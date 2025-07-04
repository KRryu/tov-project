/**
 * E-1 비자 사전심사 서비스
 * 매뉴얼 기반 즉시 평가 및 사전 스크리닝
 * 경로: /backend/src/modules/visaEvaluation/core/services/E1PreScreeningService.js
 */

const { POSITION_QUALIFICATION_MATRIX, INSTITUTION_ELIGIBILITY, EXCLUSION_CONDITIONS } = require('../../config/eligibility/e1Eligibility');
const { NATIONALITY_SPECIFIC_DOCUMENTS } = require('../../config/documents/e1Documents');
const { VISA_CHANGE_MATRIX } = require('../../config/changeability/visaChangePaths');

class E1PreScreeningService {
  constructor() {
    this.immediateRejectReasons = [];
    this.remediableIssues = [];
    this.processingTimeFactors = [];
  }

  /**
   * 사전심사 수행
   */
  async performPreScreening(applicantData) {
    const {
      applicationType,
      nationality,
      educationLevel,
      experienceYears,
      position,
      institutionType,
      weeklyHours,
      currentVisa,
      criminalRecord,
      healthStatus
    } = applicantData;

    // 1. 즉시 거부 사유 체크
    const immediateRejectionReasons = this.checkImmediateRejection(applicantData);
    
    // 2. 보완 가능 사항 체크
    const remediableIssues = this.checkRemediableIssues(applicantData);
    
    // 3. 예상 처리 시간 계산
    const processingTime = this.estimateProcessingTime(applicantData);
    
    // 4. 성공 가능성 예측
    const successProbability = this.predictSuccessProbability(applicantData, immediateRejectionReasons, remediableIssues);
    
    // 5. 행동 계획 생성
    const actionPlan = this.generateActionPlan(remediableIssues);

    return {
      passPreScreening: immediateRejectionReasons.length === 0,
      immediateRejectionReasons,
      remediableIssues,
      estimatedProcessingTime: processingTime,
      successProbability,
      recommendedActions: actionPlan,
      riskFactors: this.identifyRiskFactors(applicantData),
      timeline: this.generateTimeline(actionPlan),
      alternatives: immediateRejectionReasons.length > 0 ? this.suggestAlternatives(applicantData) : []
    };
  }

  /**
   * 즉시 거부 사유 체크
   */
  checkImmediateRejection(applicantData) {
    const reasons = [];
    const { educationLevel, position, institutionType, nationality, criminalRecord, currentVisa } = applicantData;

    // 1. 교육기관 부적격
    if (INSTITUTION_ELIGIBILITY.ineligible.institutions.some(inst => inst.code === institutionType)) {
      reasons.push({
        code: 'INELIGIBLE_INSTITUTION',
        severity: 'CRITICAL',
        message: '비적격 교육기관 - E-1 비자 발급 불가',
        solution: '적격 교육기관으로 이직 필요'
      });
    }

    // 2. 직급별 최소 자격 미달
    const positionReq = POSITION_QUALIFICATION_MATRIX[position];
    if (positionReq && positionReq[institutionType]) {
      const requirement = positionReq[institutionType];
      
      if (!this.checkEducationLevel(educationLevel, requirement.minimumDegree)) {
        reasons.push({
          code: 'INSUFFICIENT_EDUCATION',
          severity: 'CRITICAL',
          message: `${position} 직급 최소 학력 요건 미달 (필요: ${requirement.minimumDegree})`,
          solution: `${requirement.minimumDegree} 이상 학위 취득 필요`
        });
      }
    }

    // 3. 범죄 경력 (해당 국가)
    if (NATIONALITY_SPECIFIC_DOCUMENTS.criminal_record_required.countries.includes(nationality) && criminalRecord === true) {
      reasons.push({
        code: 'CRIMINAL_RECORD',
        severity: 'CRITICAL', 
        message: '범죄 경력으로 인한 입국 금지',
        solution: '법적 상담 후 재신청 고려'
      });
    }

    // 4. 비자 변경 불가능한 케이스
    if (applicantData.applicationType === 'CHANGE') {
      const changeInfo = VISA_CHANGE_MATRIX[currentVisa];
      if (!changeInfo || !changeInfo.allowed.includes('E-1')) {
        reasons.push({
          code: 'INVALID_VISA_CHANGE',
          severity: 'CRITICAL',
          message: `${currentVisa}에서 E-1으로 직접 변경 불가능`,
          solution: '출국 후 신규 신청 또는 중간 비자를 통한 변경'
        });
      }
    }

    // 5. 건강상 문제
    if (applicantData.healthStatus === 'UNFIT') {
      reasons.push({
        code: 'HEALTH_ISSUES',
        severity: 'CRITICAL',
        message: '건강진단서 결과 부적격',
        solution: '치료 후 재검진 필요'
      });
    }

    return reasons;
  }

