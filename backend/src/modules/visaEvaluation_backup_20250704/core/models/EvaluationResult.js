/**
 * 비자 평가 결과 모델
 * 경로: /backend/src/modules/visaEvaluation/core/models/EvaluationResult.js
 */

// === 🔧 기존 유틸리티 활용 ===
const { normalizeVisaCode, formatVisaTypeForDisplay, getVisaName: getVisaNameFromUtil, getSupportedVisaTypes } = require('../../../../utils/visaType');

/**
 * 평가 결과 상태 열거형
 */
const EVALUATION_STATUS = {
  ELIGIBLE: 'ELIGIBLE',           // 승인 가능
  BORDERLINE: 'BORDERLINE',       // 보완 필요
  INELIGIBLE: 'INELIGIBLE',       // 승인 어려움
  INCOMPLETE: 'INCOMPLETE'        // 정보 부족
};

/**
 * 신뢰도 수준 열거형
 */
const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',         // 높음 (90% 이상)
  MEDIUM: 'MEDIUM',     // 보통 (70-89%)
  LOW: 'LOW'            // 낮음 (70% 미만)
};

/**
 * 처리 시간 추정치 (일 단위) - 기본값 및 예외 케이스
 */
const PROCESSING_TIME_ESTIMATES = {
  // 일반적인 취업비자 (E 시리즈)
  'employment': { min: 10, max: 20, average: 15 },
  
  // 복잡한 평가가 필요한 비자
  'complex': { min: 14, max: 30, average: 22 },
  
  // 간단한 행정처리 비자  
  'simple': { min: 7, max: 14, average: 10 },
  
  // 예외적인 케이스들
  'E-6': { min: 14, max: 30, average: 22 },  // 예술흥행 (복잡)
  'E-9': { min: 14, max: 30, average: 22 },  // 비전문취업 (복잡)
  'F-2': { min: 21, max: 45, average: 30 },  // 거주 (매우 복잡)
  'F-6': { min: 14, max: 30, average: 22 },  // 결혼이민 (복잡)
  
  // 기본값
  'default': { min: 14, max: 30, average: 22 }
};

/**
 * 비자 타입별 처리 복잡도 분류
 */
const getProcessingComplexity = (visaType) => {
  const complexVisas = ['E-6', 'E-9', 'F-2', 'F-6', 'D-8', 'D-9'];
  const simpleVisas = ['E-2', 'E-8', 'C-3', 'C-4'];
  
  if (complexVisas.includes(visaType)) return 'complex';
  if (simpleVisas.includes(visaType)) return 'simple';
  if (visaType.startsWith('E-')) return 'employment';
  
  return 'default';
};

/**
 * 평가 결과 클래스
 */
class EvaluationResult {
  constructor(visaType, applicationType = 'NEW') {
    this.visaType = formatVisaTypeForDisplay(visaType);
    this.applicationType = applicationType;
    this.evaluationDate = new Date().toISOString();
    this.evaluationVersion = '2.0';
    
    // 점수 정보
    this.scores = {
      overall: 0,
      category: {},
      weighted: {}
    };
    
    // 평가 결과
    this.status = EVALUATION_STATUS.INCOMPLETE;
    this.isEligible = false;
    this.confidenceLevel = CONFIDENCE_LEVELS.LOW;
    this.confidencePercentage = 0;
    
    // 요구사항 및 추천사항
    this.missingRequirements = [];
    this.recommendations = [];
    this.strengths = [];
    this.weaknesses = [];
    
    // === 🔧 동적 처리시간 계산 ===
    this.estimatedProcessingTime = this._getProcessingTimeEstimate();
    
    // 세부 정보
    this.details = {
      subcategory: null,
      applicationSpecifics: {},
      riskFactors: [],
      opportunities: []
    };
    
    // 개선 로드맵
    this.improvementRoadmap = {
      immediate: [],    // 즉시 (1-3개월)
      shortTerm: [],    // 단기 (3-6개월)
      mediumTerm: [],   // 중기 (6-12개월)
      longTerm: []      // 장기 (1년 이상)
    };
    
    this.success = true;
  }
  
  /**
   * 처리 시간 추정치 반환 (동적 계산)
   */
  _getProcessingTimeEstimate() {
    // 1. 특정 비자에 대한 예외 처리
    if (PROCESSING_TIME_ESTIMATES[this.visaType]) {
      const estimate = PROCESSING_TIME_ESTIMATES[this.visaType];
      return this._formatProcessingTime(estimate);
    }
    
    // 2. 복잡도 기반 분류
    const complexity = getProcessingComplexity(this.visaType);
    const estimate = PROCESSING_TIME_ESTIMATES[complexity] || PROCESSING_TIME_ESTIMATES.default;
    
    return this._formatProcessingTime(estimate);
  }
  
  /**
   * 처리시간 포맷팅
   */
  _formatProcessingTime(estimate) {
    return {
      minimum: estimate.min,
      maximum: estimate.max,
      average: estimate.average,
      description: `약 ${estimate.average}일 (${estimate.min}-${estimate.max}일)`
    };
  }
  
  /**
   * 점수 설정
   */
  setScores(categoryScores, weightedScores, totalScore) {
    this.scores.category = categoryScores;
    this.scores.weighted = weightedScores;
    this.scores.overall = Math.round(totalScore);
  }
  
