/**
 * 연장 신청 전략
 * EXTENSION 타입 비자 신청 평가 로직
 */

const BaseStrategy = require('./BaseStrategy');
const logger = require('../../../../../utils/logger');

class ExtensionStrategy extends BaseStrategy {
  constructor(configManager, ruleEngine) {
    super(configManager, ruleEngine);
  }

  /**
   * 연장 신청 평가 실행
   */
  async evaluate(context) {
    logger.info(`연장 신청 평가 시작: ${context.visaType}`);

    try {
      const evaluationResults = {
        scores: {},
        validations: [],
        recommendations: [],
        requiredDocuments: []
      };

      // 1. 체류 이력 평가 (40%)
      const stayHistoryResult = await this.evaluateStayHistory(context);
      evaluationResults.scores.stayHistory = {
        score: stayHistoryResult.score,
        weight: 40,
        details: stayHistoryResult
      };

      // 2. 활동 실적 평가 (30%)
      const performanceResult = await this.evaluatePerformance(context);
      evaluationResults.scores.performance = {
        score: performanceResult.score,
        weight: 30,
        details: performanceResult
      };

      // 3. 계약 연속성 평가 (20%)
      const continuityResult = await this.evaluateContinuity(context);
      evaluationResults.scores.continuity = {
        score: continuityResult.score,
        weight: 20,
        details: continuityResult
      };

      // 4. 문서 평가 (10%)
      const documentResult = await this.evaluateDocuments(context);
      evaluationResults.scores.documents = {
        score: documentResult.score,
        weight: 10,
        details: documentResult
      };

      // 5. 연장 한도 확인
      const extensionLimit = await this.checkExtensionLimit(context);
      if (!extensionLimit.allowed) {
        evaluationResults.blocked = true;
        evaluationResults.blockReason = extensionLimit.reason;
      }

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
      logger.error('연장 신청 평가 중 오류:', error);
      throw error;
    }
  }

  /**
   * 체류 이력 평가
   */
  async evaluateStayHistory(context) {
    const { data } = context;
    const stayHistory = data.stayHistory || {};
    
    const result = {
      score: 100,
      details: {
        violations: [],
        positiveFactors: [],
        negativeFactors: []
      }
    };

    // 위반 사항 확인
    if (stayHistory.violations && stayHistory.violations.length > 0) {
      for (const violation of stayHistory.violations) {
        const penalty = this.calculateViolationPenalty(violation);
        result.score -= penalty;
        result.details.violations.push({
          type: violation.type,
          date: violation.date,
          penalty
        });
      }
    }

    // 긍정적 요소
    if (stayHistory.taxPayments && stayHistory.taxPayments.consistent) {
      result.score += 10;
      result.details.positiveFactors.push('성실한 납세 이력');
    }

    if (stayHistory.socialContribution) {
      result.score += 5;
      result.details.positiveFactors.push('사회 기여 활동');
    }

    // 출입국 기록
    if (stayHistory.departureCount > 0) {
      const avgStayPeriod = stayHistory.totalDays / stayHistory.departureCount;
      if (avgStayPeriod < 30) {
        result.score -= 10;
        result.details.negativeFactors.push('잦은 출입국');
      }
    }

    // 점수 정규화
    result.score = Math.max(0, Math.min(100, result.score));

    return result;
  }

  /**
   * 활동 실적 평가
   */
  async evaluatePerformance(context) {
    const { visaType, data } = context;
    const performance = data.performance || {};
    
    let result = {
      score: 0,
      details: {}
    };

    switch (visaType) {
      case 'E-1': // 교수
        result = await this.evaluateAcademicPerformance(performance);
        break;
      
      case 'E-2': // 회화지도
        result = await this.evaluateTeachingPerformance(performance);
        break;
      
      case 'E-7': // 특정활동
        result = await this.evaluateProfessionalPerformance(performance);
        break;
      
      case 'D-2': // 유학
        result = await this.evaluateStudentPerformance(performance);
        break;
      
      default:
        result = await this.evaluateGeneralPerformance(performance);
    }

    return result;
  }

