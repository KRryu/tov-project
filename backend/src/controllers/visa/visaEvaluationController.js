const visaEvaluationService = require('../../services/visa/visaEvaluationService');
const VisaApplication = require('../../models/visa/VisaApplication');
const logger = require('../../utils/logger');
const { normalizeVisaType, formatVisaTypeForDisplay } = require('../../utils/visaType');

// ✅ 최적화된 비자 평가 모듈 (V3.0)
const { 
  evaluateVisaV3, 
  evaluateVisaSmart, 
  quickVisaEvaluation,
  recommendVisa,
  getApplicationGuide,
  getServiceStatus,
  getSupportedVisaTypes,
  getVisaTypeInfo
} = require('../../modules/visaEvaluation');

// ✅ E1 종합 서비스 (통합된 버전)
const E1ComprehensiveService = require('../../modules/visaEvaluation/core/services/E1ComprehensiveService');

/**
 * 최적화된 비자 평가 전용 컨트롤러 V3.0
 * 역할: 비자 평가, 결과 저장, 문서 업로드 처리
 * 
 * 🚀 개선사항:
 * - 5개 E1 특화 서비스 → 1개 종합 서비스로 통합
 * - 복잡한 import → 단순한 모듈 사용
 * - 37개 비자 지원 준비 완료
 */

/**
 * 표준화된 응답 객체 생성
 */
const createResponse = (success, data, message = null) => {
  const response = { success };
  
  if (success && data !== null) {
    response.data = data;
  }
  
  if (!success && message) {
    response.error = message;
  }
  
  return response;
};