  /**
   * 보완 가능 사항 체크
   */
  checkRemediableIssues(applicantData) {
    const issues = [];
    const { 
      weeklyHours, 
      onlinePercentage, 
      contractDuration, 
      salary,
      languageScores,
      publications,
      recommendations
    } = applicantData;

    // 1. 강의시수 부족
    if (weeklyHours < 6) {
      issues.push({
        code: 'INSUFFICIENT_TEACHING_HOURS',
        severity: 'HIGH',
        category: 'CONTRACT',
        message: `주당 강의시수 부족 (현재: ${weeklyHours}시간, 최소: 6시간)`,
        solution: '계약서 수정하여 주당 6시간 이상으로 조정',
        timeToResolve: '1-2주',
        difficulty: 'EASY'
      });
    }

    // 2. 온라인 강의 비율 초과
    if (onlinePercentage > 50) {
      issues.push({
        code: 'EXCESSIVE_ONLINE_TEACHING',
        severity: 'HIGH',
        category: 'CONTRACT',
        message: `온라인 강의 비율 초과 (현재: ${onlinePercentage}%, 최대: 50%)`,
        solution: '온라인 강의 비율을 50% 이하로 조정',
        timeToResolve: '2-3주',
        difficulty: 'MEDIUM'
      });
    }

    // 3. 계약기간 문제
    if (contractDuration < 12) {
      issues.push({
        code: 'SHORT_CONTRACT_DURATION',
        severity: 'MEDIUM',
        category: 'CONTRACT',
        message: `계약기간이 짧음 (현재: ${contractDuration}개월)`,
        solution: '최소 1년 이상 계약으로 조정 권장',
        timeToResolve: '1주',
        difficulty: 'EASY'
      });
    }

    // 4. 언어능력 부족
    if (!languageScores?.korean || languageScores.korean < 'TOPIK_3') {
      issues.push({
        code: 'LOW_KOREAN_PROFICIENCY',
        severity: 'MEDIUM',
        category: 'LANGUAGE',
        message: '한국어 능력 증빙 부족',
        solution: 'TOPIK 3급 이상 취득 권장',
        timeToResolve: '2-3개월',
        difficulty: 'MEDIUM'
      });
    }

    // 5. 연구실적 부족
    if (!publications || publications.length < 3) {
      issues.push({
        code: 'INSUFFICIENT_RESEARCH',
        severity: 'LOW',
        category: 'QUALIFICATION',
        message: '연구실적 부족',
        solution: '논문, 저서, 학회발표 등 연구실적 보완',
        timeToResolve: '3-6개월',
        difficulty: 'HARD'
      });
    }

    // 6. 추천서 부족
    if (!recommendations || recommendations.length === 0) {
      issues.push({
        code: 'NO_RECOMMENDATIONS',
        severity: 'LOW',
        category: 'DOCUMENTATION',
        message: '추천서 없음',
        solution: '대학 총장, 학장 등의 추천서 확보',
        timeToResolve: '1-2주',
        difficulty: 'EASY'
      });
    }

    return issues;
  }

