/**
 * 변경 신청 전략
 * CHANGE 타입 비자 신청 평가 로직
 */

const BaseStrategy = require('./BaseStrategy');
const logger = require('../../../../../utils/logger');

class ChangeStrategy extends BaseStrategy {
  constructor(configManager, ruleEngine) {
    super(configManager, ruleEngine);
  }

  /**
   * 변경 신청 평가 실행
   */
  async evaluate(context) {
    logger.info(`변경 신청 평가 시작: ${context.data.currentVisa} → ${context.visaType}`);

    try {
      const evaluationResults = {
        scores: {},
        validations: [],
        recommendations: [],
        requiredDocuments: [],
        changePath: null
      };

      // 0. 변경 가능 경로 확인 (필수)
      const changePathResult = await this.evaluateChangePath(context);
      if (!changePathResult.allowed) {
        evaluationResults.blocked = true;
        evaluationResults.blockReason = changePathResult.reason;
        evaluationResults.finalScore = 0;
        return evaluationResults;
      }
      evaluationResults.changePath = changePathResult;

      // 1. 변경 가능성 평가 (30%)
      evaluationResults.scores.changeability = {
        score: changePathResult.score,
        weight: 30,
        details: changePathResult
      };

      // 2. 체류 이력 평가 (20%)
      const stayHistoryResult = await this.evaluateStayHistory(context);
      evaluationResults.scores.stayHistory = {
        score: stayHistoryResult.score,
        weight: 20,
        details: stayHistoryResult
      };

      // 3. 새 비자 요건 충족도 (30%)
      const requirementsResult = await this.evaluateNewRequirements(context);
      evaluationResults.scores.newRequirements = {
        score: requirementsResult.score,
        weight: 30,
        details: requirementsResult
      };

      // 4. 변경 사유 타당성 (10%)
      const reasonResult = await this.evaluateChangeReason(context);
      evaluationResults.scores.reason = {
        score: reasonResult.score,
        weight: 10,
        details: reasonResult
      };

      // 5. 문서 평가 (10%)
      const documentResult = await this.evaluateDocuments(context);
      evaluationResults.scores.documents = {
        score: documentResult.score,
        weight: 10,
        details: documentResult
      };

      // 6. 규칙 엔진 적용
      const ruleResults = await this.ruleEngine.applyRules(context);
      evaluationResults.validations = ruleResults;

      // 7. 최종 점수 계산
      evaluationResults.finalScore = this.aggregateScores(evaluationResults.scores);

      // 8. 추천사항 생성
      evaluationResults.recommendations = this.generateRecommendations(evaluationResults, context);

      // 9. 필수 문서 목록
      evaluationResults.requiredDocuments = await this.getRequiredDocuments(context);

      // 10. 결과 로깅
      this.logEvaluationResult(context, evaluationResults);

      return evaluationResults;

    } catch (error) {
      logger.error('변경 신청 평가 중 오류:', error);
      throw error;
    }
  }

  /**
   * 변경 가능 경로 평가
   */
  async evaluateChangePath(context) {
    const fromVisa = context.data.currentVisa?.type;
    const toVisa = context.visaType;

    if (!fromVisa) {
      return {
        allowed: false,
        reason: '현재 비자 정보가 없습니다',
        score: 0
      };
    }

    // 변경 경로 확인
    const changePath = this.configManager.getChangePath(fromVisa, toVisa);
    
    if (!changePath) {
      return {
        allowed: false,
        reason: `${fromVisa}에서 ${toVisa}로 직접 변경이 불가능합니다`,
        score: 0,
        alternatives: this.suggestAlternativePaths(fromVisa, toVisa)
      };
    }

    // 변경 조건 확인
    const conditionsMet = await this.checkChangeConditions(context.data, changePath);
    
    return {
      allowed: conditionsMet.allowed,
      reason: conditionsMet.reason,
      score: conditionsMet.score,
      difficulty: changePath.difficulty || 'MEDIUM',
      successRate: changePath.successRate || 50,
      conditions: changePath,
      unmetConditions: conditionsMet.unmet
    };
  }

