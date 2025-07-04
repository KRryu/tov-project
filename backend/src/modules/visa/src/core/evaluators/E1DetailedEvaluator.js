/**
 * E-1 비자 상세 평가 모듈 (교수비자)
 * 사증/체류 매뉴얼 기반 정교한 평가 알고리즘
 */

const logger = require('../../../../../utils/logger');

class E1DetailedEvaluator {
  constructor(applicationType = 'NEW') {
    this.applicationType = applicationType; // NEW, EXTENSION, CHANGE
    
    // 교수 관련 자격증 가중치
    this.academicCertificateWeights = {
      'phd': 1.5,           // 박사학위
      'masters': 1.3,       // 석사학위
      'bachelor': 1.0,      // 학사학위
      'teaching_cert': 1.2, // 교사 자격증
      'professor_cert': 1.4 // 교수 자격증
    };

    // 학문 분야별 가중치
    this.academicFieldWeights = {
      'natural_sciences': 1.2,    // 자연과학
      'engineering': 1.15,        // 공학
      'humanities': 1.1,          // 인문학
      'social_sciences': 1.1,     // 사회과학
      'arts': 1.05,               // 예술
      'medicine': 1.3,            // 의학
      'law': 1.2,                 // 법학
      'business': 1.1,            // 경영학
      'education': 1.0,           // 교육학
      'other': 0.9
    };
    
    // GNI 기준 소득 요건 (2024년 기준)
    this.incomeRequirements = {
      'E-1-1': 66000000,  // 전임강사(교수, 부교수, 조교수)
      'E-1-2': 49500000,  // 시간강사
      'E-1-3': 33000000   // 연구원
    };
  }

  /**
   * 종합 평가 수행 (신청 유형별 분기)
   */
  async evaluateComprehensive(data) {
    if (this.applicationType === 'NEW') {
      return this.evaluateNewApplication(data);
    } else if (this.applicationType === 'EXTENSION') {
      return this.evaluateExtension(data);
    } else if (this.applicationType === 'CHANGE') {
      return this.evaluateChange(data);
    }
    
    // 기본값: 신규 신청
    return this.evaluateNewApplication(data);
  }
  
  /**
   * 신규 신청 평가 (사증민원 매뉴얼 기반)
   */
  async evaluateNewApplication(data) {
    const evaluation = {
      academicQualification: await this.evaluateAcademicQualification(data),
      teachingExperience: await this.evaluateTeachingExperience(data),
      researchCapability: await this.evaluateResearchCapability(data),
      languageSkills: await this.evaluateLanguageSkills(data),
      ageEvaluation: await this.evaluateAge(data),
      institutionStatus: await this.evaluateInvitingInstitution(data),
      growthPotential: await this.calculateGrowthPotential(data),
      risks: await this.identifyRisks(data),
      recommendations: []
    };

    // 점수 계산 (사증민원 매뉴얼 기준)
    const scoreAnalysis = this.calculateNewApplicationScore(evaluation);
    evaluation.totalScore = scoreAnalysis.totalScore;
    evaluation.scoreBreakdown = scoreAnalysis;
    evaluation.manualScoreCheck = scoreAnalysis.manualScoreCheck;
    
    evaluation.recommendations = this.generateNewApplicationRecommendations(evaluation, data);
    evaluation.improvementRoadmap = this.createImprovementRoadmap(evaluation, data);

    return evaluation;
  }
  
  /**
   * 연장 신청 평가 (체류민원 매뉴얼 기반)
   */
  async evaluateExtension(data) {
    const evaluation = {
      complianceCheck: await this.evaluateVisaCompliance(data),
      incomeVerification: await this.evaluateIncomeRequirement(data),
      employmentContinuity: await this.evaluateEmploymentStatus(data),
      taxCompliance: await this.evaluateTaxPayment(data),
      tradePerformance: await this.evaluateRecentTradeActivity(data),
      risks: await this.identifyExtensionRisks(data),
      recommendations: []
    };

    // 연장 평가는 Pass/Fail 방식
    const complianceResult = this.calculateExtensionCompliance(evaluation);
    evaluation.totalScore = complianceResult.score;
    evaluation.complianceStatus = complianceResult;
    
    evaluation.recommendations = this.generateExtensionRecommendations(evaluation, data);

    return evaluation;
  }
  
  /**
   * 변경 신청 평가 (체류민원 매뉴얼 기반)
   */
  async evaluateChange(data) {
    // 변경 신청은 신규와 유사하지만 현재 체류 상태도 고려
    const evaluation = await this.evaluateNewApplication(data);
    
    // 추가로 현재 비자 상태 확인
    evaluation.currentVisaStatus = await this.evaluateCurrentVisaStatus(data);
    evaluation.changeEligibility = await this.evaluateChangeEligibility(data);
    
    return evaluation;
  }

  /**
   * 학술 자격 평가 (신규 신청용)
   */
  async evaluateAcademicQualification(data) {
    const result = {
      score: 0,
      maxScore: 25,
      details: {},
      qualified: false
    };

    // 1. 학위 수준 평가
    const educationLevel = this.mapEducationLevel(data.highestEducation);
    const educationScores = {
      'DOCTORATE': 20,
      'MASTERS': 15,
      'BACHELOR': 10,
      'ASSOCIATE': 5
    };
    
    const eduScore = educationScores[educationLevel] || 0;
    result.details.degree = {
      score: eduScore,
      level: educationLevel,
      message: `${educationLevel} 학위 보유`
    };
    result.score += eduScore;
    
    if (eduScore >= 10) {
      result.qualified = true;
    }

    // 2. 전공 관련성
    if (data.majorField) {
      const fieldWeight = this.academicFieldWeights[data.majorField] || 1.0;
      const fieldScore = 5 * fieldWeight;
      result.details.major = {
        score: fieldScore,
        field: data.majorField,
        message: `${data.majorField} 전공`
      };
      result.score += fieldScore;
    }

    return result;
  }

