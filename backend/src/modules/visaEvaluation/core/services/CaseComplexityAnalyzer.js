/**
 * E-1 비자 케이스 복잡도 분석기
 * 행정사 매칭 및 법적 수수료 산정을 위한 복잡도 평가
 * 경로: /backend/src/modules/visaEvaluation/core/services/CaseComplexityAnalyzer.js
 */

class CaseComplexityAnalyzer {
  constructor() {
    this.complexityFactors = [];
    this.legalFeeRanges = {
      SIMPLE: { min: 300000, max: 800000 },      // 30-80만원
      STANDARD: { min: 800000, max: 1500000 },   // 80-150만원
      COMPLEX: { min: 1500000, max: 2500000 },   // 150-250만원
      VERY_COMPLEX: { min: 2500000, max: 4000000 } // 250-400만원
    };
  }

  /**
   * 케이스 복잡도 분석
   */
  analyzeCaseComplexity(evaluationResult, applicantData) {
    const complexityFactors = this.identifyComplexityFactors(evaluationResult, applicantData);
    const overallComplexity = this.calculateOverallComplexity(complexityFactors);
    const legalRequirements = this.determineLegalRequirements(overallComplexity, complexityFactors);
    const timeEstimates = this.estimateTimeRequirements(overallComplexity, complexityFactors);
    const riskAssessment = this.assessRiskLevel(complexityFactors);

    return {
      complexity: overallComplexity,
      factors: complexityFactors,
      legalRequirements,
      timeEstimates,
      riskAssessment,
      estimatedLegalFees: this.calculateLegalFees(overallComplexity, complexityFactors),
      recommendedExpertise: this.identifyRequiredExpertise(complexityFactors),
      priorityLevel: this.determinePriorityLevel(overallComplexity, riskAssessment),
      specialConsiderations: this.identifySpecialConsiderations(applicantData)
    };
  }

  /**
   * 복잡도 요인 식별
   */
  identifyComplexityFactors(evaluationResult, applicantData) {
    const factors = [];
    
    // 1. 신청 유형별 기본 복잡도
    this.analyzeApplicationTypeComplexity(applicantData.applicationType, factors);
    
    // 2. 학력 인증 복잡도
    this.analyzeEducationComplexity(applicantData, factors);
    
    // 3. 경력 증명 복잡도
    this.analyzeExperienceComplexity(applicantData, factors);
    
    // 4. 교육기관 복잡도
    this.analyzeInstitutionComplexity(applicantData, factors);
    
    // 5. 서류 복잡도
    this.analyzeDocumentComplexity(applicantData, factors);
    
    // 6. 법적 이슈
    this.analyzeLegalComplexity(applicantData, factors);
    
    // 7. 평가 결과 기반 복잡도
    this.analyzeEvaluationComplexity(evaluationResult, factors);

    return factors;
  }

  /**
   * 신청 유형별 복잡도 분석
   */
  analyzeApplicationTypeComplexity(applicationType, factors) {
    switch (applicationType) {
      case 'NEW':
        factors.push({
          category: 'APPLICATION_TYPE',
          factor: 'NEW_APPLICATION',
          complexity: 'MEDIUM',
          impact: 2,
          description: '신규 신청 - 전체 서류 검토 필요',
          timeImpact: 5,
          legalSupport: 'RECOMMENDED'
        });
        break;
        
      case 'EXTENSION':
        factors.push({
          category: 'APPLICATION_TYPE',
          factor: 'EXTENSION_APPLICATION',
          complexity: 'LOW',
          impact: 1,
          description: '연장 신청 - 기존 기록 활용 가능',
          timeImpact: 2,
          legalSupport: 'OPTIONAL'
        });
        break;
        
      case 'CHANGE':
        factors.push({
          category: 'APPLICATION_TYPE',
          factor: 'CHANGE_APPLICATION',
          complexity: 'HIGH',
          impact: 3,
          description: '변경 신청 - 자격 요건 재검토 필요',
          timeImpact: 10,
          legalSupport: 'HIGHLY_RECOMMENDED'
        });
        break;
    }
  }

