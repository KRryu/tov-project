/**
 * 고급 비자 평가 라우트 (플러그인 기반 v2)
 * 신규/연장/변경 신청, 법무대리인 매칭, 문서 검증 등 지원
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
const asyncHandler = require('../../../utils/asyncHandler');
const logger = require('../../../utils/logger');
const { uploadVisaDocument, handleUploadError } = require('../../../middlewares/uploadMiddleware');

// 새로운 v2 비자 평가 모듈
const visaEvaluationV2 = require('../../../modules/visaEvaluation/index-v2');

// 모델
const VisaApplication = require('../../../models/visa/VisaApplication');
const DocumentSubmission = require('../../../models/visa/DocumentSubmission');
const EvaluationHistory = require('../../../models/visa/EvaluationHistory');

/**
 * @route   POST /api/v2/visa/advanced/pre-screening
 * @desc    비자 사전심사 (모든 비자 타입 지원)
 * @access  Public
 */
router.post('/pre-screening', asyncHandler(async (req, res) => {
  const { visaType, applicationType, applicantData } = req.body;
  
  logger.info('Advanced pre-screening request', { 
    visaType, 
    applicationType,
    nationality: applicantData.nationality 
  });

  // 필수 필드 검증
  if (!visaType || !applicationType || !applicantData) {
    return res.status(400).json({
      success: false,
      message: 'visaType, applicationType, and applicantData are required'
    });
  }

  // 신청 유형 추가
  applicantData.applicationType = applicationType;

  try {
    // v2 모듈로 사전심사 수행
    const result = await visaEvaluationV2.performPreScreening(visaType, applicantData);
    
    // 이력 저장 (로그인한 경우)
    if (req.user?.id) {
      const history = new EvaluationHistory({
        userId: req.user.id,
        visaType,
        evaluationType: 'PRE_SCREENING',
        evaluationStatus: 'COMPLETED',
        inputData: applicantData,
        result: {
          ...result,
          evaluationType: 'pre-screening'
        },
        metadata: {
          source: 'advanced-v2',
          applicationType
        }
      });
      await history.save();
    }

    res.json({
      success: true,
      data: {
        ...result,
        evaluationId: result.metadata?.evaluationId,
        nextSteps: generateNextSteps(result, applicationType)
      }
    });

  } catch (error) {
    logger.error('Pre-screening error:', error);
    res.status(500).json({
      success: false,
      message: 'Pre-screening failed',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/detailed-evaluation
 * @desc    상세 비자 평가
 * @access  Private
 */
router.post('/detailed-evaluation', protect, asyncHandler(async (req, res) => {
  const { visaType, applicationType, applicantData, applicationId } = req.body;
  
  logger.info('Detailed evaluation request', { 
    visaType, 
    applicationType,
    applicationId,
    userId: req.user.id 
  });

  try {
    // v2 모듈로 상세 평가 수행
    const result = await visaEvaluationV2.evaluateVisa(visaType, applicantData, {
      applicationType
    });

    // 신청서 업데이트 (있는 경우)
    if (applicationId) {
      await VisaApplication.findByIdAndUpdate(applicationId, {
        evaluationResult: result,
        evaluationDate: new Date(),
        status: result.status === 'APPROVED' ? 'evaluation_completed' : 'evaluation_failed'
      });
    }

    // 이력 저장
    const history = new EvaluationHistory({
      userId: req.user.id,
      applicationId,
      visaType,
      evaluationType: 'DETAILED',
      evaluationStatus: 'COMPLETED',
      inputData: applicantData,
      result,
      metadata: {
        source: 'advanced-v2',
        applicationType,
        score: result.score
      }
    });
    await history.save();

    // 복잡도 분석 (E-1의 경우)
    let complexityAnalysis = null;
    if (visaType === 'E-1') {
      const service = await visaEvaluationV2.getVisaEvaluationService();
      const e1Service = service.services.get('E-1');
      if (e1Service && typeof e1Service.analyzeComplexity === 'function') {
        complexityAnalysis = await e1Service.analyzeComplexity(applicantData);
      }
    }

    res.json({
      success: true,
      data: {
        evaluation: result,
        evaluationId: history._id,
        complexityAnalysis,
        recommendations: generateRecommendations(result, applicationType),
        nextSteps: result.status === 'APPROVED' ? 
          ['document_upload', 'legal_consultation', 'payment'] : 
          ['improve_conditions', 're_evaluate']
      }
    });

  } catch (error) {
    logger.error('Detailed evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Evaluation failed',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/validate-field
 * @desc    실시간 필드 검증
 * @access  Public
 */
router.post('/validate-field', asyncHandler(async (req, res) => {
  const { visaType, fieldName, value, context } = req.body;
  
  logger.info('Field validation request', { 
    visaType, 
    fieldName,
    hasContext: !!context 
  });

  try {
    const result = await visaEvaluationV2.validateField(
      visaType, 
      fieldName, 
      value, 
      context || {}
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Field validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/advanced/requirements/:visaType
 * @desc    비자 요구사항 조회
 * @access  Public
 */
router.get('/requirements/:visaType', asyncHandler(async (req, res) => {
  const { visaType } = req.params;
  const { applicationType = 'NEW', nationality } = req.query;
  
  logger.info('Requirements request', { 
    visaType, 
    applicationType,
    nationality 
  });

  try {
    const requirements = await visaEvaluationV2.getVisaRequirements(
      visaType, 
      applicationType, 
      nationality
    );

    res.json({
      success: true,
      data: requirements
    });

  } catch (error) {
    logger.error('Requirements fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requirements',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/check-changeability
 * @desc    비자 변경 가능성 확인
 * @access  Public
 */
router.post('/check-changeability', asyncHandler(async (req, res) => {
  const { fromVisa, toVisa } = req.body;
  
  logger.info('Changeability check', { fromVisa, toVisa });

  try {
    const result = await visaEvaluationV2.checkChangeability(fromVisa, toVisa);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Changeability check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check changeability',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/legal-matching
 * @desc    법무대리인 매칭
 * @access  Private
 */
router.post('/legal-matching', protect, asyncHandler(async (req, res) => {
  const { visaType, evaluationScore, complexityLevel, applicationId } = req.body;
  
  logger.info('Legal representative matching request', { 
    visaType, 
    evaluationScore,
    complexityLevel,
    userId: req.user.id 
  });

  try {
    // 법무대리인 매칭 서비스 호출
    const LegalRepresentativeMatchingService = require('../../../modules/visaEvaluation/core/services/LegalRepresentativeMatchingService');
    const matchingService = new LegalRepresentativeMatchingService();
    
    const caseDetails = {
      visaType,
      score: evaluationScore,
      complexity: complexityLevel || 'MEDIUM',
      userId: req.user.id
    };

    const matches = await matchingService.findMatches(caseDetails);

    // 매칭 결과 저장
    if (applicationId && matches.length > 0) {
      await VisaApplication.findByIdAndUpdate(applicationId, {
        legalRepresentativeMatches: matches.map(match => ({
          representativeId: match.id,
          matchScore: match.matchScore,
          specialties: match.specialties,
          matchedAt: new Date()
        }))
      });
    }

    res.json({
      success: true,
      data: {
        matches,
        recommendedCount: Math.min(3, matches.length),
        selectionGuidance: generateLegalSelectionGuidance(complexityLevel)
      }
    });

  } catch (error) {
    logger.error('Legal matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Legal matching failed',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/document-upload
 * @desc    문서 업로드 및 검증
 * @access  Private
 */
router.post('/document-upload', 
  protect, 
  uploadVisaDocument('documents'),
  asyncHandler(async (req, res) => {
    const { applicationId, visaType, documentType } = req.body;
    const files = req.files;
    
    logger.info('Document upload request', { 
      applicationId,
      visaType,
      documentType,
      fileCount: files?.length,
      userId: req.user.id 
    });

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    try {
      const uploadedDocuments = [];

      for (const file of files) {
        // 문서 정보 저장
        const document = new DocumentSubmission({
          userId: req.user.id,
          applicationId,
          visaType,
          documentType: documentType || 'general',
          fileName: file.originalname,
          fileUrl: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadDate: new Date(),
          status: 'uploaded',
          metadata: {
            encoding: file.encoding,
            fieldname: file.fieldname
          }
        });

        await document.save();

        // 문서 검증 (비동기로 백그라운드에서 수행)
        document.validateDocument().catch(err => {
          logger.error('Document validation error:', err);
        });

        uploadedDocuments.push({
          id: document._id,
          fileName: document.fileName,
          documentType: document.documentType,
          status: document.status
        });
      }

      // 신청서 업데이트
      if (applicationId) {
        await VisaApplication.findByIdAndUpdate(applicationId, {
          $push: { documents: { $each: uploadedDocuments.map(d => d.id) } },
          lastDocumentUpload: new Date()
        });
      }

      res.json({
        success: true,
        data: {
          uploadedDocuments,
          totalCount: uploadedDocuments.length,
          nextSteps: ['await_validation', 'submit_additional_if_needed']
        }
      });

    } catch (error) {
      logger.error('Document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Document upload failed',
        error: error.message
      });
    }
}));

/**
 * @route   GET /api/v2/visa/advanced/document-status/:applicationId
 * @desc    문서 검증 상태 확인
 * @access  Private
 */
router.get('/document-status/:applicationId', protect, asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  
  logger.info('Document status check', { 
    applicationId,
    userId: req.user.id 
  });

  try {
    const documents = await DocumentSubmission.find({
      applicationId,
      userId: req.user.id
    }).select('fileName documentType status validationResult uploadDate');

    const summary = {
      total: documents.length,
      validated: documents.filter(d => d.status === 'validated').length,
      rejected: documents.filter(d => d.status === 'rejected').length,
      pending: documents.filter(d => d.status === 'uploaded').length
    };

    res.json({
      success: true,
      data: {
        documents,
        summary,
        allValidated: summary.validated === summary.total && summary.total > 0,
        readyForSubmission: summary.rejected === 0 && summary.pending === 0 && summary.total > 0
      }
    });

  } catch (error) {
    logger.error('Document status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check document status',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/advanced/create-application
 * @desc    비자 신청서 생성
 * @access  Private
 */
router.post('/create-application', protect, asyncHandler(async (req, res) => {
  const { visaType, applicationType, applicationData } = req.body;
  
  logger.info('Create application request', { 
    visaType,
    applicationType,
    userId: req.user.id 
  });

  try {
    const application = new VisaApplication({
      userId: req.user.id,
      visaType,
      applicationType,
      applicationData,
      status: 'draft',
      createdDate: new Date(),
      lastModified: new Date()
    });

    await application.save();

    res.json({
      success: true,
      data: {
        applicationId: application._id,
        status: application.status,
        nextSteps: ['complete_evaluation', 'upload_documents', 'select_legal_representative']
      }
    });

  } catch (error) {
    logger.error('Application creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/advanced/supported-types
 * @desc    지원되는 비자 타입 목록 (확장 정보 포함)
 * @access  Public
 */
router.get('/supported-types', asyncHandler(async (req, res) => {
  const { category, applicationType } = req.query;
  
  logger.info('Supported types request', { category, applicationType });

  try {
    const supportedTypes = await visaEvaluationV2.getSupportedVisaTypes();
    const typesWithDetails = [];

    for (const visaType of supportedTypes) {
      const features = await visaEvaluationV2.getVisaTypeFeatures(visaType);
      
      // 카테고리 필터
      if (category && features.category !== category) continue;
      
      // 신청 유형 필터
      if (applicationType && !features.applicationTypes.includes(applicationType)) continue;

      typesWithDetails.push({
        code: visaType,
        ...features
      });
    }

    res.json({
      success: true,
      data: {
        visaTypes: typesWithDetails,
        totalCount: typesWithDetails.length,
        categories: [...new Set(typesWithDetails.map(t => t.category))],
        features: {
          preScreening: true,
          detailedEvaluation: true,
          documentValidation: true,
          legalMatching: true,
          applicationTracking: true
        }
      }
    });

  } catch (error) {
    logger.error('Supported types fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supported types',
      error: error.message
    });
  }
}));

// === 헬퍼 함수들 ===

/**
 * 다음 단계 생성
 */
function generateNextSteps(evaluationResult, applicationType) {
  const steps = [];
  
  if (evaluationResult.passPreScreening) {
    steps.push('proceed_to_detailed_evaluation');
    steps.push('prepare_required_documents');
  } else {
    steps.push('review_rejection_reasons');
    steps.push('address_remediable_issues');
    
    if (evaluationResult.alternatives && evaluationResult.alternatives.length > 0) {
      steps.push('consider_alternative_visas');
    }
  }
  
  if (evaluationResult.remediableIssues && evaluationResult.remediableIssues.length > 0) {
    steps.push('follow_action_plan');
  }
  
  return steps;
}

/**
 * 추천사항 생성
 */
function generateRecommendations(evaluationResult, applicationType) {
  const recommendations = [];
  
  if (evaluationResult.score < 70) {
    recommendations.push({
      type: 'improvement',
      priority: 'high',
      message: 'Consider addressing the identified issues before proceeding'
    });
  }
  
  if (applicationType === 'CHANGE' && evaluationResult.score >= 70) {
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      message: 'Current visa change timing appears favorable'
    });
  }
  
  if (evaluationResult.details?.documentCheck?.missingRequired?.length > 0) {
    recommendations.push({
      type: 'documentation',
      priority: 'high',
      message: 'Complete all required documents before submission'
    });
  }
  
  return recommendations;
}

/**
 * 법무대리인 선택 가이드
 */
function generateLegalSelectionGuidance(complexityLevel) {
  const guidance = {
    LOW: 'Your case is straightforward. Basic legal support should suffice.',
    MEDIUM: 'Your case has moderate complexity. Consider experienced legal representation.',
    HIGH: 'Your case is complex. Highly experienced legal representation is strongly recommended.',
    VERY_HIGH: 'Your case is very complex. Specialist legal representation is essential.'
  };
  
  return guidance[complexityLevel] || guidance.MEDIUM;
}

module.exports = router;