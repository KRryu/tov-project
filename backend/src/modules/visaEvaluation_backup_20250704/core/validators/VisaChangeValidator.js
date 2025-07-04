/**
 * 비자 변경 가능성 검증 시스템
 * 법적 가능성, 실질적 요건, 타이밍, 리스크를 종합 평가
 * 경로: /backend/src/modules/visaEvaluation/core/validators/VisaChangeValidator.js
 */

const { getGlobalRegistry } = require('../registry/VisaTypeRegistry');
const { ValidationError, VisaEvaluationError } = require('../../../../utils/errors');
const logger = require('../../../../utils/logger');

/**
 * 변경 리스크 레벨
 */
const RISK_LEVELS = {
  LOW: 'LOW',           // 낮음 (90% 이상 성공률)
  MEDIUM: 'MEDIUM',     // 보통 (70-89% 성공률)
  HIGH: 'HIGH',         // 높음 (50-69% 성공률)
  CRITICAL: 'CRITICAL'  // 매우 높음 (50% 미만 성공률)
};

/**
 * 변경 타이밍 상태
 */
const TIMING_STATUS = {
  OPTIMAL: 'OPTIMAL',       // 최적
  ACCEPTABLE: 'ACCEPTABLE', // 허용 가능
  SUBOPTIMAL: 'SUBOPTIMAL', // 차선
  RESTRICTED: 'RESTRICTED'  // 제한됨
};

/**
 * 법적 변경 경로 매트릭스
 */
const LEGAL_CHANGE_MATRIX = {
  'D-2': {  // 유학
    allowed: ['E-1', 'E-2', 'E-3', 'E-7', 'F-2', 'D-10'],
    restricted: ['C-3', 'C-4', 'H-2'],
    special_conditions: {
      'E-1': ['graduation_required', 'phd_or_master_required'],
      'E-7': ['relevant_major_required', 'job_offer_required']
    }
  },
  
  'E-1': {  // 교수
    allowed: ['E-2', 'E-3', 'E-4', 'E-5', 'E-7', 'F-2'],
    restricted: ['D-2', 'C-3', 'C-4'],
    special_conditions: {
      'E-2': ['teaching_experience_transfer'],
      'F-2': ['points_system_required']
    }
  },
  
  'E-2': {  // 회화지도
    allowed: ['E-1', 'E-3', 'E-7', 'F-2'],
    restricted: ['D-2', 'C-3', 'C-4'],
    special_conditions: {
      'E-1': ['higher_qualification_required'],
      'E-7': ['skill_transfer_evaluation']
    }
  },
  
  'E-7': {  // 특정활동
    allowed: ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'F-2'],
    restricted: ['D-2', 'C-3', 'C-4'],
    special_conditions: {
      'F-2': ['points_system_required', 'income_requirement']
    }
  },
  
  'F-2': {  // 거주
    allowed: ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-7'],
    restricted: [],
    special_conditions: {}
  }
};

/**
 * 비자 변경 검증기
 */
class VisaChangeValidator {
  constructor(options = {}) {
    this.registry = options.registry || getGlobalRegistry();
    this.logger = options.logger || logger;
    this.enableDetailedLogging = options.enableDetailedLogging === true;
  }

