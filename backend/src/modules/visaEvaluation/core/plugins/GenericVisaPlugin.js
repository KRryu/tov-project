/**
 * 범용 비자 플러그인
 * 설정 파일 기반으로 모든 비자 타입을 처리할 수 있는 플러그인
 */

const AbstractVisaPlugin = require('../abstracts/AbstractVisaPlugin');
const logger = require('../../../../utils/logger');

class GenericVisaPlugin extends AbstractVisaPlugin {
  constructor(visaType, config) {
    super(visaType, config);
    this.evaluators = new Map();
  }

  /**
   * 설정 검증
   */
  validateConfiguration() {
    if (!this.config) {
      throw new Error('Configuration is required');
    }

    if (!this.config.code || !this.config.name) {
      throw new Error('Invalid configuration: code and name are required');
    }

    if (!this.config.requirements) {
      logger.warn(`No requirements defined for ${this.visaType}`);
    }

    if (!this.config.documents) {
      logger.warn(`No documents defined for ${this.visaType}`);
    }
  }

  /**
   * 리소스 로드
   */
  async loadResources() {
    // 신청 유형별 평가기 생성
    this.createApplicationTypeEvaluators();
    
    // 필드 검증 규칙 준비
    this.prepareFieldValidationRules();
    
    logger.info(`Resources loaded for ${this.visaType}`);
  }

  /**
   * 즉시 거부 규칙
   */
  getImmediateRejectionRules() {
    return this.config?.evaluation?.immediateRejection || [];
  }

  /**
   * 보완 가능 사항 규칙
   */
  getRemediableIssueRules() {
    return this.config?.evaluation?.remediableIssues || [];
  }

  /**
   * 비자별 필드 규칙
   */
  getVisaSpecificFieldRules() {
    const rules = {};
    
    // 특수 요구사항에서 필드 규칙 생성
    const specific = this.config?.requirements?.specific || {};
    
    // E-2 예시: 원어민 국가 체크
    if (specific.nativeLanguageCountries) {
      rules.nationality = {
        ...rules.nationality,
        validation: (value) => {
          return specific.nativeLanguageCountries.includes(value);
        },
        message: `Must be from one of: ${specific.nativeLanguageCountries.join(', ')}`
      };
    }
    
    // E-7 예시: 점수제
    if (specific.pointSystem?.enabled) {
      rules.pointScore = {
        required: true,
        type: 'number',
        validation: (value) => {
          return value >= specific.pointSystem.minimumPoints;
        },
        message: `Minimum ${specific.pointSystem.minimumPoints} points required`
      };
    }
    
    // E-1 예시: 주당 수업시간
    if (specific.teaching?.weeklyHours) {
      rules.weeklyTeachingHours = {
        required: true,
        type: 'number',
        validation: (value) => {
          return value >= specific.teaching.weeklyHours.minimum;
        },
        message: specific.teaching.weeklyHours.description
      };
    }
    
    return rules;
  }

  /**
   * 자격 요건
   */
  getEligibilityRequirements() {
    return this.config?.requirements?.eligibility || {};
  }

  /**
   * 문서 요구사항
   */
  getDocumentRequirements() {
    const docs = this.config?.documents || {};
    return {
      basic: docs.basic || [],
      byApplicationType: docs.byApplicationType || {},
      byNationality: docs.byNationality || {}
    };
  }

  /**
   * 제한사항
   */
  getRestrictions() {
    return this.config?.requirements?.restrictions || {
      age: null,
      gender: null,
      nationality: [],
      other: []
    };
  }

  /**
   * 추가 즉시 거부 체크
   */
  async checkAdditionalImmediateRejection(applicantData) {
    const reasons = [];
    
    // 국적 제한 체크
    const nationalityReq = this.config?.requirements?.eligibility?.nationality;
    if (nationalityReq?.allowed && !nationalityReq.allowed.includes(applicantData.nationality)) {
      reasons.push({
        code: 'NATIONALITY_NOT_ALLOWED',
        severity: 'CRITICAL',
        message: `Nationality ${applicantData.nationality} is not allowed`,
        solution: 'Consider alternative visa types'
      });
    }
    
    // 나이 제한 체크
    const ageReq = this.config?.requirements?.eligibility?.age;
    if (ageReq) {
      if (ageReq.minimum && applicantData.age < ageReq.minimum) {
        reasons.push({
          code: 'AGE_TOO_YOUNG',
          severity: 'CRITICAL',
          message: `Minimum age requirement: ${ageReq.minimum}`,
          solution: 'Wait until age requirement is met'
        });
      }
      if (ageReq.maximum && applicantData.age > ageReq.maximum) {
        reasons.push({
          code: 'AGE_TOO_OLD',
          severity: 'CRITICAL',
          message: `Maximum age limit: ${ageReq.maximum}`,
          solution: 'Consider alternative visa types'
        });
      }
    }
    
    return reasons;
  }

  /**
   * 추가 보완사항 체크
   */
  async checkAdditionalRemediableIssues(applicantData) {
    const issues = [];
    
    // 언어 능력 체크
    const languageReq = this.config?.requirements?.eligibility?.language || [];
    for (const req of languageReq) {
      if (!req.required) continue;
      
      const score = applicantData.languageScores?.[req.language];
      if (!score || !this.meetsLanguageRequirement(score, req.level)) {
        issues.push({
          code: `INSUFFICIENT_${req.language.toUpperCase()}_SKILL`,
          severity: 'MEDIUM',
          category: 'LANGUAGE',
          message: `${req.language} proficiency below required level (${req.level})`,
          solution: req.description || 'Improve language skills',
          timeToResolve: '2-6개월',
          difficulty: 'MEDIUM'
        });
      }
    }
    
    return issues;
  }

