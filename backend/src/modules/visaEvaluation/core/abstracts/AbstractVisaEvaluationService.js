/**
 * 비자 평가 서비스 추상 클래스
 * 모든 비자 타입의 평가 서비스가 상속받아야 하는 기본 클래스
 * @abstract
 */

const { ValidationError } = require('../../../../utils/errors');
const logger = require('../../../../utils/logger');

class AbstractVisaEvaluationService {
  constructor(visaType, config) {
    if (new.target === AbstractVisaEvaluationService) {
      throw new Error('Cannot instantiate abstract class directly');
    }
    
    this.visaType = visaType;
    this.config = config;
    this.immediateRejectReasons = [];
    this.remediableIssues = [];
    this.processingTimeFactors = [];
  }

  /**
   * 사전심사 수행 - 템플릿 메서드 패턴
   * @param {Object} applicantData - 신청자 데이터
   * @returns {Object} 사전심사 결과
   */
  async performPreScreening(applicantData) {
    try {
      // 1. 데이터 유효성 검증
      this.validateApplicantData(applicantData);
      
      // 2. 즉시 거부 사유 체크
      const immediateRejectionReasons = await this.checkImmediateRejection(applicantData);
      
      // 3. 보완 가능 사항 체크
      const remediableIssues = await this.checkRemediableIssues(applicantData);
      
      // 4. 예상 처리 시간 계산
      const processingTime = await this.estimateProcessingTime(applicantData);
      
      // 5. 성공 가능성 예측
      const successProbability = await this.predictSuccessProbability(
        applicantData, 
        immediateRejectionReasons, 
        remediableIssues
      );
      
      // 6. 행동 계획 생성
      const actionPlan = this.generateActionPlan(remediableIssues);
      
      // 7. 위험 요소 식별
      const riskFactors = await this.identifyRiskFactors(applicantData);
      
      // 8. 타임라인 생성
      const timeline = this.generateTimeline(actionPlan);
      
      // 9. 대안 제시
      const alternatives = immediateRejectionReasons.length > 0 
        ? await this.suggestAlternatives(applicantData) 
        : [];

      return {
        passPreScreening: immediateRejectionReasons.length === 0,
        immediateRejectionReasons,
        remediableIssues,
        estimatedProcessingTime: processingTime,
        successProbability,
        recommendedActions: actionPlan,
        riskFactors,
        timeline,
        alternatives,
        metadata: {
          visaType: this.visaType,
          evaluationDate: new Date().toISOString(),
          version: this.config?.version || '1.0'
        }
      };
    } catch (error) {
      logger.error(`Pre-screening error for ${this.visaType}:`, error);
      throw error;
    }
  }

  /**
   * 상세 평가 수행
   * @param {Object} applicantData - 신청자 데이터
   * @param {Object} options - 평가 옵션
   * @returns {Object} 평가 결과
   */
  async evaluate(applicantData, options = {}) {
    const { applicationType = 'NEW' } = options;
    
    try {
      // 1. 기본 자격 요건 체크
      const eligibility = await this.checkEligibility(applicantData);
      
      // 2. 문서 완성도 체크
      const documentCheck = await this.checkDocumentCompleteness(applicantData);
      
      // 3. 신청 유형별 평가
      const typeSpecificEvaluation = await this.evaluateByApplicationType(
        applicantData, 
        applicationType
      );
      
      // 4. 종합 점수 계산
      const score = this.calculateScore({
        eligibility,
        documentCheck,
        typeSpecificEvaluation
      });
      
      // 5. 평가 결과 생성
      return this.generateEvaluationResult(score, {
        eligibility,
        documentCheck,
        typeSpecificEvaluation
      });
    } catch (error) {
      logger.error(`Evaluation error for ${this.visaType}:`, error);
      throw error;
    }
  }

  /**
   * 실시간 필드 검증
   * @param {string} fieldName - 필드명
   * @param {any} value - 필드값
   * @param {Object} context - 검증 컨텍스트
   * @returns {Object} 검증 결과
   */
  async validateField(fieldName, value, context = {}) {
    const validators = this.getFieldValidators();
    const validator = validators[fieldName];
    
    if (!validator) {
      return { valid: true, message: 'No validation required' };
    }
    
    try {
      const result = await validator(value, context);
      return {
        valid: result.valid,
        severity: result.severity || 'info',
        message: result.message,
        recommendation: result.recommendation
      };
    } catch (error) {
      logger.error(`Field validation error for ${fieldName}:`, error);
      return {
        valid: false,
        severity: 'error',
        message: 'Validation error occurred'
      };
    }
  }