  /**
   * 교수 경력 평가
   */
  async evaluateTeachingExperience(data) {
    const result = {
      score: 0,
      maxScore: 30,
      details: {}
    };

    const years = parseInt(data.teachingExperience || data.yearsOfExperience) || 0;
    
    // 매뉴얼 기준 교수 경력 점수
    if (years >= 10) {
      result.score = 30;
      result.details.years = { score: 30, message: '10년 이상 교수 경력' };
    } else if (years >= 7) {
      result.score = 25;
      result.details.years = { score: 25, message: '7년 이상 교수 경력' };
    } else if (years >= 5) {
      result.score = 20;
      result.details.years = { score: 20, message: '5년 이상 교수 경력' };
    } else if (years >= 3) {
      result.score = 15;
      result.details.years = { score: 15, message: '3년 이상 교수 경력' };
    } else if (years >= 1) {
      result.score = 10;
      result.details.years = { score: 10, message: '1년 이상 교수 경력' };
    }

    // 교수 분야별 가중치
    if (data.teachingField) {
      const fieldWeight = this.academicFieldWeights[data.teachingField] || 1.0;
      result.score *= fieldWeight;
    }

    return result;
  }

  /**
   * 연구 능력 평가
   */
  async evaluateResearchCapability(data) {
    const result = {
      score: 0,
      maxScore: 30,
      details: {}
    };

    // 1. 연구 논문 평가
    const publications = data.publications || [];
    const publicationCount = data.publicationsCount || publications.length || 0;
    
    if (publicationCount > 0) {
      let pubScore = 0;
      if (publicationCount >= 20) {
        pubScore = 25;
      } else if (publicationCount >= 15) {
        pubScore = 20;
      } else if (publicationCount >= 10) {
        pubScore = 15;
      } else if (publicationCount >= 5) {
        pubScore = 10;
      } else {
        pubScore = 5;
      }
      
      result.details.publications = {
        count: publicationCount,
        score: pubScore,
        message: `${publicationCount}편의 연구 논문`
      };
      result.score += pubScore;
    }

    // 2. 연구 프로젝트 평가
    if (data.researchProjects) {
      const projectScore = Math.min(data.researchProjects * 2, 10);
      result.details.projects = {
        count: data.researchProjects,
        score: projectScore,
        message: `${data.researchProjects}개의 연구 프로젝트`
      };
      result.score += projectScore;
    }

    // 3. 학술상 수상 평가
    if (data.academicAwards) {
      const awardScore = Math.min(data.academicAwards * 3, 15);
      result.details.awards = {
        count: data.academicAwards,
        score: awardScore,
        message: `${data.academicAwards}개의 학술상 수상`
      };
      result.score += awardScore;
    }

    result.score = Math.min(result.score, result.maxScore);
    return result;
  }

  /**
   * 초청 교육기관 평가
   */
  async evaluateInvitingInstitution(data) {
    const result = {
      score: 0,
      maxScore: 25,
      details: {}
    };

    // 1. 교육기관 유형 평가
    if (data.institutionType) {
      const typeScores = {
        'university': 25,        // 대학교
        'college': 20,          // 전문대학
        'graduate_school': 23,  // 대학원
        'research_institute': 18, // 연구소
        'academy': 15           // 학원
      };
      const typeScore = typeScores[data.institutionType] || 10;
      result.details.type = {
        type: data.institutionType,
        score: typeScore
      };
      result.score += typeScore;
    }

    result.score = Math.min(result.score, result.maxScore);
    return result;
  }

  /**
   * 연장 신청 - 소득 요건 평가
   */
  async evaluateIncomeRequirement(data) {
    const result = {
      passed: false,
      score: 0,
      details: {},
      required: 0,
      actual: 0
    };

    // 직급에 따른 소득 요건
    const position = data.currentPosition || 'E-1-1';
    result.required = this.incomeRequirements[position] || this.incomeRequirements['E-1-1'];
    result.actual = parseInt(data.annualIncome || data.monthlyIncome * 12) || 0;

    if (result.actual >= result.required) {
      result.passed = true;
      result.score = 100;
      result.details.message = `소득 요건 충족 (${result.actual.toLocaleString()}원/${result.required.toLocaleString()}원)`;
    } else {
      result.score = Math.round((result.actual / result.required) * 100);
      result.details.message = `소득 요건 미달 (${result.actual.toLocaleString()}원/${result.required.toLocaleString()}원)`;
    }

    return result;
  }

  /**
   * 연장 신청 - 납세 실적 평가
   */
  async evaluateTaxPayment(data) {
    const result = {
      passed: true,
      score: 100,
      details: {}
    };

    if (data.taxDelayCount > 0) {
      result.score -= data.taxDelayCount * 10;
      result.details.delays = `납세 지연 ${data.taxDelayCount}회`;
    }

    if (data.taxUnpaid) {
      result.passed = false;
      result.score = 0;
      result.details.unpaid = '미납 세금 존재';
    }

    result.score = Math.max(0, result.score);
    return result;
  }