  /**
   * 예상 처리 시간 계산
   */
  estimateProcessingTime(applicantData) {
    let baseTime = 15; // 기본 15일
    let factors = [];

    const { applicationType, nationality, institutionType, documentQuality } = applicantData;

    // 신청 유형별 조정
    switch (applicationType) {
      case 'NEW':
        baseTime = 20;
        factors.push('신규 신청으로 인한 추가 검토 시간');
        break;
      case 'EXTENSION':
        baseTime = 10;
        factors.push('연장 신청으로 단축 처리');
        break;
      case 'CHANGE':
        baseTime = 25;
        factors.push('변경 신청으로 인한 상세 검토');
        break;
    }

    // 국적별 조정
    if (NATIONALITY_SPECIFIC_DOCUMENTS.criminal_record_required.countries.includes(nationality)) {
      baseTime += 5;
      factors.push('범죄경력증명서 검증 시간');
    }

    // 교육기관 유형별 조정
    const institutionInfo = INSTITUTION_ELIGIBILITY.eligible.institutions.find(inst => inst.code === institutionType);
    if (institutionInfo && institutionInfo.weight < 0.9) {
      baseTime += 7;
      factors.push('특수 교육기관에 대한 추가 검토');
    }

    // 서류 품질별 조정
    if (documentQuality === 'POOR') {
      baseTime += 10;
      factors.push('서류 보완 및 재검토 시간');
    } else if (documentQuality === 'EXCELLENT') {
      baseTime -= 3;
      factors.push('완벽한 서류로 인한 신속 처리');
    }

    return {
      estimatedDays: Math.max(5, baseTime),
      factors,
      range: {
        minimum: Math.max(5, baseTime - 5),
        maximum: baseTime + 10
      }
    };
  }

  /**
   * 성공 가능성 예측
   */
  predictSuccessProbability(applicantData, rejectionReasons, remediableIssues) {
    if (rejectionReasons.length > 0) {
      return {
        percentage: 0,
        level: 'IMPOSSIBLE',
        reasoning: '즉시 거부 사유 존재'
      };
    }

    let baseScore = 85; // 기본 성공률

    // 보완 가능 사항에 따른 차감
    remediableIssues.forEach(issue => {
      switch (issue.severity) {
        case 'HIGH':
          baseScore -= 20;
          break;
        case 'MEDIUM':
          baseScore -= 10;
          break;
        case 'LOW':
          baseScore -= 5;
          break;
      }
    });

    // 추가 요소들
    const { experienceYears, publications, institutionPrestige } = applicantData;
    
    if (experienceYears > 10) baseScore += 10;
    if (publications && publications.length > 5) baseScore += 15;
    if (institutionPrestige === 'HIGH') baseScore += 10;

    const finalScore = Math.max(0, Math.min(100, baseScore));

    let level;
    if (finalScore >= 80) level = 'HIGH';
    else if (finalScore >= 60) level = 'MEDIUM'; 
    else if (finalScore >= 40) level = 'LOW';
    else level = 'VERY_LOW';

    return {
      percentage: finalScore,
      level,
      reasoning: this.generateSuccessReasoning(finalScore, remediableIssues)
    };
  }

  /**
   * 행동 계획 생성
   */
  generateActionPlan(remediableIssues) {
    const actionPlan = {
      immediate: [], // 즉시 수행 (1주 이내)
      shortTerm: [], // 단기 (1-4주)
      mediumTerm: [], // 중기 (1-3개월)
      longTerm: []   // 장기 (3개월 이상)
    };

    remediableIssues.forEach(issue => {
      const action = {
        issue: issue.code,
        title: issue.message,
        solution: issue.solution,
        difficulty: issue.difficulty,
        category: issue.category
      };

      if (issue.timeToResolve.includes('1-2주') || issue.timeToResolve.includes('1주')) {
        if (issue.severity === 'HIGH') {
          actionPlan.immediate.push(action);
        } else {
          actionPlan.shortTerm.push(action);
        }
      } else if (issue.timeToResolve.includes('2-3주') || issue.timeToResolve.includes('1-4주')) {
        actionPlan.shortTerm.push(action);
      } else if (issue.timeToResolve.includes('2-3개월') || issue.timeToResolve.includes('1-3개월')) {
        actionPlan.mediumTerm.push(action);
      } else {
        actionPlan.longTerm.push(action);
      }
    });

    return actionPlan;
  }

