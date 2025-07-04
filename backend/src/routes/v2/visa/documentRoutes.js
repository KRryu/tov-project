const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
const { uploadVisaDocument } = require('../../../middlewares/uploadMiddleware');
const DocumentSubmission = require('../../../models/visa/DocumentSubmission');
const { getDocumentValidationService } = require('../../../services/visa/documentValidationService');
const { DocumentHelper } = require('../../../utils/documentHelper');
const logger = require('../../../utils/logger');
const asyncHandler = require('../../../utils/asyncHandler');

/**
 * 문서 관리 라우트 V2
 * 경로: /backend/src/routes/v2/visa/documentRoutes.js
 * 
 * 역할: 문서 업로드, 검증, 관리 API
 */

/**
 * @route   GET /api/v2/visa/documents/:applicationId
 * @desc    신청서별 문서 목록 조회
 * @access  Private
 */
router.get('/:applicationId', protect, asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  
  logger.info('문서 목록 조회', { applicationId, userId: req.user.id });
  
  const documentSubmission = await DocumentSubmission.findByApplication(applicationId);
  
  if (!documentSubmission) {
    return res.status(404).json({
      success: false,
      message: '문서 제출 정보를 찾을 수 없습니다.'
    });
  }
  
  // 사용자 권한 확인
  if (documentSubmission.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: '접근 권한이 없습니다.'
    });
  }
  
  res.json({
    success: true,
    data: {
      documents: documentSubmission.documents,
      validation: documentSubmission.setValidation,
      status: documentSubmission.submissionStatus,
      metadata: documentSubmission.metadata
    }
  });
}));

/**
 * @route   POST /api/v2/visa/documents/upload
 * @desc    문서 업로드
 * @access  Private
 */
router.post('/upload', 
  protect, 
  uploadVisaDocument('documents'), 
  asyncHandler(async (req, res) => {
    const { applicationId, visaType } = req.body;
    const files = req.files;
    
    logger.info('문서 업로드 시작', { 
      applicationId, 
      visaType, 
      fileCount: files.length,
      userId: req.user.id 
    });
    
    if (!applicationId || !visaType) {
      return res.status(400).json({
        success: false,
        message: '신청서 ID와 비자 타입이 필요합니다.'
      });
    }
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '업로드할 파일이 없습니다.'
      });
    }
    
    // 기존 문서 제출 정보 조회 또는 생성
    let documentSubmission = await DocumentSubmission.findByApplication(applicationId);
    
    if (!documentSubmission) {
      documentSubmission = new DocumentSubmission({
        applicationId,
        userId: req.user.id,
        visaType,
        documents: []
      });
    }
    
    const validationService = getDocumentValidationService();
    const uploadedDocuments = [];
    const errors = [];
    
    // 각 파일 처리
    for (const file of files) {
      try {
        // 파일 검증
        const fileValidation = DocumentHelper.validateFile({
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
        
        if (!fileValidation.isValid) {
          errors.push({
            filename: file.originalname,
            errors: fileValidation.errors
          });
          continue;
        }
        
        // 문서 타입 파싱
        const parsedInfo = DocumentHelper.parseDocumentName(file.originalname, visaType);
        
        // 문서 타입 검증
        const typeValidation = validationService.validateDocumentType(
          parsedInfo.primaryType, 
          visaType
        );
        
        // 문서 객체 생성
        const documentData = {
          documentType: parsedInfo.primaryType,
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          
          validation: {
            ...typeValidation,
            parsedInfo,
            validatedAt: new Date()
          },
          
          metadata: {
            ...req.body.metadata,
            uploadSource: 'WEB'
          }
        };
        
        uploadedDocuments.push(documentData);
        
      } catch (error) {
        logger.error('파일 처리 중 오류:', { filename: file.originalname, error });
        errors.push({
          filename: file.originalname,
          errors: [error.message]
        });
      }
    }
    
    // 성공한 문서들 저장
    if (uploadedDocuments.length > 0) {
      for (const doc of uploadedDocuments) {
        await documentSubmission.addDocument(doc);
      }
      
      // 문서 세트 검증 실행
      await documentSubmission.validateDocumentSet();
    }
    
    logger.info('문서 업로드 완료', { 
      applicationId,
      uploaded: uploadedDocuments.length,
      errors: errors.length 
    });
    
    res.json({
      success: true,
      message: `${uploadedDocuments.length}개 문서가 업로드되었습니다.`,
      data: {
        uploadedDocuments: uploadedDocuments.length,
        errors,
        validation: documentSubmission.setValidation,
        submissionId: documentSubmission._id
      }
    });
  })
);

