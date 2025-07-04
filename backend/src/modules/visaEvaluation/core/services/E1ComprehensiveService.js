/**
 * E1 비자 종합 서비스 - 통합된 매뉴얼 기반 평가 시스템
 * 기존 5개 특화 서비스를 하나로 통합
 */

const logger = require('../../../../utils/logger');

class E1ComprehensiveService {
  constructor() {
    this.serviceVersion = '3.0-integrated';
    this.logger = logger;
  }

  /**
   * 🎯 E1 비자 종합 평가 - 모든 기능 통합
   */
  async performComprehensiveEvaluation(applicantData, clientPreferences = {}, serviceOptions = {}) {
    try {
      this.logger.info('🎯 E1 종합 평가 시작');

      // 1. 기본 평가
      const basicEvaluation = await this._performBasicEvaluation(applicantData);
      
      // 2. 사전 심사
      const preScreening = this._performPreScreening(applicantData);
      
      // 3. 활동 검증
      const activityValidation = this._validateActivity(applicantData);
      
      // 4. 사증발급인정서 평가
      const certificateAssessment = this._assessCertificate(applicantData);
      
      // 5. 행정사 매칭 (선택적)
      const legalMatching = serviceOptions.includeLegalMatching !== false 
        ? await this._matchLegalRepresentative(basicEvaluation, clientPreferences)
        : null;
      
      // 6. 분석 및 추천
      const analytics = this._generateAnalytics({
        basicEvaluation,
        preScreening,
        activityValidation,
        certificateAssessment
      });

      return {
        success: true,
        evaluation: basicEvaluation,
        preScreening,
        activityAssessment: activityValidation,
        visaIssuanceCertificate: certificateAssessment,
        legalRepresentative: legalMatching,
        analytics,
        metadata: {
          evaluationDate: new Date().toISOString(),
          version: this.serviceVersion,
          comprehensive: true
        }
      };

    } catch (error) {
      this.logger.error('E1 종합 평가 오류:', error);
      return {
        success: false,
        error: error.message,
        version: this.serviceVersion
      };
    }
  }

  /**
   * 기본 평가 수행
   */
  async _performBasicEvaluation(data) {
    const evaluationService = require('./SimplifiedEvaluationService').getSimplifiedEvaluationService();
    return await evaluationService.evaluate('E-1', data);
  }

  /**
   * 사전 심사
   */
  _performPreScreening(data) {
    const issues = [];
    const strengths = [];

    // 학력 검증
    if (data.education?.degree === 'MASTERS' || data.education?.degree === 'DOCTORATE') {
      strengths.push('고급 학위 보유');
    } else {
      issues.push('학사 이상 학위 필요');
    }

    // 강의 시수 검증
    if (data.weeklyHours >= 6) {
      strengths.push('주당 강의시수 충족');
    } else {
      issues.push('주당 6시간 이상 강의 필요');
    }

    // 온라인 강의 비율 검증
    if (data.onlinePercentage <= 50) {
      strengths.push('온라인 강의 비율 적정');
    } else {
      issues.push('온라인 강의 50% 이하로 조정 필요');
    }

    return {
      success: issues.length === 0,
      strengths,
      issues,
      successProbability: Math.max(0, 100 - (issues.length * 25))
    };
  }

  /**
   * 활동 검증
   */
  _validateActivity(data) {
    const validation = {
      lectureHours: data.weeklyHours >= 6,
      onlineRatio: data.onlinePercentage <= 50,
      institutionType: data.institution?.type === 'UNIVERSITY',
      contractPeriod: data.contractPeriod >= 12
    };

    const validCount = Object.values(validation).filter(Boolean).length;
    const score = (validCount / Object.keys(validation).length) * 100;

    return {
      validation,
      score: Math.round(score),
      compliant: validCount === Object.keys(validation).length,
      recommendations: this._generateActivityRecommendations(validation)
    };
  }

  /**
   * 사증발급인정서 평가
   */
  _assessCertificate(data) {
    const isRequired = data.applicationType === 'NEW' && 
                     data.nationality && 
                     !['KR'].includes(data.nationality);

    return {
      required: isRequired,
      recommendedMethod: isRequired ? 'CERTIFICATE_FIRST' : 'DIRECT_APPLICATION',
      processingTime: isRequired ? '2-3주' : '1-2주',
      advantages: isRequired ? [
        '사전 승인으로 안정성 확보',
        '영사관 심사 간소화',
        '거절 위험 최소화'
      ] : [],
      guide: this._generateCertificateGuide(isRequired)
    };
  }

