/**
 * 출입국 전문 행정사 매칭 서비스
 * 케이스 복잡도 및 신청자 요구사항에 기반한 최적 매칭
 * 경로: /backend/src/modules/visaEvaluation/core/services/LegalRepresentativeMatchingService.js
 */

class LegalRepresentativeMatchingService {
  constructor() {
    // 행정사 등급 체계
    this.representativeGrades = {
      EXPERT: {
        description: '최고급 전문가',
        experience: '10년 이상',
        specialties: ['복잡 케이스', '거절 사례 재신청', '특수 비자'],
        successRate: '95% 이상',
        avgFee: { min: 1500000, max: 4000000 },
        languageSupport: ['한국어', '영어', '중국어']
      },
      SENIOR: {
        description: '고급 전문가',
        experience: '5-10년',
        specialties: ['일반 케이스', 'E-1/E-2 전문', '변경 신청'],
        successRate: '90% 이상',
        avgFee: { min: 800000, max: 2000000 },
        languageSupport: ['한국어', '영어']
      },
      INTERMEDIATE: {
        description: '중급 전문가',
        experience: '2-5년',
        specialties: ['표준 케이스', '연장 신청', '서류 검토'],
        successRate: '85% 이상',
        avgFee: { min: 500000, max: 1200000 },
        languageSupport: ['한국어']
      },
      JUNIOR: {
        description: '초급 전문가',
        experience: '1-2년',
        specialties: ['단순 케이스', '서류 준비', '상담'],
        successRate: '80% 이상',
        avgFee: { min: 300000, max: 800000 },
        languageSupport: ['한국어']
      }
    };

    // 매칭 알고리즘 가중치
    this.matchingWeights = {
      complexity: 0.4,      // 케이스 복잡도 40%
      experience: 0.25,     // 경력 25%
      specialty: 0.15,      // 전문 분야 15%
      location: 0.1,        // 지역 10%
      language: 0.05,       // 언어 5%
      budget: 0.05          // 예산 5%
    };
  }

  /**
   * 행정사 매칭 수행
   */
  async matchLegalRepresentative(evaluationResult, clientPreferences = {}) {
    const {
      complexity,
      riskAssessment,
      specialRequirements,
      estimatedLegalFees,
      urgency
    } = evaluationResult;

    const {
      budget,
      preferredLanguage,
      location,
      communicationPreference,
      experiencePreference
    } = clientPreferences;

    // 1. 필요 등급 결정
    const requiredGrade = this.determineRequiredGrade(complexity, riskAssessment);
    
    // 2. 전문 분야 매칭
    const requiredSpecialties = this.identifyRequiredSpecialties(evaluationResult);
    
    // 3. 후보 행정사 필터링
    const candidates = await this.filterCandidates({
      requiredGrade,
      requiredSpecialties,
      budget,
      location,
      preferredLanguage
    });

    // 4. 매칭 점수 계산
    const scoredCandidates = this.calculateMatchingScores(
      candidates,
      evaluationResult,
      clientPreferences
    );

    // 5. 최종 추천 목록 생성
    const recommendations = this.generateRecommendations(scoredCandidates, urgency);

    return {
      recommendedGrade: requiredGrade,
      requiredSpecialties,
      totalCandidates: candidates.length,
      recommendations,
      matchingCriteria: this.getMatchingCriteria(evaluationResult),
      servicePlan: this.generateServicePlan(evaluationResult, recommendations[0])
    };
  }

  /**
   * 필요 등급 결정
   */
  determineRequiredGrade(complexity, riskAssessment) {
    // 복잡도 기반 등급 결정
    if (complexity.complexity === 'VERY_COMPLEX' || riskAssessment.level === 'VERY_HIGH') {
      return 'EXPERT';
    } else if (complexity.complexity === 'COMPLEX' || riskAssessment.level === 'HIGH') {
      return 'SENIOR';
    } else if (complexity.complexity === 'STANDARD' || riskAssessment.level === 'MEDIUM') {
      return 'INTERMEDIATE';
    } else {
      return 'JUNIOR';
    }
  }