/**
 * @route   PUT /api/v2/visa/documents/:documentId/status
 * @desc    문서 상태 업데이트
 * @access  Private
 */
router.put('/:documentId/status', protect, asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { status, comments } = req.body;
  
  logger.info('문서 상태 업데이트', { documentId, status, userId: req.user.id });
  
  const documentSubmission = await DocumentSubmission.findOne({
    'documents._id': documentId
  });
  
  if (!documentSubmission) {
    return res.status(404).json({
      success: false,
      message: '문서를 찾을 수 없습니다.'
    });
  }
  
  // 권한 확인 (관리자 또는 문서 소유자)
  const isOwner = documentSubmission.userId.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: '문서 상태를 변경할 권한이 없습니다.'
    });
  }
  
  await documentSubmission.updateDocumentStatus(
    documentId, 
    status, 
    req.user.name || req.user.email,
    comments
  );
  
  res.json({
    success: true,
    message: '문서 상태가 업데이트되었습니다.',
    data: {
      documentId,
      newStatus: status
    }
  });
}));

/**
 * @route   POST /api/v2/visa/documents/validate-set
 * @desc    문서 세트 검증
 * @access  Private
 */
router.post('/validate-set', protect, asyncHandler(async (req, res) => {
  const { applicationId } = req.body;
  
  logger.info('문서 세트 검증 요청', { applicationId, userId: req.user.id });
  
  const documentSubmission = await DocumentSubmission.findByApplication(applicationId);
  
  if (!documentSubmission) {
    return res.status(404).json({
      success: false,
      message: '문서 제출 정보를 찾을 수 없습니다.'
    });
  }
  
  // 권한 확인
  if (documentSubmission.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: '접근 권한이 없습니다.'
    });
  }
  
  // 문서 세트 검증 실행
  await documentSubmission.validateDocumentSet();
  
  res.json({
    success: true,
    message: '문서 세트 검증이 완료되었습니다.',
    data: {
      validation: documentSubmission.setValidation,
      completeness: documentSubmission.metadata.completionPercentage,
      missingDocuments: documentSubmission.getMissingDocuments()
    }
  });
}));

/**
 * @route   GET /api/v2/visa/documents/suggestions/:visaType
 * @desc    비자별 문서 제안
 * @access  Private
 */
router.get('/suggestions/:visaType', protect, asyncHandler(async (req, res) => {
  const { visaType } = req.params;
  const { submitted } = req.query;
  
  logger.info('문서 제안 요청', { visaType, userId: req.user.id });
  
  const submittedDocuments = submitted ? JSON.parse(submitted) : [];
  
  const suggestions = DocumentHelper.suggestMissingDocuments(
    submittedDocuments, 
    visaType
  );
  
  res.json({
    success: true,
    data: suggestions
  });
}));

/**
 * @route   GET /api/v2/visa/documents/analyze/:applicationId
 * @desc    문서 완성도 분석
 * @access  Private
 */