  // === 추상 메서드 (하위 클래스에서 구현 필수) ===
  
  /**
   * @abstract
   * 즉시 거부 사유 체크
   */
  async checkImmediateRejection(applicantData) {
    throw new Error('Method checkImmediateRejection must be implemented');
  }

  /**
   * @abstract
   * 보완 가능 사항 체크
   */
  async checkRemediableIssues(applicantData) {
    throw new Error('Method checkRemediableIssues must be implemented');
  }

  /**
   * @abstract
   * 자격 요건 체크
   */
  async checkEligibility(applicantData) {
    throw new Error('Method checkEligibility must be implemented');
  }

  /**
   * @abstract
   * 필드 검증자 반환
   */
  getFieldValidators() {
    throw new Error('Method getFieldValidators must be implemented');
  }

  /**
   * @abstract
   * 신청 유형별 평가
   */
  async evaluateByApplicationType(applicantData, applicationType) {
    throw new Error('Method evaluateByApplicationType must be implemented');
  }

  // === 공통 유틸리티 메서드 ===

  /**
   * 신청자 데이터 유효성 검증
   */
  validateApplicantData(applicantData) {
    if (!applicantData) {
      throw new ValidationError('Applicant data is required');
    }
    
    const requiredFields = ['nationality', 'applicationType'];
    for (const field of requiredFields) {
      if (!applicantData[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }
  }

  /**
   * 예상 처리 시간 계산 (기본 구현)
   */
  async estimateProcessingTime(applicantData) {
    const baseTime = this.config?.processingTime?.base || 15;
    const factors = [];
    
    // 신청 유형별 조정
    const typeAdjustment = {
      'NEW': 5,
      'EXTENSION': -5,
      'CHANGE': 10
    };
    
    const adjustedTime = baseTime + (typeAdjustment[applicantData.applicationType] || 0);
    
    return {
      estimatedDays: Math.max(5, adjustedTime),
      factors,
      range: {
        minimum: Math.max(5, adjustedTime - 5),
        maximum: adjustedTime + 10
      }
    };
  }

  /**
   * 성공 가능성 예측 (기본 구현)
   */
  async predictSuccessProbability(applicantData, rejectionReasons, remediableIssues) {
    if (rejectionReasons.length > 0) {
      return {
        percentage: 0,
        level: 'IMPOSSIBLE',
        reasoning: 'Immediate rejection reasons exist'
      };
    }
    
    let baseScore = 85;
    
    // 보완 가능 사항에 따른 차감
    remediableIssues.forEach(issue => {
      const deduction = {
        'HIGH': 20,
        'MEDIUM': 10,
        'LOW': 5
      };
      baseScore -= deduction[issue.severity] || 5;
    });
    
    const finalScore = Math.max(0, Math.min(100, baseScore));
    
    return {
      percentage: finalScore,
      level: this.getSuccessLevel(finalScore),
      reasoning: this.generateSuccessReasoning(finalScore, remediableIssues)
    };
  }

  /**
   * 행동 계획 생성
   */
  generateActionPlan(remediableIssues) {
    const actionPlan = {
      immediate: [],
      shortTerm: [],
      mediumTerm: [],
      longTerm: []
    };
    
    remediableIssues.forEach(issue => {
      const action = {
        issue: issue.code,
        title: issue.message,
        solution: issue.solution,
        difficulty: issue.difficulty,
        category: issue.category
      };
      
      // 시간대별 분류 로직
      if (issue.timeToResolve?.includes('1주') || issue.timeToResolve?.includes('즉시')) {
        if (issue.severity === 'HIGH') {
          actionPlan.immediate.push(action);
        } else {
          actionPlan.shortTerm.push(action);
        }
      } else if (issue.timeToResolve?.includes('개월')) {
        if (issue.timeToResolve.includes('1-3')) {
          actionPlan.mediumTerm.push(action);
        } else {
          actionPlan.longTerm.push(action);
        }
      } else {
        actionPlan.shortTerm.push(action);
      }
    });
    
    return actionPlan;
  }

  /**
   * 위험 요소 식별 (기본 구현)
   */
  async identifyRiskFactors(applicantData) {
    return [];
  }

  /**
   * 대안 제시 (기본 구현)
   */
  async suggestAlternatives(applicantData) {
    return [];
  }

  /**
   * 타임라인 생성
   */
  generateTimeline(actionPlan) {
    const timeline = [];
    let currentWeek = 0;
    
    if (actionPlan.immediate.length > 0) {
      timeline.push({
        period: '1주차',
        actions: actionPlan.immediate.map(action => action.title),
        critical: true
      });
      currentWeek = 1;
    }
    
    if (actionPlan.shortTerm.length > 0) {
      timeline.push({
        period: `${currentWeek + 1}-${currentWeek + 4}주차`,
        actions: actionPlan.shortTerm.map(action => action.title),
        critical: false
      });
      currentWeek += 4;
    }
    
    if (actionPlan.mediumTerm.length > 0) {
      timeline.push({
        period: `${Math.ceil(currentWeek / 4) + 1}-${Math.ceil(currentWeek / 4) + 3}개월`,
        actions: actionPlan.mediumTerm.map(action => action.title),
        critical: false
      });
    }
    
    if (actionPlan.longTerm.length > 0) {
      timeline.push({
        period: '3개월 이후',
        actions: actionPlan.longTerm.map(action => action.title),
        critical: false
      });
    }
    
    return timeline;
  }

  /**
   * 문서 완성도 체크 (기본 구현)
   */
  async checkDocumentCompleteness(applicantData) {
    const requiredDocs = this.config?.documents?.required || [];
    const providedDocs = applicantData.documents || [];
    
    const completeness = (providedDocs.length / requiredDocs.length) * 100;
    
    return {
      completeness: Math.min(100, completeness),
      missingDocuments: requiredDocs.filter(doc => !providedDocs.includes(doc))
    };
  }

  /**
   * 점수 계산
   */
  calculateScore(evaluationComponents) {
    const weights = this.config?.scoring?.weights || {
      eligibility: 0.4,
      documentCheck: 0.2,
      typeSpecificEvaluation: 0.4
    };
    
    let totalScore = 0;
    
    if (evaluationComponents.eligibility) {
      totalScore += (evaluationComponents.eligibility.score || 0) * weights.eligibility;
    }
    
    if (evaluationComponents.documentCheck) {
      totalScore += (evaluationComponents.documentCheck.completeness || 0) * weights.documentCheck;
    }
    
    if (evaluationComponents.typeSpecificEvaluation) {
      totalScore += (evaluationComponents.typeSpecificEvaluation.score || 0) * weights.typeSpecificEvaluation;
    }
    
    return Math.round(totalScore);
  }

  /**
   * 평가 결과 생성
   */
  generateEvaluationResult(score, details) {
    return {
      score,
      status: this.getEvaluationStatus(score),
      details,
      metadata: {
        visaType: this.visaType,
        evaluationDate: new Date().toISOString()
      }
    };
  }

  /**
   * 성공 레벨 판정
   */
  getSuccessLevel(score) {
    if (score >= 80) return 'HIGH';
    if (score >= 60) return 'MEDIUM';
    if (score >= 40) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * 평가 상태 판정
   */
  getEvaluationStatus(score) {
    if (score >= 70) return 'APPROVED';
    if (score >= 50) return 'CONDITIONAL';
    return 'REJECTED';
  }

  /**
   * 성공 이유 생성
   */
  generateSuccessReasoning(score, issues) {
    if (score >= 80) {
      return '높은 성공 가능성 - 대부분의 요건을 충족하며 승인 가능성이 높습니다.';
    } else if (score >= 60) {
      return '보통 성공 가능성 - 일부 보완이 필요하지만 전체적으로 양호합니다.';
    } else if (score >= 40) {
      return '낮은 성공 가능성 - 상당한 보완이 필요합니다.';
    } else {
      return '매우 낮은 성공 가능성 - 대대적인 개선이 필요합니다.';
    }
  }
}

module.exports = AbstractVisaEvaluationService;