  /**
   * 기본 자격 요건 평가 (매뉴얼 기준 적용) - 기존 메서드 보존
   */
  async evaluateBasicQualification(data) {
    const result = {
      score: 0,
      maxScore: 23, // 학력(13) + 직위(10)
      details: {},
      qualified: true
    };

    // 1. 학위 요건 (매뉴얼 기준: 5-13점)
    const educationLevel = this.mapEducationLevel(data.highestEducation);
    const educationScores = {
      'DOCTORATE': 13,
      'MASTERS': 13,     // 석사/박사 동일 점수
      'BACHELOR': 10,
      'ASSOCIATE': 7,
      'HIGH_SCHOOL': 5
    };
    
    const eduScore = educationScores[educationLevel] || 5;
    result.details.degree = { 
      score: eduScore, 
      message: this.getEducationMessage(educationLevel, eduScore) 
    };
    result.score += eduScore;
    
    // 최소 16점 필요 - 학사 이상이면 일단 가능성 있음
    if (eduScore < 10) {
      result.qualified = false;
      result.details.degree.message += ' (추가 점수 필요)';
    }

    // 2. 직위/직급 평가 (매뉴얼 기준: 2-10점)
    const positionScore = this.evaluatePosition(data.jobTitle, data.currentOccupation);
    result.details.position = {
      score: positionScore.score,
      message: positionScore.message
    };
    result.score += positionScore.score;

    // 2. 전공 관련성
    if (data.educationField && data.jobTitle) {
      const relevance = this.calculateFieldRelevance(data.educationField, data.jobTitle);
      result.details.relevance = {
        score: relevance * 5,
        message: relevance >= 0.8 ? '전공과 직무 높은 연관성' : '전공-직무 연관성 보통'
      };
      result.score += relevance * 5;
    }

    // 3. 교육기관 적격성
    const institutionType = data.institutionType || 'university';
    const institutionScore = (this.institutionWeights[institutionType] || 0.7) * 5;
    result.details.institution = {
      score: institutionScore,
      message: this.getInstitutionMessage(institutionType)
    };
    result.score += institutionScore;

    return result;
  }

  /**
   * 학술 전문성 심화 평가 (매뉴얼 기준 반영)
   */
  async evaluateAcademicExpertise(data) {
    const result = {
      score: 0,
      maxScore: 12, // 강의경력(5) + 연구직위(7)
      details: {}
    };

    // 1. 강의 경력 (매뉴얼 기준: 1-5점)
    const teachingYears = parseInt(data.yearsOfExperience) || 0;
    let teachingScore = 0;
    let teachingMessage = '';
    
    if (teachingYears >= 5) {
      teachingScore = 5;
      teachingMessage = '5년 이상 강의경력 (최고 점수)';
    } else if (teachingYears >= 3) {
      teachingScore = 3;
      teachingMessage = '3-4년 강의경력';
    } else if (teachingYears >= 1) {
      teachingScore = 1;
      teachingMessage = '1-2년 강의경력';
    } else {
      teachingScore = 0;
      teachingMessage = '강의경력 부족 (최소 1년 필요)';
    }
    
    result.details.teaching = { 
      score: teachingScore, 
      years: teachingYears,
      message: teachingMessage 
    };
    result.score += teachingScore;

    // 2. 연구 직위 평가 (매뉴얼 기준: 2-7점)
    const researchPosition = this.evaluateResearchPosition(data);
    result.details.researchPosition = {
      score: researchPosition.score,
      message: researchPosition.message
    };
    result.score += researchPosition.score;

    // 2. 연구 실적 상세 평가
    const publications = parseInt(data.publicationsCount) || 0;
    let researchScore = 0;
    let researchMessage = '';

    if (publications >= 10) {
      researchScore = 10;
      researchMessage = 'SCI급 논문 10편 이상 - 탁월한 연구 실적';
    } else if (publications >= 5) {
      researchScore = 7;
      researchMessage = '우수한 연구 실적 보유';
    } else if (publications >= 2) {
      researchScore = 4;
      researchMessage = '기본적인 연구 실적 보유';
    } else if (publications === 1) {
      researchScore = 2;
      researchMessage = '최소 연구 실적 보유';
    } else {
      researchScore = 0;
      researchMessage = '연구 실적 보완 필요';
    }

    result.details.research = {
      score: researchScore,
      count: publications,
      message: researchMessage
    };
    result.score += researchScore;

    // 3. 전문 분야 수요도
    const fieldScore = (this.fieldDemand[data.educationField] || 0.8) * 5;
    result.details.fieldDemand = {
      score: fieldScore,
      field: data.educationField,
      message: this.getFieldDemandMessage(data.educationField)
    };
    result.score += fieldScore;

    // 4. 학술 활동 (학회, 세미나 등)
    if (data.academicActivities) {
      const activityScore = Math.min(data.academicActivities * 0.5, 5);
      result.details.activities = {
        score: activityScore,
        message: '활발한 학술 활동 참여'
      };
      result.score += activityScore;
    }

    return result;
  }

  /**
   * 교육기관 적합성 평가
   */
  async evaluateInstitutionFit(data) {
    const result = {
      score: 0,
      maxScore: 15,
      details: {}
    };

    // 1. 초빙 기관 수준
    const institutionPrestige = data.institutionPrestige || 'regular';
    const prestigeScores = {
      'top_tier': 8,      // SKY, KAIST 등
      'high_tier': 6,     // 주요 국립대
      'mid_tier': 4,      // 일반 4년제
      'regular': 2        // 기타
    };
    
    result.details.prestige = {
      score: prestigeScores[institutionPrestige] || 2,
      message: this.getPrestigeMessage(institutionPrestige)
    };
    result.score += result.details.prestige.score;

    // 2. 계약 조건
    const contractMonths = parseInt(data.contractDuration) || 12;
    if (contractMonths >= 24) {
      result.details.contract = {
        score: 4,
        duration: contractMonths,
        message: '2년 이상 장기 계약 - 안정성 우수'
      };
      result.score += 4;
    } else if (contractMonths >= 12) {
      result.details.contract = {
        score: 2,
        duration: contractMonths,
        message: '1년 계약 - 기본 요건 충족'
      };
      result.score += 2;
    }

    // 3. 강의 시수 적정성
    const weeklyHours = parseInt(data.weeklyTeachingHours) || 9;
    if (weeklyHours >= 6 && weeklyHours <= 15) {
      result.details.workload = {
        score: 3,
        hours: weeklyHours,
        message: '적정 강의 시수'
      };
      result.score += 3;
    } else if (weeklyHours < 6) {
      result.details.workload = {
        score: 1,
        hours: weeklyHours,
        message: '최소 주당 6시간 이상 필요'
      };
      result.score += 1;
    }

    return result;
  }