  /**
   * 변경 조건 확인
   */
  async checkChangeConditions(data, conditions) {
    const result = {
      allowed: true,
      score: 100,
      unmet: [],
      reason: '모든 조건 충족'
    };

    // 교육 요건
    if (conditions.education) {
      const educationMet = this.checkEducationRequirement(data.education, conditions.education);
      if (!educationMet) {
        result.allowed = false;
        result.score -= 30;
        result.unmet.push({
          condition: 'education',
          required: conditions.education,
          current: data.education
        });
      }
    }

    // 취업 제안
    if (conditions.jobOffer && !data.jobOffer) {
      result.allowed = false;
      result.score -= 40;
      result.unmet.push({
        condition: 'jobOffer',
        message: '고용계약서 필요'
      });
    }

    // 급여 요건
    if (conditions.salary) {
      const salaryMet = this.checkSalaryRequirement(data.salary, conditions.salary);
      if (!salaryMet) {
        result.score -= 20;
        result.unmet.push({
          condition: 'salary',
          required: conditions.salary,
          current: data.salary
        });
      }
    }

    // 체류 기간 요건
    if (conditions.minStayMonths && data.totalStayMonths < conditions.minStayMonths) {
      result.score -= 15;
      result.unmet.push({
        condition: 'stayPeriod',
        required: `${conditions.minStayMonths}개월`,
        current: `${data.totalStayMonths}개월`
      });
    }

    // 한국어 능력
    if (conditions.koreanLevel && data.koreanLevel < conditions.koreanLevel) {
      result.score -= 10;
      result.unmet.push({
        condition: 'koreanLevel',
        required: `TOPIK ${conditions.koreanLevel}급`,
        current: `TOPIK ${data.koreanLevel}급`
      });
    }

    if (result.unmet.length > 0) {
      result.reason = `충족되지 않은 조건: ${result.unmet.length}개`;
    }

    result.score = Math.max(0, result.score);
    return result;
  }

  /**
   * 체류 이력 평가
   */
  async evaluateStayHistory(context) {
    const { data } = context;
    const result = {
      score: 100,
      details: {
        currentVisaValidity: true,
        violations: [],
        positiveFactors: []
      }
    };

    // 현재 비자 유효성
    if (!data.currentVisa || data.currentVisa.daysRemaining < 30) {
      result.score -= 30;
      result.details.currentVisaValidity = false;
      result.details.warning = '현재 비자 만료 임박';
    }

    // 체류 규정 위반
    if (data.stayHistory?.violations) {
      for (const violation of data.stayHistory.violations) {
        const penalty = this.calculateViolationPenalty(violation);
        result.score -= penalty;
        result.details.violations.push(violation);
      }
    }

    // 성실한 체류
    if (data.stayHistory?.consistentStay) {
      result.score += 10;
      result.details.positiveFactors.push('성실한 체류 이력');
    }

    result.score = Math.max(0, Math.min(100, result.score));
    return result;
  }

  /**
   * 새 비자 요건 충족도 평가
   */
  async evaluateNewRequirements(context) {
    const newVisaConfig = context.visaConfig;
    const { data } = context;
    
    // 기본 자격 요건 평가
    const eligibilityResult = await this.validateEligibility(
      data.newQualifications || data,
      newVisaConfig.base_requirements || {}
    );

    // 특수 요건 확인
    const specialRequirements = await this.checkSpecialRequirements(context);
    
    const finalScore = (eligibilityResult.score + specialRequirements.score) / 2;

    return {
      score: finalScore,
      eligibility: eligibilityResult,
      special: specialRequirements,
      details: {
        metRequirements: eligibilityResult.valid && specialRequirements.valid,
        eligibilityScore: eligibilityResult.score,
        specialScore: specialRequirements.score
      }
    };
  }