  /**
   * 추가 자격요건 체크
   */
  async checkAdditionalEligibility(applicantData) {
    const result = {
      type: 'additional',
      score: 100,
      details: []
    };
    
    // 비자별 특수 요구사항 체크
    const specific = this.config?.requirements?.specific || {};
    
    // 점수제 체크 (E-7 등)
    if (specific.pointSystem?.enabled) {
      const pointScore = applicantData.pointScore || 0;
      const minPoints = specific.pointSystem.minimumPoints;
      
      if (pointScore < minPoints) {
        result.score -= 50;
        result.details.push({
          type: 'points',
          met: false,
          message: `Point score ${pointScore} below minimum ${minPoints}`
        });
      }
    }
    
    // 급여 요구사항 체크
    if (specific.salaryRequirement) {
      const salary = applicantData.salary || 0;
      const minSalary = this.calculateMinimumSalary(specific.salaryRequirement);
      
      if (salary < minSalary) {
        result.score -= 30;
        result.details.push({
          type: 'salary',
          met: false,
          message: `Salary below minimum requirement`
        });
      }
    }
    
    return result;
  }

  /**
   * 추가 위험요소 식별
   */
  async identifyAdditionalRiskFactors(applicantData) {
    const risks = [];
    
    // 변경 신청시 위험요소
    if (applicantData.applicationType === 'CHANGE') {
      const changeability = this.config?.changeability?.from;
      if (changeability?.conditional?.[applicantData.currentVisa]) {
        risks.push({
          factor: 'CONDITIONAL_CHANGE',
          description: `Change from ${applicantData.currentVisa} has conditions`,
          mitigation: changeability.conditional[applicantData.currentVisa].condition
        });
      }
    }
    
    return risks;
  }

  /**
   * 추가 대안 제시
   */
  async suggestAdditionalAlternatives(applicantData) {
    // 설정에 정의된 대안들은 GenericPreScreeningService에서 처리
    // 여기서는 추가적인 동적 대안만 제시
    return [];
  }

  /**
   * 신청유형별 평가기 가져오기
   */
  getApplicationTypeEvaluator(applicationType) {
    return this.evaluators.get(applicationType);
  }

  /**
   * 지원 기능 - 기본값 오버라이드
   */
  supportsPreScreening() {
    return this.config?.features?.preScreening !== false;
  }

  supportsDetailedEvaluation() {
    return this.config?.features?.detailedEvaluation !== false;
  }

  supportsDocumentValidation() {
    return this.config?.features?.documentValidation !== false;
  }

  supportsRealTimeValidation() {
    return this.config?.features?.realTimeValidation === true;
  }

  supportsComplexityAnalysis() {
    return this.config?.features?.complexityAnalysis === true;
  }

  supportsActivityValidation() {
    return this.config?.features?.activityValidation === true;
  }

  supportsCertificateIssuance() {
    return this.config?.features?.certificateIssuance === true;
  }

  supportsLegalMatching() {
    return this.config?.features?.legalMatching === true;
  }

  // === 헬퍼 메서드 ===

  /**
   * 신청 유형별 평가기 생성
   */
  createApplicationTypeEvaluators() {
    const GenericApplicationTypeEvaluator = require('../evaluators/GenericApplicationTypeEvaluator');
    
    const applicationTypes = this.config?.applicationTypes || ['NEW', 'EXTENSION', 'CHANGE'];
    
    for (const type of applicationTypes) {
      const evaluator = new GenericApplicationTypeEvaluator(
        this.visaType,
        type,
        this.config
      );
      this.evaluators.set(type, evaluator);
    }
  }

  /**
   * 필드 검증 규칙 준비
   */
  prepareFieldValidationRules() {
    // 필드 검증 규칙은 getVisaSpecificFieldRules에서 동적으로 생성
    logger.info(`Field validation rules prepared for ${this.visaType}`);
  }

  /**
   * 언어 요구사항 충족 체크
   */
  meetsLanguageRequirement(actual, required) {
    // TOPIK, TOEFL, IELTS 등 다양한 언어 시험 점수 비교
    // 간단한 구현
    const levels = {
      'TOPIK_1': 1, 'TOPIK_2': 2, 'TOPIK_3': 3, 'TOPIK_4': 4, 'TOPIK_5': 5, 'TOPIK_6': 6,
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6,
      'NATIVE': 10
    };
    
    const actualLevel = levels[actual] || 0;
    const requiredLevel = levels[required] || 0;
    
    return actualLevel >= requiredLevel;
  }

  /**
   * 최소 급여 계산
   */
  calculateMinimumSalary(requirement) {
    // GNI 기반 계산 등
    if (requirement.minimum?.startsWith('GNI_')) {
      const multiplier = parseFloat(requirement.minimum.replace('GNI_', ''));
      const gni = 35000000; // 예시 GNI
      return gni * multiplier;
    }
    
    return parseInt(requirement.minimum) || 0;
  }
}

module.exports = GenericVisaPlugin;