  /**
   * 계약 연속성 평가
   */
  async evaluateContinuity(context) {
    const { data } = context;
    const result = {
      score: 100,
      details: {
        contractGaps: [],
        employerChanges: 0,
        salaryProgression: 'STABLE'
      }
    };

    // 계약 공백 확인
    if (data.employmentHistory) {
      const gaps = this.findEmploymentGaps(data.employmentHistory);
      result.details.contractGaps = gaps;
      
      // 공백 기간에 따른 감점
      for (const gap of gaps) {
        if (gap.days > 30) {
          result.score -= 20;
        } else if (gap.days > 14) {
          result.score -= 10;
        }
      }

      // 고용주 변경 횟수
      result.details.employerChanges = data.employmentHistory.length - 1;
      if (result.details.employerChanges > 2) {
        result.score -= 15;
      }
    }

    // 급여 진행 상황
    if (data.salaryHistory) {
      const progression = this.analyzeSalaryProgression(data.salaryHistory);
      result.details.salaryProgression = progression;
      
      if (progression === 'INCREASING') {
        result.score += 10;
      } else if (progression === 'DECREASING') {
        result.score -= 10;
      }
    }

    // 현재 계약 상태
    if (data.currentContract) {
      if (data.currentContract.remainingMonths < 3) {
        result.score -= 15;
        result.details.warning = '계약 만료 임박';
      }
    }

    result.score = Math.max(0, Math.min(100, result.score));
    return result;
  }

  /**
   * 연장 한도 확인
   */
  async checkExtensionLimit(context) {
    const { visaType, data } = context;
    const extensionCount = data.previousExtensions || 0;

    // 비자별 최대 연장 횟수
    const limits = {
      'E-1': 5,
      'E-2': 5,
      'E-7': 3,
      'D-2': 4,
      'D-4': 2
    };

    const limit = limits[visaType] || 3;

    if (extensionCount >= limit) {
      return {
        allowed: false,
        reason: `최대 연장 횟수(${limit}회) 초과`,
        currentCount: extensionCount,
        maxLimit: limit
      };
    }

    // 총 체류 기간 확인
    const totalStayYears = data.totalStayMonths / 12;
    const maxStayYears = {
      'E-1': 10,
      'E-2': 10,
      'E-7': 5,
      'D-2': 6
    };

    const maxYears = maxStayYears[visaType] || 5;
    
    if (totalStayYears >= maxYears) {
      return {
        allowed: false,
        reason: `최대 체류 기간(${maxYears}년) 초과`,
        currentYears: totalStayYears,
        maxYears
      };
    }

    return {
      allowed: true,
      remainingExtensions: limit - extensionCount,
      remainingYears: maxYears - totalStayYears
    };
  }

  /**
   * 위반 사항 벌점 계산
   */
  calculateViolationPenalty(violation) {
    const penalties = {
      OVERSTAY: 30,
      ILLEGAL_EMPLOYMENT: 40,
      CRIMINAL_RECORD: 50,
      TAX_DELINQUENCY: 20,
      INSURANCE_VIOLATION: 15,
      ADDRESS_UNREPORTED: 10
    };

    return penalties[violation.type] || 10;
  }