  /**
   * 변경 사유 타당성 평가
   */
  async evaluateChangeReason(context) {
    const { data } = context;
    const result = {
      score: 50, // 기본 점수
      details: {
        reasonType: null,
        validity: 'MEDIUM',
        supporting: []
      }
    };

    if (!data.changeReason) {
      result.score = 0;
      result.details.validity = 'NONE';
      return result;
    }

    // 사유 유형별 평가
    const reasonType = this.categorizeChangeReason(data.changeReason);
    result.details.reasonType = reasonType;

    switch (reasonType) {
      case 'CAREER_ADVANCEMENT':
        result.score = 90;
        result.details.validity = 'HIGH';
        result.details.supporting.push('경력 발전을 위한 정당한 사유');
        break;
      
      case 'EDUCATION_COMPLETION':
        result.score = 85;
        result.details.validity = 'HIGH';
        result.details.supporting.push('학업 완료 후 자연스러운 진로');
        break;
      
      case 'FAMILY_CIRCUMSTANCES':
        result.score = 80;
        result.details.validity = 'HIGH';
        result.details.supporting.push('가족 사정으로 인한 불가피한 변경');
        break;
      
      case 'EMPLOYMENT_CHANGE':
        result.score = 70;
        result.details.validity = 'MEDIUM';
        result.details.supporting.push('고용 상황 변화');
        break;
      
      case 'VISA_LIMITATION':
        result.score = 60;
        result.details.validity = 'MEDIUM';
        result.details.supporting.push('현재 비자의 활동 제한');
        break;
      
      default:
        result.score = 40;
        result.details.validity = 'LOW';
    }

    // 증빙 자료 확인
    if (data.supportingDocuments?.length > 0) {
      result.score += 10;
      result.details.supporting.push(`증빙 자료 ${data.supportingDocuments.length}개 제출`);
    }

    result.score = Math.min(100, result.score);
    return result;
  }

  /**
   * 대체 경로 제안
   */
  suggestAlternativePaths(fromVisa, toVisa) {
    const alternatives = [];

    // 단계적 변경 경로 찾기
    // 예: D-2 → E-7이 직접 불가능한 경우, D-2 → D-10 → E-7 제안
    if (fromVisa === 'D-2' && toVisa === 'E-7') {
      alternatives.push({
        path: ['D-2', 'D-10', 'E-7'],
        description: '구직(D-10) 비자를 거쳐 E-7로 변경',
        estimatedTime: '3-6개월'
      });
    }

    // F-2 거주 비자를 통한 경로
    if (this.canChangeToF2(fromVisa)) {
      alternatives.push({
        path: [fromVisa, 'F-2', toVisa],
        description: 'F-2 거주 비자 취득 후 변경',
        estimatedTime: '1-2년'
      });
    }

    // 출국 후 재입국
    alternatives.push({
      path: ['출국', `${toVisa} 신규 신청`],
      description: '본국에서 새로운 비자 신청',
      estimatedTime: '1-3개월'
    });

    return alternatives;
  }

  /**
   * 급여 요건 확인
   */
  checkSalaryRequirement(salary, requirement) {
    if (typeof requirement === 'number') {
      return salary >= requirement;
    }
    
    // GNI 기준
    if (requirement.includes('GNI')) {
      const gniPercentage = parseInt(requirement.replace('GNI_', '')) / 100;
      const gniAmount = 35000000 * gniPercentage; // 예시: 3500만원 기준
      return salary >= gniAmount;
    }
    
    return true;
  }

