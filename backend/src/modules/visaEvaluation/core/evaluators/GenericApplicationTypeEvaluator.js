/**
 * 범용 신청유형별 평가기
 * 설정 기반으로 NEW, EXTENSION, CHANGE 신청을 평가
 */

const logger = require('../../../../utils/logger');

class GenericApplicationTypeEvaluator {
  constructor(visaType, applicationType, config) {
    this.visaType = visaType;
    this.applicationType = applicationType;
    this.config = config;
    this.documents = this.getRequiredDocuments();
  }

  /**
   * 평가 수행
   */
  async evaluate(applicantData) {
    try {
      const evaluation = {
        documentCheck: await this.checkDocumentCompleteness(applicantData),
        eligibilityCheck: await this.checkTypeSpecificEligibility(applicantData),
        requirementCheck: await this.checkTypeSpecificRequirements(applicantData),
        complianceCheck: await this.checkCompliance(applicantData)
      };
      
      return this.calculateScore(evaluation);
    } catch (error) {
      logger.error(`Evaluation error for ${this.visaType} ${this.applicationType}:`, error);
      throw error;
    }
  }

  /**
   * 문서 완성도 체크
   */
  async checkDocumentCompleteness(applicantData) {
    const providedDocs = applicantData.documents || [];
    const requiredDocs = this.documents.required;
    const optionalDocs = this.documents.optional;
    
    const missingRequired = requiredDocs.filter(doc => 
      !providedDocs.some(pd => pd.code === doc.code)
    );
    
    const providedOptional = optionalDocs.filter(doc =>
      providedDocs.some(pd => pd.code === doc.code)
    );
    
    const completeness = requiredDocs.length > 0
      ? ((requiredDocs.length - missingRequired.length) / requiredDocs.length) * 100
      : 100;
    
    const bonus = optionalDocs.length > 0
      ? (providedOptional.length / optionalDocs.length) * 10
      : 0;
    
    return {
      score: Math.min(100, completeness + bonus),
      completeness,
      missingRequired,
      providedOptional,
      details: {
        totalRequired: requiredDocs.length,
        totalProvided: requiredDocs.length - missingRequired.length,
        optionalProvided: providedOptional.length
      }
    };
  }

  /**
   * 신청유형별 자격요건 체크
   */
  async checkTypeSpecificEligibility(applicantData) {
    const results = {
      eligible: true,
      score: 100,
      checks: []
    };
    
    switch (this.applicationType) {
      case 'NEW':
        return this.checkNewApplicationEligibility(applicantData);
        
      case 'EXTENSION':
        return this.checkExtensionEligibility(applicantData);
        
      case 'CHANGE':
        return this.checkChangeEligibility(applicantData);
        
      default:
        return results;
    }
  }

  /**
   * 신규신청 자격요건
   */
  async checkNewApplicationEligibility(applicantData) {
    const results = {
      eligible: true,
      score: 100,
      checks: []
    };
    
    // 기본 자격요건 체크
    const eligibility = this.config?.requirements?.eligibility || {};
    
    // 학력 체크
    if (eligibility.education) {
      const educationMet = this.checkEducationLevel(
        applicantData.educationLevel,
        eligibility.education.minimum
      );
      
      if (!educationMet) {
        results.eligible = false;
        results.score -= 40;
      }
      
      results.checks.push({
        type: 'education',
        met: educationMet,
        required: eligibility.education.minimum,
        actual: applicantData.educationLevel
      });
    }
    
    // 경력 체크
    if (eligibility.experience) {
      const experienceMet = applicantData.experienceYears >= eligibility.experience.minimum;
      
      if (!experienceMet) {
        results.score -= 20;
      }
      
      results.checks.push({
        type: 'experience',
        met: experienceMet,
        required: eligibility.experience.minimum,
        actual: applicantData.experienceYears
      });
    }
    
    return results;
  }

