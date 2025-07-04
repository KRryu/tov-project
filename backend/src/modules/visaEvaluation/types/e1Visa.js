/**
 * E-1 비자(교수) 통합 평가 시스템 - 매뉴얼 완전 반영 버전
 * 신청 유형별 완전 분리된 평가 로직
 */

const BaseEvaluator = require('../core/evaluators/BaseEvaluator');
const { 
  E1NewApplicationEvaluator,
  E1ExtensionEvaluator, 
  E1ChangeApplicationEvaluator,
  TEACHING_REQUIREMENTS,
  EDUCATION_INSTITUTION_TYPES
} = require('../core/evaluators/E1ApplicationTypeEvaluators');

const { E1RealTimeValidator } = require('../core/validators/E1RealTimeValidator');
const logger = require('../../../utils/logger');

/**
 * E-1 비자 특화 평가기 클래스
 */
class E1VisaEvaluator extends BaseEvaluator {
  constructor(visaInfo = {}, options = {}) {
    super('E-1', options);
    this.visaInfo = visaInfo;
    this.isSpecialized = true;
    this.evaluatorName = 'E1VisaEvaluator';
  }

  /**
   * E-1 특화 평가 로직 오버라이드
   */
  async evaluate(applicantData, options = {}) {
    const { applicationType = 'NEW', office } = options;
    
    try {
      logger.info('🎓 E-1 특화 평가기 시작', { applicationType });

      // 1. 기본 검증
      const validationResult = this.validateBasicRequirements(applicantData, applicationType);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
          criticalIssues: validationResult.criticalIssues,
          applicationType,
          visaType: 'E-1'
        };
      }

      // 2. 신청 유형별 평가기 선택
      const evaluators = {
        'NEW': new E1NewApplicationEvaluator(),
        'EXTENSION': new E1ExtensionEvaluator(),
        'CHANGE': new E1ChangeApplicationEvaluator()
      };

      const evaluator = evaluators[applicationType];
      if (!evaluator) {
        // 기본 BaseEvaluator 로직 사용
        return await super.evaluate(applicantData, options);
      }

      // 3. 신청 유형별 평가 실행
      const evaluation = evaluator.evaluate(applicantData.evaluation || {});
      
      // 4. 실시간 검증 추가
      const realTimeValidator = new E1RealTimeValidator();
      const fieldValidation = realTimeValidator.validateMultipleFields({
        weeklyTeachingHours: applicantData.evaluation?.weeklyTeachingHours,
        onlineTeachingRatio: applicantData.evaluation?.onlineTeachingRatio,
        institutionType: applicantData.evaluation?.institutionType,
        contractPeriod: applicantData.evaluation?.contractPeriod,
        educationLevel: applicantData.evaluation?.educationLevel,
        currentVisa: applicantData.evaluation?.currentVisa
      }, { applicationType, position: applicantData.evaluation?.position });

      // 5. 특별 케이스 처리
      const specialCases = new E1SpecialCases();
      const specialConditions = specialCases.handleSpecialCases(applicantData.evaluation || {});

      // 6. 출입국 관리소별 요구사항
      const officeSpecifics = new ImmigrationOfficeSpecifics();
      const officeRequirements = officeSpecifics.getOfficeSpecificRequirements(office, applicationType);