  /**
   * 특수 요건 확인
   */
  async checkSpecialRequirements(context) {
    const { visaType, data } = context;
    const result = {
      valid: true,
      score: 100,
      unmet: []
    };

    // E-1 교수 비자 특수 요건 (체류민원 매뉴얼 기반)
    if (visaType === 'E-1') {
      // 1. 학위 요건 (최소 석사 이상)
      const educationLevel = this.mapEducationLevel(data.highestEducation);
      if (!['DOCTORATE', 'MASTERS'].includes(educationLevel)) {
        result.valid = false;
        result.score -= 50;
        result.unmet.push('교수 자격을 위해서는 최소 석사 학위 필요');
      }

      // 2. 교육기관 초청장
      if (!data.institutionInvitation) {
        result.valid = false;
        result.score -= 40;
        result.unmet.push('인가된 교육기관의 초청장 필요');
      }

      // 3. 전공 관련성
      if (!data.majorRelevance || data.majorRelevance < 80) {
        result.score -= 20;
        result.unmet.push('전공과 교수 분야의 관련성 부족');
      }

      // 4. 연구 실적 (논문, 저서 등)
      const publications = data.publications || [];
      const publicationsCount = data.publicationsCount || publications.length;
      if (publicationsCount < 2) {
        result.score -= 15;
        result.unmet.push('연구 실적 부족 (최소 2편의 논문 권장)');
      }

      // 5. 교육 경력
      const teachingExp = parseInt(data.teachingExperience) || 0;
      if (teachingExp < 2) {
        result.score -= 15;
        result.unmet.push('교육 경력 부족 (최소 2년 권장)');
      }
    }

    // E-7 특수 요건
    if (visaType === 'E-7') {
      // 전공-직무 연관성
      if (!data.majorJobRelevance || data.majorJobRelevance < 70) {
        result.score -= 20;
        result.unmet.push('전공과 직무의 연관성 부족');
      }

      // 기업 요건
      if (!data.companyEligible) {
        result.valid = false;
        result.score -= 40;
        result.unmet.push('고용 기업이 E-7 채용 자격 미충족');
      }
    }

    // F-2 특수 요건
    if (visaType === 'F-2') {
      // 점수제
      if (data.pointScore < 80) {
        result.valid = false;
        result.score = 0;
        result.unmet.push(`점수 부족: ${data.pointScore}/80`);
      }
    }

    result.score = Math.max(0, result.score);
    return result;
  }

  /**
   * 학력 수준 매핑 헬퍼
   */
  mapEducationLevel(education) {
    const mapping = {
      'phd': 'DOCTORATE',
      'doctorate': 'DOCTORATE',
      'master': 'MASTERS',
      'masters': 'MASTERS',
      'bachelor': 'BACHELOR',
      'bachelors': 'BACHELOR',
      'associate': 'ASSOCIATE',
      'high_school': 'HIGH_SCHOOL'
    };
    return mapping[education] || 'BACHELOR';
  }

