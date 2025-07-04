/**
 * E1 서비스 어댑터
 * 기존 E1 전용 서비스들을 새로운 범용 구조와 통합
 */

const GenericPreScreeningService = require('../services/GenericPreScreeningService');
const E1Plugin = require('../plugins/E1Plugin');
const logger = require('../../../../utils/logger');

// 기존 E1 서비스들
const E1PreScreeningService = require('../services/E1PreScreeningService');
const E1ActivityValidationService = require('../services/E1ActivityValidationService');
const E1RealTimeValidator = require('../validators/E1RealTimeValidator');

class E1ServiceAdapter extends GenericPreScreeningService {
  constructor(config) {
    // E1 플러그인과 함께 범용 서비스 초기화
    const plugin = new E1Plugin('E-1', config);
    super('E-1', config, plugin);
    
    // 기존 E1 서비스들 초기화
    this.legacyPreScreening = new E1PreScreeningService();
    this.activityValidator = new E1ActivityValidationService();
    this.realTimeValidator = new E1RealTimeValidator();
    
    this.initialized = false;
  }

  /**
   * 어댑터 초기화
   */
  async initialize() {
    try {
      await this.plugin.initialize();
      this.initialized = true;
      logger.info('E1 Service Adapter initialized');
    } catch (error) {
      logger.error('Failed to initialize E1 Service Adapter:', error);
      throw error;
    }
  }

  /**
   * 사전심사 수행 - 기존 서비스와 새 서비스 통합
   */
  async performPreScreening(applicantData) {
    try {
      // 1. 새로운 범용 사전심사 수행
      const genericResult = await super.performPreScreening(applicantData);
      
      // 2. 기존 E1 전용 사전심사도 수행
      const legacyResult = await this.legacyPreScreening.performPreScreening(applicantData);
      
      // 3. 결과 병합
      return this.mergeResults(genericResult, legacyResult);
      
    } catch (error) {
      logger.error('E1 pre-screening error:', error);
      throw error;
    }
  }

  /**
   * 활동 검증 - E1 전용 기능
   */
  async validateActivity(applicantData) {
    if (!this.activityValidator) {
      throw new Error('Activity validation not available');
    }
    
    return this.activityValidator.validateTeachingActivity(applicantData);
  }

  /**
   * 실시간 필드 검증 - 기존 서비스 활용
   */
  async validateField(fieldName, value, context = {}) {
    try {
      // 1. E1 전용 검증기 사용
      const e1Validation = await this.realTimeValidator.validateField(fieldName, value, context);
      
      // 2. 범용 검증도 수행
      const genericValidation = await super.validateField(fieldName, value, context);
      
      // 3. 더 엄격한 결과 반환
      if (!e1Validation.valid || !genericValidation.valid) {
        return {
          valid: false,
          severity: e1Validation.severity || genericValidation.severity || 'error',
          message: e1Validation.message || genericValidation.message,
          recommendation: e1Validation.recommendation || genericValidation.recommendation,
          source: 'e1-adapter'
        };
      }
      
      return {
        valid: true,
        severity: 'info',
        message: 'Validation passed',
        source: 'e1-adapter'
      };
      
    } catch (error) {
      logger.error(`Field validation error for ${fieldName}:`, error);
      return {
        valid: false,
        severity: 'error',
        message: 'Validation error occurred',
        source: 'e1-adapter'
      };
    }
  }

  /**
   * 복잡도 분석 - E1 전용
   */
  async analyzeComplexity(applicantData) {
    const CaseComplexityAnalyzer = require('../services/CaseComplexityAnalyzer');
    const analyzer = new CaseComplexityAnalyzer();
    
    return analyzer.analyzeE1Case(applicantData);
  }

  /**
   * 증명서 발급 - E1 전용
   */
  async issueCertificate(evaluationResult) {
    const VisaIssuanceCertificateService = require('../services/VisaIssuanceCertificateService');
    const certificateService = new VisaIssuanceCertificateService();
    
    return certificateService.generateE1Certificate(evaluationResult);
  }

