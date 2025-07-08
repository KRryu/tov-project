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
    
    // 프론트엔드에서 전달한 데이터 구조 확인
    const evaluationData = context.data.evaluation || context.data;
    logger.info(`전체 데이터 구조:`, JSON.stringify(context.data, null, 2));
    logger.info(`평가 데이터 구조:`, JSON.stringify(evaluationData, null, 2));

    try {
      const evaluationResults = {
        scores: {},
        validations: [],
        recommendations: [],
        requiredDocuments: []
      };

      // 1. 체류 이력 평가 (40점 만점)
      const stayHistoryResult = await this.evaluateStayHistory(context);
      const stayHistoryScore = Math.round((stayHistoryResult.score / 100) * 40);
      evaluationResults.scores.stayHistory = {
        score: stayHistoryScore,
        maxScore: 40,
        weight: 40,
        percentage: stayHistoryResult.score, // 100점 만점 기준 백분율
        details: stayHistoryResult
      };

      // 2. 활동 실적 평가 (30점 만점)
      const performanceResult = await this.evaluatePerformance(context);
      const performanceScore = Math.round((performanceResult.score / 100) * 30);
      evaluationResults.scores.performance = {
        score: performanceScore,
        maxScore: 30,
        weight: 30,
        percentage: performanceResult.score, // 100점 만점 기준 백분율
        details: performanceResult
      };

      // 3. 계약 연속성 평가 (20점 만점)
      const continuityResult = await this.evaluateContinuity(context);
      const continuityScore = Math.round((continuityResult.score / 100) * 20);
      evaluationResults.scores.continuity = {
        score: continuityScore,
        maxScore: 20,
        weight: 20,
        percentage: continuityResult.score, // 100점 만점 기준 백분율
        details: continuityResult
      };
      
      // contractContinuity도 동일한 결과로 매핑 (프론트엔드 호환성)
      evaluationResults.scores.contractContinuity = {
        score: continuityScore,
        maxScore: 20,
        weight: 20,
        percentage: continuityResult.score, // 100점 만점 기준 백분율
        details: continuityResult
      };

      // 4. 문서 평가 (10점 만점)
      const documentResult = await this.evaluateDocuments(context);
      const documentScore = Math.round((documentResult.score / 100) * 10);
      evaluationResults.scores.documents = {
        score: documentScore,
        maxScore: 10,
        weight: 10,
        percentage: documentResult.score, // 100점 만점 기준 백분율
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

      // 7. 최종 점수 계산 (단순 합산)
      const finalScore = 
        evaluationResults.scores.stayHistory.score +
        evaluationResults.scores.performance.score +
        evaluationResults.scores.continuity.score +
        evaluationResults.scores.documents.score;
      
      evaluationResults.finalScore = finalScore;

      // 8. 추천사항 생성
      evaluationResults.recommendations = this.generateRecommendations(evaluationResults, context);

      // 9. 필수 문서 목록
      evaluationResults.requiredDocuments = await this.getRequiredDocuments(context);

      // 10. 결과 로깅
      this.logEvaluationResult(context, evaluationResults);

      // 11. 프론트엔드가 기대하는 구조로 변환
      const formattedResult = {
        ...evaluationResults,
        score: evaluationResults.finalScore,
        eligible: evaluationResults.finalScore >= 70,
        details: evaluationResults.scores,  // scores를 details에도 매핑
        evaluationDetails: {
          scores: evaluationResults.scores,
          applicationType: 'EXTENSION',
          details: evaluationResults.scores
        },
        applicationType: 'EXTENSION'
      };

      logger.info('연장 평가 최종 결과:', {
        finalScore: evaluationResults.finalScore,
        breakdown: {
          stayHistory: `${evaluationResults.scores.stayHistory.score}점 (${evaluationResults.scores.stayHistory.percentage}%)`,
          performance: `${evaluationResults.scores.performance.score}점 (${evaluationResults.scores.performance.percentage}%)`,
          continuity: `${evaluationResults.scores.continuity.score}점 (${evaluationResults.scores.continuity.percentage}%)`,
          documents: `${evaluationResults.scores.documents.score}점 (${evaluationResults.scores.documents.percentage}%)`
        },
        percentages: {
          stayHistory: evaluationResults.scores.stayHistory.percentage,
          performance: evaluationResults.scores.performance.percentage,
          continuity: evaluationResults.scores.continuity.percentage,
          documents: evaluationResults.scores.documents.percentage
        }
      });

      // 프론트엔드 디버깅용 상세 로그
      logger.info('프론트엔드 전달 데이터 구조:', {
        'details.contractContinuity': evaluationResults.scores.contractContinuity,
        'details.continuity': evaluationResults.scores.continuity,
        'details.documents': evaluationResults.scores.documents,
        'details.stayHistory': evaluationResults.scores.stayHistory,
        'details.performance': evaluationResults.scores.performance
      });

      return formattedResult;

    } catch (error) {
      logger.error('연장 신청 평가 중 오류:', error);
      throw error;
    }
  }

  /**
   * 체류 이력 평가
   */
  async evaluateStayHistory(context) {
    const evaluationData = context.data.evaluation || context.data;
    const stayHistory = evaluationData.stayHistory || {};
    
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
    const { visaType } = context;
    const evaluationData = context.data.evaluation || context.data;
    const performance = evaluationData.performance || {};
    
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
    const evaluationData = context.data.evaluation || context.data;
    logger.info('계약 연속성 평가 시작:', {
      contractContinuity: evaluationData.contractContinuity,
      employmentHistory: evaluationData.employmentHistory
    });
    
    const result = {
      score: 100,
      details: {
        contractGaps: [],
        employerChanges: 0,
        salaryProgression: 'STABLE',
        messages: []
      }
    };

    // contractContinuity 구조에서 데이터 추출
    const contractData = evaluationData.contractContinuity || {};
    
    // 1. 현재 계약 상태 평가
    if (contractData.currentContract) {
      const remainingMonths = contractData.currentContract.remainingMonths || 12;
      
      if (remainingMonths >= 12) {
        result.details.messages.push(`계약 잔여기간 ${remainingMonths}개월 - 안정적 (보너스 +10점)`);
        result.score += 10;
      } else if (remainingMonths >= 6) {
        result.details.messages.push(`계약 잔여기간 ${remainingMonths}개월 - 양호`);
      } else if (remainingMonths >= 3) {
        result.details.messages.push(`계약 잔여기간 ${remainingMonths}개월 - 주의 (-5점)`);
        result.score -= 5;
      } else {
        result.details.messages.push(`계약 잔여기간 ${remainingMonths}개월 - 위험 (-15점)`);
        result.score -= 15;
        result.details.warning = '계약 만료 임박';
      }
    }

    // 2. 고용주 변경 횟수 평가
    const employerChanges = contractData.employerChangeCount || 0;
    result.details.employerChanges = employerChanges;
    
    if (employerChanges === 0) {
      result.details.messages.push('직장 변경 없음 - 안정적 (보너스 +10점)');
      result.score += 10;
    } else if (employerChanges === 1) {
      result.details.messages.push('직장 변경 1회 - 보통');
    } else if (employerChanges === 2) {
      result.details.messages.push('직장 변경 2회 - 주의 (-10점)');
      result.score -= 10;
    } else {
      result.details.messages.push(`직장 변경 ${employerChanges}회 - 불안정 (-20점)`);
      result.score -= 20;
    }

    // 3. 계약 공백 기간 평가
    const contractGaps = contractData.contractGaps || 0;
    if (contractGaps > 0) {
      if (contractGaps > 90) {
        result.details.messages.push(`계약 공백 ${contractGaps}일 - 심각 (-25점)`);
        result.score -= 25;
      } else if (contractGaps > 30) {
        result.details.messages.push(`계약 공백 ${contractGaps}일 - 주의 (-15점)`);
        result.score -= 15;
      } else if (contractGaps > 7) {
        result.details.messages.push(`계약 공백 ${contractGaps}일 - 경미 (-5점)`);
        result.score -= 5;
      }
    } else {
      result.details.messages.push('계약 공백 없음 - 연속성 우수');
    }

    // 4. 급여 변화 추이 평가
    const salaryProgression = contractData.salaryProgression || 'stable';
    result.details.salaryProgression = salaryProgression.toUpperCase();
    
    if (salaryProgression === 'increasing') {
      result.details.messages.push('급여 상승 추세 - 긍정적 (보너스 +10점)');
      result.score += 10;
    } else if (salaryProgression === 'stable') {
      result.details.messages.push('급여 안정적 유지 - 양호');
    } else if (salaryProgression === 'decreasing') {
      result.details.messages.push('급여 하락 추세 - 우려 (-10점)');
      result.score -= 10;
    }

    // 5. 현재 고용 기간 평가
    if (contractData.employmentHistory && contractData.employmentHistory.length > 0) {
      const currentJob = contractData.employmentHistory[0];
      const employmentLength = currentJob.lengthMonths || 12;
      
      if (employmentLength >= 24) {
        result.details.messages.push(`현재 직장 ${employmentLength}개월 근무 - 장기 안정 (보너스 +5점)`);
        result.score += 5;
      } else if (employmentLength >= 12) {
        result.details.messages.push(`현재 직장 ${employmentLength}개월 근무 - 안정적`);
      } else if (employmentLength >= 6) {
        result.details.messages.push(`현재 직장 ${employmentLength}개월 근무 - 보통`);
      } else {
        result.details.messages.push(`현재 직장 ${employmentLength}개월 근무 - 단기 (-5점)`);
        result.score -= 5;
      }
    }

    result.score = Math.max(0, Math.min(100, result.score));
    
    logger.info('계약 연속성 평가 완료:', {
      finalScore: result.score,
      employerChanges,
      contractGaps,
      salaryProgression,
      messages: result.details.messages
    });
    
    return result;
  }

  /**
   * 문서 평가 (준비도 평가로 변경)
   */
  async evaluateDocuments(context) {
    const evaluationData = context.data.evaluation || context.data;
    
    // 상세한 디버깅 로그 추가
    logger.info('🔍 문서 평가 시작 - 전체 context:', {
      contextKeys: Object.keys(context),
      dataKeys: Object.keys(context.data || {}),
      evaluationKeys: Object.keys(evaluationData || {}),
      hasSubmittedDocuments: !!evaluationData.submittedDocuments,
      submittedDocuments: evaluationData.submittedDocuments
    });
    
    logger.info('🔍 문서 평가 상세 분석:', { 
      evaluationDataStructure: JSON.stringify(evaluationData, null, 2),
      submittedDocsType: typeof evaluationData.submittedDocuments,
      submittedDocsValue: evaluationData.submittedDocuments 
    });
    
    const result = {
      score: 0,
      details: {
        submitted: false,
        missing: [],
        checked: [],
        messages: []
      }
    };

    // 프론트엔드에서 체크박스로 선택한 문서들
    const submittedDocs = evaluationData.submittedDocuments || {};
    
    logger.info('🔍 제출된 문서 분석:', {
      submittedDocs,
      submittedDocsKeys: Object.keys(submittedDocs),
      submittedDocsValues: Object.values(submittedDocs)
    });
    
    // 필수 문서 목록과 점수
    const documentScores = {
      'employment_cert': 20,    // 재직증명서
      'income_cert': 15,        // 소득금액증명원
      'passport_copy': 15,      // 여권사본
      'alien_reg': 15,          // 외국인등록증
      'tax_payment': 15,        // 납세증명서
      'health_insurance': 10,   // 건강보험납부확인서
      'contract_copy': 10       // 고용계약서 사본
    };

    const documentNames = {
      'employment_cert': '재직증명서',
      'income_cert': '소득금액증명원',
      'passport_copy': '여권사본',
      'alien_reg': '외국인등록증',
      'tax_payment': '납세증명서',
      'health_insurance': '건강보험납부확인서',
      'contract_copy': '고용계약서사본'
    };

    // 체크된 문서들의 점수 합산
    let totalScore = 0;
    
    for (const [docId, score] of Object.entries(documentScores)) {
      const isChecked = submittedDocs[docId];
      logger.info(`📄 문서 체크: ${docId} = ${isChecked} (${typeof isChecked})`);
      
      if (isChecked) {
        totalScore += score;
        result.details.checked.push(docId);
        result.details.messages.push(`${documentNames[docId]} 준비완료 (+${score}점)`);
        logger.info(`✅ ${documentNames[docId]} 체크됨 - ${score}점 추가`);
      } else {
        result.details.missing.push(docId);
        result.details.messages.push(`${documentNames[docId]} 준비필요 (${score}점)`);
        logger.info(`❌ ${documentNames[docId]} 미체크 - 점수 없음`);
      }
    }

    // 최소 필수 문서 확인
    const essentialDocs = ['employment_cert', 'income_cert', 'passport_copy', 'alien_reg'];
    const hasAllEssential = essentialDocs.every(doc => submittedDocs[doc]);
    
    result.details.submitted = hasAllEssential;
    result.details.essentialComplete = hasAllEssential;
    
    // 필수 문서 완료 시 보너스
    if (hasAllEssential) {
      result.details.messages.push('필수 문서 모두 준비 완료');
    } else {
      result.details.messages.push('필수 문서 중 일부 미준비');
    }

    result.score = Math.min(100, totalScore);
    
    logger.info('📊 문서 평가 완료:', {
      totalScore: result.score,
      checkedCount: result.details.checked.length,
      missingCount: result.details.missing.length,
      essentialComplete: hasAllEssential,
      checkedDocs: result.details.checked,
      missingDocs: result.details.missing,
      messages: result.details.messages
    });
    
    return result;
  }

  /**
   * 연장 한도 확인
   */
  async checkExtensionLimit(context) {
    const { visaType } = context;
    const evaluationData = context.data.evaluation || context.data;
    const extensionCount = evaluationData.previousExtensions || evaluationData.stayHistory?.previousExtensions || 0;

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
    const totalStayMonths = evaluationData.totalStayMonths || evaluationData.stayHistory?.totalStayMonths || 0;
    const totalStayYears = totalStayMonths / 12;
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
    logger.info('E-1 활동 실적 평가 시작:', performance);
    
    const result = {
      score: 0,
      details: {},
      complianceIssues: []
    };

    // 1. 교육기관에서의 교수 활동 실적 (40점)
    const coursesTaught = performance.coursesTaught || 0;
    if (coursesTaught > 0) {
      result.details.coursesTaught = coursesTaught;
      // 연간 강의 과목 수에 따른 점수
      if (coursesTaught >= 6) {
        result.score += 40;
        result.details.coursesMessage = `${coursesTaught}과목 담당 - 우수 (40점)`;
      } else if (coursesTaught >= 4) {
        result.score += 30;
        result.details.coursesMessage = `${coursesTaught}과목 담당 - 양호 (30점)`;
      } else if (coursesTaught >= 2) {
        result.score += 20;
        result.details.coursesMessage = `${coursesTaught}과목 담당 - 보통 (20점)`;
      } else if (coursesTaught >= 1) {
        result.score += 10;
        result.details.coursesMessage = `${coursesTaught}과목 담당 - 최소 (10점)`;
      }
    } else {
      result.details.coursesMessage = '담당 과목 없음 (0점)';
      result.complianceIssues.push('교수 활동 실적 부족');
    }

    // 2. 연구 실적 (30점)
    const publications = performance.publications || 0;
    if (publications > 0) {
      result.details.publications = publications;
      // 연간 논문 게재 수에 따른 점수
      if (publications >= 5) {
        result.score += 30;
        result.details.researchMessage = `논문 ${publications}편 - 탁월 (30점)`;
      } else if (publications >= 3) {
        result.score += 25;
        result.details.researchMessage = `논문 ${publications}편 - 우수 (25점)`;
      } else if (publications >= 2) {
        result.score += 20;
        result.details.researchMessage = `논문 ${publications}편 - 양호 (20점)`;
      } else {
        result.score += 15;
        result.details.researchMessage = `논문 ${publications}편 - 보통 (15점)`;
      }
    } else {
      result.details.researchMessage = '연구 실적 없음 (0점)';
    }

    // 3. 학생 지도 및 학술 활동 (20점)
    const studentsSupervised = performance.studentsSupervised || 0;
    if (studentsSupervised > 0) {
      result.details.studentsSupervised = studentsSupervised;
      const supervisionScore = Math.min(studentsSupervised * 3, 20);
      result.score += supervisionScore;
      result.details.supervisionMessage = `${studentsSupervised}명 지도 - ${supervisionScore}점`;
    } else {
      result.details.supervisionMessage = '학생 지도 없음 (0점)';
    }

    // 4. 출석률 및 근무 성실성 (10점) - 체류민원 매뉴얼 준수사항
    const attendanceRate = performance.attendanceRate || 0.95;
    if (attendanceRate >= 0.95) {
      result.score += 10;
      result.details.attendanceNote = `출석률 ${Math.round(attendanceRate * 100)}% - 우수 (10점)`;
    } else if (attendanceRate >= 0.90) {
      result.score += 7;
      result.details.attendanceNote = `출석률 ${Math.round(attendanceRate * 100)}% - 양호 (7점)`;
    } else if (attendanceRate >= 0.80) {
      result.score += 5;
      result.details.attendanceNote = `출석률 ${Math.round(attendanceRate * 100)}% - 보통 (5점)`;
      result.complianceIssues.push('출석률 개선 필요');
    } else {
      result.score += 0;
      result.details.attendanceNote = `출석률 ${Math.round(attendanceRate * 100)}% - 미흡 (0점)`;
      result.complianceIssues.push('출석률 심각하게 미흡 - 연장 위험');
    }

    // 5. 추가 활동 점수 (보너스)
    if (performance.extraActivities) {
      result.score += 5;
      result.details.extraMessage = '추가 학술 활동 참여 (+5점)';
    }

    // 6. 체류자격 준수 여부 확인
    if (performance.unauthorizedWork) {
      result.complianceIssues.push('체류자격외 활동 위반');
      result.score *= 0.5; // 50% 감점
    }

    if (performance.addressNotReported) {
      result.complianceIssues.push('주소 신고 의무 미이행');
      result.score -= 10;
    }

    result.score = Math.max(0, Math.min(100, result.score));
    
    logger.info('E-1 활동 실적 평가 완료:', {
      coursesTaught,
      publications,
      studentsSupervised,
      attendanceRate,
      finalScore: result.score,
      details: result.details
    });
    
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