  /**
   * 연구 역량 심화 평가
   */
  async evaluateResearchCapability(data) {
    const result = {
      score: 0,
      maxScore: 15,
      details: {}
    };

    // 1. 논문 질적 평가
    if (data.majorPublications) {
      const hasInternational = data.majorPublications.toLowerCase().includes('sci') || 
                              data.majorPublications.toLowerCase().includes('ssci');
      
      result.details.publicationQuality = {
        score: hasInternational ? 7 : 3,
        message: hasInternational ? '국제 저명 학술지 게재' : '국내 학술지 위주'
      };
      result.score += result.details.publicationQuality.score;
    }

    // 2. 연구 프로젝트 경험
    if (data.researchProjects) {
      const projectScore = Math.min(data.researchProjects * 2, 5);
      result.details.projects = {
        score: projectScore,
        count: data.researchProjects,
        message: `${data.researchProjects}개 연구 프로젝트 수행`
      };
      result.score += projectScore;
    }

    // 3. 특허/저서
    if (data.patents || data.books) {
      const ipScore = Math.min((data.patents || 0) + (data.books || 0) * 2, 3);
      result.details.intellectualProperty = {
        score: ipScore,
        message: '지적재산권 보유'
      };
      result.score += ipScore;
    }

    return result;
  }

  /**
   * 언어 적응력 평가
   */
  async evaluateLanguageAdaptability(data) {
    const result = {
      score: 0,
      maxScore: 10,
      details: {}
    };

    // 1. 한국어 능력
    const koreanLevel = data.koreanProficiency;
    const koreanScores = {
      'native': 5,
      'advanced': 4,
      'intermediate': 2,
      'beginner': 1,
      'none': 0
    };

    result.details.korean = {
      score: koreanScores[koreanLevel] || 0,
      level: koreanLevel,
      message: this.getKoreanLevelMessage(koreanLevel)
    };
    result.score += result.details.korean.score;

    // 2. 영어 능력 (국제화 관련)
    const englishLevel = data.englishProficiency;
    const englishScores = {
      'native': 3,
      'advanced': 3,
      'intermediate': 2,
      'beginner': 1,
      'none': 0
    };

    result.details.english = {
      score: englishScores[englishLevel] || 0,
      level: englishLevel,
      message: '영어 강의 가능 여부'
    };
    result.score += result.details.english.score;

    // 3. 한국 체류/방문 경험
    if (data.previousKoreaExperience) {
      result.details.experience = {
        score: 2,
        message: '한국 체류 경험으로 적응력 입증'
      };
      result.score += 2;
    }

    return result;
  }

  /**
   * 안정성 요인 평가
   */
  async evaluateStabilityFactors(data) {
    const result = {
      score: 0,
      maxScore: 10,
      details: {}
    };

    // 1. 나이 (안정성 지표)
    const age = this.calculateAge(data.birthDate);
    if (age >= 30 && age <= 50) {
      result.details.age = {
        score: 5,
        age: age,
        message: '경력 전성기 연령대'
      };
      result.score += 5;
    } else if (age < 30) {
      result.details.age = {
        score: 3,
        age: age,
        message: '젊은 연구자 - 잠재력 우수'
      };
      result.score += 3;
    } else if (age > 50) {
      result.details.age = {
        score: 4,
        age: age,
        message: '풍부한 경험의 시니어 연구자'
      };
      result.score += 4;
    }

    // 2. 가족 동반 여부
    if (data.familyAccompanying) {
      result.details.family = {
        score: 3,
        message: '가족 동반으로 장기 체류 의향'
      };
      result.score += 3;
    }

    // 3. 재정 능력
    const financialScores = {
      'sufficient': 2,
      'moderate': 1,
      'limited': 0,
      'sponsored': 2
    };

    result.details.financial = {
      score: financialScores[data.financialCapability] || 0,
      message: this.getFinancialMessage(data.financialCapability)
    };
    result.score += result.details.financial.score;

    return result;
  }