  /**
   * 학력 인증 복잡도 분석
   */
  analyzeEducationComplexity(applicantData, factors) {
    const { educationCountry, degreeType, institutionAccreditation } = applicantData;

    // 외국 학위 인증
    if (educationCountry !== 'KR') {
      factors.push({
        category: 'EDUCATION',
        factor: 'FOREIGN_DEGREE_VERIFICATION',
        complexity: 'MEDIUM',
        impact: 2,
        description: '외국 학위 인증 및 아포스티유 확인',
        timeImpact: 7,
        legalSupport: 'RECOMMENDED'
      });
    }

    // 온라인 학위
    if (degreeType === 'ONLINE') {
      factors.push({
        category: 'EDUCATION',
        factor: 'ONLINE_DEGREE',
        complexity: 'HIGH',
        impact: 3,
        description: '온라인 학위 인정 여부 검토',
        timeImpact: 10,
        legalSupport: 'REQUIRED'
      });
    }

    // 비인가 기관
    if (institutionAccreditation === 'UNACCREDITED') {
      factors.push({
        category: 'EDUCATION',
        factor: 'UNACCREDITED_INSTITUTION',
        complexity: 'VERY_HIGH',
        impact: 4,
        description: '비인가 교육기관 학위 - 대안 모색 필요',
        timeImpact: 20,
        legalSupport: 'REQUIRED'
      });
    }
  }

  /**
   * 경력 증명 복잡도 분석
   */
  analyzeExperienceComplexity(applicantData, factors) {
    const { experienceCountries, experienceTypes, experienceGaps } = applicantData;

    // 다국가 경력
    if (experienceCountries && experienceCountries.length > 2) {
      factors.push({
        category: 'EXPERIENCE',
        factor: 'MULTINATIONAL_EXPERIENCE',
        complexity: 'MEDIUM',
        impact: 2,
        description: '다국가 경력 증명서 수집 및 번역',
        timeImpact: 8,
        legalSupport: 'RECOMMENDED'
      });
    }

    // 비정형 경력
    if (experienceTypes && experienceTypes.includes('FREELANCE')) {
      factors.push({
        category: 'EXPERIENCE',
        factor: 'FREELANCE_EXPERIENCE',
        complexity: 'HIGH',
        impact: 3,
        description: '프리랜서 경력 증명 어려움',
        timeImpact: 12,
        legalSupport: 'HIGHLY_RECOMMENDED'
      });
    }

    // 경력 공백
    if (experienceGaps && experienceGaps.length > 0) {
      factors.push({
        category: 'EXPERIENCE',
        factor: 'EXPERIENCE_GAPS',
        complexity: 'MEDIUM',
        impact: 2,
        description: '경력 공백 기간 설명 필요',
        timeImpact: 5,
        legalSupport: 'RECOMMENDED'
      });
    }
  }

  /**
   * 교육기관 복잡도 분석
   */
  analyzeInstitutionComplexity(applicantData, factors) {
    const { institutionType, institutionStatus, institutionLocation } = applicantData;

    // 특수 교육기관
    const specialInstitutions = ['CREDIT_BANK', 'CYBER_UNIVERSITY', 'FOREIGN_SCHOOL'];
    if (specialInstitutions.includes(institutionType)) {
      factors.push({
        category: 'INSTITUTION',
        factor: 'SPECIAL_INSTITUTION',
        complexity: 'HIGH',
        impact: 3,
        description: '특수 교육기관 - 추가 인증 절차',
        timeImpact: 10,
        legalSupport: 'HIGHLY_RECOMMENDED'
      });
    }

    // 신설 기관
    if (institutionStatus === 'NEWLY_ESTABLISHED') {
      factors.push({
        category: 'INSTITUTION',
        factor: 'NEW_INSTITUTION',
        complexity: 'MEDIUM',
        impact: 2,
        description: '신설 교육기관 - 안정성 검토',
        timeImpact: 7,
        legalSupport: 'RECOMMENDED'
      });
    }

    // 지방 소재
    if (institutionLocation === 'REGIONAL') {
      factors.push({
        category: 'INSTITUTION',
        factor: 'REGIONAL_INSTITUTION',
        complexity: 'LOW',
        impact: 1,
        description: '지방 소재 - 우대 정책 적용 가능',
        timeImpact: 0,
        legalSupport: 'OPTIONAL',
        advantage: true
      });
    }
  }

