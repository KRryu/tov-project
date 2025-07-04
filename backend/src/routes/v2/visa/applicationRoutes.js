const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
const visaController = require('../../../controllers/visa/visaController');
const EvaluationHistory = require('../../../models/visa/EvaluationHistory');
const DocumentSubmission = require('../../../models/visa/DocumentSubmission');
const logger = require('../../../utils/logger');
const asyncHandler = require('../../../utils/asyncHandler');

/**
 * 비자 신청서 관리 라우트 V2
 * 경로: /backend/src/routes/v2/visa/applicationRoutes.js
 * 
 * 역할: V2 버전 비자 신청서 CRUD, 향상된 추적 및 관리
 */

/**
 * @route   POST /api/v2/visa/applications
 * @desc    비자 신청서 생성/업데이트 (V2 향상 기능)
 * @access  Private
 */
router.post('/', protect, asyncHandler(async (req, res) => {
  logger.info('비자 신청서 생성/업데이트 V2', { 
    userId: req.user.id,
    visaType: req.body.visaType 
  });
  
  // V1 컨트롤러 호출
  await visaController.createOrUpdateApplication(req, res);
  
  // V2 추가 기능: 문서 제출 환경 자동 생성
  if (res.locals.applicationCreated && req.body.visaType) {
    try {
      const existingDocSubmission = await DocumentSubmission.findByApplication(res.locals.applicationId);
      
      if (!existingDocSubmission) {
        const documentSubmission = new DocumentSubmission({
          applicationId: res.locals.applicationId,
          userId: req.user.id,
          visaType: req.body.visaType,
          documents: []
        });
        
        await documentSubmission.save();
        logger.info('문서 제출 환경 자동 생성', { 
          applicationId: res.locals.applicationId,
          submissionId: documentSubmission._id 
        });
      }
    } catch (error) {
      logger.error('문서 제출 환경 생성 오류:', error);
      // 신청서 생성은 성공했으므로 에러를 무시하고 계속 진행
    }
  }
}));

/**
 * @route   GET /api/v2/visa/applications/current
 * @desc    현재 진행 중인 비자 신청서 조회 (V2 향상 기능)
 * @access  Private
 */
router.get('/current', protect, asyncHandler(async (req, res) => {
  logger.info('현재 신청서 조회 V2', { userId: req.user.id });
  
  // V1 기능 실행
  await visaController.getCurrentApplication(req, res);
  
  // V2 추가 정보: 문서 제출 상태와 평가 이력 포함
  if (res.locals.currentApplication) {
    try {
      const applicationId = res.locals.currentApplication._id;
      
      // 문서 제출 상태 조회
      const documentSubmission = await DocumentSubmission.findByApplication(applicationId);
      
      // 최근 평가 이력 조회
      const recentEvaluations = await EvaluationHistory.findByUser(req.user.id, {
        limit: 3,
        visaType: res.locals.currentApplication.visaType
      });
      
      // V2 응답에 추가 정보 포함
      const originalResponse = res.locals.responseData || {};
      const enhancedResponse = {
        ...originalResponse,
        v2Features: {
          documentSubmission: documentSubmission ? {
            submissionId: documentSubmission._id,
            totalDocuments: documentSubmission.documents.length,
            completeness: documentSubmission.metadata.completionPercentage,
            status: documentSubmission.submissionStatus,
            lastUpdated: documentSubmission.updatedAt
          } : null,
          
          recentEvaluations: recentEvaluations.map(eval => ({
            evaluationId: eval._id,
            score: eval.result?.score,
            status: eval.result?.status,
            evaluatedAt: eval.createdAt,
            confidence: eval.result?.confidence
          })),
          
          recommendations: res.locals.currentApplication.visaType ? [
            '문서 제출 완성도를 확인하세요',
            '평가를 통해 승인 가능성을 확인하세요'
          ] : []
        }
      };
      
      res.json(enhancedResponse);
      return;
    } catch (error) {
      logger.error('V2 추가 정보 조회 오류:', error);
      // V1 응답 그대로 반환
    }
  }
}));