  /**
   * 상태 설정 (임계값 기반)
   */
  setStatus(thresholds) {
    const score = this.scores.overall;
    
    if (score >= thresholds.pass) {
      this.status = EVALUATION_STATUS.ELIGIBLE;
      this.isEligible = true;
      this.confidenceLevel = CONFIDENCE_LEVELS.HIGH;
      this.confidencePercentage = Math.min(85 + (score - thresholds.pass), 95);
    } else if (score >= thresholds.borderline) {
      this.status = EVALUATION_STATUS.BORDERLINE;
      this.isEligible = false;
      this.confidenceLevel = CONFIDENCE_LEVELS.MEDIUM;
      this.confidencePercentage = 60 + ((score - thresholds.borderline) * 1.67);
    } else if (score >= thresholds.low) {
      this.status = EVALUATION_STATUS.INELIGIBLE;
      this.isEligible = false;
      this.confidenceLevel = CONFIDENCE_LEVELS.LOW;
      this.confidencePercentage = 30 + ((score - thresholds.low) * 2);
    } else {
      this.status = EVALUATION_STATUS.INELIGIBLE;
      this.isEligible = false;
      this.confidenceLevel = CONFIDENCE_LEVELS.LOW;
      this.confidencePercentage = Math.max(score * 0.6, 5);
    }
    
    this.confidencePercentage = Math.round(this.confidencePercentage);
  }
  
  /**
   * 누락된 요구사항 추가
   */
  addMissingRequirement(requirement) {
    this.missingRequirements.push(requirement);
  }
  
  /**
   * 추천사항 추가
   */
  addRecommendation(recommendation) {
    this.recommendations.push(recommendation);
  }
  
  /**
   * 강점 추가
   */
  addStrength(strength) {
    this.strengths.push(strength);
  }
  
  /**
   * 약점 추가
   */
  addWeakness(weakness) {
    this.weaknesses.push(weakness);
  }
  
  /**
   * 로드맵 항목 추가
   */
  addToRoadmap(timeframe, item) {
    if (this.improvementRoadmap[timeframe]) {
      this.improvementRoadmap[timeframe].push(item);
    }
  }
  
  /**
   * 상태 메시지 반환
   */
  getStatusMessage() {
    const messages = {
      [EVALUATION_STATUS.ELIGIBLE]: '비자 승인 가능성이 높습니다.',
      [EVALUATION_STATUS.BORDERLINE]: '일부 보완이 필요하지만 승인 가능합니다.',
      [EVALUATION_STATUS.INELIGIBLE]: '현재 상태로는 승인이 어려울 수 있습니다.',
      [EVALUATION_STATUS.INCOMPLETE]: '평가를 위한 정보가 부족합니다.'
    };
    
    return messages[this.status] || '평가 상태를 확인할 수 없습니다.';
  }
  
  /**
   * 신뢰도 메시지 반환
   */
  getConfidenceMessage() {
    const messages = {
      [CONFIDENCE_LEVELS.HIGH]: '높은 신뢰도',
      [CONFIDENCE_LEVELS.MEDIUM]: '보통 신뢰도',
      [CONFIDENCE_LEVELS.LOW]: '낮은 신뢰도'
    };
    
    return `${messages[this.confidenceLevel]} (${this.confidencePercentage}%)`;
  }
  
  /**
   * JSON 직렬화를 위한 변환
   */
  toJSON() {
    return {
      visaType: this.visaType,
      visaName: this._getVisaName(),
      applicationType: this.applicationType,
      applicationTypeName: this._getApplicationTypeName(),
      
      // 평가 결과
      totalScore: this.scores.overall,
      status: this.status,
      statusMessage: this.getStatusMessage(),
      isEligible: this.isEligible,
      
      // 신뢰도
      confidenceLevel: this.confidenceLevel,
      confidencePercentage: this.confidencePercentage,
      confidenceMessage: this.getConfidenceMessage(),
      
      // 점수 상세
      categoryScores: this.scores.category,
      weightedScores: this.scores.weighted,
      
      // 평가 내용
      strengths: this.strengths,
      weaknesses: this.weaknesses,
      missingRequirements: this.missingRequirements,
      recommendations: this.recommendations,
      
      // 개선 계획
      improvementRoadmap: this.improvementRoadmap,
      
      // 처리 정보
      estimatedProcessingTime: this.estimatedProcessingTime,
      
      // 세부 정보
      details: this.details,
      
      // 메타 정보
      evaluationDate: this.evaluationDate,
      evaluationVersion: this.evaluationVersion,
      success: this.success
    };
  }
  
  /**
   * 비자명 반환 (기존 유틸리티 활용)
   */
  _getVisaName() {
    try {
      // === 🔧 하드코딩 제거: 기존 유틸리티 사용 ===
      return getVisaNameFromUtil(this.visaType);
    } catch (error) {
      // 폴백: 기본 비자명 매핑
      const fallbackNames = {
        'E-1': '교수',
        'E-2': '회화지도', 
        'E-3': '연구',
        'E-4': '기술지도',
        'E-5': '전문직업',
        'E-6': '예술흥행',
        'E-7': '특정활동',
        'E-8': '계절근로',
        'E-9': '비전문취업',
        'E-10': '전환취업',
        'F-1': '방문동거',
        'F-2': '거주',
        'F-3': '동반',
        'F-6': '결혼이민'
      };
      
      return fallbackNames[this.visaType] || this.visaType;
    }
  }
  
  /**
   * 신청 유형명 반환
   */
  _getApplicationTypeName() {
    const typeNames = {
      'NEW': '신규 신청',
      'EXTENSION': '연장 신청',
      'CHANGE': '변경 신청',
      'REENTRY': '재입국 허가'
    };
    
    return typeNames[this.applicationType] || this.applicationType;
  }
}

/**
 * 평가 결과 팩토리 함수
 */
const createEvaluationResult = (visaType, applicationType = 'NEW') => {
  return new EvaluationResult(visaType, applicationType);
};

module.exports = {
  EvaluationResult,
  createEvaluationResult,
  EVALUATION_STATUS,
  CONFIDENCE_LEVELS,
  PROCESSING_TIME_ESTIMATES
}; 