  /**
   * 필요 전문 분야 식별
   */
  identifyRequiredSpecialties(evaluationResult) {
    const specialties = [];
    const { complexity, preScreening, evaluation } = evaluationResult;

    // 복잡도 요인별 전문성
    complexity.factors.forEach(factor => {
      switch (factor.category) {
        case 'EDUCATION':
          specialties.push('학위인증 전문');
          if (factor.factor === 'FOREIGN_DEGREE_VERIFICATION') {
            specialties.push('국외학위 인정');
          }
          break;
        case 'LEGAL':
          specialties.push('출입국법 전문');
          specialties.push('비자위반 대응');
          break;
        case 'DOCUMENTS':
          specialties.push('서류 검증');
          if (factor.factor === 'APOSTILLE_REQUIRED') {
            specialties.push('아포스티유 절차');
          }
          break;
        case 'APPLICATION_TYPE':
          if (factor.factor === 'CHANGE_APPLICATION') {
            specialties.push('비자변경 전문');
          }
          break;
      }
    });

    // 사전심사 결과 기반 전문성
    if (preScreening.immediateRejectionReasons.length > 0) {
      specialties.push('거절 사례 재신청');
      specialties.push('이의제기 대응');
    }

    // 평가 점수 기반 전문성
    if (evaluation.score < 60) {
      specialties.push('어려운 케이스 전문');
    }

    return [...new Set(specialties)]; // 중복 제거
  }