/**
 * @route   GET /api/v2/visa/applications
 * @desc    사용자 비자 신청서 목록 조회 (V2 향상 기능)
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  logger.info('신청서 목록 조회 V2', { userId: req.user.id });
  
  // V1 기능 실행
  await visaController.getUserApplications(req, res);
  
  // V2 추가 기능: 각 신청서에 대한 요약 정보 추가
  if (res.locals.applications) {
    try {
      const enhancedApplications = await Promise.all(
        res.locals.applications.map(async (application) => {
          // 문서 제출 정보
          const documentSubmission = await DocumentSubmission.findByApplication(application._id);
          
          // 최근 평가 정보
          const latestEvaluation = await EvaluationHistory.findOne({
            applicationId: application._id,
            evaluationStatus: 'COMPLETED'
          }).sort({ createdAt: -1 });
          
          return {
            ...application.toObject(),
            v2Summary: {
              documentStatus: documentSubmission ? {
                totalDocuments: documentSubmission.documents.length,
                completeness: documentSubmission.metadata.completionPercentage,
                verified: documentSubmission.metadata.verifiedDocuments,
                pending: documentSubmission.metadata.pendingDocuments
              } : null,
              
              latestEvaluation: latestEvaluation ? {
                score: latestEvaluation.result?.score,
                status: latestEvaluation.result?.status,
                evaluatedAt: latestEvaluation.createdAt
              } : null,
              
              overallProgress: this._calculateOverallProgress(
                application, 
                documentSubmission, 
                latestEvaluation
              )
            }
          };
        })
      );
      
      res.json({
        success: true,
        count: enhancedApplications.length,
        data: enhancedApplications
      });
      return;
    } catch (error) {
      logger.error('V2 신청서 목록 조회 오류:', error);
      // V1 응답 그대로 반환
    }
  }
}));

/**
 * @route   GET /api/v2/visa/applications/:id
 * @desc    특정 비자 신청서 상세 조회 (V2 향상 기능)
 * @access  Private
 */
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info('신청서 상세 조회 V2', { applicationId: id, userId: req.user.id });
  
  // V1 기능 실행
  await visaController.getApplicationById(req, res);
  
  // V2 추가 기능: 완전한 프로파일 정보
  if (res.locals.application) {
    try {
      const application = res.locals.application;
      
      // 문서 제출 정보
      const documentSubmission = await DocumentSubmission.findByApplication(id);
      
      // 평가 이력 전체
      const evaluationHistory = await EvaluationHistory.find({
        applicationId: id
      }).sort({ createdAt: -1 }).limit(10);
      
      // 관련 통계
      const stats = await this._generateApplicationStats(id, req.user.id);
      
      const enhancedApplication = {
        ...application.toObject(),
        v2Details: {
          documentSubmission: documentSubmission ? {
            submissionId: documentSubmission._id,
            documents: documentSubmission.documents,
            validation: documentSubmission.setValidation,
            status: documentSubmission.submissionStatus,
            metadata: documentSubmission.metadata
          } : null,
          
          evaluationHistory: evaluationHistory.map(eval => ({
            evaluationId: eval._id,
            type: eval.evaluationType,
            status: eval.evaluationStatus,
            result: eval.result,
            evaluatedAt: eval.createdAt,
            processingTime: eval.metadata?.performance?.totalProcessingTime
          })),
          
          statistics: stats,
          
          timeline: this._generateApplicationTimeline(
            application, 
            documentSubmission, 
            evaluationHistory
          ),
          
          nextActions: this._generateNextActions(
            application, 
            documentSubmission, 
            evaluationHistory
          )
        }
      };
      
      res.json({
        success: true,
        data: enhancedApplication
      });
      return;
    } catch (error) {
      logger.error('V2 신청서 상세 조회 오류:', error);
      // V1 응답 그대로 반환
    }
  }
}));

/**
 * @route   POST /api/v2/visa/applications/:id/submit
 * @desc    비자 신청서 제출 (V2 향상 기능)
 * @access  Private
 */
router.post('/:id/submit', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info('신청서 제출 V2', { applicationId: id, userId: req.user.id });
  
  // V2 사전 검증: 문서 완성도 확인
  const documentSubmission = await DocumentSubmission.findByApplication(id);
  
  if (documentSubmission) {
    await documentSubmission.validateDocumentSet();
    
    if (!documentSubmission.setValidation.isComplete) {
      return res.status(400).json({
        success: false,
        message: '문서 제출이 완료되지 않았습니다.',
        details: {
          completeness: documentSubmission.metadata.completionPercentage,
          missingDocuments: documentSubmission.getMissingDocuments(),
          suggestions: documentSubmission.setValidation.suggestions
        }
      });
    }
  }
  
  // V1 제출 로직 실행
  await visaController.submitApplication(req, res);
  
  // V2 추가 기능: 제출 후 처리
  if (res.locals.submitted) {
    try {
      // 평가 이력 생성 (제출 시점 스냅샷)
      const evaluationHistory = new EvaluationHistory({
        userId: req.user.id,
        applicationId: id,
        visaType: res.locals.application?.visaType,
        evaluationType: 'INITIAL',
        evaluationStatus: 'PENDING',
        inputData: {
          submittedAt: new Date(),
          documentCount: documentSubmission?.documents.length || 0,
          documentCompleteness: documentSubmission?.metadata.completionPercentage || 0
        },
        metadata: {
          context: {
            source: 'APPLICATION_SUBMISSION',
            trigger: 'USER_REQUEST'
          }
        }
      });
      
      await evaluationHistory.save();
      
      logger.info('제출 시점 평가 이력 생성', { 
        applicationId: id,
        evaluationId: evaluationHistory._id 
      });
      
    } catch (error) {
      logger.error('제출 후 처리 오류:', error);
    }
  }
}));

/**
 * @route   GET /api/v2/visa/applications/:id/timeline
 * @desc    신청서 진행 타임라인 조회
 * @access  Private
 */