  /**
   * 학술 활동 실적 평가 (E-1) - 체류민원 매뉴얼 기반
   */
  async evaluateAcademicPerformance(performance) {
    const result = {
      score: 0,
      details: {},
      complianceIssues: []
    };

    // 1. 교육기관에서의 교수 활동 실적 (40점)
    if (performance.coursesTaught) {
      result.details.coursesTaught = performance.coursesTaught;
      // 연간 강의 과목 수에 따른 점수
      if (performance.coursesTaught >= 6) {
        result.score += 40;
      } else if (performance.coursesTaught >= 4) {
        result.score += 30;
      } else if (performance.coursesTaught >= 2) {
        result.score += 20;
      } else if (performance.coursesTaught >= 1) {
        result.score += 10;
      }
    }

    // 2. 연구 실적 (30점)
    if (performance.publications) {
      result.details.publications = performance.publications;
      // 연간 논문 게재 수에 따른 점수
      if (performance.publications >= 5) {
        result.score += 30;
      } else if (performance.publications >= 3) {
        result.score += 25;
      } else if (performance.publications >= 2) {
        result.score += 20;
      } else if (performance.publications >= 1) {
        result.score += 15;
      }
    }

    // 3. 학생 지도 및 학술 활동 (20점)
    if (performance.studentsSupervised) {
      result.details.studentsSupervised = performance.studentsSupervised;
      result.score += Math.min(performance.studentsSupervised * 3, 20);
    }

    // 4. 출석률 및 근무 성실성 (10점) - 체류민원 매뉴얼 준수사항
    if (performance.attendanceRate >= 0.95) {
      result.score += 10;
      result.details.attendanceNote = '우수한 출석률';
    } else if (performance.attendanceRate >= 0.90) {
      result.score += 7;
      result.details.attendanceNote = '양호한 출석률';
    } else if (performance.attendanceRate >= 0.80) {
      result.score += 5;
      result.details.attendanceNote = '보통 출석률';
      result.complianceIssues.push('출석률 개선 필요');
    } else {
      result.score += 0;
      result.details.attendanceNote = '출석률 미흡';
      result.complianceIssues.push('출석률 심각하게 미흡 - 연장 위험');
    }

    // 5. 체류자격 준수 여부 확인
    if (performance.unauthorizedWork) {
      result.complianceIssues.push('체류자격외 활동 위반');
      result.score *= 0.5; // 50% 감점
    }

    if (performance.addressNotReported) {
      result.complianceIssues.push('주소 신고 의무 미이행');
      result.score -= 10;
    }

    result.score = Math.max(0, Math.min(100, result.score));
    return result;
  }

  /**
   * 교육 활동 실적 평가 (E-2)
   */
  async evaluateTeachingPerformance(performance) {
    const result = {
      score: 0,
      details: {}
    };

    // 주당 수업 시간 (40점)
    if (performance.weeklyHours >= 15) {
      result.score += 40;
    } else if (performance.weeklyHours >= 10) {
      result.score += 30;
    } else if (performance.weeklyHours >= 6) {
      result.score += 20;
    }

    // 학생 평가 (30점)
    if (performance.studentEvaluation >= 4.5) {
      result.score += 30;
    } else if (performance.studentEvaluation >= 4.0) {
      result.score += 20;
    } else if (performance.studentEvaluation >= 3.5) {
      result.score += 10;
    }

    // 출석률 (20점)
    if (performance.attendanceRate >= 0.95) {
      result.score += 20;
    } else if (performance.attendanceRate >= 0.90) {
      result.score += 10;
    }

    // 추가 활동 (10점)
    if (performance.extraActivities) {
      result.score += 10;
    }

    return result;
  }

  /**
   * 고용 공백 찾기
   */
  findEmploymentGaps(employmentHistory) {
    const gaps = [];
    
    for (let i = 1; i < employmentHistory.length; i++) {
      const prevEnd = new Date(employmentHistory[i-1].endDate);
      const nextStart = new Date(employmentHistory[i].startDate);
      
      const gapDays = Math.floor((nextStart - prevEnd) / (1000 * 60 * 60 * 24));
      
      if (gapDays > 0) {
        gaps.push({
          from: employmentHistory[i-1].endDate,
          to: employmentHistory[i].startDate,
          days: gapDays
        });
      }
    }
    
    return gaps;
  }

  /**
   * 급여 추이 분석
   */
  analyzeSalaryProgression(salaryHistory) {
    if (salaryHistory.length < 2) return 'STABLE';
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < salaryHistory.length; i++) {
      if (salaryHistory[i].amount > salaryHistory[i-1].amount) {
        increasing++;
      } else if (salaryHistory[i].amount < salaryHistory[i-1].amount) {
        decreasing++;
      }
    }
    
