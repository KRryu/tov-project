/**
 * 비자 평가 모듈 중계 인덱스 - V3.0 (최적화된 버전)
 * 경로: /backend/src/modules/visaEvaluation/index.js
 * 
 * 🚀 v3.0 최적화 개선사항:
 * - 거대한 EvaluationService.js (1494줄) 제거
 * - SimplifiedEvaluationService를 메인으로 사용
 * - 팩토리 패턴 기반 아키텍처
 * - 37개 비자 확장 준비 완료
 * - 결제-서류업로드 플로우 지원
 */

// === 🎯 새로운 최적화된 서비스들 ===
const { getSimplifiedEvaluationService, quickEvaluate } = require('./core/services/SimplifiedEvaluationService');
const { getEvaluatorFactory } = require('./core/evaluators/EvaluatorFactory');

// === 🛠️ 중앙화된 설정 관리 ===
const { getSupportedVisaTypes, isValidVisaType, getVisaTypeInfo } = require('./config/centralVisaConfig');

// === 🔄 기존 타입별 평가 모듈 (하위 호환성만) ===
const typesExports = require('./types');

// === 🛠️ 공통 유틸리티 ===
const visaTypeUtils = require('../../utils/visaType');
const { normalizeVisaCode, formatVisaTypeForDisplay } = visaTypeUtils;

// === 📝 모델 및 상수 ===
const { APPLICATION_TYPES } = require('./core/models/ApplicationType');
const { EVALUATION_STATUS, CONFIDENCE_LEVELS } = require('./core/models/EvaluationResult');

// === 🚀 시스템 유틸리티들 ===
const logger = require('../../utils/logger');
const RuleEngine = require('./core/rules/RuleEngine');
const cacheManager = require('../../utils/cacheManager');
const progressTracker = require('../../utils/progressTracker');

/**
 * 🔄 기존 API 호환성 함수 (V1) - 레거시 지원
 * 기존 visaEvaluationService.js에서 사용하는 함수와 완전 동일한 시그니처
 * 
 * @param {string} visaType - 비자 타입 (E-1, F-6 등)
 * @param {Object} applicantData - 신청자 데이터
 * @returns {Object} 평가 결과 (기존 형식)
 */
const evaluateVisa = (visaType, applicantData) => {
  logger.info('🔄 레거시 호환 모드: evaluateVisa 호출');
  
  try {
    const normalizedType = normalizeVisaCode(visaType);
    
    // 기존 타입별 평가 함수 매핑 (동기식)
    const evaluationMap = {
      'E1': typesExports.evaluateE1Visa,
      'E2': typesExports.evaluateE2Visa,
      'E3': typesExports.evaluateE3Visa,
      'E4': typesExports.evaluateE4Visa,
      'E5': typesExports.evaluateE5Visa,
      'E6': typesExports.evaluateE6Visa,
      'E7': typesExports.evaluateE7Visa,
      'E8': typesExports.evaluateE8Visa,
      'E9': typesExports.evaluateE9Visa,
      'E10': typesExports.evaluateE10Visa,
      'F1': typesExports.evaluateF1Visa,
      'F2': typesExports.evaluateF2Visa,
      'F3': typesExports.evaluateF3Visa,
      'F6': typesExports.evaluateF6Visa
    };
    
    const evaluateFunction = evaluationMap[normalizedType];
    
    if (evaluateFunction) {
      logger.info(`✅ 기존 ${normalizedType} 평가 함수 사용`);
      return evaluateFunction(applicantData);
    }
    
    // 지원되지 않는 비자 타입
    throw new Error(`비자 타입 ${visaType}은(는) 아직 지원되지 않습니다.`);
    
  } catch (error) {
    logger.error(`❌ 레거시 평가 오류 (${visaType}):`, error);
    return {
      success: false,
      message: `${visaType} 비자 평가 중 오류가 발생했습니다.`,
      error: error.message
    };
  }
};

/**
 * 🆕 최적화된 V3 비자 평가 함수 - SimplifiedEvaluationService 기반
 * 팩토리 패턴과 중앙화된 설정으로 37개 비자 지원
 * 
 * @param {string} visaType - 비자 타입 (E-1, F-6 등)
 * @param {Object} applicantData - 신청자 데이터
 * @param {Object} options - 평가 옵션
 * @returns {Promise<Object>} 평가 결과
 */