  /**
   * 결과 병합
   */
  mergeResults(genericResult, legacyResult) {
    // 기본적으로 범용 결과 구조 사용
    const merged = { ...genericResult };
    
    // 즉시 거부 사유 병합 (중복 제거)
    const rejectionMap = new Map();
    [...genericResult.immediateRejectionReasons, ...legacyResult.immediateRejectionReasons]
      .forEach(reason => rejectionMap.set(reason.code, reason));
    merged.immediateRejectionReasons = Array.from(rejectionMap.values());
    
    // 보완 가능 사항 병합 (중복 제거)
    const issueMap = new Map();
    [...genericResult.remediableIssues, ...legacyResult.remediableIssues]
      .forEach(issue => issueMap.set(issue.code, issue));
    merged.remediableIssues = Array.from(issueMap.values());
    
    // 성공 가능성은 더 보수적인 값 사용
    merged.successProbability = {
      percentage: Math.min(
        genericResult.successProbability.percentage,
        legacyResult.successProbability.percentage
      ),
      level: genericResult.successProbability.percentage <= legacyResult.successProbability.percentage
        ? genericResult.successProbability.level
        : legacyResult.successProbability.level,
      reasoning: `${genericResult.successProbability.reasoning} (Legacy: ${legacyResult.successProbability.reasoning})`
    };
    
    // E1 전용 정보 추가
    merged.e1Specific = {
      teachingRequirements: this.extractTeachingRequirements(legacyResult),
      institutionEligibility: this.extractInstitutionInfo(legacyResult),
      positionRequirements: this.extractPositionInfo(legacyResult)
    };
    
    // 통과 여부는 둘 다 통과해야 함
    merged.passPreScreening = genericResult.passPreScreening && legacyResult.passPreScreening;
    
    return merged;
  }

  /**
   * 교육 요구사항 추출
   */
  extractTeachingRequirements(legacyResult) {
    // 레거시 결과에서 교육 관련 정보 추출
    const teachingIssues = legacyResult.remediableIssues.filter(issue => 
      ['INSUFFICIENT_TEACHING_HOURS', 'EXCESSIVE_ONLINE_TEACHING'].includes(issue.code)
    );
    
    return {
      weeklyHoursRequired: 6,
      onlinePercentageLimit: 50,
      issues: teachingIssues
    };
  }

  /**
   * 기관 정보 추출
   */
  extractInstitutionInfo(legacyResult) {
    const institutionRejection = legacyResult.immediateRejectionReasons.find(reason =>
      reason.code === 'INELIGIBLE_INSTITUTION'
    );
    
    return {
      eligible: !institutionRejection,
      issue: institutionRejection
    };
  }

  /**
   * 직급 정보 추출
   */
  extractPositionInfo(legacyResult) {
    const positionRejection = legacyResult.immediateRejectionReasons.find(reason =>
      reason.code === 'INSUFFICIENT_EDUCATION'
    );
    
    return {
      qualified: !positionRejection,
      issue: positionRejection
    };
  }

  /**
   * E1 전용 평가 서비스 가져오기
   */
  getE1ComprehensiveService() {
    const E1ComprehensiveService = require('../services/E1ComprehensiveService');
    return new E1ComprehensiveService();
  }

  /**
   * 향상된 E1 평가 서비스 가져오기
   */
  getEnhancedE1EvaluationService() {
    const EnhancedE1EvaluationService = require('../services/EnhancedE1EvaluationService');
    return new EnhancedE1EvaluationService();
  }

  /**
   * 분석 서비스 가져오기
   */
  getE1AnalyticsService() {
    const E1AnalyticsService = require('../services/E1AnalyticsService');
    return new E1AnalyticsService();
  }

  /**
   * 서비스 종료
   */
  async shutdown() {
    if (this.plugin && typeof this.plugin.shutdown === 'function') {
      await this.plugin.shutdown();
    }
    this.initialized = false;
    logger.info('E1 Service Adapter shut down');
  }
}

module.exports = E1ServiceAdapter;