    if (increasing > decreasing) return 'INCREASING';
    if (decreasing > increasing) return 'DECREASING';
    return 'STABLE';
  }

  /**
   * 연장 신청 특화 추천사항
   */
  generateRecommendations(evaluationResults, context) {
    const recommendations = super.generateRecommendations(evaluationResults, context);

    // 연장 한도 관련
    if (evaluationResults.blocked) {
      recommendations.push({
        type: 'CRITICAL',
        priority: 'CRITICAL',
        message: evaluationResults.blockReason,
        action: 'CONSIDER_VISA_CHANGE'
      });
    }

    // 활동 실적 개선
    if (evaluationResults.scores.performance?.score < 60) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        message: '활동 실적을 개선하세요. 다음 연장 시 중요한 평가 요소입니다.',
        action: 'IMPROVE_PERFORMANCE'
      });
    }

    // 계약 갱신
    const continuityDetails = evaluationResults.scores.continuity?.details;
    if (continuityDetails?.warning) {
      recommendations.push({
        type: 'CONTRACT',
        priority: 'HIGH',
        message: continuityDetails.warning,
        action: 'RENEW_CONTRACT'
      });
    }

    return recommendations;
  }

  /**
   * 일반 활동 실적 평가
   */
  async evaluateGeneralPerformance(performance) {
    const result = {
      score: 50, // 기본 점수
      details: {}
    };

    // 근무 성실성
    if (performance.attendanceRate >= 0.95) {
      result.score += 20;
    }

    // 업무 평가
    if (performance.evaluation === 'EXCELLENT') {
      result.score += 30;
    } else if (performance.evaluation === 'GOOD') {
      result.score += 20;
    }

    return result;
  }

  /**
   * 전문직 활동 실적 평가 (E-7)
   */
  async evaluateProfessionalPerformance(performance) {
    const result = {
      score: 0,
      details: {}
    };

    // 프로젝트 수행 (40점)
    if (performance.projectsCompleted) {
      result.score += Math.min(performance.projectsCompleted * 10, 40);
    }

    // 기술 기여도 (30점)
    if (performance.technicalContribution === 'HIGH') {
      result.score += 30;
    } else if (performance.technicalContribution === 'MEDIUM') {
      result.score += 20;
    }

    // 팀워크 (20점)
    if (performance.teamworkScore >= 4) {
      result.score += 20;
    } else if (performance.teamworkScore >= 3) {
      result.score += 10;
    }

    // 자격증 취득 (10점)
    if (performance.newCertifications > 0) {
      result.score += 10;
    }

    return result;
  }

  /**
   * 학생 성적 평가 (D-2)
   */
  async evaluateStudentPerformance(performance) {
    const result = {
      score: 0,
      details: {}
    };

    // GPA (40점)
    if (performance.gpa >= 4.0) {
      result.score += 40;
    } else if (performance.gpa >= 3.5) {
      result.score += 30;
    } else if (performance.gpa >= 3.0) {
      result.score += 20;
    } else if (performance.gpa >= 2.5) {
      result.score += 10;
    }

    // 출석률 (30점)
    if (performance.attendanceRate >= 0.90) {
      result.score += 30;
    } else if (performance.attendanceRate >= 0.80) {
      result.score += 20;
    } else if (performance.attendanceRate >= 0.70) {
      result.score += 10;
    }

    // 학업 진척도 (20점)
    if (performance.creditsCompleted >= performance.creditsRequired * 0.9) {
      result.score += 20;
    } else if (performance.creditsCompleted >= performance.creditsRequired * 0.7) {
      result.score += 10;
    }

    // 한국어 능력 (10점)
    if (performance.topikLevel >= 4) {
      result.score += 10;
    } else if (performance.topikLevel >= 3) {
      result.score += 5;
    }

    return result;
  }
}

module.exports = ExtensionStrategy;