  /**
   * 성장 가능성 계산 (실제 점수 향상 가능성 기반)
   */
  async calculateGrowthPotential(data) {
    const factors = [];
    const currentEducation = this.mapEducationLevel(data.highestEducation);
    const currentExperience = parseInt(data.yearsOfExperience) || 0;
    const currentPubs = parseInt(data.publicationsCount) || 0;

    // 1. 학위 향상 가능성 (매뉴얼 기준)
    const educationPotential = {
      'HIGH_SCHOOL': { to: 'BACHELOR', points: 5, time: '4년' },
      'BACHELOR': { to: 'MASTERS', points: 3, time: '2년' },
      'MASTERS': { to: 'DOCTORATE', points: 0, time: '이미 최고점' }, // 석사/박사 동점
      'DOCTORATE': { to: null, points: 0, time: '이미 최고점' }
    };
    
    const eduUpgrade = educationPotential[currentEducation];
    if (eduUpgrade && eduUpgrade.points > 0) {
      factors.push({
        category: 'education',
        potential: Math.round((eduUpgrade.points / 35) * 100), // 100점 환산
        realPoints: eduUpgrade.points,
        timeframe: eduUpgrade.time,
        action: `${eduUpgrade.to === 'DOCTORATE' ? '박사' : eduUpgrade.to === 'MASTERS' ? '석사' : '학사'} 학위 취득`,
        difficulty: 'high'
      });
    }

    // 2. 경력 증대 가능성 (매뉴얼 기준: 최대 5점)
    if (currentExperience < 5) {
      const experienceGap = 5 - currentExperience;
      const experiencePoints = experienceGap >= 4 ? 5 : experienceGap >= 2 ? 3 : 1;
      factors.push({
        category: 'experience',
        potential: Math.round((experiencePoints / 35) * 100),
        realPoints: experiencePoints,
        timeframe: `${experienceGap}년`,
        action: `${experienceGap}년 추가 경력 축적`,
        difficulty: 'medium'
      });
    }

    // 3. 직급 상향 가능성
    const currentTitle = (data.jobTitle || '').toLowerCase();
    let titleUpgrade = null;
    
    if (currentTitle.includes('강사') || currentTitle.includes('lecturer')) {
      titleUpgrade = { to: '조교수', points: 2, time: '2-3년' };
    } else if (currentTitle.includes('조교수') || currentTitle.includes('assistant')) {
      titleUpgrade = { to: '부교수', points: 3, time: '3-5년' };
    } else if (currentTitle.includes('부교수') || currentTitle.includes('associate')) {
      titleUpgrade = { to: '정교수', points: 3, time: '5년+' };
    } else if (currentTitle.includes('연구원') && !currentTitle.includes('수석')) {
      titleUpgrade = { to: '선임/수석연구원', points: 2, time: '3-5년' };
    }
    
    if (titleUpgrade) {
      factors.push({
        category: 'position',
        potential: Math.round((titleUpgrade.points / 35) * 100),
        realPoints: titleUpgrade.points,
        timeframe: titleUpgrade.time,
        action: `${titleUpgrade.to} 승진`,
        difficulty: 'high'
      });
    }

    // 4. 연구 실적 증대 (실질적 계산)
    const researchPotential = currentPubs < 5 ? 3 : currentPubs < 10 ? 2 : 1;
    if (researchPotential > 0) {
      factors.push({
        category: 'research',
        potential: Math.round((researchPotential / 35) * 100),
        realPoints: researchPotential,
        timeframe: '1-2년',
        action: `논문 ${5 - Math.min(currentPubs, 5)}편 추가 게재`,
        difficulty: 'medium'
      });
    }

    // 5. 한국어 능력 향상 (보너스 점수)
    if (data.koreanProficiency !== 'native' && data.koreanProficiency !== 'advanced') {
      factors.push({
        category: 'language',
        potential: 3, // 보너스 점수이므로 적게 책정
        realPoints: 1,
        timeframe: '6개월-1년',
        action: 'TOPIK 4급 이상 취득',
        difficulty: 'medium'
      });
    }

    // 총 성장 가능 점수 (100점 기준)
    const totalPotential = Math.min(
      factors.reduce((sum, f) => sum + f.potential, 0),
      100 - 60 // 현재 점수가 60점 이상이라고 가정
    );

    return {
      totalPotential: Math.round(totalPotential),
      factors: factors,
      priorityActions: this.prioritizeActions(factors)
    };
  }

  /**
   * 리스크 식별
   */
  async identifyRisks(data) {
    const risks = [];

    // 1. 최소 요건 미충족
    if (data.highestEducation === 'bachelor' || !data.highestEducation) {
      risks.push({
        type: 'qualification',
        severity: 'high',
        description: '최소 석사 학위 필요',
        mitigation: '대학원 진학 또는 동등 경력 증명'
      });
    }

    // 2. 경력 부족
    if (parseInt(data.yearsOfExperience) < 2) {
      risks.push({
        type: 'experience',
        severity: 'high',
        description: '2년 이상 교육/연구 경력 필요',
        mitigation: '추가 경력 축적 필요'
      });
    }

    // 3. 온라인 강의 비율
    if (data.onlineTeachingRatio > 0.5) {
      risks.push({
        type: 'teaching_method',
        severity: 'medium',
        description: '온라인 강의 50% 초과',
        mitigation: '오프라인 강의 비중 증대'
      });
    }

    // 4. 근무처 수 제한
    if (data.plannedWorkplaces > 2) {
      risks.push({
        type: 'workplace_limit',
        severity: 'high',
        description: '최대 2개 기관만 가능',
        mitigation: '근무처 수 조정 필요'
      });
    }

    return risks;
  }

  /**
   * 맞춤형 추천사항 생성 (매뉴얼 기준 반영)
   */
  generatePersonalizedRecommendations(evaluation, data) {
    const recommendations = [];
    const totalScore = evaluation.totalScore;
    const manualCheck = evaluation.manualScoreCheck;

    // 매뉴얼 기준 점수 확인
    if (manualCheck && !manualCheck.passed) {
      recommendations.push({
        priority: 'high',
        category: 'manual_requirement',
        message: `출입국 매뉴얼 기준 미달: 현재 ${manualCheck.actualScore}점 (최소 ${manualCheck.minimumRequired}점 필요)`,
        actions: [
          `${manualCheck.minimumRequired - manualCheck.actualScore}점 추가 획득 필요`,
          '학력 향상 또는 경력 증빙으로 점수 보완',
          '직급 상향을 통한 점수 확보'
        ],
        expectedImprovement: manualCheck.minimumRequired - manualCheck.actualScore
      });
    }

    // 점수대별 맞춤 전략
    if (totalScore >= 80 && manualCheck.passed) {
      recommendations.push({
        priority: 'info',
        category: 'general',
        message: '매우 우수한 조건입니다. 즉시 비자 신청 가능합니다.',
        actions: [
          '필수 서류 준비: 학위증명서, 경력증명서, 고용계약서',
          '서류 아포스티유 인증 진행',
          '법무대리인 선임으로 신속한 처리'
        ]
      });
    } else if (totalScore >= 60) {
      recommendations.push({
        priority: 'medium',
        category: 'general',
        message: '기본 자격은 충족하나 경쟁력 강화가 필요합니다.',
        actions: [
          '추가 연구실적 확보 (논문 2-3편)',
          '한국어 능력 향상 (TOPIK 4급 이상)',
          '상위 기관으로 이직 고려'
        ]
      });
    } else {
      recommendations.push({
        priority: 'high',
        category: 'general',
        message: '체계적인 준비가 필요합니다. 단계별 계획을 수립하세요.',
        actions: [
          '최소 학력 요건 충족 (석사 이상)',
          '교육/연구 경력 2년 이상 확보',
          '전문가 상담을 통한 맞춤 전략 수립'
        ]
      });
    }

    // 세부 영역별 추천
    if (evaluation.academicExpertise.details.research.score < 5) {
      recommendations.push({
        priority: 'high',
        category: 'research',
        message: '연구 실적 보완이 시급합니다.',
        actions: [
          '국제 학술지 논문 투고',
          '공동 연구 프로젝트 참여',
          '학회 발표를 통한 실적 구축'
        ],
        expectedImprovement: 10
      });
    }

    if (evaluation.languageAdaptability.details.korean.score < 2) {
      recommendations.push({
        priority: 'medium',
        category: 'language',
        message: '한국어 능력 향상이 필요합니다.',
        actions: [
          'TOPIK 4급 이상 취득 목표',
          '온라인 한국어 강좌 수강',
          '한국 대학 어학당 등록 고려'
        ],
        expectedImprovement: 5
      });
    }

    if (evaluation.basicQualification.details.degree.score < 7) {
      recommendations.push({
        priority: 'high',
        category: 'education',
        message: '학위 수준 향상을 고려하세요.',
        actions: [
          '박사 과정 진학 검토',
          '연구 경력으로 학위 부족 보완',
          '전문 자격증 취득'
        ],
        expectedImprovement: 15
      });
    }

    return recommendations;
  }

