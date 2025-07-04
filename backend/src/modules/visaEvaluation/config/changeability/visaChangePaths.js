/**
 * 비자 변경 가능 경로 및 조건 정의
 * 경로: /backend/src/modules/visaEvaluation/config/changeability/visaChangePaths.js
 */

/**
 * 비자 변경 매트릭스
 * 출발 비자에서 목표 비자로의 변경 가능성과 조건을 정의
 */
const VISA_CHANGE_MATRIX = {
  // === 🎓 학생 비자 (D-2) ===
  'D-2': {
    allowed: ['E-1', 'E-2', 'E-3', 'E-7', 'D-10', 'F-2', 'F-6'],
    conditions: {
      'E-1': {
        education: 'master',
        requirement: '석사 이상 학위 또는 박사 수료',
        jobOffer: true,
        restrictions: ['학위 취득 또는 수료 후 가능', '교육기관 채용 확정'],
        difficulty: 'MEDIUM',
        successRate: 75,
        alternatives: ['graduation_certificate', 'completion_certificate']
      },
      'E-2': {
        education: 'bachelor',
        nationality: 'E2_COUNTRIES',
        requirement: '학사 학위 + 영어권 국적',
        restrictions: ['영어권 국가 국적자만 가능', '학위 취득 후'],
        difficulty: 'EASY',
        successRate: 85
      },
      'E-7': {
        education: 'bachelor',
        jobOffer: true,
        salary: 'GNI_80',
        requirement: '학사 학위 + 전문직 취업',
        restrictions: ['전공 관련 분야', '최소 급여 기준 충족'],
        difficulty: 'MEDIUM',
        successRate: 70
      },
      'D-10': {
        requirement: '구직 목적',
        restrictions: ['졸업 예정 또는 졸업 직후'],
        difficulty: 'EASY',
        successRate: 95
      },
      'F-2': {
        residencePeriod: 24,
        points: 80,
        requirement: '점수제 80점 이상',
        restrictions: ['점수제 요건 충족', '2년 이상 체류'],
        difficulty: 'HARD',
        successRate: 45
      }
    }
  },

  // === 🔍 구직 비자 (D-10) ===
  'D-10': {
    allowed: ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-9', 'F-2'],
    conditions: {
      'E-1': {
        education: 'master',
        jobOffer: true,
        requirement: '석사 + 교육기관 채용',
        restrictions: ['대학 또는 연구기관'],
        difficulty: 'MEDIUM',
        successRate: 80
      },
      'E-2': {
        education: 'bachelor',
        nationality: 'E2_COUNTRIES',
        requirement: '학사 + 영어권 국적',
        restrictions: ['영어 회화지도 분야'],
        difficulty: 'EASY',
        successRate: 90
      },
      'E-7': {
        education: 'bachelor',
        jobOffer: true,
        salary: 'GNI_80',
        requirement: '학사 + 전문직 취업',
        restrictions: ['전문 기술 분야'],
        difficulty: 'EASY',
        successRate: 85
      },
      'E-9': {
        requirement: '단순 기능직',
        restrictions: ['지정 업종 내'],
        difficulty: 'MEDIUM',
        successRate: 60
      },
      'F-2': {
        points: 80,
        requirement: '점수제 80점 이상',
        restrictions: ['점수제 요건 충족'],
        difficulty: 'HARD',
        successRate: 50
      }
    }
  },

  // === 🎯 회화지도 비자 (E-2) ===
  'E-2': {
    allowed: ['E-1', 'E-7', 'F-2', 'F-5'],
    conditions: {
      'E-1': {
        education: 'master',
        experience: 3,
        requirement: '석사 + 3년 교육경력',
        restrictions: ['대학 교원 자격 필요'],
        difficulty: 'MEDIUM',
        successRate: 70
      },
      'E-7': {
        jobOffer: true,
        salary: 'GNI_80',
        requirement: '전문직 취업 제안',
        restrictions: ['교육 관련 전문 분야'],
        difficulty: 'MEDIUM',
        successRate: 65
      },
      'F-2': {
        residencePeriod: 36,
        points: 80,
        requirement: '3년 체류 + 점수제',
        restrictions: ['점수제 요건 충족'],
        difficulty: 'HARD',
        successRate: 55
      },
      'F-5': {
        residencePeriod: 60,
        points: 120,
        requirement: '5년 체류 + 고득점',
        restrictions: ['영주권 요건 충족'],
        difficulty: 'VERY_HARD',
        successRate: 30
      }
    }
  },

  // === 💼 특정활동 비자 (E-7) ===
  'E-7': {
    allowed: ['E-7', 'F-2', 'F-5', 'D-8', 'D-9'],
    conditions: {
      'E-7': {
        requirement: '동일 분야 연장',
        restrictions: ['활동 분야 유지'],
        difficulty: 'EASY',
        successRate: 90
      },
      'F-2': {
        residencePeriod: 36,
        income: 'GNI_2X',
        requirement: '3년 체류 + 고소득',
        restrictions: ['점수제 또는 숙련기능인력'],
        difficulty: 'MEDIUM',
        successRate: 75
      },
      'F-5': {
        residencePeriod: 60,
        income: 'GNI_2X',
        requirement: '5년 체류 + 고소득',
        restrictions: ['영주권 요건 충족'],
        difficulty: 'HARD',
        successRate: 60
      },
      'D-8': {
        investment: 100000000,
        businessPlan: true,
        requirement: '1억원 투자 + 사업계획',
        restrictions: ['사업계획서 승인 필요'],
        difficulty: 'HARD',
        successRate: 40
      },
      'D-9': {
        businessPlan: true,
        requirement: '기술창업 계획',
        restrictions: ['기술창업 요건 충족'],
        difficulty: 'HARD',
        successRate: 45
      }
    }
  },

  // === 👨‍👩‍👧‍👦 거주 비자 (F-2) ===
  'F-2': {
    allowed: ['F-5', 'E-7', 'D-8', 'D-9'],
    conditions: {
      'F-5': {
        residencePeriod: 24,
        points: 120,
        requirement: '2년 체류 + 고득점',
        restrictions: ['영주권 요건 충족'],
        difficulty: 'MEDIUM',
        successRate: 70
      },
      'E-7': {
        jobOffer: true,
        salary: 'GNI_80',
        requirement: '전문직 취업',
        restrictions: ['전문 기술 분야'],
        difficulty: 'EASY',
        successRate: 85
      },
      'D-8': {
        investment: 100000000,
        businessPlan: true,
        requirement: '1억원 투자',
        restrictions: ['투자 조건 충족'],
        difficulty: 'MEDIUM',
        successRate: 65
      }
    }
  },

  // === 🏠 결혼이민 비자 (F-6) ===
  'F-6': {
    allowed: ['F-5'],
    conditions: {
      'F-5': {
        residencePeriod: 24,
        marriageDuration: 24,
        requirement: '2년 혼인 + 2년 체류',
        restrictions: ['혼인 관계 유지'],
        difficulty: 'EASY',
        successRate: 90
      }
    }
  },

  // === 🔧 비전문취업 비자 (E-9) ===
  'E-9': {
    allowed: ['F-4', 'E-7'],
    conditions: {
      'F-4': {
        residencePeriod: 36,
        requirement: '3년 이상 체류',
        restrictions: ['한국계 외국인'],
        difficulty: 'MEDIUM',
        successRate: 70
      },
      'E-7': {
        education: 'bachelor',
        experience: 3,
        requirement: '학위 + 숙련 기술',
        restrictions: ['기술 향상 증명'],
        difficulty: 'HARD',
        successRate: 45
      }
    }
  },

  // === 🏭 방문취업 비자 (H-2) ===
  'H-2': {
    allowed: ['F-4', 'E-9'],
    conditions: {
      'F-4': {
        requirement: '한국계 중국인/구소련',
        restrictions: ['출신 국가 조건'],
        difficulty: 'MEDIUM',
        successRate: 75
      },
      'E-9': {
        experience: 3,
        requirement: '3년 이상 경력',
        restrictions: ['숙련 기능 증명'],
        difficulty: 'MEDIUM',
        successRate: 60
      }
    }
  }
};

