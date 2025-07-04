/**
 * 비자 신청 유형 모델
 * 경로: /backend/src/modules/visaEvaluation/core/models/ApplicationType.js
 */

/**
 * 비자 신청 유형 열거형
 */
const APPLICATION_TYPES = {
  NEW: 'NEW',                    // 신규 신청
  EXTENSION: 'EXTENSION',        // 연장 신청
  CHANGE: 'CHANGE',             // 변경 신청
  REENTRY: 'REENTRY'            // 재입국 허가
};

/**
 * 신청 유형별 특성 정의
 */
const APPLICATION_TYPE_CONFIG = {
  [APPLICATION_TYPES.NEW]: {
    name: '신규 신청',
    description: '최초로 해당 비자를 신청하는 경우',
    requiredDocuments: 'full',    // 모든 서류 필요
    evaluationWeight: 1.0,        // 전체 평가 적용
    additionalChecks: [
      'eligibility_verification',
      'document_completeness',
      'background_check'
    ]
  },
  
  [APPLICATION_TYPES.EXTENSION]: {
    name: '연장 신청',
    description: '현재 보유한 비자의 체류기간을 연장하는 경우',
    requiredDocuments: 'partial', // 부분 서류 (갱신용)
    evaluationWeight: 0.8,        // 기존 체류 이력 고려
    additionalChecks: [
      'current_status_verification',
      'compliance_check',
      'continued_eligibility'
    ]
  },
  
  [APPLICATION_TYPES.CHANGE]: {
    name: '변경 신청',
    description: '현재 체류자격을 다른 비자로 변경하는 경우',
    requiredDocuments: 'hybrid',  // 기존 + 신규 요구사항
    evaluationWeight: 0.9,        // 신규 자격 + 체류 이력
    additionalChecks: [
      'change_eligibility',
      'transition_feasibility',
      'current_compliance'
    ]
  },
  
  [APPLICATION_TYPES.REENTRY]: {
    name: '재입국 허가',
    description: '출국 후 재입국을 위한 허가 신청',
    requiredDocuments: 'minimal', // 최소 서류
    evaluationWeight: 0.6,        // 기존 이력 중심
    additionalChecks: [
      'departure_reason',
      'return_necessity',
      'compliance_history'
    ]
  }
};

/**
 * 신청 유형 결정 함수
 * @param {Object} applicantData - 신청자 데이터
 * @returns {string} 신청 유형
 */
const determineApplicationType = (applicantData) => {
  const { currentVisa, targetVisa, hasKoreanVisa, isExtension } = applicantData;
  
  // 연장 신청
  if (isExtension === true || (currentVisa && currentVisa === targetVisa)) {
    return APPLICATION_TYPES.EXTENSION;
  }
  
  // 변경 신청
  if (hasKoreanVisa === true && currentVisa && currentVisa !== targetVisa) {
    return APPLICATION_TYPES.CHANGE;
  }
  
  // 신규 신청 (기본값)
  return APPLICATION_TYPES.NEW;
};

/**
 * 신청 유형별 평가 가중치 조정
 * @param {string} applicationType - 신청 유형
 * @param {Object} baseWeights - 기본 가중치
 * @returns {Object} 조정된 가중치
 */
const adjustWeightsForApplicationType = (applicationType, baseWeights) => {
  const config = APPLICATION_TYPE_CONFIG[applicationType];
  const adjustmentFactor = config.evaluationWeight;
  
  const adjustedWeights = {};
  
  // 신청 유형별 가중치 조정
  switch (applicationType) {
    case APPLICATION_TYPES.EXTENSION:
      // 연장 신청시 기존 체류 이력과 현재 상태에 더 집중
      Object.keys(baseWeights).forEach(key => {
        if (key.includes('compliance') || key.includes('current')) {
          adjustedWeights[key] = Math.min(baseWeights[key] * 1.2, 1.0);
        } else {
          adjustedWeights[key] = baseWeights[key] * 0.9;
        }
      });
      break;
      
    case APPLICATION_TYPES.CHANGE:
      // 변경 신청시 새로운 자격 요건에 더 집중
      Object.keys(baseWeights).forEach(key => {
        if (key.includes('eligibility') || key.includes('qualification')) {
          adjustedWeights[key] = Math.min(baseWeights[key] * 1.1, 1.0);
        } else {
          adjustedWeights[key] = baseWeights[key] * 0.95;
        }
      });
      break;
      
    default:
      // 신규 신청은 원래 가중치 유지
      Object.assign(adjustedWeights, baseWeights);
  }
  
  return adjustedWeights;
};

module.exports = {
  APPLICATION_TYPES,
  APPLICATION_TYPE_CONFIG,
  determineApplicationType,
  adjustWeightsForApplicationType
}; 