/**
 * 범용 비자 사전심사 서비스
 * 설정 기반으로 모든 비자 타입의 사전심사를 처리
 */

const AbstractVisaEvaluationService = require('../abstracts/AbstractVisaEvaluationService');
const logger = require('../../../../utils/logger');

class GenericPreScreeningService extends AbstractVisaEvaluationService {
  constructor(visaType, config, plugin) {
    super(visaType, config);
    this.plugin = plugin;
    this.rules = plugin?.getEvaluationRules() || {};
  }

  /**
   * 즉시 거부 사유 체크
   */
  async checkImmediateRejection(applicantData) {
    const reasons = [];
    const immediateRejectionRules = this.rules.immediateRejection || [];

    for (const rule of immediateRejectionRules) {
      if (await this.evaluateRule(rule, applicantData)) {
        reasons.push({
          code: rule.code,
          severity: 'CRITICAL',
          message: rule.message,
          solution: rule.solution || '대안 비자 타입 고려'
        });
      }
    }

    // 플러그인의 추가 즉시 거부 체크
    if (this.plugin && typeof this.plugin.checkAdditionalImmediateRejection === 'function') {
      const additionalReasons = await this.plugin.checkAdditionalImmediateRejection(applicantData);
      reasons.push(...additionalReasons);
    }

    return reasons;
  }

  /**
   * 보완 가능 사항 체크
   */
  async checkRemediableIssues(applicantData) {
    const issues = [];
    const remediableRules = this.rules.remediableIssues || [];

    for (const rule of remediableRules) {
      if (await this.evaluateRule(rule, applicantData)) {
        issues.push({
          code: rule.code,
          severity: rule.severity || 'MEDIUM',
          category: rule.category || 'GENERAL',
          message: rule.message,
          solution: rule.solution,
          timeToResolve: rule.timeToResolve || '1-2주',
          difficulty: rule.difficulty || 'MEDIUM'
        });
      }
    }

    // 플러그인의 추가 보완사항 체크
    if (this.plugin && typeof this.plugin.checkAdditionalRemediableIssues === 'function') {
      const additionalIssues = await this.plugin.checkAdditionalRemediableIssues(applicantData);
      issues.push(...additionalIssues);
    }

    return issues;
  }

  /**
   * 자격 요건 체크
   */
  async checkEligibility(applicantData) {
    const eligibilityReq = this.config?.requirements?.eligibility || {};
    const results = {
      eligible: true,
      score: 100,
      details: []
    };

    // 학력 체크
    if (eligibilityReq.education) {
      const educationCheck = this.checkEducationRequirement(
        applicantData.educationLevel,
        eligibilityReq.education
      );
      if (!educationCheck.met) {
        results.eligible = false;
        results.score -= 30;
      }
      results.details.push(educationCheck);
    }

    // 경력 체크
    if (eligibilityReq.experience) {
      const experienceCheck = this.checkExperienceRequirement(
        applicantData.experienceYears,
        eligibilityReq.experience
      );
      if (!experienceCheck.met) {
        results.score -= 20;
      }
      results.details.push(experienceCheck);
    }

    // 언어 능력 체크
    if (eligibilityReq.language) {
      const languageCheck = this.checkLanguageRequirement(
        applicantData.languageScores,
        eligibilityReq.language
      );
      if (!languageCheck.met && languageCheck.required) {
        results.eligible = false;
        results.score -= 25;
      }
      results.details.push(languageCheck);
    }

    // 플러그인의 추가 자격요건 체크
    if (this.plugin && typeof this.plugin.checkAdditionalEligibility === 'function') {
      const additionalCheck = await this.plugin.checkAdditionalEligibility(applicantData);
      if (additionalCheck.score !== undefined) {
        results.score = (results.score + additionalCheck.score) / 2;
      }
      results.details.push(additionalCheck);
    }

    return results;
  }

  /**
   * 필드 검증자 반환
   */
  getFieldValidators() {
    const validators = {};
    const fieldRules = this.plugin?.getFieldValidationRules() || {};

    for (const [fieldName, rule] of Object.entries(fieldRules)) {
      validators[fieldName] = async (value, context) => {
        return this.validateFieldAgainstRule(fieldName, value, rule, context);
      };
    }

    return validators;
  }