  /**
   * 행정사 매칭
   */
  async _matchLegalRepresentative(evaluation, preferences) {
    // 복잡도 기반 매칭
    const complexity = this._calculateComplexity(evaluation);
    
    return {
      recommended: complexity.level !== 'LOW',
      complexity,
      estimatedFee: this._estimateLegalFee(complexity),
      specialization: ['E-1 비자', '교육 분야', '외국인 교수'],
      matchingScore: 85,
      benefits: [
        '매뉴얼 기반 정확한 서류 준비',
        '출입국사무소 직접 소통',
        '문제 발생 시 즉시 대응'
      ]
    };
  }

  /**
   * 분석 및 추천사항
   */
  _generateAnalytics(components) {
    const { basicEvaluation, preScreening, activityValidation, certificateAssessment } = components;
    
    const overallScore = (
      (basicEvaluation.totalScore || 0) * 0.4 +
      preScreening.successProbability * 0.3 +
      activityValidation.score * 0.3
    );

    return {
      overallScore: Math.round(overallScore),
      successProbability: this._calculateSuccessProbability(overallScore),
      riskFactors: this._identifyRiskFactors(components),
      recommendations: this._generateRecommendations(components),
      timeline: this._estimateTimeline({ visaIssuanceCertificate: certificateAssessment, activityValidation })
    };
  }

  // === 헬퍼 메서드들 ===

  _generateActivityRecommendations(validation) {
    const recommendations = [];
    
    if (!validation.lectureHours) {
      recommendations.push('주당 강의시수를 6시간 이상으로 조정');
    }
    if (!validation.onlineRatio) {
      recommendations.push('온라인 강의 비율을 50% 이하로 조정');
    }
    if (!validation.institutionType) {
      recommendations.push('고등교육법상 적격 교육기관 확인');
    }
    
    return recommendations;
  }

  _generateCertificateGuide(isRequired) {
    if (!isRequired) {
      return '직접 신청 가능';
    }

    return {
      step1: '교육기관에서 사증발급인정서 신청',
      step2: '법무부 심사 및 승인 (2-3주)',
      step3: '승인서로 해외 영사관에서 사증 신청',
      step4: '사증 발급 후 입국',
      requiredDocs: [
        '교육기관 사업자등록증',
        '신청자 학위증명서',
        '범죄경력증명서',
        '건강진단서'
      ]
    };
  }

  _calculateComplexity(evaluation) {
    let complexity = 0;
    
    if (evaluation.totalScore < 70) complexity += 2;
    if (evaluation.missingRequirements?.length > 3) complexity += 1;
    if (evaluation.warnings?.length > 0) complexity += 1;
    
    return {
      level: complexity === 0 ? 'LOW' : complexity <= 2 ? 'MEDIUM' : 'HIGH',
      score: complexity,
      factors: evaluation.missingRequirements || []
    };
  }

  _estimateLegalFee(complexity) {
    const baseFee = {
      LOW: 800000,
      MEDIUM: 1200000,
      HIGH: 1800000
    };
    
    return {
      estimated: baseFee[complexity.level],
      range: `${baseFee[complexity.level] * 0.8} - ${baseFee[complexity.level] * 1.2}`,
      currency: 'KRW'
    };
  }

  _calculateSuccessProbability(score) {
    if (score >= 80) return { level: 'HIGH', percentage: score };
    if (score >= 60) return { level: 'MEDIUM', percentage: score };
    return { level: 'LOW', percentage: score };
  }

  _identifyRiskFactors(components) {
    const risks = [];
    
    if (components.preScreening.issues.length > 0) {
      risks.push(...components.preScreening.issues);
    }
    
    if (components.activityValidation.score < 70) {
      risks.push('활동 계획 보완 필요');
    }
    
    return risks;
  }

  _generateRecommendations(components) {
    const recommendations = [];
    
    // 사전 심사 기반 추천
    recommendations.push(...components.preScreening.issues);
    
    // 활동 검증 기반 추천
    recommendations.push(...components.activityValidation.recommendations);
    
    return recommendations.slice(0, 5); // 상위 5개만
  }

  _estimateTimeline(components) {
    const base = components.visaIssuanceCertificate?.required ? 4 : 2;
    const complexity = components.activityValidation?.score < 70 ? 2 : 0;
    
    return {
      estimated: `${base + complexity}-${base + complexity + 2}주`,
      phases: components.visaIssuanceCertificate?.required ? [
        '사증발급인정서 신청: 2-3주',
        '사증 신청: 1-2주'
      ] : [
        '직접 사증 신청: 2-4주'
      ]
    };
  }
}

module.exports = E1ComprehensiveService; 