  /**
   * 서류 복잡도 분석
   */
  analyzeDocumentComplexity(applicantData, factors) {
    const { nationality, documentLanguages, apostilleRequired } = applicantData;

    // 다언어 서류
    if (documentLanguages && documentLanguages.length > 2) {
      factors.push({
        category: 'DOCUMENTS',
        factor: 'MULTILINGUAL_DOCUMENTS',
        complexity: 'MEDIUM',
        impact: 2,
        description: '다언어 서류 번역 및 공증',
        timeImpact: 10,
        legalSupport: 'RECOMMENDED'
      });
    }

    // 아포스티유 대상 국가
    if (apostilleRequired) {
      factors.push({
        category: 'DOCUMENTS',
        factor: 'APOSTILLE_REQUIRED',
        complexity: 'MEDIUM',
        impact: 2,
        description: '아포스티유 또는 영사확인 필요',
        timeImpact: 15,
        legalSupport: 'RECOMMENDED'
      });
    }

    // 범죄경력증명서 필요 국가
    const criminalRecordCountries = ['US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'ZA'];
    if (criminalRecordCountries.includes(nationality)) {
      factors.push({
        category: 'DOCUMENTS',
        factor: 'CRIMINAL_RECORD_REQUIRED',
        complexity: 'HIGH',
        impact: 3,
        description: '범죄경력증명서 발급 및 인증',
        timeImpact: 20,
        legalSupport: 'HIGHLY_RECOMMENDED'
      });
    }
  }

  /**
   * 법적 이슈 복잡도 분석
   */
  analyzeLegalComplexity(applicantData, factors) {
    const { previousViolations, currentLegalIssues, immigrationHistory } = applicantData;

    // 이전 위반 기록
    if (previousViolations && previousViolations.length > 0) {
      factors.push({
        category: 'LEGAL',
        factor: 'PREVIOUS_VIOLATIONS',
        complexity: 'VERY_HIGH',
        impact: 4,
        description: '이전 출입국 위반 기록 - 면밀한 법적 검토',
        timeImpact: 25,
        legalSupport: 'REQUIRED'
      });
    }

    // 현재 법적 문제
    if (currentLegalIssues) {
      factors.push({
        category: 'LEGAL',
        factor: 'CURRENT_LEGAL_ISSUES',
        complexity: 'VERY_HIGH',
        impact: 4,
        description: '현재 진행 중인 법적 문제',
        timeImpact: 30,
        legalSupport: 'REQUIRED'
      });
    }

    // 복잡한 출입국 이력
    if (immigrationHistory && immigrationHistory.complexity === 'HIGH') {
      factors.push({
        category: 'LEGAL',
        factor: 'COMPLEX_IMMIGRATION_HISTORY',
        complexity: 'HIGH',
        impact: 3,
        description: '복잡한 출입국 이력 검토',
        timeImpact: 15,
        legalSupport: 'HIGHLY_RECOMMENDED'
      });
    }
  }

  /**
   * 평가 결과 기반 복잡도 분석
   */
  analyzeEvaluationComplexity(evaluationResult, factors) {
    if (!evaluationResult) return;

    const { score, issues, recommendations } = evaluationResult;

    // 낮은 평가 점수
    if (score < 60) {
      factors.push({
        category: 'EVALUATION',
        factor: 'LOW_EVALUATION_SCORE',
        complexity: 'HIGH',
        impact: 3,
        description: '낮은 평가 점수 - 보완 전략 필요',
        timeImpact: 20,
        legalSupport: 'HIGHLY_RECOMMENDED'
      });
    }

    // 다수의 문제점
    if (issues && issues.length > 5) {
      factors.push({
        category: 'EVALUATION',
        factor: 'MULTIPLE_ISSUES',
        complexity: 'HIGH',
        impact: 3,
        description: '다수의 문제점 - 종합적 해결책 필요',
        timeImpact: 15,
        legalSupport: 'HIGHLY_RECOMMENDED'
      });
    }
  }

  /**
   * 전체 복잡도 계산
   */
  calculateOverallComplexity(factors) {
    if (factors.length === 0) return 'SIMPLE';

    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
    const maxImpact = factors.reduce((max, factor) => Math.max(max, factor.impact), 0);
    const averageImpact = totalImpact / factors.length;

    // 복잡도 결정 로직
    if (maxImpact >= 4 || averageImpact >= 3) {
      return 'VERY_COMPLEX';
    } else if (maxImpact >= 3 || averageImpact >= 2.5) {
      return 'COMPLEX';
    } else if (maxImpact >= 2 || averageImpact >= 1.5) {
      return 'STANDARD';
    } else {
      return 'SIMPLE';
    }
  }

  /**
   * 법적 수수료 계산
   */
  calculateLegalFees(complexity, factors) {
    const baseRange = this.legalFeeRanges[complexity];
    let adjustedMin = baseRange.min;
    let adjustedMax = baseRange.max;

    // 특별 요인에 따른 조정
    factors.forEach(factor => {
      if (factor.legalSupport === 'REQUIRED') {
        adjustedMin *= 1.2;
        adjustedMax *= 1.3;
      } else if (factor.advantage) {
        adjustedMin *= 0.9;
        adjustedMax *= 0.9;
      }
    });

    return {
      min: Math.round(adjustedMin),
      max: Math.round(adjustedMax),
      average: Math.round((adjustedMin + adjustedMax) / 2),
      complexity,
      disclaimer: '실제 수수료는 케이스별 상담을 통해 결정됩니다.'
    };
  }

  /**
   * 필요 전문성 식별
   */
  identifyRequiredExpertise(factors) {
    const expertise = new Set(['E-1 비자 전문']);
    
    factors.forEach(factor => {
      switch (factor.category) {
        case 'EDUCATION':
          expertise.add('학위인증 전문');
          if (factor.factor === 'FOREIGN_DEGREE_VERIFICATION') {
            expertise.add('국외학위 인정');
          }
          break;
        case 'LEGAL':
          expertise.add('출입국법 전문');
          expertise.add('비자위반 대응');
          break;
        case 'INSTITUTION':
          expertise.add('교육기관 인증');
          break;
        case 'DOCUMENTS':
          expertise.add('서류 검증');
          if (factor.factor === 'APOSTILLE_REQUIRED') {
            expertise.add('아포스티유 절차');
          }
          break;
        case 'APPLICATION_TYPE':
          if (factor.factor === 'CHANGE_APPLICATION') {
            expertise.add('비자변경 전문');
          }
          break;
      }
    });

    return Array.from(expertise);
  }

  /**
   * 시간 소요 예측
   */
  estimateTimeRequirements(complexity, factors) {
    const baseTime = {
      SIMPLE: 15,
      STANDARD: 25,
      COMPLEX: 40,
      VERY_COMPLEX: 60
    };

    const totalTimeImpact = factors.reduce((sum, factor) => sum + factor.timeImpact, 0);
    const estimatedDays = baseTime[complexity] + totalTimeImpact;

    return {
      preparation: Math.round(estimatedDays * 0.6),
      submission: Math.round(estimatedDays * 0.2),
      followUp: Math.round(estimatedDays * 0.2),
      total: estimatedDays,
      breakdown: factors.map(factor => ({
        factor: factor.description,
        days: factor.timeImpact
      }))
    };
  }

  /**
   * 위험 수준 평가
   */
  assessRiskLevel(factors) {
    const riskFactors = factors.filter(factor => 
      factor.category === 'LEGAL' || 
      factor.complexity === 'VERY_HIGH' ||
      factor.factor === 'UNACCREDITED_INSTITUTION'
    );

    let riskLevel = 'LOW';
    if (riskFactors.length > 2) {
      riskLevel = 'VERY_HIGH';
    } else if (riskFactors.length > 1) {
      riskLevel = 'HIGH';
    } else if (riskFactors.length === 1) {
      riskLevel = 'MEDIUM';
    }

    return {
      level: riskLevel,
      factors: riskFactors.map(factor => factor.description),
      recommendations: this.generateRiskMitigationRecommendations(riskLevel, riskFactors)
    };
  }

  /**
   * 우선순위 수준 결정
   */
  determinePriorityLevel(complexity, riskAssessment) {
    if (riskAssessment.level === 'VERY_HIGH' || complexity === 'VERY_COMPLEX') {
      return 'URGENT';
    } else if (riskAssessment.level === 'HIGH' || complexity === 'COMPLEX') {
      return 'HIGH';
    } else if (riskAssessment.level === 'MEDIUM' || complexity === 'STANDARD') {
      return 'MEDIUM';
    } else {
      return 'NORMAL';
    }
  }

  /**
   * 특별 고려사항 식별
   */
  identifySpecialConsiderations(applicantData) {
    const considerations = [];
    
    const { nationality, familyStatus, urgency, financialStatus } = applicantData;

    if (familyStatus === 'FAMILY_WITH_CHILDREN') {
      considerations.push({
        type: 'FAMILY_CONSIDERATION',
        description: '가족 동반 입국 계획 고려',
        recommendation: '가족 비자 동시 신청 검토'
      });
    }

    if (urgency === 'HIGH') {
      considerations.push({
        type: 'URGENT_PROCESSING',
        description: '긴급 처리 필요',
        recommendation: '신속 처리 서비스 이용 검토'
      });
    }

    if (financialStatus === 'LIMITED') {
      considerations.push({
        type: 'BUDGET_CONSTRAINT',
        description: '예산 제약 있음',
        recommendation: '단계별 서비스 제공 검토'
      });
    }

    return considerations;
  }

  /**
   * 법적 요구사항 결정
   */
  determineLegalRequirements(complexity, factors) {
    const legalSupportNeeded = factors.some(factor => factor.legalSupport === 'REQUIRED');
    const highlyRecommended = factors.some(factor => factor.legalSupport === 'HIGHLY_RECOMMENDED');

    if (legalSupportNeeded) {
      return {
        level: 'REQUIRED',
        description: '전문 법무 서비스 필수',
        services: ['법무 상담', '서류 검토', '대리 신청', '이의제기 대응']
      };
    } else if (highlyRecommended || complexity === 'COMPLEX' || complexity === 'VERY_COMPLEX') {
      return {
        level: 'HIGHLY_RECOMMENDED',
        description: '전문 법무 서비스 강력 권장',
        services: ['법무 상담', '서류 검토', '대리 신청']
      };
    } else {
      return {
        level: 'OPTIONAL',
        description: '선택적 법무 서비스',
        services: ['서류 검토', '상담']
      };
    }
  }

  /**
   * 위험 완화 권고사항 생성
   */
  generateRiskMitigationRecommendations(riskLevel, riskFactors) {
    const recommendations = [];

    if (riskLevel === 'VERY_HIGH') {
      recommendations.push('전문 법무법인 상담 필수');
      recommendations.push('사전 심사 단계에서 철저한 검토');
      recommendations.push('대안 전략 수립');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('전문가 상담 권장');
      recommendations.push('보완 서류 사전 준비');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('전문가 검토 권장');
    }

    return recommendations;
  }
}

module.exports = CaseComplexityAnalyzer; 