  /**
   * 종합 변경 가능성 평가
   * @param {string} fromVisa - 현재 비자
   * @param {string} toVisa - 변경할 비자
   * @param {Object} applicantData - 신청자 데이터
   * @returns {Object} 종합 평가 결과
   */
  async validateChange(fromVisa, toVisa, applicantData) {
    const evaluationId = this._generateEvaluationId();
    
    try {
      this.logger.info('비자 변경 가능성 평가 시작', {
        evaluationId,
        fromVisa,
        toVisa,
        applicantId: applicantData.id
      });

      // 1. 법적 가능성 검증
      const legalCheck = this.checkLegalPath(fromVisa, toVisa);
      
      // 2. 실질적 요건 검증
      const requirementCheck = await this.checkRequirements(toVisa, applicantData);
      
      // 3. 타이밍 검증
      const timingCheck = this.checkTiming(applicantData.currentStatus);
      
      // 4. 리스크 평가
      const riskAssessment = await this.assessRisk(fromVisa, toVisa, applicantData);
      
      // 5. 종합 판단
      const overallResult = this._calculateOverallResult(
        legalCheck, 
        requirementCheck, 
        timingCheck, 
        riskAssessment
      );

      // 6. 권고사항 생성
      const recommendations = this.generateRecommendations(
        fromVisa, 
        toVisa, 
        legalCheck, 
        requirementCheck, 
        timingCheck, 
        riskAssessment
      );

      const result = {
        evaluationId,
        possible: overallResult.possible,
        confidence: overallResult.confidence,
        riskLevel: riskAssessment.level,
        
        details: {
          legal: legalCheck,
          requirements: requirementCheck,
          timing: timingCheck,
          risk: riskAssessment
        },
        
        recommendations,
        estimatedProcessingTime: this._estimateProcessingTime(fromVisa, toVisa, riskAssessment.level),
        
        metadata: {
          evaluatedAt: new Date(),
          evaluationId,
          version: '2.0'
        }
      };

      this.logger.info('비자 변경 가능성 평가 완료', {
        evaluationId,
        possible: result.possible,
        riskLevel: result.riskLevel,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      this.logger.error('비자 변경 가능성 평가 중 오류:', {
        evaluationId,
        error: error.message,
        fromVisa,
        toVisa
      });
      
      throw new VisaEvaluationError(
        '비자 변경 가능성 평가 중 오류가 발생했습니다.',
        fromVisa,
        'CHANGE',
        { originalError: error.message, evaluationId }
      );
    }
  }

  /**
   * 법적 가능성 검증
   * @param {string} fromVisa - 현재 비자
   * @param {string} toVisa - 변경할 비자
   * @returns {Object} 법적 검증 결과
   */
  checkLegalPath(fromVisa, toVisa) {
    const fromMatrix = LEGAL_CHANGE_MATRIX[fromVisa];
    
    if (!fromMatrix) {
      return {
        possible: false,
        reason: '현재 비자 타입이 변경 매트릭스에 없습니다.',
        code: 'UNSUPPORTED_FROM_VISA'
      };
    }

    // 제한된 변경인지 확인
    if (fromMatrix.restricted.includes(toVisa)) {
      return {
        possible: false,
        reason: '법적으로 제한된 비자 변경 경로입니다.',
        code: 'RESTRICTED_PATH'
      };
    }

    // 허용된 변경인지 확인
    if (!fromMatrix.allowed.includes(toVisa)) {
      return {
        possible: false,
        reason: '허용되지 않은 비자 변경 경로입니다.',
        code: 'DISALLOWED_PATH'
      };
    }

    // 특별 조건 확인
    const specialConditions = fromMatrix.special_conditions[toVisa] || [];

    return {
      possible: true,
      specialConditions,
      legalBasis: this._getLegalBasis(fromVisa, toVisa),
      code: 'LEGAL_PATH_CONFIRMED'
    };
  }

  /**
   * 실질적 요건 검증
   * @param {string} toVisa - 변경할 비자
   * @param {Object} applicantData - 신청자 데이터
   * @returns {Object} 요건 검증 결과
   */
  async checkRequirements(toVisa, applicantData) {
    const visaConfig = this.registry.getConfig(toVisa);
    
    if (!visaConfig) {
      throw new ValidationError(
        `등록되지 않은 비자 타입: ${toVisa}`,
        { visaType: toVisa }
      );
    }

    const eligibilityRules = visaConfig.eligibilityRules || {};
    const basicRequirements = eligibilityRules.basic || {};
    
    const results = {
      passed: [],
      failed: [],
      warnings: [],
      score: 0
    };

    // 학력 요건 검증
    if (basicRequirements.minimumEducation) {
      const educationCheck = this._checkEducationRequirement(
        applicantData.education,
        basicRequirements.minimumEducation
      );
      
      if (educationCheck.passed) {
        results.passed.push('education');
        results.score += 25;
      } else {
        results.failed.push({
          requirement: 'education',
          reason: educationCheck.reason,
          required: basicRequirements.minimumEducation,
          actual: applicantData.education?.level
        });
      }
    }

    // 경력 요건 검증
    if (basicRequirements.minimumExperience > 0) {
      const experienceYears = this._calculateExperienceYears(applicantData.experience);
      
      if (experienceYears >= basicRequirements.minimumExperience) {
        results.passed.push('experience');
        results.score += 25;
      } else {
        results.failed.push({
          requirement: 'experience',
          reason: '최소 경력 요건 미충족',
          required: `${basicRequirements.minimumExperience}년`,
          actual: `${experienceYears}년`
        });
      }
    }

    // 언어 요건 검증 (한국어)
    const languageCheck = this._checkLanguageRequirement(applicantData.language);
    if (languageCheck.sufficient) {
      results.passed.push('language');
      results.score += 25;
    } else {
      results.warnings.push({
        requirement: 'language',
        message: '언어 능력 증명이 도움이 될 수 있습니다.',
        suggestion: languageCheck.suggestion
      });
      results.score += 10; // 부분 점수
    }

    // 재정 요건 검증
    const financialCheck = this._checkFinancialRequirement(applicantData.financial, toVisa);
    if (financialCheck.sufficient) {
      results.passed.push('financial');
      results.score += 25;
    } else {
      results.failed.push({
        requirement: 'financial',
        reason: financialCheck.reason,
        required: financialCheck.minimumAmount,
        actual: financialCheck.actualAmount
      });
    }

    return {
      overall: results.failed.length === 0 && results.score >= 75,
      score: results.score,
      maxScore: 100,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      additionalRequirements: this._getAdditionalRequirements(toVisa, applicantData)
    };
  }

  /**
   * 타이밍 검증
   * @param {Object} currentStatus - 현재 상태
   * @returns {Object} 타이밍 검증 결과
   */
  checkTiming(currentStatus) {
    const now = new Date();
    const visaExpiry = new Date(currentStatus.visaExpiryDate);
    const daysUntilExpiry = Math.ceil((visaExpiry - now) / (1000 * 60 * 60 * 24));
    
    let timingStatus;
    let message;
    let score = 0;

    if (daysUntilExpiry < 30) {
      timingStatus = TIMING_STATUS.RESTRICTED;
      message = '비자 만료까지 30일 미만으로 긴급 처리가 필요합니다.';
      score = 25;
    } else if (daysUntilExpiry < 90) {
      timingStatus = TIMING_STATUS.SUBOPTIMAL;
      message = '비자 만료까지 90일 미만으로 서둘러 신청하는 것이 좋습니다.';
      score = 60;
    } else if (daysUntilExpiry < 180) {
      timingStatus = TIMING_STATUS.ACCEPTABLE;
      message = '적절한 신청 시기입니다.';
      score = 85;
    } else {
      timingStatus = TIMING_STATUS.OPTIMAL;
      message = '최적의 신청 시기입니다.';
      score = 100;
    }

    // 체류 기간 고려
    const stayDuration = this._calculateStayDuration(currentStatus.entryDate);
    let stayBonus = 0;
    
    if (stayDuration >= 12) {
      stayBonus = Math.min(20, Math.floor(stayDuration / 12) * 5);
    }

    return {
      status: timingStatus,
      score: Math.min(100, score + stayBonus),
      daysUntilExpiry,
      stayDuration,
      message,
      recommendations: this._getTimingRecommendations(timingStatus, daysUntilExpiry)
    };
  }

  /**
   * 리스크 평가
   * @param {string} fromVisa - 현재 비자
   * @param {string} toVisa - 변경할 비자
   * @param {Object} applicantData - 신청자 데이터
   * @returns {Object} 리스크 평가 결과
   */
  async assessRisk(fromVisa, toVisa, applicantData) {
    let riskScore = 0;
    const riskFactors = [];
    const mitigatingFactors = [];

    // 1. 변경 경로별 기본 리스크
    const pathRisk = this._getPathRisk(fromVisa, toVisa);
    riskScore += pathRisk.score;
    if (pathRisk.factor) riskFactors.push(pathRisk.factor);

    // 2. 신청자 이력 리스크
    const historyRisk = this._assessHistoryRisk(applicantData.stayHistory);
    riskScore += historyRisk.score;
    riskFactors.push(...historyRisk.factors);

    // 3. 서류 완성도 리스크
    const documentRisk = this._assessDocumentRisk(applicantData.documents, toVisa);
    riskScore += documentRisk.score;
    if (documentRisk.factors.length > 0) {
      riskFactors.push(...documentRisk.factors);
    }

    // 4. 완화 요인 평가
    const mitigating = this._assessMitigatingFactors(applicantData);
    riskScore -= mitigating.score;
    mitigatingFactors.push(...mitigating.factors);

    // 리스크 레벨 결정
    const level = this._determineRiskLevel(riskScore);
    
    return {
      level,
      score: riskScore,
      factors: riskFactors,
      mitigatingFactors,
      successProbability: this._calculateSuccessProbability(riskScore),
      recommendations: this._getRiskMitigationRecommendations(riskFactors)
    };
  }

  /**
   * 권고사항 생성
   */
  generateRecommendations(fromVisa, toVisa, legalCheck, requirementCheck, timingCheck, riskAssessment) {
    const recommendations = [];

    // 법적 권고사항
    if (!legalCheck.possible) {
      recommendations.push({
        category: 'LEGAL',
        priority: 'CRITICAL',
        message: legalCheck.reason,
        actions: ['법무법인 상담', '대안 비자 타입 검토']
      });
    }

    // 요건 관련 권고사항
    if (requirementCheck.failed.length > 0) {
      requirementCheck.failed.forEach(failure => {
        recommendations.push({
          category: 'REQUIREMENTS',
          priority: 'HIGH',
          message: `${failure.requirement} 요건 미충족: ${failure.reason}`,
          actions: this._getRequirementActions(failure.requirement)
        });
      });
    }

    // 타이밍 관련 권고사항
    if (timingCheck.status === TIMING_STATUS.RESTRICTED) {
      recommendations.push({
        category: 'TIMING',
        priority: 'HIGH',
        message: '긴급 처리가 필요한 상황입니다.',
        actions: ['즉시 신청 준비', '긴급 처리 수수료 검토', '임시 연장 신청 고려']
      });
    }

    // 리스크 완화 권고사항
    if (riskAssessment.level === RISK_LEVELS.HIGH || riskAssessment.level === RISK_LEVELS.CRITICAL) {
      recommendations.push({
        category: 'RISK_MITIGATION',
        priority: 'HIGH',
        message: '성공률 향상을 위한 추가 조치가 필요합니다.',
        actions: riskAssessment.recommendations
      });
    }

    return recommendations;
  }

  // Private methods

  _generateEvaluationId() {
    return `change_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  _calculateOverallResult(legalCheck, requirementCheck, timingCheck, riskAssessment) {
    if (!legalCheck.possible) {
      return { possible: false, confidence: 0 };
    }

    let confidence = 0;
    confidence += requirementCheck.overall ? 40 : (requirementCheck.score / 100) * 40;
    confidence += (timingCheck.score / 100) * 30;
    confidence += riskAssessment.successProbability * 30;

    return {
      possible: confidence >= 50,
      confidence: Math.round(confidence)
    };
  }

  _checkEducationRequirement(education, required) {
    const levels = {
      'Bachelor': 1,
      'Master': 2,
      'PhD': 3
    };

    const actualLevel = levels[education?.level] || 0;
    const requiredLevel = levels[required] || 0;

    return {
      passed: actualLevel >= requiredLevel,
      reason: actualLevel < requiredLevel ? 
        `${required} 이상의 학위가 필요합니다.` : null
    };
  }

  _calculateExperienceYears(experience) {
    if (!experience || !Array.isArray(experience)) return 0;
    
    return experience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = new Date(exp.endDate || Date.now());
      const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
  }

  _checkLanguageRequirement(language) {
    const korean = language?.korean;
    
    if (!korean) {
      return {
        sufficient: false,
        suggestion: 'TOPIK 시험 응시 권장'
      };
    }

    const topikLevel = parseInt(korean.level?.replace('TOPIK_', '') || '0');
    
    return {
      sufficient: topikLevel >= 3,
      suggestion: topikLevel < 3 ? 'TOPIK 3급 이상 취득 권장' : null
    };
  }

  _checkFinancialRequirement(financial, visaType) {
    const minimumAmounts = {
      'E-1': 30000000,  // 3천만원
      'E-2': 20000000,  // 2천만원
      'E-7': 25000000,  // 2천5백만원
      'F-2': 50000000   // 5천만원
    };

    const minimumAmount = minimumAmounts[visaType] || 20000000;
    const actualAmount = financial?.bankBalance || 0;

    return {
      sufficient: actualAmount >= minimumAmount,
      minimumAmount,
      actualAmount,
      reason: actualAmount < minimumAmount ? 
        `최소 ${minimumAmount.toLocaleString()}원의 잔고가 필요합니다.` : null
    };
  }

  _getPathRisk(fromVisa, toVisa) {
    const riskMatrix = {
      'D-2_E-1': { score: 10, factor: '유학에서 교수로의 일반적 경로' },
      'E-2_E-1': { score: 15, factor: '회화지도에서 교수로의 승급 경로' },
      'E-7_F-2': { score: 20, factor: '취업에서 거주로의 고위험 경로' }
    };

    const key = `${fromVisa}_${toVisa}`;
    return riskMatrix[key] || { score: 5, factor: null };
  }

  _assessHistoryRisk(stayHistory) {
    const factors = [];
    let score = 0;

    if (stayHistory?.violations?.length > 0) {
      score += stayHistory.violations.length * 15;
      factors.push('법규 위반 이력');
    }

    if (stayHistory?.addressChanges > 5) {
      score += 10;
      factors.push('잦은 주소 변경');
    }

    return { score, factors };
  }

  _assessDocumentRisk(documents, visaType) {
    const factors = [];
    let score = 0;

    const visaConfig = this.registry.getConfig(visaType);
    const requiredDocs = visaConfig?.documents?.CHANGE?.required || [];
    
    const missingDocs = requiredDocs.filter(doc => !documents?.[doc]);
    
    if (missingDocs.length > 0) {
      score += missingDocs.length * 10;
      factors.push(`필수 서류 ${missingDocs.length}개 누락`);
    }

    return { score, factors };
  }

  _assessMitigatingFactors(applicantData) {
    const factors = [];
    let score = 0;

    if (applicantData.korean?.level?.includes('6')) {
      score += 15;
      factors.push('한국어 최고급 수준');
    }

    if (applicantData.stayHistory?.totalDuration > 36) {
      score += 10;
      factors.push('장기 체류 이력');
    }

    return { score, factors };
  }

  _determineRiskLevel(riskScore) {
    if (riskScore >= 60) return RISK_LEVELS.CRITICAL;
    if (riskScore >= 40) return RISK_LEVELS.HIGH;
    if (riskScore >= 20) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.LOW;
  }

  _calculateSuccessProbability(riskScore) {
    return Math.max(0.1, Math.min(0.95, 0.9 - (riskScore / 100)));
  }

  _estimateProcessingTime(fromVisa, toVisa, riskLevel) {
    const baseTimes = {
      [RISK_LEVELS.LOW]: '15-20 영업일',
      [RISK_LEVELS.MEDIUM]: '20-30 영업일',
      [RISK_LEVELS.HIGH]: '30-45 영업일',
      [RISK_LEVELS.CRITICAL]: '45-60 영업일'
    };

    return baseTimes[riskLevel] || '20-30 영업일';
  }

  _getLegalBasis(fromVisa, toVisa) {
    return [
      '출입국관리법 제25조 (체류자격 변경허가)',
      '출입국관리법 시행령 제30조',
      '외국인 체류 및 취업에 관한 규정'
    ];
  }

  _getAdditionalRequirements(visaType, applicantData) {
    // 비자별 추가 요구사항 반환
    return [];
  }

  _getTimingRecommendations(status, daysUntilExpiry) {
    const recommendations = [];
    
    if (status === TIMING_STATUS.RESTRICTED) {
      recommendations.push('긴급 처리 신청 고려');
      recommendations.push('법무사 상담 필수');
    }
    
    return recommendations;
  }

  _getRiskMitigationRecommendations(riskFactors) {
    return riskFactors.map(factor => {
      switch (factor) {
        case '법규 위반 이력':
          return '위반 사항 해결 증빙 서류 준비';
        case '잦은 주소 변경':
          return '주소 안정성 확보 및 증빙';
        default:
          return '관련 서류 보완';
      }
    });
  }

  _getRequirementActions(requirement) {
    const actions = {
      education: ['학위 인증', '한국 학력 인정 신청'],
      experience: ['경력 증명서 발급', '재직 증명서 준비'],
      language: ['TOPIK 시험 응시', '언어 연수 고려'],
      financial: ['잔고 증명서 발급', '수입 증빙 서류 준비']
    };

    return actions[requirement] || ['관련 서류 준비'];
  }

  _calculateStayDuration(entryDate) {
    const now = new Date();
    const entry = new Date(entryDate);
    return Math.floor((now - entry) / (1000 * 60 * 60 * 24 * 30)); // 개월 수
  }
}

module.exports = {
  VisaChangeValidator,
  RISK_LEVELS,
  TIMING_STATUS
}; 