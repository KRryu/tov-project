// 새로운 V4 모듈 사용
const VisaModule = require('../../modules/visa');

// 모듈 초기화 플래그
let moduleInitialized = false;
const VisaApplication = require('../../models/visa/VisaApplication');
const logger = require('../../utils/logger');

/**
 * 비자 타입 정규화 함수 - utils/visaType.js와 통일
 */
const { normalizeVisaCode } = require('../../utils/visaType');

// 하이픈 제거된 Visa Code 정규화 함수 (E1, E2 등) - 서비스 내부 전용
const normalizeVisaType = normalizeVisaCode;

/**
 * 비자 평가 서비스
 */
const visaEvaluationService = {
  /**
   * 비자 평가 수행 - E1, E2, E3, E4 고도화 버전 반영
   */
  async evaluateVisa(visaType, applicantData) {
    try {
      // 로깅을 위한 정규화(하이픈 제거)
      const normalized = normalizeVisaType(visaType);
      logger.info(`비자 평가 시작: ${normalized}`);

      // 모듈 초기화 확인
      if (!moduleInitialized) {
        await VisaModule.initialize();
        moduleInitialized = true;
      }

      // 새로운 V4 모듈로 평가
      const evaluation = await VisaModule.evaluate({
        visaType: normalized,
        applicationType: applicantData.applicationType || 'NEW',
        data: applicantData
      });
      
      const result = evaluation.success ? evaluation.result : null;

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('비자 평가 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 자격 상태 결정
   */
  determineEligibilityStatus(result) {
    const { EVALUATION_STATUS } = VisaApplication;
    
    if (!result.totalScore && !result.overallScore) {
      return EVALUATION_STATUS.REVIEW_REQUIRED;
    }

    const score = result.totalScore || result.overallScore;
    
    if (score >= 80) {
      return EVALUATION_STATUS.QUALIFIED;
    } else if (score < 60) {
      return EVALUATION_STATUS.UNQUALIFIED;
    } else {
      return EVALUATION_STATUS.REVIEW_REQUIRED;
    }
  },

  /**
   * 지원되는 비자 유형 목록 조회
   */
  getSupportedTypes() {
    const visaTypes = getSupportedVisaTypes();
    logger.info(`지원되는 비자 유형 조회: ${visaTypes.length}개 유형`);
    return visaTypes;
  },

  /**
   * 평가 결과 저장 - 고도화 특화 필드 제거, 공통 구조만 저장
   */
  async saveEvaluationResult(applicationId, userId, result) {
    if (!applicationId) {
      throw new Error('신청서 ID가 필요합니다.');
    }

    if (!result) {
      throw new Error('평가 결과 데이터가 필요합니다.');
    }

    const application = await VisaApplication.findById(applicationId);
    
    if (!application) {
      throw new Error('해당 신청서를 찾을 수 없습니다.');
    }

    if (application.userId.toString() !== userId) {
      throw new Error('해당 신청서에 대한 접근 권한이 없습니다.');
    }

    // 공통 평가 결과 구조 (비자별 특화 필드 제거)
    const evaluationResult = {
      overallScore: result.totalScore || result.overallScore || 0,
      eligibilityStatus: result.status || VisaApplication.EVALUATION_STATUS.REVIEW_REQUIRED,
      categoryScores: result.categoryScores || {},
      weightedScores: result.weightedScores || {},
      categoryInfo: result.categoryInfo || {},
      details: result.details || {},
      issues: result.issues || [],
      recommendations: result.recommendations || [],
      evaluatedAt: new Date(),
      rawResult: result // 전체 원본 결과 저장(향후 필요 시 사용)
    };

    application.evaluationResult = evaluationResult;

    // 단순 상태 업데이트 (점수 기반)
    const eligibility = this.determineEligibilityStatus(result);
    if (eligibility === VisaApplication.EVALUATION_STATUS.QUALIFIED) {
      application.status = VisaApplication.APPLICATION_STATUS.REVIEWING;
    } else if (eligibility === VisaApplication.EVALUATION_STATUS.UNQUALIFIED) {
      application.status = VisaApplication.APPLICATION_STATUS.REJECTED;
    } else {
      application.status = VisaApplication.APPLICATION_STATUS.ADDITIONAL_INFO_REQUIRED;
    }

    await application.save();

    return {
      success: true,
      message: '평가 결과가 저장되었습니다.',
      status: application.status,
      approvalChance: result.approvalPrediction?.percentage
    };
  },

  /**
   * 문서 업로드 처리
   */
  async processDocumentUpload(userId, files) {
    if (!files || files.length === 0) {
      throw new Error('업로드된 파일이 없습니다.');
    }

    const uploadedFiles = files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));

    logger.info(`사용자 ${userId}가 ${uploadedFiles.length}개의 문서를 업로드했습니다.`);
    
    return {
      success: true,
      files: uploadedFiles
    };
  }
};

module.exports = visaEvaluationService;