  /**
   * 개선 로드맵 생성
   */
  createImprovementRoadmap(evaluation, data) {
    const currentScore = evaluation.totalScore;
    const targetScore = 70; // 안정적 통과 기준
    const gap = Math.max(0, targetScore - currentScore);

    const roadmap = {
      currentStatus: {
        score: currentScore,
        level: this.getScoreLevel(currentScore),
        strengths: this.identifyStrengths(evaluation),
        weaknesses: this.identifyWeaknesses(evaluation)
      },
      targetStatus: {
        score: targetScore,
        timeframe: this.estimateTimeframe(gap),
        feasibility: this.assessFeasibility(evaluation, data)
      },
      phases: []
    };

    // 단계별 계획 수립
    if (gap > 0) {
      // Phase 1: 즉시 실행 가능 (0-3개월)
      roadmap.phases.push({
        phase: 1,
        title: '즉시 실행 단계',
        duration: '0-3개월',
        actions: this.getImmediateActions(evaluation, data),
        expectedGain: Math.min(gap * 0.3, 10)
      });

      // Phase 2: 단기 목표 (3-6개월)
      roadmap.phases.push({
        phase: 2,
        title: '단기 개선 단계',
        duration: '3-6개월',
        actions: this.getShortTermActions(evaluation, data),
        expectedGain: Math.min(gap * 0.4, 15)
      });

      // Phase 3: 중장기 목표 (6-12개월)
      if (gap > 20) {
        roadmap.phases.push({
          phase: 3,
          title: '중장기 발전 단계',
          duration: '6-12개월',
          actions: this.getLongTermActions(evaluation, data),
          expectedGain: gap * 0.3
        });
      }
    }

    return roadmap;
  }

  // === 헬퍼 메소드들 ===

  mapEducationLevel(education) {
    const mapping = {
      'phd': 'DOCTORATE',
      'master': 'MASTERS',
      'bachelor': 'BACHELOR',
      'high_school': 'HIGH_SCHOOL'
    };
    return mapping[education] || education || 'BACHELOR';
  }

  calculateFieldRelevance(educationField, jobTitle) {
    // 간단한 관련성 계산 (실제로는 더 정교한 로직 필요)
    if (!educationField || !jobTitle) return 0.5;
    
    const field = educationField.toLowerCase();
    const job = jobTitle.toLowerCase();
    
    if (field.includes(job) || job.includes(field)) return 1.0;
    
    // 유사 분야 매칭
    const fieldGroups = {
      tech: ['computer', 'software', 'it', 'engineering'],
      science: ['physics', 'chemistry', 'biology', 'science'],
      business: ['business', 'management', 'economics', 'finance'],
      humanities: ['literature', 'history', 'philosophy', 'language']
    };
    
    for (const group of Object.values(fieldGroups)) {
      if (group.some(term => field.includes(term)) && 
          group.some(term => job.includes(term))) {
        return 0.8;
      }
    }
    
    return 0.5;
  }

  getInstitutionMessage(type) {
    const messages = {
      'university': '4년제 대학 - 적격 기관',
      'junior_college': '전문대학 - 적격 기관',
      'graduate_school': '대학원 - 우수 적격 기관',
      'research_institute': '연구기관 - 적격 기관',
      'special_school': '특수학교 - 조건부 적격',
      'international_school': '외국인학교 - 조건부 적격',
      'other': '기타 기관 - 추가 검토 필요'
    };
    return messages[type] || '기관 유형 확인 필요';
  }

  getFieldDemandMessage(field) {
    const messages = {
      'engineering': '공학 분야 - 높은 수요',
      'natural_science': '자연과학 - 높은 수요',
      'medicine': '의학 분야 - 안정적 수요',
      'economics': '경제학 - 보통 수요',
      'business': '경영학 - 보통 수요',
      'humanities': '인문학 - 제한적 수요',
      'arts': '예술 분야 - 제한적 수요'
    };
    return messages[field] || '해당 분야 수요 확인 필요';
  }

  getPrestigeMessage(level) {
    const messages = {
      'top_tier': '최상위권 대학 - 매우 유리',
      'high_tier': '상위권 대학 - 유리',
      'mid_tier': '중위권 대학 - 보통',
      'regular': '일반 대학 - 기본'
    };
    return messages[level] || '일반 교육기관';
  }

  getKoreanLevelMessage(level) {
    const messages = {
      'native': '원어민 수준 - 완벽한 의사소통',
      'advanced': 'TOPIK 5-6급 - 학술 강의 가능',
      'intermediate': 'TOPIK 3-4급 - 일상 소통 가능',
      'beginner': 'TOPIK 1-2급 - 기초 수준',
      'none': '한국어 학습 필요'
    };
    return messages[level] || '한국어 능력 확인 필요';
  }