      // 7. 종합 결과 생성
      const result = {
        success: true,
        visaType: 'E-1',
        visaName: '교수(E-1)',
        applicationType,
        
        // 평가 결과
        totalScore: evaluation.score,
        categoryScores: evaluation.details || {},
        
        // 판정 결과
        status: evaluation.status,
        confidence: this._determineConfidence(evaluation.score),
        message: this._generateMessage(evaluation.score),

        // 실시간 검증 결과
        fieldValidation: {
          overallValid: fieldValidation.overallValid,
          score: realTimeValidator.calculateRealTimeScore(fieldValidation),
          issues: fieldValidation.issues,
          warnings: fieldValidation.warnings,
          successes: fieldValidation.successes
        },

        // 처리 예상 시간
        processingTime: this.getProcessingTime(applicationType, evaluation),

        // 필요 서류 체크리스트  
        requiredDocuments: evaluator.requiredDocuments,

        // 특별 조건
        specialConditions,

        // 사무소별 요구사항
        officeRequirements,

        // 동적 추천사항
        recommendations: realTimeValidator.generateDynamicRecommendations(fieldValidation, { applicationType }),

        // 복잡도 평가
        caseComplexity: this.calculateCaseComplexity(evaluation, fieldValidation),

        // 성공 가능성 예측
        successProbability: this.predictSuccess(applicationType, evaluation, fieldValidation),

        // 메타 정보
        evaluatedAt: new Date().toISOString(),
        evaluationVersion: '3.0',
        manualCompliance: true,
        evaluatorType: 'SPECIALIZED'
      };

      logger.info('🎓 E-1 특화 평가 완료', { 
        applicationType, 
        score: result.totalScore,
        status: result.status
      });

      return result;

    } catch (error) {
      logger.error('E-1 특화 평가 중 오류:', error);
      
      // 오류 시 기본 BaseEvaluator로 폴백
      logger.info('기본 평가기로 폴백 실행');
      return await super.evaluate(applicantData, options);
    }
  }

  /**
   * 신뢰도 결정
   */
  _determineConfidence(score) {
    if (score >= 85) return 'HIGH';
    if (score >= 70) return 'MEDIUM';
    if (score >= 50) return 'LOW';
    return 'VERY_LOW';
  }

  /**
   * 메시지 생성
   */
  _generateMessage(score) {
    if (score >= 85) return '비자 승인 가능성이 매우 높습니다.';
    if (score >= 70) return '비자 승인 가능성이 높습니다.';
    if (score >= 50) return '추가 검토가 필요합니다.';
    return '현재 상태로는 승인이 어렵습니다.';
  }

  /**
   * 기본 요구사항 검증
   */
  validateBasicRequirements(applicantData, applicationType) {
    const errors = [];
    const criticalIssues = [];

    // 필수 데이터 존재 여부 확인
    if (!applicantData.evaluation) {
      criticalIssues.push('평가 데이터가 없습니다');
    }

    // 신청 유형별 필수 필드 확인
    const requiredFields = {
      'NEW': ['educationLevel', 'position'],
      'EXTENSION': ['weeklyTeachingHours', 'contractPeriod'],
      'CHANGE': ['currentVisa', 'educationLevel']
    };

    const required = requiredFields[applicationType] || [];
    const evaluation = applicantData.evaluation || {};

    required.forEach(field => {
      if (!evaluation[field]) {
        errors.push(`필수 필드 누락: ${field}`);
      }
    });

    return {
      isValid: criticalIssues.length === 0 && errors.length === 0,
      errors,
      criticalIssues
    };
  }

  // 나머지 헬퍼 메서드들을 클래스 내부로 이동
  getProcessingTime(applicationType, evaluation) {
    const baseTimes = {
      'NEW': { min: 10, max: 15, unit: '영업일' },
      'EXTENSION': { min: 5, max: 7, unit: '영업일' }, 
      'CHANGE': { min: 15, max: 20, unit: '영업일' }
    };

    let adjustment = 0;
    
    if (evaluation.hasComplexIssues) adjustment += 5;
    if (evaluation.missingDocuments > 0) adjustment += 3;
    if (evaluation.requiresAdditionalReview) adjustment += 7;

    const baseTime = baseTimes[applicationType];
    return {
      minimum: baseTime.min + adjustment,
      maximum: baseTime.max + adjustment,
      unit: baseTime.unit,
      factors: evaluation.delayFactors || []
    };
  }

  calculateCaseComplexity(evaluation, fieldValidation) {
    let complexity = 'SIMPLE';
    let score = 0;

    if (evaluation.score < 50) score += 30;
    else if (evaluation.score < 70) score += 15;

    score += fieldValidation.issues.length * 10;
    score += fieldValidation.warnings.length * 5;

    if (score >= 50) complexity = 'COMPLEX';
    else if (score >= 25) complexity = 'MODERATE';

    return {
      level: complexity,
      score,
      factors: {
        evaluationScore: evaluation.score,
        issueCount: fieldValidation.issues.length,
        warningCount: fieldValidation.warnings.length
      }
    };
  }

  predictSuccess(applicationType, evaluation, fieldValidation) {
    let probability = 0.5;

    if (evaluation.score >= 80) probability = 0.9;
    else if (evaluation.score >= 70) probability = 0.8; 
    else if (evaluation.score >= 60) probability = 0.6;
    else if (evaluation.score >= 50) probability = 0.4;
    else probability = 0.2;

    const criticalIssues = fieldValidation.issues.filter(i => i.severity === 'CRITICAL').length;
    const highIssues = fieldValidation.issues.filter(i => i.severity === 'HIGH').length;

    probability -= (criticalIssues * 0.3);
    probability -= (highIssues * 0.1);

    const typeMultipliers = {
      'NEW': 0.9,
      'EXTENSION': 1.1, 
      'CHANGE': 0.8
    };

    probability *= typeMultipliers[applicationType];

    return {
      percentage: Math.max(5, Math.min(95, Math.round(probability * 100))),
      level: probability >= 0.8 ? 'HIGH' : probability >= 0.6 ? 'MEDIUM' : probability >= 0.4 ? 'LOW' : 'VERY_LOW',
      factors: {
        evaluationScore: evaluation.score,
        criticalIssues,
        highIssues,
        applicationType
      }
    };
  }
}

