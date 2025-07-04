/**
 * 비자 평가 컨트롤러 V3
 * 기존 시스템과 새 모듈을 연결하는 브릿지
 */

const asyncHandler = require('../../utils/asyncHandler');
const logger = require('../../utils/logger');
const VisaModule = require('../../modules/visa');

// 모듈 초기화
let moduleInitialized = false;
const initializeModule = async () => {
  if (!moduleInitialized) {
    await VisaModule.initialize();
    moduleInitialized = true;
    logger.info('✅ 새 비자 모듈 V4 초기화 완료');
  }
};

/**
 * 메인 비자 평가 (새 모듈 사용)
 */
exports.evaluateVisa = asyncHandler(async (req, res) => {
  await initializeModule();

  const { visaType, applicationType = 'NEW', ...data } = req.body;

  const result = await VisaModule.evaluate({
    visaType,
    applicationType,
    data
  });

  if (result.success) {
    res.json({
      success: true,
      data: {
        eligible: result.result.eligible,
        score: result.result.score,
        details: result.result.details,
        recommendations: result.result.recommendations,
        requiredDocuments: result.result.requiredDocuments,
        nextSteps: result.result.nextSteps,
        evaluationId: result.evaluationId
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error
    });
  }
});

/**
 * 빠른 사전 평가
 */
exports.quickEvaluation = asyncHandler(async (req, res) => {
  await initializeModule();

  const { visaType, education, experience } = req.body;

  const result = await VisaModule.evaluate({
    visaType,
    applicationType: 'NEW',
    data: {
      education: education || 'BACHELOR',
      experience: experience || 0,
      quickCheck: true
    }
  });

  res.json({
    success: result.success,
    eligible: result.result?.eligible || false,
    score: result.result?.score || 0,
    message: result.result?.eligible 
      ? '기본 요건을 충족합니다.' 
      : '추가 검토가 필요합니다.'
  });
});

/**
 * 지원 비자 타입 조회
 */
exports.getSupportedVisaTypes = asyncHandler(async (req, res) => {
  await initializeModule();

  const types = await VisaModule.visaService.getSupportedVisaTypes();
  
  res.json({
    success: true,
    data: types
  });
});

/**
 * 비자 타입 정보 조회
 */
exports.getVisaTypeInfo = asyncHandler(async (req, res) => {
  await initializeModule();

  const { visaType } = req.params;
  const { applicationType = 'NEW' } = req.query;

  const requirements = await VisaModule.visaService.getVisaRequirements(
    visaType,
    applicationType
  );

  res.json({
    success: true,
    data: requirements
  });
});

/**
 * 비자 추천
 */
exports.recommendVisa = asyncHandler(async (req, res) => {
  await initializeModule();

  const { currentStatus, purpose, qualifications } = req.body;

  // 여러 비자 타입을 평가하여 최적 추천
  const candidates = ['E-1', 'E-2', 'E-7', 'D-2', 'D-10'];
  const evaluations = [];

  for (const visaType of candidates) {
    try {
      const result = await VisaModule.evaluate({
        visaType,
        applicationType: currentStatus ? 'CHANGE' : 'NEW',
        data: {
          ...qualifications,
          currentVisa: { type: currentStatus },
          purpose
        }
      });

      if (result.success && result.result.eligible) {
        evaluations.push({
          visaType,
          score: result.result.score,
          complexity: result.result.complexity,
          processingTime: result.result.processingTime
        });
      }
    } catch (error) {
      logger.warn(`비자 추천 평가 실패: ${visaType}`, error);
    }
  }

  // 점수순 정렬
  evaluations.sort((a, b) => b.score - a.score);

  res.json({
    success: true,
    data: {
      recommendations: evaluations.slice(0, 3),
      totalEvaluated: candidates.length
    }
  });
});

/**
 * 신청 가이드 조회
 */
exports.getApplicationGuide = asyncHandler(async (req, res) => {
  await initializeModule();

  const { visaType, applicationType = 'NEW' } = req.query;

  const requirements = await VisaModule.visaService.getVisaRequirements(
    visaType,
    applicationType
  );

  // 가이드 생성
  const guide = {
    visaType,
    applicationType,
    steps: [
      {
        step: 1,
        title: '자격 요건 확인',
        description: '기본 자격 요건을 충족하는지 확인하세요.',
        requirements: requirements.requirements.basic
      },
      {
        step: 2,
        title: '필수 서류 준비',
        description: '모든 필수 서류를 준비하세요.',
        documents: requirements.requirements.documents
      },
      {
        step: 3,
        title: '온라인 신청',
        description: '준비된 서류로 온라인 신청을 진행하세요.',
        link: 'https://www.visa.go.kr'
      },
      {
        step: 4,
        title: '수수료 납부',
        description: '신청 수수료를 납부하세요.',
        fee: applicationType === 'NEW' ? 60000 : 130000
      },
      {
        step: 5,
        title: '심사 대기',
        description: '심사 결과를 기다리세요.',
        processingTime: requirements.processingTime
      }
    ]
  };

  res.json({
    success: true,
    data: guide
  });
});

/**
 * 서비스 상태 확인
 */
exports.getServiceStatus = asyncHandler(async (req, res) => {
  const status = VisaModule.getStatus();

  res.json({
    success: true,
    data: {
      ...status,
      message: '비자 평가 서비스가 정상 작동 중입니다.'
    }
  });
});

/**
 * E1 종합 평가 (레거시 호환)
 */
exports.comprehensiveE1Evaluation = asyncHandler(async (req, res) => {
  await initializeModule();

  const result = await VisaModule.evaluate({
    visaType: 'E-1',
    applicationType: req.body.applicationType || 'NEW',
    data: req.body
  });

  res.json({
    success: result.success,
    data: result.success ? {
      ...result.result,
      comprehensive: true,
      evaluationType: 'E1_COMPREHENSIVE'
    } : null,
    error: result.error
  });
});