  /**
   * 신청 유형별 평가
   */
  async evaluateByApplicationType(applicantData, applicationType) {
    const evaluator = this.getApplicationTypeEvaluator(applicationType);
    
    if (!evaluator) {
      logger.warn(`No specific evaluator for ${applicationType}, using generic evaluation`);
      return this.genericApplicationTypeEvaluation(applicantData, applicationType);
    }

    return evaluator.evaluate(applicantData);
  }

  /**
   * 위험 요소 식별
   */
  async identifyRiskFactors(applicantData) {
    const riskFactors = [];

    // 설정 기반 위험 요소 체크
    const riskRules = this.config?.evaluation?.riskFactors || [];
    
    for (const rule of riskRules) {
      if (await this.evaluateRule(rule, applicantData)) {
        riskFactors.push({
          factor: rule.code,
          description: rule.description,
          mitigation: rule.mitigation
        });
      }
    }

    // 플러그인의 추가 위험요소 체크
    if (this.plugin && typeof this.plugin.identifyAdditionalRiskFactors === 'function') {
      const additionalRisks = await this.plugin.identifyAdditionalRiskFactors(applicantData);
      riskFactors.push(...additionalRisks);
    }

    return riskFactors;
  }

  /**
   * 대안 제시
   */
  async suggestAlternatives(applicantData) {
    const alternatives = [];

    // 설정에서 대안 비자 목록 가져오기
    const alternativeVisas = this.config?.alternatives || [];
    
    for (const alt of alternativeVisas) {
      if (await this.evaluateRule(alt.condition, applicantData)) {
        alternatives.push({
          visa: alt.visa,
          title: alt.title,
          reason: alt.reason,
          advantages: alt.advantages || []
        });
      }
    }

    // 플러그인의 추가 대안 제시
    if (this.plugin && typeof this.plugin.suggestAdditionalAlternatives === 'function') {
      const additionalAlts = await this.plugin.suggestAdditionalAlternatives(applicantData);
      alternatives.push(...additionalAlts);
    }

    return alternatives;
  }

  // === 헬퍼 메서드 ===

  /**
   * 규칙 평가
   */
  async evaluateRule(rule, data) {
    if (!rule || !rule.condition) return false;

    try {
      // 조건이 함수인 경우
      if (typeof rule.condition === 'function') {
        return await rule.condition(data);
      }

      // 조건이 문자열인 경우 (간단한 표현식)
      if (typeof rule.condition === 'string') {
        return this.evaluateStringCondition(rule.condition, data);
      }

      // 조건이 객체인 경우 (복잡한 조건)
      if (typeof rule.condition === 'object') {
        return this.evaluateObjectCondition(rule.condition, data);
      }

      return false;
    } catch (error) {
      logger.error(`Error evaluating rule ${rule.code}:`, error);
      return false;
    }
  }

  /**
   * 문자열 조건 평가
   */
  evaluateStringCondition(condition, data) {
    // 간단한 조건 평가 (예: "experienceYears < 2")
    // 실제로는 더 안전한 평가 방법 사용 권장
    const parts = condition.match(/(\w+)\s*([<>=!]+)\s*(.+)/);
    if (!parts) return false;

    const [, field, operator, value] = parts;
    const fieldValue = this.getNestedValue(data, field);
    
    switch (operator) {
      case '<': return fieldValue < parseFloat(value);
      case '>': return fieldValue > parseFloat(value);
      case '<=': return fieldValue <= parseFloat(value);
      case '>=': return fieldValue >= parseFloat(value);
      case '==': return fieldValue == value;
      case '!=': return fieldValue != value;
      default: return false;
    }
  }

  /**
   * 객체 조건 평가
   */
  evaluateObjectCondition(condition, data) {
    // AND 조건
    if (condition.and) {
      return condition.and.every(cond => this.evaluateRule({ condition: cond }, data));
    }

    // OR 조건
    if (condition.or) {
      return condition.or.some(cond => this.evaluateRule({ condition: cond }, data));
    }

    // 필드 체크
    if (condition.field && condition.operator && condition.value !== undefined) {
      const fieldValue = this.getNestedValue(data, condition.field);
      return this.compareValues(fieldValue, condition.operator, condition.value);
    }

    return false;
  }

  /**
   * 중첩된 객체에서 값 가져오기
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  /**
   * 값 비교
   */
  compareValues(value1, operator, value2) {
    switch (operator) {
      case 'eq': return value1 === value2;
      case 'ne': return value1 !== value2;
      case 'gt': return value1 > value2;
      case 'gte': return value1 >= value2;
      case 'lt': return value1 < value2;
      case 'lte': return value1 <= value2;
      case 'in': return Array.isArray(value2) && value2.includes(value1);
      case 'nin': return Array.isArray(value2) && !value2.includes(value1);
      case 'contains': return String(value1).includes(value2);
      case 'regex': return new RegExp(value2).test(value1);
      default: return false;
    }
  }