/**
 * 변경 불가능한 조합
 */
const PROHIBITED_CHANGES = {
  from: ['A-1', 'A-2', 'A-3', 'C-1', 'C-3', 'C-4'],
  to: ['A-1', 'A-2', 'A-3', 'C-1', 'C-3', 'C-4'],
  reason: '외교·공무·단기 체류 비자는 변경 불가'
};

/**
 * 변경 난이도 정의
 */
const CHANGE_DIFFICULTY = {
  VERY_EASY: { score: 95, description: '매우 쉬움', color: 'green' },
  EASY: { score: 85, description: '쉬움', color: 'lightgreen' },
  MEDIUM: { score: 70, description: '보통', color: 'yellow' },
  HARD: { score: 50, description: '어려움', color: 'orange' },
  VERY_HARD: { score: 30, description: '매우 어려움', color: 'red' }
};

/**
 * 급여 기준 정의
 */
const SALARY_STANDARDS = {
  GNI_80: 2800000,    // 1인당 국민총소득 80% (약 280만원)
  GNI_100: 3500000,   // 1인당 국민총소득 100% (약 350만원)
  GNI_2X: 7000000     // 1인당 국민총소득 2배 (약 700만원)
};

/**
 * 변경 가능성 확인 함수
 */
function checkChangeability(currentVisa, targetVisa) {
  // 금지된 변경인지 확인
  if (PROHIBITED_CHANGES.from.includes(currentVisa) || 
      PROHIBITED_CHANGES.to.includes(targetVisa)) {
    return {
      possible: false,
      reason: PROHIBITED_CHANGES.reason,
      alternatives: []
    };
  }

  const changeInfo = VISA_CHANGE_MATRIX[currentVisa];
  
  if (!changeInfo || !changeInfo.allowed.includes(targetVisa)) {
    return {
      possible: false,
      reason: `${currentVisa}에서 ${targetVisa}로 직접 변경이 불가능합니다.`,
      alternatives: suggestAlternativePaths(currentVisa, targetVisa)
    };
  }

  const conditions = changeInfo.conditions[targetVisa];
  
  return {
    possible: true,
    conditions,
    difficulty: CHANGE_DIFFICULTY[conditions.difficulty],
    successRate: conditions.successRate,
    requirements: conditions.requirement,
    restrictions: conditions.restrictions
  };
}