/**
 * 출입국 관리소별 특이사항 처리
 */
class ImmigrationOfficeSpecifics {
  constructor() {
    this.officeRequirements = {
      '서울': {
        additionalDocs: [],
        processingTime: 'standard',
        onlineBookingRequired: true
      },
      '인천공항': {
        additionalDocs: ['입국 사실 증명'],
        processingTime: 'expedited', 
        walkInAllowed: true
      }
    };
  }

  getOfficeSpecificRequirements(office, applicationType) {
    return this.officeRequirements[office] || {};
  }
}

/**
 * 특별 케이스 처리
 */
class E1SpecialCases {
  handleSpecialCases(data) {
    const specialCases = [];

    if (data.hasGoldCard) {
      specialCases.push({
        type: 'GOLD_CARD',
        benefit: '우선 처리 및 서류 간소화',
        requiredDocs: ['GOLD CARD 사본'],
        processingTime: '5-7일'
      });
    }

    if (data.field === 'ARTS' || data.field === 'SPORTS') {
      specialCases.push({
        type: 'ARTS_SPORTS', 
        flexibleRequirements: true,
        alternativeQualifications: '국제 대회 수상, 활동 경력 등'
      });
    }

    if (data.governmentInvitation) {
      specialCases.push({
        type: 'GOVERNMENT_INVITED',
        benefit: '자격 요건 일부 면제 가능',
        fastTrack: true
      });
    }

    return specialCases;
  }
}

module.exports = E1VisaEvaluator;

// 추가 export들
module.exports.E1VisaEvaluator = E1VisaEvaluator;
module.exports.E1NewApplicationEvaluator = E1NewApplicationEvaluator;
module.exports.E1ExtensionEvaluator = E1ExtensionEvaluator;
module.exports.E1ChangeApplicationEvaluator = E1ChangeApplicationEvaluator;
module.exports.E1RealTimeValidator = E1RealTimeValidator;
module.exports.TEACHING_REQUIREMENTS = TEACHING_REQUIREMENTS;
module.exports.EDUCATION_INSTITUTION_TYPES = EDUCATION_INSTITUTION_TYPES;