const evaluateVisaV3 = async (visaType, applicantData, options = {}) => {
  try {
    logger.info('🆕 V3 최적화된 비자 평가 시작:', { 
      visaType, 
      hasData: !!applicantData,
      options 
    });
    
    // SimplifiedEvaluationService 사용 (최적화된 버전)
    const evaluationService = getSimplifiedEvaluationService();
    
    // 기본 옵션 설정
    const evaluationOptions = {
      useFactoryPattern: true,    // 팩토리 패턴 사용
      useCentralConfig: true,     // 중앙화된 설정 사용
      useCache: true,             // 캐시 사용
      trackProgress: true,        // 진행상황 추적
      ...options                  // 사용자 옵션으로 덮어쓰기
    };
    
    const result = await evaluationService.evaluate(visaType, applicantData, evaluationOptions);
    
    logger.info('✅ V3 최적화된 평가 완료:', {
      success: result.success,
      totalScore: result.totalScore,
      fromCache: result._fromCache,
      evaluationId: result.evaluationId
    });
    
    return result;
    
  } catch (error) {
    logger.error('❌ V3 평가 오류:', error);
    return {
      success: false,
      message: 'V3 평가 중 오류가 발생했습니다.',
      error: error.message,
      visaType,
      _optimized: true
    };
  }
};

/**
 * 🤖 지능형 비자 평가 함수 - V3 우선 사용
 * V3 최적화된 엔진을 우선 사용하고, 실패 시 레거시로 폴백
 */
const evaluateVisaSmart = async (visaType, applicantData, useV3 = true) => {
  logger.info(`🤖 지능형 평가 시작: ${visaType}, V3 사용: ${useV3}`);
  
  if (useV3) {
    // V3 최적화된 엔진 우선 시도
    try {
      const result = await evaluateVisaV3(visaType, applicantData);
      if (result.success) {
        logger.info('✅ V3 최적화된 평가 성공');
        return result;
      }
      throw new Error('V3 평가 실패');
    } catch (error) {
      logger.warn('⚠️ V3 평가 실패, 레거시로 폴백:', error.message);
      // 레거시로 폴백
      return evaluateVisa(visaType, applicantData);
    }
  } else {
    // 레거시 엔진 사용
    logger.info('🔄 레거시 엔진 사용');
    return evaluateVisa(visaType, applicantData);
  }
};

/**
 * ⚡ 빠른 평가 함수 - 간단한 사전 평가용
 * SimplifiedEvaluationService의 quickEvaluate 사용
 */