const visaEvaluationController = {
  /**
   * 🎯 비자 평가 수행 (메인 기능) - V3 최적화
   */
  evaluateVisa: async (req, res) => {
    try {
      const { visaType, evaluation, administrative } = req.body;

      if (!evaluation || !administrative) {
        return res.status(400).json(createResponse(false, null, '평가 데이터와 행정 데이터가 모두 필요합니다.'));
      }

      const normalized = normalizeVisaType(visaType);

      const { missingEvaluation, missingAdministrative } = VisaApplication.getMissingFields(normalized, evaluation, administrative);
      if (missingEvaluation.length || missingAdministrative.length) {
        const missing = [...missingEvaluation, ...missingAdministrative];
        return res.status(400).json(createResponse(false, null, `필수 필드가 누락되었습니다: ${missing.join(', ')}`));
      }

      // V3 최적화된 평가 사용
      const result = await evaluateVisaSmart(normalized, { evaluation, administrative });
      return res.status(200).json(createResponse(true, result.data || result));
    } catch (error) {
      logger.error('비자 평가 중 오류 발생:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || '비자 평가 중 오류가 발생했습니다.' });
    }
  },

  /**
   * ⚡ 빠른 사전 평가 (신규 기능)
   */
  quickEvaluation: async (req, res) => {
    try {
      const { visaType, basicData } = req.body;

      if (!visaType || !basicData) {
        return res.status(400).json(createResponse(false, null, '비자 타입과 기본 데이터가 필요합니다.'));
      }

      const result = await quickVisaEvaluation(visaType, basicData);
      return res.status(200).json(createResponse(true, result));
    } catch (error) {
      logger.error('빠른 평가 중 오류 발생:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || '빠른 평가 중 오류가 발생했습니다.' });
    }
  },

  /**
   * 🎯 비자 추천 시스템 (신규 기능)
   */
  recommendVisaTypes: async (req, res) => {
    try {
      const { applicantProfile } = req.body;

      if (!applicantProfile) {
        return res.status(400).json(createResponse(false, null, '신청자 프로필이 필요합니다.'));
      }

      const result = await recommendVisa(applicantProfile);
      return res.status(200).json(createResponse(true, result));
    } catch (error) {
      logger.error('비자 추천 중 오류 발생:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || '비자 추천 중 오류가 발생했습니다.' });
    }
  },

  /**
   * 지원되는 비자 유형 목록 조회 (최적화됨)
   */
  getSupportedTypes: async (req, res) => {
    try {
      const visaTypes = getSupportedVisaTypes();
      
      return res.status(200).json({
        success: true,
        data: {
          visaTypes,
          total: visaTypes.length,
          version: '3.0-optimized'
        }
      });
    } catch (error) {
      logger.error('비자 유형 목록 조회 중 오류 발생:', error);
      return res.status(error.status || 500).json({
        success: false,
        error: error.message || '비자 유형 목록 조회 중 오류가 발생했습니다.'
      });
    }
  },

  /**
   * 📚 신청 가이드 조회 (신규 기능)
   */
  getApplicationGuide: async (req, res) => {
    try {
      const { visaType, applicationType } = req.query;

      if (!visaType) {
        return res.status(400).json(createResponse(false, null, '비자 타입이 필요합니다.'));
      }

      const guide = getApplicationGuide(visaType, applicationType);
      return res.status(200).json(createResponse(true, guide));
    } catch (error) {
      logger.error('신청 가이드 조회 중 오류 발생:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || '신청 가이드 조회 중 오류가 발생했습니다.' });
    }
  },

  /**
   * 📊 서비스 상태 조회 (최적화됨)
   */
  getServiceStatus: async (req, res) => {
    try {
      const status = getServiceStatus();
      return res.status(200).json(createResponse(true, status));
    } catch (error) {
      logger.error('서비스 상태 조회 중 오류 발생:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || '서비스 상태 조회 중 오류가 발생했습니다.' });
    }
  },

  /**
   * 🔍 비자 타입 상세 정보 조회 (신규 기능)
   */
  getVisaTypeInfo: async (req, res) => {
    try {
      const { visaType } = req.params;

      if (!visaType) {
        return res.status(400).json(createResponse(false, null, '비자 타입이 필요합니다.'));
      }

      const visaInfo = getVisaTypeInfo(visaType);
      
      if (!visaInfo) {
        return res.status(404).json(createResponse(false, null, '해당 비자 타입 정보를 찾을 수 없습니다.'));
      }

      return res.status(200).json(createResponse(true, visaInfo));
    } catch (error) {
      logger.error('비자 타입 정보 조회 중 오류 발생:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || '비자 타입 정보 조회 중 오류가 발생했습니다.' });
    }
  },

  /**
   * 평가 결과 저장
   */
  saveEvaluationResult: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: '인증이 필요합니다.' });
      }

      const { applicationId, evaluationResult } = req.body;
      
      if (!applicationId) {
        return res.status(400).json({ success: false, error: '신청서 ID가 필요합니다.' });
      }
      
      if (!evaluationResult) {
        return res.status(400).json({ success: false, error: '평가 결과 데이터가 필요합니다.' });
      }

      const saved = await visaEvaluationService.saveEvaluationResult(applicationId, req.user.id, evaluationResult);
      return res.status(200).json(saved);
    } catch (error) {
      logger.error('평가 결과 저장 중 오류 발생:', error);
      return res.status(error.status || 500).json({ success: false, error: error.message || '평가 결과 저장 중 오류가 발생했습니다.' });
    }
  },

  /**
   * 문서 업로드 처리
   */
  uploadDocuments: async (req, res) => {
    try {
      if (!req.user) {
        logger.warn('인증되지 않은 사용자의 문서 업로드 시도');
        return res.status(401).json({
          success: false,
          error: '인증이 필요합니다.'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: '업로드할 파일이 없습니다.'
        });
      }

      const uploadResult = await visaEvaluationService.processDocumentUpload(req.user.id, req.files);
      
      return res.status(200).json(uploadResult);
    } catch (error) {
      logger.error('문서 업로드 중 오류 발생:', error);
      return res.status(error.status || 500).json({
        success: false,
        error: error.message || '문서 업로드 중 오류가 발생했습니다.'
      });
    }
  },

  /**
   * 비자 신청서 제출 (평가 완료 후)
   */
  submitApplication: async (req, res) => {
    try {
      if (!req.user) {
        logger.warn('인증되지 않은 사용자의 비자 신청서 제출 시도');
        return res.status(401).json({
          success: false,
          error: '인증이 필요합니다.'
        });
      }

      const { applicationId } = req.body;

      if (!applicationId) {
        logger.warn('제출할 신청서 ID가 누락되었습니다.');
        return res.status(400).json({
          success: false,
          error: '신청서 ID가 필요합니다.'
        });
      }

      // 신청서 존재 및 권한 확인
      const application = await VisaApplication.findById(applicationId);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: '해당 신청서를 찾을 수 없습니다.'
        });
      }
      
      if (application.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: '해당 신청서에 대한 접근 권한이 없습니다.'
        });
      }

      // 평가 결과가 있는지 확인
      if (!application.evaluationResult || !application.evaluationResult.overallScore) {
        return res.status(400).json({
          success: false,
          error: '평가를 먼저 완료해주세요.'
        });
      }

      // 신청서 상태 업데이트
      application.status = VisaApplication.APPLICATION_STATUS.SUBMITTED;
      application.submittedAt = new Date();
      application.metadata.version += 1;
      application.metadata.lastModifiedBy = req.user.id;
      
      await application.save();

      logger.info(`사용자 ${req.user.id}의 신청서 ${applicationId} 제출 완료`);
      
      return res.status(200).json({
        success: true,
        message: '신청서가 성공적으로 제출되었습니다.',
        submissionTimestamp: application.submittedAt,
        applicationStatus: application.status
      });
    } catch (error) {
      logger.error('신청서 제출 중 오류 발생:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '신청서 제출 중 오류가 발생했습니다.'
      });
    }
  },

  /**
   * 사용자의 비자 신청 기록 조회 (평가 결과 포함)
   */
  getUserApplications: async (req, res) => {
    try {
      if (!req.user) {
        logger.warn('인증되지 않은 사용자의 비자 신청 기록 조회 시도');
        return res.status(401).json({
          success: false,
          error: '인증이 필요합니다.'
        });
      }

      const { status, visaType } = req.query;
      
      // 쿼리 구성
      const query = { userId: req.user.id };
      
      if (status) {
        query.status = status.toUpperCase();
      }
      
      if (visaType) {
        query.visaType = normalizeVisaType(visaType);
      }

      const applications = await VisaApplication.find(query)
        .sort({ updatedAt: -1 })
        .lean();

      // 평가 결과가 있는 신청서들만 필터링하거나 평가 상태 추가
      const applicationsWithEvaluationStatus = applications.map(app => ({
        ...app,
        hasEvaluation: !!app.evaluationResult,
        evaluationScore: app.evaluationResult?.overallScore || null,
        evaluationStatus: app.evaluationResult?.eligibilityStatus || 'NOT_EVALUATED',
        visaTypeDisplay: formatVisaTypeForDisplay(app.visaType)
      }));

      logger.info(`사용자 ${req.user.id}의 비자 신청 기록 조회: ${applications.length}건`);
      
      return res.status(200).json({
        success: true,
        data: {
          applications: applicationsWithEvaluationStatus,
          total: applications.length
        }
      });
    } catch (error) {
      logger.error('신청 기록 조회 중 오류 발생:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '신청 기록 조회 중 오류가 발생했습니다.'
      });
    }
  },

  /**
   * 특정 비자 신청서 상세 조회 (평가 결과 포함)
   */
  getApplicationDetail: async (req, res) => {
    try {
      if (!req.user) {
        logger.warn('인증되지 않은 사용자의 비자 신청서 상세 조회 시도');
        return res.status(401).json({
          success: false,
          error: '인증이 필요합니다.'
        });
      }

      const { id } = req.params;

      if (!id) {
        logger.warn('조회할 신청서 ID가 누락되었습니다.');
        return res.status(400).json({
          success: false,
          error: '신청서 ID가 필요합니다.'
        });
      }

      const application = await VisaApplication.findById(id).lean();
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: '해당 신청서를 찾을 수 없습니다.'
        });
      }
      
      if (application.userId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: '해당 신청서에 대한 접근 권한이 없습니다.'
        });
      }

      // 상세 정보 포맷팅
      const detailedApplication = {
        ...application,
        visaTypeDisplay: formatVisaTypeForDisplay(application.visaType),
        hasEvaluation: !!application.evaluationResult,
        evaluationScore: application.evaluationResult?.overallScore || null,
        evaluationStatus: application.evaluationResult?.eligibilityStatus || 'NOT_EVALUATED',
        evaluationDate: application.evaluationResult?.evaluatedAt || null,
        documentCount: application.documents?.length || 0,
        daysSinceSubmission: application.submittedAt ? 
          Math.floor((Date.now() - new Date(application.submittedAt).getTime()) / (1000 * 60 * 60 * 24)) : null
      };

      logger.info(`사용자 ${req.user.id}의 신청서 ${id} 상세 조회`);
      
      return res.status(200).json({
        success: true,
        data: {
          application: detailedApplication
        }
      });
    } catch (error) {
      logger.error('신청서 상세 조회 중 오류 발생:', error);
      return res.status(500).json({
        success: false,
        error: error.message || '신청서 상세 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // ===== E-1 비자 종합 평가 (통합된 서비스 사용) =====

  /**
   * 🎯 E-1 비자 종합 평가 (최적화된 통합 버전)
   * 매뉴얼 기반 완전 버전: 사전평가 → 활동검증 → 사증발급인정서 → 행정사매칭
   */
  comprehensiveE1Evaluation: async (req, res) => {
    const {
      applicantData,
      clientPreferences = {},
      serviceOptions = {}
    } = req.body;

    try {
      logger.info('🎯 E-1 종합 평가 시작 (통합 서비스)');

      // 통합된 E1 종합 서비스 사용
      const e1Service = new E1ComprehensiveService();
      
      // 종합 평가 실행 (모든 기능 포함)
      const comprehensiveResult = await e1Service.performComprehensiveEvaluation(
        applicantData,
        clientPreferences,
        serviceOptions
      );

      logger.info('✅ E-1 종합 평가 완료 (통합 서비스):', {
        success: comprehensiveResult.success,
        evaluationScore: comprehensiveResult.evaluation?.totalScore,
        legalMatching: !!comprehensiveResult.legalRepresentative,
        certificateAssessment: !!comprehensiveResult.visaIssuanceCertificate
      });

      return res.status(200).json({
        success: true,
        data: comprehensiveResult
      });

    } catch (error) {
      logger.error('E-1 종합 평가 중 오류 발생:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'E-1 종합 평가 중 오류가 발생했습니다.'
      });
    }
  }
};

module.exports = visaEvaluationController; 