/**
 * 대안 경로 제안 함수
 */
function suggestAlternativePaths(currentVisa, targetVisa) {
  const alternatives = [];
  
  // 모든 가능한 중간 비자 찾기
  const currentOptions = VISA_CHANGE_MATRIX[currentVisa];
  if (currentOptions) {
    currentOptions.allowed.forEach(intermediateVisa => {
      const intermediateOptions = VISA_CHANGE_MATRIX[intermediateVisa];
      if (intermediateOptions && intermediateOptions.allowed.includes(targetVisa)) {
        alternatives.push({
          path: `${currentVisa} → ${intermediateVisa} → ${targetVisa}`,
          description: `${intermediateVisa}를 거쳐 ${targetVisa}로 변경`,
          totalDifficulty: 'MEDIUM'
        });
      }
    });
  }

  // 직접 경로가 없는 경우 일반적인 대안
  if (alternatives.length === 0) {
    alternatives.push({
      path: `${currentVisa} → 출국 → ${targetVisa} 신규 신청`,
      description: '출국 후 신규 신청',
      totalDifficulty: 'HARD'
    });
    
    // D-10을 거치는 경로 (가능한 경우)
    if (currentVisa !== 'D-10' && VISA_CHANGE_MATRIX['D-10']?.allowed.includes(targetVisa)) {
      alternatives.push({
        path: `${currentVisa} → D-10 → ${targetVisa}`,
        description: '구직비자를 거쳐 변경',
        totalDifficulty: 'MEDIUM'
      });
    }
  }

  return alternatives;
}

/**
 * 조건 충족 여부 확인 함수
 */