  /**
   * 학력 요구사항 체크
   */
  checkEducationRequirement(actual, requirement) {
    const levels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];
    const actualIndex = levels.indexOf(actual);
    const requiredIndex = levels.indexOf(requirement.minimum);

    return {
      type: 'education',
      met: actualIndex >= requiredIndex,
      actual,
      required: requirement.minimum,
      message: actualIndex >= requiredIndex 
        ? '학력 요건 충족' 
        : `최소 ${requirement.minimum} 이상 필요`
    };
  }

  /**
   * 경력 요구사항 체크
   */
  checkExperienceRequirement(actual, requirement) {
    const years = requirement.unit === 'months' ? requirement.minimum / 12 : requirement.minimum;
    
    return {
      type: 'experience',
      met: actual >= years,
      actual,
      required: years,
      message: actual >= years
        ? '경력 요건 충족'
        : `최소 ${years}년 이상 경력 필요`
    };
  }

  /**
   * 언어 요구사항 체크
   */
  checkLanguageRequirement(scores, requirements) {
    const results = {
      type: 'language',
      met: true,
      required: false,
      details: []
    };

    for (const req of requirements) {
      if (req.required) {
        results.required = true;
      }

      const score = scores?.[req.language];
      const met = score && this.compareLanguageLevel(score, req.level);
      
      if (!met && req.required) {
        results.met = false;
      }

      results.details.push({
        language: req.language,
        required: req.required,
        met,
        actual: score,
        required: req.level
      });
    }

    return results;
  }

  /**
   * 언어 레벨 비교
   */
  compareLanguageLevel(actual, required) {
    // 간단한 구현 - 실제로는 더 복잡한 비교 로직 필요
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const actualIndex = levels.indexOf(actual);
    const requiredIndex = levels.indexOf(required);
    
    return actualIndex >= requiredIndex;
  }

  /**
   * 필드 검증
   */
  async validateFieldAgainstRule(fieldName, value, rule, context) {
    const result = {
      valid: true,
      severity: 'info',
      message: ''
    };

    // 필수 체크
    if (rule.required && !value) {
      return {
        valid: false,
        severity: 'error',
        message: rule.message || `${fieldName} is required`
      };
    }

    // 타입 체크
    if (rule.type && value !== undefined) {
      const typeCheck = this.checkFieldType(value, rule.type);
      if (!typeCheck) {
        return {
          valid: false,
          severity: 'error',
          message: `${fieldName} must be of type ${rule.type}`
        };
      }
    }

    // 패턴 체크
    if (rule.pattern && value) {
      const pattern = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
      if (!pattern.test(value)) {
        return {
          valid: false,
          severity: 'warning',
          message: rule.message || `${fieldName} format is invalid`
        };
      }
    }

    // 커스텀 검증
    if (rule.validation && typeof rule.validation === 'function') {
      const customResult = await rule.validation(value, context);
      if (!customResult) {
        return {
          valid: false,
          severity: rule.severity || 'warning',
          message: rule.message || `${fieldName} validation failed`
        };
      }
    }

    return result;
  }

  /**
   * 필드 타입 체크
   */
  checkFieldType(value, expectedType) {
    switch (expectedType) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'array': return Array.isArray(value);
      case 'object': return typeof value === 'object' && !Array.isArray(value);
      case 'date': return value instanceof Date || !isNaN(Date.parse(value));
      default: return true;
    }
  }

  /**
   * 범용 신청유형별 평가
   */
  genericApplicationTypeEvaluation(applicantData, applicationType) {
    // 기본적인 평가 로직
    const score = applicationType === 'NEW' ? 70 : applicationType === 'EXTENSION' ? 80 : 60;
    
    return {
      score,
      type: applicationType,
      details: {
        message: `Generic evaluation for ${applicationType} application`
      }
    };
  }

  /**
   * 신청유형별 평가기 가져오기
   */
  getApplicationTypeEvaluator(applicationType) {
    // 플러그인에서 제공하는 평가기 사용
    if (this.plugin && typeof this.plugin.getApplicationTypeEvaluator === 'function') {
      return this.plugin.getApplicationTypeEvaluator(applicationType);
    }
    return null;
  }
}

module.exports = GenericPreScreeningService;