router.get('/analyze/:applicationId', protect, asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  
  logger.info('문서 완성도 분석', { applicationId, userId: req.user.id });
  
  const documentSubmission = await DocumentSubmission.findByApplication(applicationId);
  
  if (!documentSubmission) {
    return res.status(404).json({
      success: false,
      message: '문서 제출 정보를 찾을 수 없습니다.'
    });
  }
  
  // 권한 확인
  if (documentSubmission.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: '접근 권한이 없습니다.'
    });
  }
  
  // 문서 분석
  const categorization = DocumentHelper.categorizeDocuments(documentSubmission.documents);
  const completenessAnalysis = DocumentHelper.analyzeDocumentCompleteness(
    documentSubmission.documents, 
    documentSubmission.visaType
  );
  
  // 만료 예정 문서 확인
  const expiringDocuments = documentSubmission.getExpiringDocuments(30);
  
  res.json({
    success: true,
    data: {
      categorization,
      completenessAnalysis,
      expiringDocuments,
      summary: {
        totalDocuments: documentSubmission.documents.length,
        completeness: documentSubmission.metadata.completionPercentage,
        status: documentSubmission.submissionStatus,
        lastUpdated: documentSubmission.updatedAt
      }
    }
  });
}));

/**
 * @route   DELETE /api/v2/visa/documents/:documentId
 * @desc    문서 삭제
 * @access  Private
 */
router.delete('/:documentId', protect, asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  
  logger.info('문서 삭제 요청', { documentId, userId: req.user.id });
  
  const documentSubmission = await DocumentSubmission.findOne({
    'documents._id': documentId
  });
  
  if (!documentSubmission) {
    return res.status(404).json({
      success: false,
      message: '문서를 찾을 수 없습니다.'
    });
  }
  
  // 권한 확인
  if (documentSubmission.userId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: '문서를 삭제할 권한이 없습니다.'
    });
  }
  
  // 문서 제거
  documentSubmission.documents.id(documentId).remove();
  await documentSubmission.save();
  
  // 문서 세트 재검증
  await documentSubmission.validateDocumentSet();
  
  res.json({
    success: true,
    message: '문서가 삭제되었습니다.',
    data: {
      remainingDocuments: documentSubmission.documents.length,
      newCompleteness: documentSubmission.metadata.completionPercentage
    }
  });
}));

/**
 * @route   GET /api/v2/visa/documents/stats/user
 * @desc    사용자 문서 통계
 * @access  Private
 */
router.get('/stats/user', protect, asyncHandler(async (req, res) => {
  logger.info('사용자 문서 통계 조회', { userId: req.user.id });
  
  const userDocuments = await DocumentSubmission.findByUser(req.user.id);
  
  let totalDocuments = 0;
  let verifiedDocuments = 0;
  let pendingDocuments = 0;
  const visaTypeStats = {};
  
  userDocuments.forEach(submission => {
    totalDocuments += submission.documents.length;
    verifiedDocuments += submission.metadata.verifiedDocuments;
    pendingDocuments += submission.metadata.pendingDocuments;
    
    if (!visaTypeStats[submission.visaType]) {
      visaTypeStats[submission.visaType] = {
        submissions: 0,
        documents: 0,
        averageCompleteness: 0
      };
    }
    
    visaTypeStats[submission.visaType].submissions += 1;
    visaTypeStats[submission.visaType].documents += submission.documents.length;
    visaTypeStats[submission.visaType].averageCompleteness += submission.metadata.completionPercentage;
  });
  
  // 평균 완성도 계산
  Object.keys(visaTypeStats).forEach(visaType => {
    const stats = visaTypeStats[visaType];
    stats.averageCompleteness = Math.round(stats.averageCompleteness / stats.submissions);
  });
  
  res.json({
    success: true,
    data: {
      summary: {
        totalSubmissions: userDocuments.length,
        totalDocuments,
        verifiedDocuments,
        pendingDocuments,
        verificationRate: totalDocuments > 0 ? Math.round((verifiedDocuments / totalDocuments) * 100) : 0
      },
      visaTypeStats
    }
  });
}));

module.exports = router; 