function checkConditionsMet(conditions, applicantData) {
  const result = {
    allMet: true,
    met: [],
    unmet: [],
    score: 100
  };

  if (!conditions) return result;

  // 학력 조건 확인
  if (conditions.education) {
    const hasEducation = checkEducationLevel(
      applicantData.educationLevel, 
      conditions.education
    );
    
    if (hasEducation) {
      result.met.push(`학력 요건: ${conditions.education}`);
    } else {
      result.unmet.push(`학력 요건 미충족: ${conditions.education} 필요`);
      result.allMet = false;
      result.score -= 30;
    }
  }

  // 경력 조건 확인
  if (conditions.experience) {
    const hasExperience = (applicantData.experienceYears || 0) >= conditions.experience;
    
    if (hasExperience) {
      result.met.push(`경력 요건: ${conditions.experience}년`);
    } else {
      result.unmet.push(`경력 요건 미충족: ${conditions.experience}년 필요`);
      result.allMet = false;
      result.score -= 25;
    }
  }

  // 취업 제안 확인
  if (conditions.jobOffer) {
    if (applicantData.hasJobOffer) {
      result.met.push('취업 제안서 보유');
    } else {
      result.unmet.push('취업 제안서 필요');
      result.allMet = false;
      result.score -= 40;
    }
  }

  // 급여 조건 확인
  if (conditions.salary) {
    const requiredSalary = SALARY_STANDARDS[conditions.salary];
    const currentSalary = applicantData.salary || 0;
    
    if (currentSalary >= requiredSalary) {
      result.met.push(`급여 조건: ${requiredSalary.toLocaleString()}원 이상`);
    } else {
      result.unmet.push(`급여 조건 미충족: ${requiredSalary.toLocaleString()}원 필요`);
      result.allMet = false;
      result.score -= 20;
    }
  }

  // 체류 기간 조건 확인
  if (conditions.residencePeriod) {
    const stayDuration = applicantData.stayDurationMonths || 0;
    
    if (stayDuration >= conditions.residencePeriod) {
      result.met.push(`체류 기간: ${conditions.residencePeriod}개월 이상`);
    } else {
      result.unmet.push(`체류 기간 부족: ${conditions.residencePeriod}개월 필요`);
      result.allMet = false;
      result.score -= 35;
    }
  }

  // 점수제 조건 확인
  if (conditions.points) {
    const currentPoints = applicantData.f2Points || 0;
    
    if (currentPoints >= conditions.points) {
      result.met.push(`점수제: ${conditions.points}점 이상`);
    } else {
      result.unmet.push(`점수제 미달: ${conditions.points}점 필요`);
      result.allMet = false;
      result.score -= 50;
    }
  }

  result.score = Math.max(0, result.score);
  return result;
}

/**
 * 학력 레벨 확인 함수
 */
function checkEducationLevel(actual, required) {
  const levels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];
  const actualIndex = levels.indexOf(actual);
  const requiredIndex = levels.indexOf(required);
  
  return actualIndex >= requiredIndex && actualIndex !== -1;
}

/**
 * 성공률 기반 추천 점수 계산
 */
function calculateRecommendationScore(currentVisa, targetVisa, applicantData) {
  const changeInfo = checkChangeability(currentVisa, targetVisa);
  
  if (!changeInfo.possible) {
    return { score: 0, recommendation: 'NOT_RECOMMENDED' };
  }

  const conditionsResult = checkConditionsMet(changeInfo.conditions, applicantData);
  const baseScore = changeInfo.successRate;
  const conditionsPenalty = (100 - conditionsResult.score) * 0.5;
  
  const finalScore = Math.max(0, baseScore - conditionsPenalty);
  
  let recommendation = 'NOT_RECOMMENDED';
  if (finalScore >= 80) recommendation = 'HIGHLY_RECOMMENDED';
  else if (finalScore >= 60) recommendation = 'RECOMMENDED';
  else if (finalScore >= 40) recommendation = 'CONDITIONAL';
  
  return {
    score: Math.round(finalScore),
    recommendation,
    conditionsMet: conditionsResult.allMet,
    difficulty: changeInfo.difficulty.description
  };
}

module.exports = {
  VISA_CHANGE_MATRIX,
  PROHIBITED_CHANGES,
  CHANGE_DIFFICULTY,
  SALARY_STANDARDS,
  checkChangeability,
  suggestAlternativePaths,
  checkConditionsMet,
  checkEducationLevel,
  calculateRecommendationScore
}; 