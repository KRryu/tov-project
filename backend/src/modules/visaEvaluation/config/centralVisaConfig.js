/**
 * 중앙화된 비자 타입 설정 (단일 진실 소스)
 * 모든 비자 관련 설정과 메타데이터를 중앙 관리
 * 경로: /backend/src/modules/visaEvaluation/config/centralVisaConfig.js
 */

const path = require('path');
const fs = require('fs').promises;
const logger = require('../../../utils/logger');
const { validateVisaConfig } = require('./schemas/visaConfigSchema');

// === 🎯 비자 타입 카테고리 정의 ===
const VISA_CATEGORIES = {
  WORK: '취업',
  EDUCATION: '교육',
  INVESTMENT: '투자',
  RESIDENCE: '거주',
  DIPLOMATIC: '외교',
  TEMPORARY: '임시',
  SPECIAL: '특별'
};

// === 🏗️ 중앙화된 비자 타입 설정 ===
const VISA_TYPES = {
  // === E 시리즈 (취업) ===
  'E-1': {
    code: 'E-1',
    name: '교수',
    category: VISA_CATEGORIES.WORK,
    description: '고등교육법에 의한 자격요건을 갖춘 외국인으로서 전문대학 이상의 교육기관이나 이에 준하는 기관에서 교육 또는 연구지도',
    evaluator: '../../types/e1Visa',
    hasSpecializedEvaluator: true,
    complexity: 'MEDIUM',
    processingTime: { min: 7, max: 30 }, // 일
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE'],
    supportedFeatures: {
      preScreening: true,
      activityValidation: true,
      certificateIssuance: true,
      legalMatching: true,
      realTimeValidation: true
    }
  },
  
  'E-2': {
    code: 'E-2',
    name: '회화지도',
    category: VISA_CATEGORIES.WORK,
    description: '법무부장관이 정하는 자격요건을 갖춘 외국인으로서 외국어전용학원, 초·중·고교 및 대학 등에서 외국어 회화지도',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'MEDIUM',
    processingTime: { min: 7, max: 21 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'E-3': {
    code: 'E-3',
    name: '연구',
    category: VISA_CATEGORIES.WORK,
    description: '정부출연기관 또는 정부가 인정하는 연구기관에서 자연과학분야의 연구 또는 산업상 고도기술의 연구·개발',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'HIGH',
    processingTime: { min: 14, max: 30 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'E-4': {
    code: 'E-4',
    name: '기술지도',
    category: VISA_CATEGORIES.WORK,
    description: '자연과학분야의 기술지도',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'MEDIUM',
    processingTime: { min: 7, max: 21 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'E-5': {
    code: 'E-5',
    name: '전문직업',
    category: VISA_CATEGORIES.WORK,
    description: '각종 전문직업에 종사',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'MEDIUM',
    processingTime: { min: 7, max: 21 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'E-6': {
    code: 'E-6',
    name: '예술흥행',
    category: VISA_CATEGORIES.WORK,
    description: '수익이 따르는 음악, 미술, 문학 등의 예술활동과 수익을 목적으로 하는 연예, 연주, 연극, 운동경기, 광고·패션모델 등의 활동',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'HIGH',
    processingTime: { min: 14, max: 30 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'E-7': {
    code: 'E-7',
    name: '특정활동',
    category: VISA_CATEGORIES.WORK,
    description: '한국 내 공·사기관과의 계약에 의하여 법무부장관이 특별히 지정하는 활동',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'HIGH',
    processingTime: { min: 14, max: 30 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  // === F 시리즈 (거주) ===
  'F-1': {
    code: 'F-1',
    name: '방문동거',
    category: VISA_CATEGORIES.RESIDENCE,
    description: '친척방문, 가족동거, 피부양 등을 위한 장기체류',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'LOW',
    processingTime: { min: 7, max: 14 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'F-2': {
    code: 'F-2',
    name: '거주',
    category: VISA_CATEGORIES.RESIDENCE,
    description: '국민의 배우자, 영주권자',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'MEDIUM',
    processingTime: { min: 14, max: 30 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'F-3': {
    code: 'F-3',
    name: '동반',
    category: VISA_CATEGORIES.RESIDENCE,
    description: '한국에 체류하는 외국인의 배우자 및 미성년 자녀',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'LOW',
    processingTime: { min: 7, max: 14 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  // === D 시리즈 (교육/연수) ===
  'D-1': {
    code: 'D-1',
    name: '문화예술',
    category: VISA_CATEGORIES.EDUCATION,
    description: '문화예술분야에서의 연수',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'LOW',
    processingTime: { min: 7, max: 14 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'D-2': {
    code: 'D-2',
    name: '유학',
    category: VISA_CATEGORIES.EDUCATION,
    description: '전문대학 이상의 교육기관에서 정규과정의 교육을 받거나 학술연구',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'MEDIUM',
    processingTime: { min: 7, max: 21 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'D-4': {
    code: 'D-4',
    name: '일반연수',
    category: VISA_CATEGORIES.EDUCATION,
    description: '대학부설어학원 등에서 언어연수',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'LOW',
    processingTime: { min: 7, max: 14 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'D-8': {
    code: 'D-8',
    name: '기업투자',
    category: VISA_CATEGORIES.INVESTMENT,
    description: '외국인투자촉진법에 의한 외국인투자기업의 경영·관리 또는 생산·기술분야에 종사',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'HIGH',
    processingTime: { min: 14, max: 45 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'D-9': {
    code: 'D-9',
    name: '무역경영',
    category: VISA_CATEGORIES.INVESTMENT,
    description: '무역업체의 경영·관리 또는 무역업무',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'MEDIUM',
    processingTime: { min: 7, max: 21 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  'D-10': {
    code: 'D-10',
    name: '구직',
    category: VISA_CATEGORIES.TEMPORARY,
    description: '전문대학 이상의 교육기관 졸업(예정)자의 구직활동',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'LOW',
    processingTime: { min: 7, max: 14 },
    applicationTypes: ['NEW', 'EXTENSION', 'CHANGE']
  },

  // === C 시리즈 (단기) ===
  'C-3': {
    code: 'C-3',
    name: '단기방문',
    category: VISA_CATEGORIES.TEMPORARY,
    description: '90일 이내의 단기간 방문',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'LOW',
    processingTime: { min: 3, max: 7 },
    applicationTypes: ['NEW']
  },

  'C-4': {
    code: 'C-4',
    name: '단기취업',
    category: VISA_CATEGORIES.TEMPORARY,
    description: '90일 이내의 단기간 취업활동',
    evaluator: 'BaseEvaluator',
    hasSpecializedEvaluator: false,
    complexity: 'LOW',
    processingTime: { min: 7, max: 14 },
    applicationTypes: ['NEW']
  }
};

// === 🔧 유틸리티 함수들 ===

/**
 * 지원되는 모든 비자 타입 코드 반환
 */
const getSupportedVisaTypes = () => {
  return Object.keys(VISA_TYPES);
};

/**
 * 평가 가능한 비자 타입들 반환
 */
const getEvaluableVisaTypes = () => {
  return Object.keys(VISA_TYPES).filter(code => {
    const visa = VISA_TYPES[code];
    return visa.applicationTypes.includes('NEW');
  });
};

/**
 * 특화된 평가기가 있는 비자 타입들 반환
 */
const getSpecializedEvaluatorVisaTypes = () => {
  return Object.keys(VISA_TYPES).filter(code => {
    return VISA_TYPES[code].hasSpecializedEvaluator;
  });
};

/**
 * 카테고리별 비자 타입들 반환
 */
const getVisaTypesByCategory = (category) => {
  return Object.keys(VISA_TYPES).filter(code => {
    return VISA_TYPES[code].category === category;
  });
};

/**
 * 비자 타입 정보 반환
 */
const getVisaTypeInfo = (visaCode) => {
  return VISA_TYPES[visaCode] || null;
};

/**
 * 비자 타입 존재 여부 확인
 */
const isValidVisaType = (visaCode) => {
  return VISA_TYPES.hasOwnProperty(visaCode);
};

/**
 * 특정 신청 유형을 지원하는 비자 타입들 반환
 */
const getVisaTypesByApplicationType = (applicationType) => {
  return Object.keys(VISA_TYPES).filter(code => {
    return VISA_TYPES[code].applicationTypes.includes(applicationType);
  });
};

/**
 * 복잡도별 비자 타입들 반환
 */
const getVisaTypesByComplexity = (complexity) => {
  return Object.keys(VISA_TYPES).filter(code => {
    return VISA_TYPES[code].complexity === complexity;
  });
};

/**
 * 비자 변경 가능한 매트릭스 (예시)
 */
const getVisaChangeMatrix = () => {
  return {
    'D-2': ['E-1', 'E-2', 'E-3', 'E-7', 'F-2'],
    'D-10': ['E-1', 'E-2', 'E-3', 'E-7'],
    'E-2': ['E-1', 'E-3', 'E-7'],
    'E-3': ['E-1', 'E-2', 'E-7'],
    'E-7': ['E-1', 'E-2', 'E-3'],
    'F-1': ['F-2'],
    'C-3': ['D-2', 'D-4']
  };
};

/**
 * 팩토리 패턴: 평가기 생성
 */
const createEvaluator = (visaCode) => {
  const visaInfo = getVisaTypeInfo(visaCode);
  
  if (!visaInfo) {
    throw new Error(`지원되지 않는 비자 타입: ${visaCode}`);
  }

  // 특화된 평가기가 있는 경우
  if (visaInfo.hasSpecializedEvaluator) {
    try {
      const EvaluatorClass = require(`../core/evaluators/${visaInfo.evaluator}`);
      return new EvaluatorClass(visaInfo);
    } catch (error) {
      console.warn(`특화 평가기 로드 실패 (${visaCode}), BaseEvaluator 사용: ${error.message}`);
    }
  }

  // BaseEvaluator 사용
  const BaseEvaluator = require('../core/evaluators/BaseEvaluator');
  return new BaseEvaluator(visaCode, visaInfo);
};

/**
 * 설정 유효성 검증
 */
const validateConfig = () => {
  const errors = [];
  
  for (const [code, config] of Object.entries(VISA_TYPES)) {
    if (!config.name) errors.push(`${code}: name 누락`);
    if (!config.category) errors.push(`${code}: category 누락`);
    if (!config.evaluator) errors.push(`${code}: evaluator 누락`);
    if (!config.applicationTypes || config.applicationTypes.length === 0) {
      errors.push(`${code}: applicationTypes 누락`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  // 기본 설정
  VISA_CATEGORIES,
  VISA_TYPES,
  
  // 유틸리티 함수들
  getSupportedVisaTypes,
  getEvaluableVisaTypes,
  getSpecializedEvaluatorVisaTypes,
  getVisaTypesByCategory,
  getVisaTypeInfo,
  isValidVisaType,
  getVisaTypesByApplicationType,
  getVisaTypesByComplexity,
  getVisaChangeMatrix,
  
  // 팩토리 패턴
  createEvaluator,
  
  // 검증
  validateConfig
}; 