  /**
   * 연장신청 자격요건
   */
  async checkExtensionEligibility(applicantData) {
    const results = {
      eligible: true,
      score: 100,
      checks: []
    };
    
    // 현재 활동 실적 체크
    if (applicantData.currentActivityScore !== undefined) {
      const activityMet = applicantData.currentActivityScore >= 60;
      
      if (!activityMet) {
        results.eligible = false;
        results.score -= 50;
      }
      
      results.checks.push({
        type: 'activity',
        met: activityMet,
        required: 60,
        actual: applicantData.currentActivityScore
      });
    }
    
    // 체류 실태 체크
    if (applicantData.stayCompliance !== undefined) {
      const complianceMet = applicantData.stayCompliance >= 80;
      
      if (!complianceMet) {
        results.score -= 30;
      }
      
      results.checks.push({
        type: 'compliance',
        met: complianceMet,
        required: 80,
        actual: applicantData.stayCompliance
      });
    }
    
    return results;
  }

  /**
   * 변경신청 자격요건
   */
  async checkChangeEligibility(applicantData) {
    const results = {
      eligible: true,
      score: 100,
      checks: []
    };
    
    const changeability = this.config?.changeability?.from || {};
    const currentVisa = applicantData.currentVisa;
    
    // 직접 변경 가능 체크
    if (changeability.allowed?.includes(currentVisa)) {
      results.checks.push({
        type: 'directChange',
        met: true,
        message: 'Direct change allowed'
      });
    }
    // 조건부 변경 가능 체크
    else if (changeability.conditional?.[currentVisa]) {
      const condition = changeability.conditional[currentVisa];
      results.eligible = false; // 조건 충족 필요
      results.score -= 30;
      
      results.checks.push({
        type: 'conditionalChange',
        met: false,
        condition: condition.condition,
        requiredDocs: condition.documents
      });
    }
    // 변경 불가
    else if (changeability.prohibited?.includes(currentVisa)) {
      results.eligible = false;
      results.score = 0;
      
      results.checks.push({
        type: 'changeProhibited',
        met: false,
        message: 'Change not allowed from this visa type'
      });
    }
    
    return results;
  }

  /**
   * 신청유형별 요구사항 체크
   */
  async checkTypeSpecificRequirements(applicantData) {
    const requirements = [];
    
    // 비자별 특수 요구사항
    const specific = this.config?.requirements?.specific || {};
    
    // E-1: 주당 수업시간
    if (specific.teaching?.weeklyHours && this.applicationType !== 'NEW') {
      const hours = applicantData.weeklyTeachingHours || 0;
      const minHours = specific.teaching.weeklyHours.minimum;
      
      requirements.push({
        type: 'weeklyHours',
        met: hours >= minHours,
        required: minHours,
        actual: hours,
        score: hours >= minHours ? 100 : (hours / minHours) * 100
      });
    }
    
    // E-7: 점수제
    if (specific.pointSystem?.enabled) {
      const points = applicantData.pointScore || 0;
      const minPoints = specific.pointSystem.minimumPoints;
      
      requirements.push({
        type: 'pointSystem',
        met: points >= minPoints,
        required: minPoints,
        actual: points,
        score: Math.min(100, (points / minPoints) * 100)
      });
    }
    
    // 평균 점수 계산
    const avgScore = requirements.length > 0
      ? requirements.reduce((sum, req) => sum + req.score, 0) / requirements.length
      : 100;
    
    return {
      score: avgScore,
      requirements
    };
  }

  /**
   * 법규 준수 체크
   */
  async checkCompliance(applicantData) {
    const compliance = {
      score: 100,
      issues: []
    };
    
    // 범죄경력
    if (applicantData.criminalRecord) {
      compliance.score = 0;
      compliance.issues.push({
        type: 'criminal',
        severity: 'CRITICAL',
        message: 'Criminal record exists'
      });
    }
    
    // 이전 비자 위반
    if (applicantData.previousViolations) {
      compliance.score -= 30;
      compliance.issues.push({
        type: 'violations',
        severity: 'HIGH',
        message: 'Previous visa violations'
      });
    }
    
    // 세금 체납 (연장/변경시)
    if (this.applicationType !== 'NEW' && applicantData.taxArrears) {
      compliance.score -= 20;
      compliance.issues.push({
        type: 'tax',
        severity: 'MEDIUM',
        message: 'Tax arrears exist'
      });
    }
    
    return compliance;
  }