  /**
   * 변경 사유 분류
   */
  categorizeChangeReason(reason) {
    const keywords = {
      CAREER_ADVANCEMENT: ['승진', '경력', '발전', '전문성'],
      EDUCATION_COMPLETION: ['졸업', '학위', '과정 수료'],
      FAMILY_CIRCUMSTANCES: ['결혼', '가족', '배우자'],
      EMPLOYMENT_CHANGE: ['이직', '취업', '고용'],
      VISA_LIMITATION: ['활동 제한', '비자 한계']
    };

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => reason.includes(word))) {
        return category;
      }
    }

    return 'OTHER';
  }

  /**
   * F-2 변경 가능 여부
   */
  canChangeToF2(visaType) {
    const f2Eligible = ['D-2', 'E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7'];
    return f2Eligible.includes(visaType);
  }

  /**
   * 위반 벌점 계산
   */
  calculateViolationPenalty(violation) {
    const penalties = {
      OVERSTAY: 40,
      ILLEGAL_ACTIVITY: 50,
      FALSE_REPORT: 30,
      TAX_DELINQUENCY: 25,
      INSURANCE_VIOLATION: 20
    };

    return penalties[violation.type] || 15;
  }

  /**
   * 변경 신청 특화 추천사항
   */
  generateRecommendations(evaluationResults, context) {
    const recommendations = super.generateRecommendations(evaluationResults, context);

    // 변경 불가인 경우
    if (evaluationResults.blocked) {
      recommendations.push({
        type: 'CRITICAL',
        priority: 'CRITICAL',
        message: evaluationResults.blockReason,
        action: 'REVIEW_ALTERNATIVES'
      });

      // 대체 경로 추천
      if (evaluationResults.changePath?.alternatives?.length > 0) {
        for (const alt of evaluationResults.changePath.alternatives) {
          recommendations.push({
            type: 'ALTERNATIVE',
            priority: 'HIGH',
            message: `대안: ${alt.description} (예상 기간: ${alt.estimatedTime})`,
            action: 'CONSIDER_ALTERNATIVE',
            details: alt
          });
        }
      }
    }

    // 조건 미충족
    const unmetConditions = evaluationResults.changePath?.unmetConditions || [];
    if (unmetConditions.length > 0) {
      for (const condition of unmetConditions) {
        recommendations.push({
          type: 'REQUIREMENT',
          priority: 'HIGH',
          message: `조건 미충족: ${condition.condition} (필요: ${condition.required}, 현재: ${condition.current})`,
          action: 'MEET_CONDITION'
        });
      }
    }

    // 성공률이 낮은 경우
    const successRate = evaluationResults.changePath?.successRate || 50;
    if (successRate < 50) {
      recommendations.push({
        type: 'WARNING',
        priority: 'MEDIUM',
        message: `이 변경 경로의 성공률은 ${successRate}%로 낮습니다. 신중한 준비가 필요합니다.`,
        action: 'PREPARE_THOROUGHLY'
      });
    }

    // 현재 비자 만료 임박
    const daysRemaining = context.data.currentVisa?.daysRemaining;
    if (daysRemaining && daysRemaining < 60) {
      recommendations.push({
        type: 'URGENT',
        priority: 'CRITICAL',
        message: `현재 비자 만료까지 ${daysRemaining}일 남았습니다. 빠른 진행이 필요합니다.`,
        action: 'EXPEDITE_PROCESS'
      });
    }

    return recommendations;
  }

  /**
   * 변경 신청용 필수 문서
   */
  async getRequiredDocuments(context) {
    const baseDocuments = await super.getRequiredDocuments(context);
    
    // 변경 신청 추가 문서
    const changeDocuments = {
      required: [
        'CURRENT_VISA_COPY',
        'CHANGE_REASON_STATEMENT',
        'RELEASE_LETTER', // 원 소속 해지 확인서
        ...baseDocuments.required
      ],
      optional: [
        'CAREER_CERTIFICATE',
        'ACHIEVEMENT_PROOF',
        ...baseDocuments.optional
      ]
    };

    // 특정 변경 경로별 추가 문서
    const fromVisa = context.data.currentVisa?.type;
    const toVisa = context.visaType;

    if (fromVisa === 'D-2' && toVisa === 'E-7') {
      changeDocuments.required.push('TRANSCRIPT');
      changeDocuments.required.push('MAJOR_RELEVANCE_PROOF');
    }

    // E-1 교수 비자로의 변경
    if (toVisa === 'E-1') {
      changeDocuments.required.push('DEGREE_CERTIFICATE'); // 학위증명서
      changeDocuments.required.push('ACADEMIC_TRANSCRIPT'); // 성적증명서
      changeDocuments.required.push('RESEARCH_PORTFOLIO'); // 연구실적증명서
      changeDocuments.required.push('INSTITUTION_INVITATION'); // 교육기관 초청장
      changeDocuments.required.push('TEACHING_PLAN'); // 강의계획서
      changeDocuments.optional.push('PUBLICATION_LIST'); // 논문목록
      changeDocuments.optional.push('RECOMMENDATION_LETTERS'); // 추천서
      changeDocuments.optional.push('ACADEMIC_AWARDS'); // 학술상 수상내역
    }

    return changeDocuments;
  }
}

module.exports = ChangeStrategy;