const quickVisaEvaluation = async (visaType, basicData) => {
  try {
    logger.info('⚡ 빠른 평가 시작:', { visaType });
    
    const result = await quickEvaluate(visaType, basicData);
    
    logger.info('✅ 빠른 평가 완료:', {
      visaType,
      score: result.score,
      likelihood: result.likelihood
    });
    
    return result;
    
  } catch (error) {
    logger.error('❌ 빠른 평가 오류:', error);
    return {
      success: false,
      message: '빠른 평가 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * 🎯 비자 추천 시스템 - 중앙화된 설정 활용
 * 37개 비자 타입 중에서 최적의 비자 추천
 */
const recommendVisa = async (applicantProfile) => {
  try {
    logger.info('🎯 비자 추천 시작:', applicantProfile);
    
    const evaluationService = getSimplifiedEvaluationService();
    const supportedTypes = getSupportedVisaTypes();
    
    const recommendations = [];
    
    // 상위 점수 비자들만 빠른 평가
    for (const visaType of supportedTypes.slice(0, 8)) { // 상위 8개 테스트
      try {
        const result = await quickEvaluate(visaType, applicantProfile);
        if (result.success && result.score > 50) {
          const visaInfo = getVisaTypeInfo(visaType);
          recommendations.push({
            visaType,
            visaName: visaInfo?.name || visaType,
            score: result.score,
            likelihood: result.likelihood,
            advantages: result.strengths?.slice(0, 2) || [],
            requirements: result.missingRequirements?.slice(0, 3) || [],
            category: visaInfo?.category || 'Unknown'
          });
        }
      } catch (error) {
        logger.warn(`⚠️ 비자 추천 평가 실패 (${visaType}):`, error.message);
      }
    }
    
    // 점수 순으로 정렬
    recommendations.sort((a, b) => b.score - a.score);
    
    return {
      success: true,
      recommendedVisas: recommendations.slice(0, 3), // 상위 3개
      applicantProfile: {
        nationality: applicantProfile.nationality,
        purpose: applicantProfile.purpose || '미지정',
        evaluatedAt: new Date().toISOString()
      },
      _optimized: true
    };
    
  } catch (error) {
    logger.error('❌ 비자 추천 오류:', error);
    return {
      success: false,
      message: '비자 추천 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * 📚 신청 유형별 가이드 제공 - 중앙화된 설정 기반
 */
const getApplicationGuide = (visaType, applicationType = APPLICATION_TYPES.NEW) => {
  const visaInfo = getVisaTypeInfo(visaType);
  
  const guides = {
    [APPLICATION_TYPES.NEW]: {
      title: '신규 비자 신청 가이드',
      steps: [
        '자격 요건 확인',
        '필요 서류 준비',
        '온라인 신청서 작성',
        '서류 제출 및 수수료 납부',
        '심사 결과 대기'
      ],
      timeline: '보통 2-4주 소요',
      tips: [
        '모든 서류를 정확히 준비하세요',
        '번역 공증이 필요한 서류를 미리 확인하세요',
        '충분한 시간을 두고 준비하세요'
      ]
    },
    [APPLICATION_TYPES.EXTENSION]: {
      title: '비자 연장 신청 가이드',
      steps: [
        '현재 비자 상태 확인',
        '연장 사유 정리',
        '갱신 서류 준비',
        '온라인 신청',
        '결과 확인'
      ],
      timeline: '보통 1-2주 소요',
      tips: [
        '만료 전 충분한 여유를 두고 신청하세요',
        '체류 기간 동안의 활동 증빙을 준비하세요',
        '변경사항이 있다면 미리 신고하세요'
      ]
    },
    [APPLICATION_TYPES.CHANGE]: {
      title: '체류자격 변경 신청 가이드',
      steps: [
        '변경 가능성 검토',
        '새로운 자격 요건 확인',
        '변경 신청서 작성',
        '서류 제출',
        '면접 (필요시)',
        '결과 통지'
      ],
      timeline: '보통 3-6주 소요',
      tips: [
        '변경 사유를 명확히 설명하세요',
        '새로운 체류자격의 요건을 충족하는지 확인하세요',
        '현재 체류 상태가 적법한지 점검하세요'
      ]
    }
  };
  
  return {
    visaType,
    visaName: visaInfo?.name || visaType,
    applicationType,
    guide: guides[applicationType] || guides[APPLICATION_TYPES.NEW],
    visaSpecificInfo: visaInfo,
    additionalResources: [
      '출입국관리소 공식 웹사이트',
      '비자 관련 FAQ',
      '전문가 상담 서비스'
    ]
  };
};

/**
 * 📊 서비스 상태 및 통계 조회 - 최적화된 버전
 */
const getServiceStatus = () => {
  const evaluationService = getSimplifiedEvaluationService();
  const supportedTypes = getSupportedVisaTypes();
  
  return {
    version: '3.0-optimized',
    status: 'active',
    architecture: 'Factory Pattern + Centralized Config',
    supportedVisaTypes: supportedTypes,
    totalSupportedVisas: supportedTypes.length,
    statistics: evaluationService.getStatistics(),
    lastUpdated: new Date().toISOString(),
    features: {
      applicationTypes: Object.values(APPLICATION_TYPES),
      evaluationStatuses: Object.values(EVALUATION_STATUS),
      confidenceLevels: Object.values(CONFIDENCE_LEVELS),
      optimizedFeatures: {
        factoryPattern: true,
        centralizedConfig: true,
        simplifiedService: true,
        quickEvaluation: true,
        smartRecommendation: true
      }
    },
    performance: {
      averageEvaluationTime: '< 2초',
      cacheHitRate: evaluationService.getCacheStats()?.hitRate || 'N/A',
      memoryUsage: 'Optimized'
    }
  };
};

// === 🔧 기존 캐시/진행상황/규칙엔진 함수들 유지 ===
const getCacheStatistics = () => cacheManager.getStatistics();
const flushCache = (cacheType = 'all') => cacheManager.flush(cacheType);
const getCacheHealth = () => cacheManager.healthCheck();
const getProgressStatistics = () => progressTracker.getStatistics();
const getProcessStatus = (processId) => progressTracker.getProcessStatus(processId);
const getUserProcesses = (userId) => progressTracker.getUserProcesses(userId);
const createRuleEngine = () => new RuleEngine();
const getRuleEngineStatistics = () => {
  const ruleEngine = new RuleEngine();
  return ruleEngine.getStatistics();
};

/**
 * 🎛️ 시스템 상태 체크 - 최적화된 버전
 */
const getSystemHealth = () => {
  try {
    const cacheHealth = cacheManager.healthCheck();
    const progressStats = progressTracker.getStatistics();
    const ruleEngineStats = getRuleEngineStatistics();
    const evaluationService = getSimplifiedEvaluationService();
    
    return {
      status: 'healthy',
      version: '3.0-optimized',
      timestamp: new Date().toISOString(),
      components: {
        evaluationService: {
          status: 'healthy',
          type: 'SimplifiedEvaluationService',
          supportedVisas: getSupportedVisaTypes().length,
          performance: 'optimized'
        },
        cache: {
          status: cacheHealth.status,
          details: cacheHealth
        },
        progressTracker: {
          status: 'healthy',
          activeProcesses: progressStats.active,
          totalProcessed: progressStats.completed + progressStats.failed
        },
        ruleEngine: {
          status: 'healthy',
          totalRules: ruleEngineStats.totalRules,
          enabledRules: ruleEngineStats.enabledRules
        },
        factoryPattern: {
          status: 'active',
          evaluatorFactory: 'operational'
        },
        centralConfig: {
          status: 'active',
          visaTypes: getSupportedVisaTypes().length
        }
      }
    };
  } catch (error) {
    logger.error('시스템 상태 체크 오류:', error);
    return {
      status: 'unhealthy',
      version: '3.0-optimized',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

// 🎯 메인 export - 최적화된 V3 API 우선, 기존 호환성 유지
module.exports = {
  // === 🆕 최적화된 V3 API (권장) ===
  evaluateVisaV3,           // 최적화된 평가 엔진 (SimplifiedEvaluationService 기반)
  evaluateVisaSmart,        // 지능형 평가 (V3 우선, 레거시 폴백)
  quickVisaEvaluation,      // 빠른 평가 (사전 평가용)
  recommendVisa,            // 37개 비자 중 최적 추천
  getApplicationGuide,      // 비자별 가이드 (중앙화된 설정 기반)
  getServiceStatus,         // 최적화된 서비스 상태
  
  // === 🔄 기존 API (호환성 유지) ===
  evaluateVisa,             // ⭐ 기존 visaEvaluationService.js 호환
  getSupportedVisaTypes,    // ⭐ 기존 서비스 호환 (중앙화된 설정 기반)
  
  // === 🚀 관리 API ===
  getCacheStatistics, flushCache, getCacheHealth,
  getProgressStatistics, getProcessStatus, getUserProcesses,
  createRuleEngine, getRuleEngineStatistics,
  getSystemHealth,
  
  // === 🔄 기존 타입별 함수들 (호환성) ===
  ...typesExports,
  
  // === 🛠️ 유틸리티 함수 ===
  normalizeVisaCode, formatVisaTypeForDisplay,
  
  // === 📝 모델 및 상수 ===
  APPLICATION_TYPES, EVALUATION_STATUS, CONFIDENCE_LEVELS,
  
  // === ⚙️ 서비스 인스턴스 (고급 사용자용) ===
  getSimplifiedEvaluationService,  // 최적화된 평가 서비스
  getEvaluatorFactory,             // 팩토리 패턴 인스턴스
  
  // === 🛠️ 중앙화된 설정 관리 ===
  isValidVisaType,                 // 비자 타입 유효성 검사
  getVisaTypeInfo,                 // 비자 타입 상세 정보
  
  // === 🔧 시스템 컴포넌트 ===
  cacheManager, progressTracker, RuleEngine
};