  getFinancialMessage(capability) {
    const messages = {
      'sufficient': '충분한 재정 능력',
      'moderate': '적정 수준의 재정 능력',
      'limited': '제한적 재정 - 보완 필요',
      'sponsored': '기관 후원 - 안정적'
    };
    return messages[capability] || '재정 능력 확인 필요';
  }

  calculateAge(birthDate) {
    if (!birthDate) return 35; // 기본값
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  calculateDetailedScore(evaluation) {
    const scoreBreakdown = {
      categories: {},
      manualScore: 0,
      manualMaxScore: 0,
      bonusScore: 0,
      bonusMaxScore: 0,
      totalScore: 0,
      details: {}
    };

    // 1. 매뉴얼 기준 점수 (학력 + 직위 + 경력)
    const manualCategories = {
      basicQualification: { name: '기본자격(학력/직위)', weight: 1 },
      academicExpertise: { name: '경력/연구', weight: 1 }
    };

    for (const [key, info] of Object.entries(manualCategories)) {
      if (evaluation[key]) {
        const score = evaluation[key].score || 0;
        const maxScore = evaluation[key].maxScore || 0;
        scoreBreakdown.manualScore += score;
        scoreBreakdown.manualMaxScore += maxScore;
        scoreBreakdown.categories[key] = {
          name: info.name,
          score: score,
          maxScore: maxScore,
          percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
        };
      }
    }

    // 2. 추가 평가 점수 (기관적합성, 언어능력 등)
    const bonusCategories = {
      institutionFit: { name: '기관적합성', weight: 0.8 },
      researchCapability: { name: '연구역량', weight: 1 },
      languageAdaptability: { name: '언어능력', weight: 0.7 },
      stabilityFactors: { name: '안정성', weight: 0.5 }
    };

    for (const [key, info] of Object.entries(bonusCategories)) {
      if (evaluation[key]) {
        const score = evaluation[key].score || 0;
        const maxScore = evaluation[key].maxScore || 0;
        const weightedScore = score * info.weight;
        const weightedMaxScore = maxScore * info.weight;
        
        scoreBreakdown.bonusScore += weightedScore;
        scoreBreakdown.bonusMaxScore += weightedMaxScore;
        scoreBreakdown.categories[key] = {
          name: info.name,
          score: score,
          maxScore: maxScore,
          weightedScore: Math.round(weightedScore * 10) / 10,
          percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
        };
      }
    }

    // 3. 100점 만점으로 정규화
    // 매뉴얼 점수: 16점 이상이면 기본 60점, 추가점은 비례 계산
    const manualMinimum = 16;
    let normalizedManualScore = 0;
    
    if (scoreBreakdown.manualScore >= manualMinimum) {
      // 기본 60점 + 추가점수
      normalizedManualScore = 60 + ((scoreBreakdown.manualScore - manualMinimum) / (scoreBreakdown.manualMaxScore - manualMinimum)) * 20;
    } else {
      // 16점 미만이면 비례 계산
      normalizedManualScore = (scoreBreakdown.manualScore / manualMinimum) * 60;
    }

    // 보너스 점수는 20점 만점으로 정규화
    const normalizedBonusScore = scoreBreakdown.bonusMaxScore > 0 
      ? (scoreBreakdown.bonusScore / scoreBreakdown.bonusMaxScore) * 20 
      : 0;

    // 최종 점수
    scoreBreakdown.totalScore = Math.round(normalizedManualScore + normalizedBonusScore);
    
    // 매뉴얼 기준 통과 여부
    scoreBreakdown.manualScoreCheck = {
      actualScore: scoreBreakdown.manualScore,
      minimumRequired: manualMinimum,
      passed: scoreBreakdown.manualScore >= manualMinimum,
      message: scoreBreakdown.manualScore >= manualMinimum ? 
        `매뉴얼 기준 통과 (${scoreBreakdown.manualScore}/${manualMinimum}점)` : 
        `매뉴얼 기준 미달 (${scoreBreakdown.manualScore}/${manualMinimum}점)`
    };

    // 점수 구성 상세
    scoreBreakdown.details = {
      manualPoints: Math.round(normalizedManualScore),
      bonusPoints: Math.round(normalizedBonusScore),
      growthPotential: evaluation.growthPotential?.totalPotential || 0
    };

    return scoreBreakdown;
  }

  // 기존 calculateWeightedScore는 calculateDetailedScore로 대체
  calculateWeightedScore(evaluation) {
    return this.calculateDetailedScore(evaluation).totalScore;
  }

  getScoreLevel(score) {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 50) return 'poor';
    return 'very_poor';
  }

  identifyStrengths(evaluation) {
    const strengths = [];
    
    for (const [category, data] of Object.entries(evaluation)) {
      if (data.score && data.maxScore) {
        const percentage = (data.score / data.maxScore) * 100;
        if (percentage >= 80) {
          strengths.push({
            category,
            score: data.score,
            percentage: Math.round(percentage)
          });
        }
      }
    }
    
    return strengths.sort((a, b) => b.percentage - a.percentage);
  }

  identifyWeaknesses(evaluation) {
    const weaknesses = [];
    
    for (const [category, data] of Object.entries(evaluation)) {
      if (data.score !== undefined && data.maxScore) {
        const percentage = (data.score / data.maxScore) * 100;
        if (percentage < 60) {
          weaknesses.push({
            category,
            score: data.score,
            percentage: Math.round(percentage),
            gap: data.maxScore - data.score
          });
        }
      }
    }
    
    return weaknesses.sort((a, b) => a.percentage - b.percentage);
  }

  estimateTimeframe(gap) {
    if (gap <= 10) return '1-3개월';
    if (gap <= 20) return '3-6개월';
    if (gap <= 30) return '6-12개월';
    return '12개월 이상';
  }