  /**
   * 최종 점수 계산
   */
  calculateScore(evaluation) {
    // 가중치 설정
    const weights = this.getScoreWeights();
    
    let totalScore = 0;
    let totalWeight = 0;
    
    // 문서 점수
    if (evaluation.documentCheck) {
      totalScore += evaluation.documentCheck.score * weights.documents;
      totalWeight += weights.documents;
    }
    
    // 자격요건 점수
    if (evaluation.eligibilityCheck) {
      // 자격요건 미충족시 즉시 거부
      if (!evaluation.eligibilityCheck.eligible) {
        return {
          score: 0,
          status: 'REJECTED',
          reason: 'Eligibility requirements not met',
          details: evaluation
        };
      }
      totalScore += evaluation.eligibilityCheck.score * weights.eligibility;
      totalWeight += weights.eligibility;
    }
    
    // 요구사항 점수
    if (evaluation.requirementCheck) {
      totalScore += evaluation.requirementCheck.score * weights.requirements;
      totalWeight += weights.requirements;
    }
    
    // 법규준수 점수
    if (evaluation.complianceCheck) {
      // 심각한 법규 위반시 즉시 거부
      if (evaluation.complianceCheck.score === 0) {
        return {
          score: 0,
          status: 'REJECTED',
          reason: 'Compliance issues',
          details: evaluation
        };
      }
      totalScore += evaluation.complianceCheck.score * weights.compliance;
      totalWeight += weights.compliance;
    }
    
    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    
    return {
      score: finalScore,
      status: this.getStatus(finalScore),
      applicationType: this.applicationType,
      details: evaluation
    };
  }

  /**
   * 신청유형별 가중치
   */
  getScoreWeights() {
    const defaultWeights = {
      documents: 0.2,
      eligibility: 0.4,
      requirements: 0.2,
      compliance: 0.2
    };
    
    // 신청유형별 조정
    if (this.applicationType === 'EXTENSION') {
      return {
        documents: 0.15,
        eligibility: 0.3,
        requirements: 0.35,  // 활동실적 중요
        compliance: 0.2
      };
    } else if (this.applicationType === 'CHANGE') {
      return {
        documents: 0.2,
        eligibility: 0.5,    // 변경 가능 여부 중요
        requirements: 0.15,
        compliance: 0.15
      };
    }
    
    return defaultWeights;
  }

  /**
   * 필요 서류 목록
   */
  getRequiredDocuments() {
    const basicDocs = this.config?.documents?.basic || [];
    const typeDocs = this.config?.documents?.byApplicationType?.[this.applicationType] || [];
    
    return {
      required: [...basicDocs.filter(d => d.required), ...typeDocs.filter(d => d.required)],
      optional: [...basicDocs.filter(d => !d.required), ...typeDocs.filter(d => !d.required)]
    };
  }

  /**
   * 학력 수준 체크
   */
  checkEducationLevel(actual, required) {
    const levels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];
    const actualIndex = levels.indexOf(actual);
    const requiredIndex = levels.indexOf(required);
    
    return actualIndex >= requiredIndex && actualIndex !== -1;
  }

  /**
   * 평가 상태 결정
   */
  getStatus(score) {
    const thresholds = this.config?.evaluation?.scoring?.thresholds || {
      approved: 70,
      conditional: 50,
      rejected: 0
    };
    
    if (score >= thresholds.approved) return 'APPROVED';
    if (score >= thresholds.conditional) return 'CONDITIONAL';
    return 'REJECTED';
  }
}

module.exports = GenericApplicationTypeEvaluator;