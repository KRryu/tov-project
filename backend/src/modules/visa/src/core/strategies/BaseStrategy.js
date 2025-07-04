/**
 * 기본 전략 클래스
 * 모든 신청 유형 전략의 부모 클래스
 */

const logger = require('../../../../../utils/logger');

class BaseStrategy {
  constructor(configManager, ruleEngine) {
    this.configManager = configManager;
    this.ruleEngine = ruleEngine;
  }

  /**
   * 평가 실행 (하위 클래스에서 구현)
   */
  async evaluate(context) {
    throw new Error('evaluate() must be implemented by subclass');
  }

  /**
   * 공통 문서 검증
   */
  async validateDocuments(documents, requiredDocs) {
    const results = {
      valid: true,
      missing: [],
      invalid: [],
      score: 100
    };

    // 필수 문서 확인
    for (const doc of requiredDocs) {
      if (!documents[doc]) {
        results.valid = false;
        results.missing.push(doc);
      } else if (documents[doc].status !== 'VERIFIED') {
        results.invalid.push({
          document: doc,
          status: documents[doc].status,
          reason: documents[doc].reason
        });
      }
    }

    // 점수 계산
    const totalRequired = requiredDocs.length;
    const validDocs = totalRequired - results.missing.length - results.invalid.length;
    results.score = totalRequired > 0 ? (validDocs / totalRequired) * 100 : 0;

    return results;
  }

  /**
   * 자격 요건 검증
   */
  async validateEligibility(data, requirements) {
    const results = {
      valid: true,
      unmetRequirements: [],
      score: 100
    };

    // 교육 요건
    if (requirements.education) {
      const educationMet = this.checkEducationRequirement(
        data.education,
        requirements.education
      );
      if (!educationMet) {
        results.valid = false;
        results.unmetRequirements.push({
          requirement: 'education',
          required: requirements.education,
          provided: data.education
        });
      }
    }

    // 경력 요건
    if (requirements.experience_years) {
      const experienceMet = data.experience >= requirements.experience_years;
      if (!experienceMet) {
        results.valid = false;
        results.unmetRequirements.push({
          requirement: 'experience',
          required: `${requirements.experience_years}년`,
          provided: `${data.experience}년`
        });
      }
    }

    // 나이 요건
    if (requirements.age) {
      const ageMet = this.checkAgeRequirement(data.age, requirements.age);
      if (!ageMet) {
        results.valid = false;
        results.unmetRequirements.push({
          requirement: 'age',
          required: requirements.age,
          provided: data.age
        });
      }
    }

    // 점수 계산
    const totalRequirements = Object.keys(requirements).length;
    const metRequirements = totalRequirements - results.unmetRequirements.length;
    results.score = totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 100;

    return results;
  }

  /**
   * 교육 수준 비교
   */
  checkEducationRequirement(provided, required) {
    const levels = ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTERS', 'DOCTORATE'];
    const providedIndex = levels.indexOf(provided);
    const requiredIndex = levels.indexOf(required);
    
    return providedIndex >= requiredIndex;
  }

  /**
   * 나이 요건 확인
   */
  checkAgeRequirement(age, requirement) {
    if (requirement.min && age < requirement.min) return false;
    if (requirement.max && age > requirement.max) return false;
    return true;
  }

  /**
   * 추천사항 생성
   */
  generateRecommendations(evaluationResults, context) {
    const recommendations = [];

    // 문서 관련 추천
    if (evaluationResults.documents?.missing?.length > 0) {
      recommendations.push({
        type: 'DOCUMENT',
        priority: 'HIGH',
        message: `누락된 문서를 준비하세요: ${evaluationResults.documents.missing.join(', ')}`,
        action: 'PREPARE_DOCUMENTS'
      });
    }

    // 자격 요건 관련 추천
    if (evaluationResults.eligibility?.unmetRequirements?.length > 0) {
      for (const unmet of evaluationResults.eligibility.unmetRequirements) {
        recommendations.push({
          type: 'REQUIREMENT',
          priority: 'HIGH',
          message: `${unmet.requirement} 요건 미충족: ${unmet.required} 필요 (현재: ${unmet.provided})`,
          action: 'IMPROVE_QUALIFICATION'
        });
      }
    }

    // 점수가 합격선에 가까운 경우
    const score = evaluationResults.finalScore || 0;
    const passingScore = context.appTypeConfig?.requirements?.passing_score || 70;
    
    if (score < passingScore && score >= passingScore - 10) {
      recommendations.push({
        type: 'SCORE',
        priority: 'MEDIUM',
        message: '합격 점수에 근접했습니다. 추가 서류나 경력으로 보완 가능합니다.',
        action: 'SUPPLEMENT_APPLICATION'
      });
    }

    // 법무대리인 추천
    if (context.visaConfig.complexity === 'HIGH' || context.visaConfig.complexity === 'VERY_HIGH') {
      recommendations.push({
        type: 'LEGAL',
        priority: 'MEDIUM',
        message: '복잡한 비자 유형입니다. 전문 법무대리인 상담을 권장합니다.',
        action: 'CONSULT_LAWYER'
      });
    }

    return recommendations;
  }

  /**
   * 필수 문서 목록 생성
   */
  async getRequiredDocuments(context) {
    const { visaType, applicationType } = context;
    
    // 기본 문서 요구사항
    const baseDocuments = this.ruleEngine.getDocumentRequirements(visaType, applicationType);
    
    // 조건부 문서 추가
    const conditionalDocuments = await this.getConditionalDocuments(context);
    
    return {
      required: [...baseDocuments.required, ...conditionalDocuments.required],
      optional: [...baseDocuments.optional, ...conditionalDocuments.optional],
      special: baseDocuments.special || []
    };
  }

  /**
   * 조건부 문서 결정
   */
  async getConditionalDocuments(context) {
    const conditional = {
      required: [],
      optional: []
    };

    // 예: 가족 동반 시 추가 문서
    if (context.data.familyAccompanying) {
      conditional.required.push('FAMILY_RELATION_CERTIFICATE');
      conditional.required.push('FAMILY_MEMBER_PASSPORTS');
    }

    // 예: 특정 국가 출신인 경우
    if (context.data.nationality === 'CHINA') {
      conditional.required.push('TEMPORARY_RESIDENCE_PERMIT');
    }

    return conditional;
  }

  /**
   * 평가 점수 집계
   */
  aggregateScores(scoreComponents) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [component, data] of Object.entries(scoreComponents)) {
      if (data.score !== undefined && data.weight !== undefined) {
        totalScore += data.score * data.weight;
        totalWeight += data.weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * 평가 결과 로깅
   */
  logEvaluationResult(context, result) {
    logger.info('평가 완료:', {
      visaType: context.visaType,
      applicationType: context.applicationType,
      eligible: result.eligible,
      score: result.finalScore,
      duration: Date.now() - context.timestamp
    });
  }
}

module.exports = BaseStrategy;