  /**
   * 위험 요소 식별
   */
  identifyRiskFactors(applicantData) {
    const riskFactors = [];
    
    const { 
      experienceYears,
      jobStability,
      contractType,
      institutionFinancialStatus,
      previousVisaViolations
    } = applicantData;

    if (experienceYears < 2) {
      riskFactors.push({
        factor: 'LIMITED_EXPERIENCE',
        description: '교육 경력 부족',
        mitigation: '인턴십, 조교 경험 등으로 보완'
      });
    }

    if (jobStability === 'LOW') {
      riskFactors.push({
        factor: 'JOB_INSTABILITY',
        description: '고용 안정성 우려',
        mitigation: '장기 계약 또는 정규직 전환 계획서'
      });
    }

    if (contractType === 'PART_TIME') {
      riskFactors.push({
        factor: 'PART_TIME_CONTRACT',
        description: '시간제 계약의 비자 발급 제한',
        mitigation: '주당 6시간 이상 확보 및 전임 계약 전환'
      });
    }

    if (previousVisaViolations) {
      riskFactors.push({
        factor: 'PREVIOUS_VIOLATIONS',
        description: '이전 비자 위반 기록',
        mitigation: '개선 사항 및 재발 방지 계획서'
      });
    }

    return riskFactors;
  }

  /**
   * 타임라인 생성
   */
  generateTimeline(actionPlan) {
    const timeline = [];
    let currentWeek = 0;

    // 즉시 행동
    if (actionPlan.immediate.length > 0) {
      timeline.push({
        period: '1주차',
        actions: actionPlan.immediate.map(action => action.title),
        critical: true
      });
      currentWeek = 1;
    }

    // 단기 행동
    if (actionPlan.shortTerm.length > 0) {
      timeline.push({
        period: `${currentWeek + 1}-${currentWeek + 4}주차`,
        actions: actionPlan.shortTerm.map(action => action.title),
        critical: false
      });
      currentWeek += 4;
    }

    // 중기 행동
    if (actionPlan.mediumTerm.length > 0) {
      timeline.push({
        period: `${Math.ceil(currentWeek / 4) + 1}-${Math.ceil(currentWeek / 4) + 3}개월`,
        actions: actionPlan.mediumTerm.map(action => action.title),
        critical: false
      });
    }

    // 장기 행동
    if (actionPlan.longTerm.length > 0) {
      timeline.push({
        period: '3개월 이후',
        actions: actionPlan.longTerm.map(action => action.title),
        critical: false
      });
    }

    return timeline;
  }

  /**
   * 대안 제시
   */
  suggestAlternatives(applicantData) {
    const alternatives = [];
    const { educationLevel, experienceYears, nationality, currentVisa } = applicantData;

    // E-2 비자 제안
    if (this.isNativeEnglishSpeaker(nationality) && educationLevel >= 'bachelor') {
      alternatives.push({
        visa: 'E-2',
        title: '영어회화지도 비자',
        reason: '영어권 국적자로 E-2 비자가 더 적합할 수 있음',
        advantages: ['요구사항이 상대적으로 간단', '빠른 처리', '높은 승인율']
      });
    }

    // E-7 비자 제안  
    if (experienceYears >= 3 && educationLevel >= 'bachelor') {
      alternatives.push({
        visa: 'E-7',
        title: '특정활동 비자',
        reason: '교육 관련 전문직으로 분류 가능',
        advantages: ['급여 조건 충족시 유리', '다양한 활동 허용']
      });
    }

    // D-10 거쳐서 신청
    if (currentVisa !== 'D-10') {
      alternatives.push({
        visa: 'D-10',
        title: '구직비자 경유 신청',
        reason: '구직비자로 먼저 입국 후 E-1으로 변경',
        advantages: ['단계적 접근', '한국 내 구직 활동 가능']
      });
    }

    return alternatives;
  }

  // ===== 유틸리티 메서드 =====

  checkEducationLevel(actual, required) {
    const levels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];
    const actualIndex = levels.indexOf(actual);
    const requiredIndex = levels.indexOf(required);
    return actualIndex >= requiredIndex && actualIndex !== -1;
  }

  isNativeEnglishSpeaker(nationality) {
    const englishSpeakingCountries = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'];
    return englishSpeakingCountries.includes(nationality);
  }

  generateSuccessReasoning(score, issues) {
    if (score >= 80) {
      return '높은 성공 가능성 - 대부분의 요건을 충족하며 승인 가능성이 높습니다.';
    } else if (score >= 60) {
      return '보통 성공 가능성 - 일부 보완이 필요하지만 전체적으로 양호합니다.';
    } else if (score >= 40) {
      return '낮은 성공 가능성 - 상당한 보완이 필요합니다.';
    } else {
      return '매우 낮은 성공 가능성 - 대대적인 개선이 필요합니다.';
    }
  }
}

module.exports = E1PreScreeningService; 