  assessFeasibility(evaluation, data) {
    const age = this.calculateAge(data.birthDate);
    const hasPhd = data.highestEducation === 'phd';
    
    if (age < 60 && (hasPhd || data.yearsOfExperience >= 5)) {
      return 'high';
    } else if (age < 65 && data.yearsOfExperience >= 2) {
      return 'medium';
    }
    return 'low';
  }

  prioritizeActions(factors) {
    return factors
      .sort((a, b) => {
        // 난이도가 낮고 효과가 큰 것 우선
        const scoreA = a.potential / (a.difficulty === 'low' ? 1 : a.difficulty === 'medium' ? 2 : 3);
        const scoreB = b.potential / (b.difficulty === 'low' ? 1 : b.difficulty === 'medium' ? 2 : 3);
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }

  getImmediateActions(evaluation, data) {
    const actions = [];

    // 서류 준비
    actions.push({
      task: '필수 서류 준비',
      details: '학위증명서 아포스티유, 경력증명서, 범죄경력증명서',
      impact: 'low',
      effort: 'medium'
    });

    // 한국어 학습
    if (evaluation.languageAdaptability.details.korean.score < 3) {
      actions.push({
        task: '한국어 학습 시작',
        details: '온라인 한국어 과정 등록, TOPIK 시험 준비',
        impact: 'medium',
        effort: 'medium'
      });
    }

    // 추천서 확보
    actions.push({
      task: '추천서 확보',
      details: '현 소속 기관장, 지도교수, 동료 교수 추천서',
      impact: 'medium',
      effort: 'low'
    });

    return actions;
  }

  getShortTermActions(evaluation, data) {
    const actions = [];

    // 연구 실적
    if (evaluation.researchCapability.score < 10) {
      actions.push({
        task: '연구 실적 향상',
        details: '진행 중인 논문 완성, 학회 발표 신청',
        impact: 'high',
        effort: 'high'
      });
    }

    // 한국어 능력
    if (evaluation.languageAdaptability.details.korean.score < 4) {
      actions.push({
        task: 'TOPIK 시험 응시',
        details: '최소 4급 이상 취득 목표',
        impact: 'medium',
        effort: 'medium'
      });
    }

    // 네트워킹
    actions.push({
      task: '한국 학계 네트워킹',
      details: '관련 학회 가입, 한국 교수진과 교류',
      impact: 'medium',
      effort: 'medium'
    });

    return actions;
  }

  getLongTermActions(evaluation, data) {
    const actions = [];

    // 학위 향상
    if (!data.highestEducation || data.highestEducation !== 'phd') {
      actions.push({
        task: '박사 학위 취득',
        details: '한국 또는 해외 박사 과정 진학',
        impact: 'very_high',
        effort: 'very_high'
      });
    }

    // 연구 프로젝트
    actions.push({
      task: '대형 연구 프로젝트 참여',
      details: '국제 공동 연구, 정부 지원 과제 참여',
      impact: 'high',
      effort: 'high'
    });

    // 저서 출간
    actions.push({
      task: '전문 저서 출간',
      details: '전공 분야 교재 또는 학술서 집필',
      impact: 'high',
      effort: 'very_high'
    });

    return actions;
  }

  /**
   * 직위/직급 평가 헬퍼 (매뉴얼 기준)
   */
  evaluatePosition(jobTitle, occupation) {
    const title = (jobTitle || occupation || '').toLowerCase();
    
    // 교수 직급 (매뉴얼 기준)
    if (title.includes('교수') || title.includes('professor')) {
      if (title.includes('정교수') || title.includes('full')) {
        return { score: 10, message: '정교수 (최고 직급)' };
      } else if (title.includes('부교수') || title.includes('associate')) {
        return { score: 7, message: '부교수' };
      } else if (title.includes('조교수') || title.includes('assistant')) {
        return { score: 4, message: '조교수' };
      } else {
        return { score: 2, message: '시간강사/강사' };
      }
    }
    
    // 연구원 직급
    if (title.includes('연구') || title.includes('research')) {
      if (title.includes('수석') || title.includes('senior') || title.includes('principal')) {
        return { score: 7, message: '수석연구원' };
      } else if (title.includes('선임') || title.includes('lead')) {
        return { score: 4, message: '선임연구원' };
      } else {
        return { score: 2, message: '연구원' };
      }
    }
    
    // 기타 교육 관련 직위
    if (title.includes('lecturer') || title.includes('instructor')) {
      return { score: 2, message: '강사' };
    }
    
    return { score: 0, message: '직위 확인 필요' };
  }

  /**
   * 연구 직위 평가 헬퍼
   */
  evaluateResearchPosition(data) {
    // 연구 경력과 실적을 바탕으로 연구 직위 추정
    const years = parseInt(data.yearsOfExperience) || 0;
    const publications = parseInt(data.publicationsCount) || 0;
    
    if (years >= 10 && publications >= 20) {
      return { score: 7, message: '수석연구원급 경력' };
    } else if (years >= 5 && publications >= 10) {
      return { score: 4, message: '선임연구원급 경력' };
    } else if (years >= 2 || publications >= 3) {
      return { score: 2, message: '연구원급 경력' };
    }
    
    return { score: 0, message: '연구 경력 부족' };
  }

  /**
   * 학력 메시지 헬퍼
   */
  getEducationMessage(level, score) {
    const messages = {
      'DOCTORATE': `박사학위 (${score}점)`,
      'MASTERS': `석사학위 (${score}점)`,
      'BACHELOR': `학사학위 (${score}점)`,
      'ASSOCIATE': `전문학사 (${score}점)`,
      'HIGH_SCHOOL': `고등학교 졸업 (${score}점)`
    };
    return messages[level] || `학력 확인 필요 (${score}점)`;
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
}

module.exports = E1DetailedEvaluator;