router.get('/:id/timeline', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info('신청서 타임라인 조회', { applicationId: id, userId: req.user.id });
  
  const application = await require('../../../models/visa/VisaApplication').findById(id);
  
  if (!application || application.userId.toString() !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: '신청서를 찾을 수 없습니다.'
    });
  }
  
  const documentSubmission = await DocumentSubmission.findByApplication(id);
  const evaluationHistory = await EvaluationHistory.find({ applicationId: id }).sort({ createdAt: 1 });
  
  const timeline = this._generateApplicationTimeline(application, documentSubmission, evaluationHistory);
  
  res.json({
    success: true,
    data: timeline
  });
}));

/**
 * @route   GET /api/v2/visa/applications/:id/insights
 * @desc    신청서 인사이트 및 분석
 * @access  Private
 */
router.get('/:id/insights', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info('신청서 인사이트 조회', { applicationId: id, userId: req.user.id });
  
  const application = await require('../../../models/visa/VisaApplication').findById(id);
  
  if (!application || application.userId.toString() !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: '신청서를 찾을 수 없습니다.'
    });
  }
  
  const insights = await this._generateApplicationInsights(id, application.visaType, req.user.id);
  
  res.json({
    success: true,
    data: insights
  });
}));

// === 헬퍼 메서드 ===

/**
 * 전체 진행률 계산
 */
router._calculateOverallProgress = function(application, documentSubmission, latestEvaluation) {
  let progress = 0;
  
  // 신청서 작성 (30%)
  if (application && application.status !== 'draft') {
    progress += 30;
  }
  
  // 문서 제출 (40%)
  if (documentSubmission) {
    progress += (documentSubmission.metadata.completionPercentage * 0.4);
  }
  
  // 평가 완료 (20%)
  if (latestEvaluation && latestEvaluation.result) {
    progress += 20;
  }
  
  // 제출 완료 (10%)
  if (application && application.status === 'submitted') {
    progress += 10;
  }
  
  return Math.round(progress);
};

/**
 * 신청서 통계 생성
 */
router._generateApplicationStats = async function(applicationId, userId) {
  // 간단한 통계 - 실제로는 더 복잡한 분석 필요
  return {
    totalDocuments: 0,
    evaluationCount: 0,
    timeSpent: '정보 없음',
    lastActivity: new Date()
  };
};

/**
 * 타임라인 생성
 */
router._generateApplicationTimeline = function(application, documentSubmission, evaluationHistory) {
  const timeline = [];
  
  // 신청서 생성
  timeline.push({
    type: 'application_created',
    title: '신청서 생성',
    date: application.createdAt,
    status: 'completed'
  });
  
  // 문서 제출 이벤트들
  if (documentSubmission) {
    timeline.push({
      type: 'documents_uploaded',
      title: '문서 업로드',
      date: documentSubmission.createdAt,
      status: 'completed',
      details: `${documentSubmission.documents.length}개 문서`
    });
  }
  
  // 평가 이벤트들
  evaluationHistory.forEach(eval => {
    timeline.push({
      type: 'evaluation',
      title: '비자 평가',
      date: eval.createdAt,
      status: eval.evaluationStatus.toLowerCase(),
      details: eval.result?.status
    });
  });
  
  // 제출 이벤트
  if (application.submittedAt) {
    timeline.push({
      type: 'application_submitted',
      title: '신청서 제출',
      date: application.submittedAt,
      status: 'completed'
    });
  }
  
  return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * 다음 액션 제안
 */
router._generateNextActions = function(application, documentSubmission, evaluationHistory) {
  const actions = [];
  
  if (!documentSubmission || documentSubmission.documents.length === 0) {
    actions.push({
      action: 'upload_documents',
      title: '문서 업로드',
      priority: 'high',
      description: '필수 문서들을 업로드하세요.'
    });
  }
  
  if (documentSubmission && !documentSubmission.setValidation.isComplete) {
    actions.push({
      action: 'complete_documents',
      title: '문서 완성',
      priority: 'medium',
      description: '누락된 문서들을 추가로 제출하세요.'
    });
  }
  
  if (!evaluationHistory.length) {
    actions.push({
      action: 'get_evaluation',
      title: '비자 평가 받기',
      priority: 'medium',
      description: '현재 조건으로 승인 가능성을 확인하세요.'
    });
  }
  
  return actions;
};

/**
 * 신청서 인사이트 생성
 */
router._generateApplicationInsights = async function(applicationId, visaType, userId) {
  // 간단한 인사이트 - 실제로는 더 복잡한 분석 필요
  return {
    readinessScore: 75,
    strengthAreas: ['학력', '경력'],
    improvementAreas: ['문서 완성도'],
    timeline: '약 2-3주 소요 예상',
    recommendations: [
      '누락된 문서를 완성하세요',
      '비자 평가를 받아 개선점을 확인하세요'
    ]
  };
};

module.exports = router; 