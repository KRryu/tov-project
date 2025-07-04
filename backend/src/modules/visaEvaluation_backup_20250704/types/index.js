/**
 * 비자 유형별 평가 모듈 통합 - 리팩토링된 버전 (v5.0)
 * 중앙화된 설정과 팩토리 패턴 적용
 */

const { evaluateE1Visa } = require('./e1Visa');

// ✅ 중앙화된 설정 사용 (단일 진실 소스)
const { 
  getSupportedVisaTypes, 
  isValidVisaType, 
  createEvaluator 
} = require('../config/centralVisaConfig');

// 기존 유틸리티는 호환성을 위해 유지
const visaTypeUtils = require('../../../utils/visaType');

/**
 * 팩토리 패턴 기반 공통 evaluateVisa 함수 (v5.0)
 * @param {string} visaType - 비자 코드(e.g. "E-1", "E2" 등)
 * @param {object} applicantData - 신청자/평가 데이터
 * @param {string} applicationType - 신청 유형 (NEW, EXTENSION, CHANGE)
 */
const evaluateVisa = (visaType, applicantData, applicationType = 'NEW') => {
  if (!visaType) {
    throw new Error('visaType 파라미터가 필요합니다.');
  }

  // 비자 타입 유효성 검증
  if (!isValidVisaType(visaType)) {
    throw new Error(`지원되지 않는 비자 타입: ${visaType}`);
  }

  try {
    // ✅ 팩토리 패턴으로 평가기 생성
    const evaluator = createEvaluator(visaType);
    
    // 평가 실행
    return evaluator.evaluate(applicantData, { 
      applicationType,
      visaType 
    });

  } catch (error) {
    console.warn(`평가기 생성 실패 (${visaType}):`, error.message);
    
    // 폴백: 기존 방식으로 처리
    const normalized = visaType.toUpperCase().replace('-', '');
    
    // E-1만 특별히 처리 (기존 로직 유지)
    if (normalized === 'E1') {
      return evaluateE1Visa(applicantData, { applicationType });
    }
    
    // 다른 비자들은 BaseEvaluator로 처리하도록 null 반환
    return null;
  }
};

/**
 * 지원되는 비자 타입 목록 반환 (중앙화된 설정 사용)
 * @deprecated 대신 centralVisaConfig.getSupportedVisaTypes() 사용 권장
 */
const getSupportedVisaTypesForEvaluation = () => {
  console.warn('getSupportedVisaTypesForEvaluation()은 deprecated입니다. centralVisaConfig.getSupportedVisaTypes()를 사용하세요.');
  return getSupportedVisaTypes();
};

/**
 * 비자 타입 유효성 검증
 * @param {string} visaType - 검증할 비자 타입
 * @returns {boolean} 유효 여부
 */
const validateVisaType = (visaType) => {
  return isValidVisaType(visaType);
};

/**
 * 평가 가능한 비자 타입 필터링
 * @param {string[]} visaTypes - 비자 타입 배열
 * @returns {string[]} 평가 가능한 비자 타입들
 */
const filterEvaluableVisaTypes = (visaTypes) => {
  return visaTypes.filter(type => isValidVisaType(type));
};

/**
 * 비자 타입별 지원 기능 확인
 * @param {string} visaType - 비자 타입
 * @returns {object} 지원 기능 정보
 */
const getVisaTypeCapabilities = (visaType) => {
  const { getVisaTypeInfo } = require('../config/centralVisaConfig');
  const info = getVisaTypeInfo(visaType);
  
  return {
    isSupported: !!info,
    hasSpecializedEvaluator: info?.hasSpecializedEvaluator || false,
    supportedFeatures: info?.supportedFeatures || {},
    complexity: info?.complexity || 'UNKNOWN',
    category: info?.category || 'UNKNOWN'
  };
};

/**
 * 배치 평가 지원 함수
 * @param {Array} evaluationRequests - 평가 요청 배열
 * @returns {Promise<Array>} 평가 결과 배열
 */
const evaluateVisaBatch = async (evaluationRequests) => {
  const results = [];
  
  for (const request of evaluationRequests) {
    try {
      const { visaType, applicantData, applicationType } = request;
      const result = evaluateVisa(visaType, applicantData, applicationType);
      
      results.push({
        ...request,
        result,
        success: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      results.push({
        ...request,
        result: null,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
};

/**
 * 호환성을 위한 레거시 함수들
 * @deprecated 새로운 팩토리 패턴 사용 권장
 */
const legacyFunctions = {
  // 기존 유틸리티 함수들 래핑
  getSupportedVisaTypes: visaTypeUtils.getSupportedVisaTypes,
  
  // 기존 evaluateE1Visa 직접 노출
  evaluateE1Visa
};

module.exports = {
  // ✅ 새로운 팩토리 패턴 기반 함수들
  evaluateVisa,
  validateVisaType,
  filterEvaluableVisaTypes,
  getVisaTypeCapabilities,
  evaluateVisaBatch,
  
  // 중앙화된 설정 함수들 (재export)
  getSupportedVisaTypes,
  isValidVisaType,
  createEvaluator,
  
  // 특화된 평가 함수들
  evaluateE1Visa,
  
  // 호환성을 위한 레거시 함수들
  getSupportedVisaTypesForEvaluation, // deprecated
  ...legacyFunctions,
  
  // 메타 정보
  version: '5.0',
  lastUpdated: '2024-01-01',
  architecture: 'FACTORY_PATTERN_WITH_CENTRALIZED_CONFIG'
};