  /**
   * 후보 행정사 필터링 (실제로는 DB 쿼리)
   */
  async filterCandidates(criteria) {
    // 실제 구현시 행정사 DB에서 쿼리
    // 여기서는 예시 데이터 생성
    const mockCandidates = [
      {
        id: 'rep001',
        name: '김출입',
        grade: 'EXPERT',
        experience: 15,
        specialties: ['E-1 전문', '학위인증', '복잡 케이스'],
        location: 'SEOUL',
        languages: ['KO', 'EN', 'CN'],
        successRate: 96,
        avgResponseTime: 2,
        fee: { min: 1500000, max: 3500000 },
        rating: 4.8,
        reviewCount: 127,
        availability: 'AVAILABLE'
      },
      {
        id: 'rep002',
        name: '이비자',
        grade: 'SENIOR',
        experience: 8,
        specialties: ['E-1/E-2 전문', '서류검토', '변경신청'],
        location: 'SEOUL',
        languages: ['KO', 'EN'],
        successRate: 92,
        avgResponseTime: 4,
        fee: { min: 800000, max: 1800000 },
        rating: 4.6,
        reviewCount: 89,
        availability: 'AVAILABLE'
      },
      {
        id: 'rep003',
        name: '박행정',
        grade: 'INTERMEDIATE',
        experience: 4,
        specialties: ['표준 케이스', '연장 신청'],
        location: 'BUSAN',
        languages: ['KO'],
        successRate: 88,
        avgResponseTime: 6,
        fee: { min: 600000, max: 1200000 },
        rating: 4.4,
        reviewCount: 56,
        availability: 'BUSY'
      }
    ];

    // 기본 필터링
    return mockCandidates.filter(candidate => {
      // 등급 필터
      const gradeRank = ['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'EXPERT'];
      const minGradeIndex = gradeRank.indexOf(criteria.requiredGrade);
      const candidateGradeIndex = gradeRank.indexOf(candidate.grade);
      
      if (candidateGradeIndex < minGradeIndex) return false;

      // 예산 필터
      if (criteria.budget && candidate.fee.min > criteria.budget) return false;

      // 언어 필터
      if (criteria.preferredLanguage && 
          !candidate.languages.includes(criteria.preferredLanguage)) return false;

      return true;
    });
  }

  /**
   * 매칭 점수 계산
   */
  calculateMatchingScores(candidates, evaluationResult, clientPreferences) {
    return candidates.map(candidate => {
      let score = 0;

      // 1. 복잡도 적합성 (40%)
      const complexityScore = this.calculateComplexityScore(candidate, evaluationResult.complexity);
      score += complexityScore * this.matchingWeights.complexity;

      // 2. 경력 점수 (25%)
      const experienceScore = Math.min(candidate.experience / 15 * 100, 100);
      score += experienceScore * this.matchingWeights.experience;

      // 3. 전문 분야 매칭 (15%)
      const specialtyScore = this.calculateSpecialtyScore(
        candidate, 
        evaluationResult.recommendedExpertise
      );
      score += specialtyScore * this.matchingWeights.specialty;

      // 4. 지역 점수 (10%)
      const locationScore = this.calculateLocationScore(candidate, clientPreferences.location);
      score += locationScore * this.matchingWeights.location;

      // 5. 언어 점수 (5%)
      const languageScore = this.calculateLanguageScore(candidate, clientPreferences.preferredLanguage);
      score += languageScore * this.matchingWeights.language;

      // 6. 예산 점수 (5%)
      const budgetScore = this.calculateBudgetScore(candidate, clientPreferences.budget);
      score += budgetScore * this.matchingWeights.budget;

      return {
        ...candidate,
        matchingScore: Math.round(score),
        scoreBreakdown: {
          complexity: Math.round(complexityScore * this.matchingWeights.complexity),
          experience: Math.round(experienceScore * this.matchingWeights.experience),
          specialty: Math.round(specialtyScore * this.matchingWeights.specialty),
          location: Math.round(locationScore * this.matchingWeights.location),
          language: Math.round(languageScore * this.matchingWeights.language),
          budget: Math.round(budgetScore * this.matchingWeights.budget)
        }
      };
    }).sort((a, b) => b.matchingScore - a.matchingScore);
  }

  /**
   * 최종 추천 목록 생성
   */
  generateRecommendations(scoredCandidates, urgency) {
    const topCandidates = scoredCandidates.slice(0, 3);

    return topCandidates.map((candidate, index) => {
      const recommendation = {
        rank: index + 1,
        representative: candidate,
        matchingScore: candidate.matchingScore,
        strengths: this.identifyStrengths(candidate),
        considerations: this.identifyConsiderations(candidate),
        estimatedTimeline: this.estimateServiceTimeline(candidate, urgency),
        serviceIncludes: this.getServiceIncludes(candidate),
        nextSteps: this.getNextSteps(candidate)
      };

      // 추천 사유
      if (index === 0) {
        recommendation.recommendationReason = '최고 매칭 점수 및 전문성';
      } else if (index === 1) {
        recommendation.recommendationReason = '우수한 경험과 합리적 비용';
      } else {
        recommendation.recommendationReason = '예산 효율성 고려';
      }

      return recommendation;
    });
  }

  /**
   * 서비스 계획 생성
   */
  generateServicePlan(evaluationResult, topRecommendation) {
    const { representative } = topRecommendation;

    return {
      phase1: {
        title: '초기 상담 및 서류 검토',
        duration: '1-2일',
        activities: [
          '케이스 상세 분석',
          '서류 완성도 검토',
          '보완 사항 식별',
          '성공 전략 수립'
        ],
        deliverables: ['상세 분석 보고서', '서류 체크리스트', '액션 플랜']
      },
      
      phase2: {
        title: '서류 준비 및 보완',
        duration: '1-3주',
        activities: [
          '누락 서류 발급 지원',
          '번역 및 공증 처리',
          '아포스티유 절차 대행',
          '신청서 작성 지원'
        ],
        deliverables: ['완성된 신청 서류 세트', '제출 준비 완료']
      },

      phase3: {
        title: '신청 및 사후 관리',
        duration: '2-4주',
        activities: [
          '출입국사무소 방문 대행',
          '진행 상황 모니터링',
          '추가 서류 요청 대응',
          '결과 안내 및 해석'
        ],
        deliverables: ['신청 완료 확인서', '진행 상황 보고서']
      },

      totalEstimate: {
        duration: '4-9주',
        totalFee: {
          min: representative.fee.min,
          max: representative.fee.max
        },
        governmentFees: this.calculateGovernmentFees(evaluationResult),
        additionalCosts: this.estimateAdditionalCosts(evaluationResult)
      }
    };
  }

  // ===== 점수 계산 헬퍼 메서드들 =====

  calculateComplexityScore(candidate, complexityAnalysis) {
    const { complexity } = complexityAnalysis;
    const gradeComplexityMap = {
      'SIMPLE': { EXPERT: 100, SENIOR: 100, INTERMEDIATE: 100, JUNIOR: 100 },
      'STANDARD': { EXPERT: 100, SENIOR: 95, INTERMEDIATE: 85, JUNIOR: 70 },
      'COMPLEX': { EXPERT: 100, SENIOR: 90, INTERMEDIATE: 70, JUNIOR: 40 },
      'VERY_COMPLEX': { EXPERT: 100, SENIOR: 80, INTERMEDIATE: 50, JUNIOR: 20 }
    };

    return gradeComplexityMap[complexity][candidate.grade] || 50;
  }

  calculateSpecialtyScore(candidate, requiredSpecialties) {
    if (!requiredSpecialties || requiredSpecialties.length === 0) return 100;

    const matchCount = requiredSpecialties.filter(specialty => 
      candidate.specialties.some(candidateSpecialty => 
        candidateSpecialty.includes(specialty) || specialty.includes(candidateSpecialty)
      )
    ).length;

    return (matchCount / requiredSpecialties.length) * 100;
  }

  calculateLocationScore(candidate, preferredLocation) {
    if (!preferredLocation) return 80;
    if (candidate.location === preferredLocation) return 100;
    return 60; // 다른 지역이지만 온라인 상담 가능
  }

  calculateLanguageScore(candidate, preferredLanguage) {
    if (!preferredLanguage || preferredLanguage === 'KO') return 100;
    return candidate.languages.includes(preferredLanguage) ? 100 : 70;
  }

  calculateBudgetScore(candidate, budget) {
    if (!budget) return 80;
    if (candidate.fee.min <= budget) return 100;
    if (candidate.fee.min <= budget * 1.2) return 80;
    return 40;
  }

  // ===== 기타 헬퍼 메서드들 =====

  identifyStrengths(candidate) {
    const strengths = [];
    
    if (candidate.successRate >= 95) strengths.push('매우 높은 성공률');
    if (candidate.experience >= 10) strengths.push('풍부한 경험');
    if (candidate.rating >= 4.7) strengths.push('탁월한 고객 만족도');
    if (candidate.avgResponseTime <= 3) strengths.push('신속한 응답');
    
    return strengths;
  }

  identifyConsiderations(candidate) {
    const considerations = [];
    
    if (candidate.fee.min >= 1500000) considerations.push('높은 수수료');
    if (candidate.availability === 'BUSY') considerations.push('현재 업무량 많음');
    if (candidate.avgResponseTime >= 6) considerations.push('응답 시간 다소 길음');
    
    return considerations;
  }

  estimateServiceTimeline(candidate, urgency) {
    let baseTime = 30; // 기본 30일
    
    if (candidate.grade === 'EXPERT') baseTime -= 5;
    if (candidate.avgResponseTime <= 3) baseTime -= 3;
    if (urgency === 'HIGH') baseTime -= 7;
    if (candidate.availability === 'BUSY') baseTime += 5;
    
    return {
      estimated: Math.max(15, baseTime),
      range: {
        min: Math.max(10, baseTime - 5),
        max: baseTime + 10
      }
    };
  }

  getServiceIncludes(candidate) {
    const baseServices = [
      '초기 상담',
      '서류 검토',
      '신청서 작성',
      '진행 상황 안내'
    ];

    const premiumServices = [
      '영어 상담 지원',
      '긴급 처리',
      '출입국사무소 동행',
      '사후 관리'
    ];

    if (candidate.grade === 'EXPERT' || candidate.grade === 'SENIOR') {
      return [...baseServices, ...premiumServices];
    }

    return baseServices;
  }

  getNextSteps(candidate) {
    return [
      {
        step: 1,
        action: '행정사 프로필 확인',
        description: '경력, 전문 분야, 고객 후기 검토'
      },
      {
        step: 2,
        action: '초기 상담 예약',
        description: '케이스 상세 논의 및 서비스 계획 수립'
      },
      {
        step: 3,
        action: '계약 및 착수',
        description: '서비스 계약 체결 및 업무 시작'
      }
    ];
  }

  calculateGovernmentFees(evaluationResult) {
    const { applicationType } = evaluationResult.applicantData || {};
    
    const fees = {
      NEW: 200000,        // 신규 신청
      EXTENSION: 60000,   // 연장 신청
      CHANGE: 130000      // 변경 신청
    };

    return fees[applicationType] || 200000;
  }

  estimateAdditionalCosts(evaluationResult) {
    return {
      translation: 150000,     // 번역 공증
      apostille: 100000,       // 아포스티유
      documents: 50000,        // 서류 발급
      transportation: 30000    // 교통비
    };
  }

  getMatchingCriteria(evaluationResult) {
    return {
      primaryFactors: [
        '케이스 복잡도 적합성',
        '전문 분야 일치도',
        '성공률 및 경험'
      ],
      secondaryFactors: [
        '지역 접근성',
        '언어 지원',
        '예산 적합성'
      ],
      algorithm: '가중평균 점수 기반 매칭'
    };
  }
}

module.exports = LegalRepresentativeMatchingService; 