/**
 * E-1 비자 활동 검증 서비스
 * 매뉴얼 기반 정확한 활동 범위 및 제한사항 검증
 * 경로: /backend/src/modules/visaEvaluation/core/services/E1ActivityValidationService.js
 */

class E1ActivityValidationService {
  constructor() {
    // 매뉴얼 기준 E-1 비자 활동범위
    this.allowedActivities = {
      // 기본 교육 활동
      primaryEducation: {
        '고등교육법상_교육기관': {
          activities: [
            '정규 교육과정 강의',
            '대학원 논문지도', 
            '학술연구 지도',
            '교육과정 개발'
          ],
          institutions: [
            '대학', '산업대학', '교육대학', '전문대학',
            '원격대학', '기술대학', '대학원'
          ],
          restrictions: {
            minimumWeeklyHours: 6,
            onlineTeachingLimit: 50, // %
            regularSemester: true
          }
        },

        '연구기관': {
          activities: [
            '학술연구',
            '연구지도',
            '연구보고서 작성',
            '학술세미나 참여'
          ],
          institutions: [
            '정부출연연구소',
            '대학부설연구소', 
            '기업부설연구소',
            '국책연구기관'
          ]
        }
      },

      // 허용되는 부수적 활동
      secondaryActivities: {
        '학술활동': [
          '학회 발표',
          '논문 심사',
          '학술지 편집',
          '국제학술대회 참석'
        ],
        '자문활동': [
          '정부기관 자문',
          '교육정책 자문',
          '학술단체 임원'
        ],
        '출판활동': [
          '학술서적 저술',
          '교재 개발',
          '번역서 출간'
        ]
      }
    };

    // 금지 활동 (매뉴얼 명시)
    this.prohibitedActivities = {
      '영리활동': [
        '사설학원 강의',
        '개인과외',
        '컨설팅 사업',
        '상업적 연구용역'
      ],
      '취업활동': [
        '기업 정규직 근무',
        '아르바이트',
        '프리랜서 활동 (교육 외)'
      ],
      '사업활동': [
        '사업자등록',
        '회사 설립',
        '주식 투자업'
      ]
    };

    // 체류기간별 제한사항
    this.periodRestrictions = {
      '단기계약': { // 1년 미만
        maxPeriod: 365,
        renewalLimit: 2,
        specialRequirements: ['계약연장 사유서']
      },
      '장기계약': { // 1년 이상
        maxPeriod: 1825, // 5년
        renewalConditions: ['성실한 활동 이행', '세금 납부'],
        benefits: ['연장 우대', '가족초청 가능']
      }
    };
  }

  /**
   * 활동 계획 종합 검증
   */
  validateActivityPlan(activityData) {
    const validation = {
      overall: true,
      issues: [],
      warnings: [],
      recommendations: [],
      activityBreakdown: {}
    };

    // 1. 기본 활동 적격성 검증
    this.validatePrimaryActivities(activityData, validation);

    // 2. 강의시수 및 온라인 비율 검증
    this.validateTeachingRequirements(activityData, validation);

    // 3. 교육기관 적격성 검증
    this.validateInstitutionEligibility(activityData, validation);

    // 4. 금지 활동 체크
    this.checkProhibitedActivities(activityData, validation);

    // 5. 부수 활동 검증
    this.validateSecondaryActivities(activityData, validation);

    // 6. 체류기간 적합성 검증
    this.validateStayPeriod(activityData, validation);

    return validation;
  }

  /**
   * 기본 교육 활동 검증
   */
  validatePrimaryActivities(activityData, validation) {
    const { 
      primaryActivity, 
      institutionType, 
      position,
      subjects,
      activityDescription 
    } = activityData;

    // 교육 활동 여부 확인
    if (!primaryActivity || primaryActivity !== '교육') {
      validation.issues.push({
        code: 'INVALID_PRIMARY_ACTIVITY',
        severity: 'CRITICAL',
        message: 'E-1 비자는 교육 활동이 주된 목적이어야 합니다.',
        suggestion: '교육 또는 연구지도 활동으로 변경 필요'
      });
      validation.overall = false;
    }

    // 교과목 적절성 검증
    if (subjects && subjects.length > 0) {
      const inappropriateSubjects = this.checkSubjectAppropiateness(subjects, position);
      if (inappropriateSubjects.length > 0) {
        validation.warnings.push({
          code: 'SUBJECT_MISMATCH',
          message: `직급에 비해 부적절한 교과목: ${inappropriateSubjects.join(', ')}`,
          suggestion: '전공 분야와 일치하는 교과목으로 조정 권장'
        });
      }
    }

    // 활동 설명 구체성 검증
    if (!activityDescription || activityDescription.length < 50) {
      validation.warnings.push({
        code: 'VAGUE_ACTIVITY_DESCRIPTION',
        message: '활동 내용 설명이 너무 간략합니다.',
        suggestion: '구체적인 교육 내용과 방법을 상세히 기술'
      });
    }
  }

  /**
   * 강의시수 및 온라인 비율 검증 (매뉴얼 핵심)
   */
  validateTeachingRequirements(activityData, validation) {
    const { 
      weeklyHours, 
      onlineHours, 
      offlineHours,
      semesterWeeks,
      totalHours
    } = activityData;

    // 주당 최소 6시간 검증
    if (weeklyHours < 6) {
      validation.issues.push({
        code: 'INSUFFICIENT_WEEKLY_HOURS',
        severity: 'CRITICAL',
        message: `주당 강의시수 부족 (현재: ${weeklyHours}시간, 최소: 6시간)`,
        suggestion: '주당 6시간 이상으로 계약 조정 필요',
        legalBasis: '매뉴얼 명시 최소 요건'
      });
      validation.overall = false;
    }

    // 온라인 강의 50% 제한 검증 (매뉴얼 핵심)
    const onlinePercentage = onlineHours ? (onlineHours / weeklyHours) * 100 : 0;
    if (onlinePercentage > 50) {
      validation.issues.push({
        code: 'EXCESSIVE_ONLINE_TEACHING',
        severity: 'HIGH',
        message: `온라인 강의 비율 초과 (현재: ${onlinePercentage.toFixed(1)}%, 최대: 50%)`,
        suggestion: '오프라인 강의 비중을 늘려 50% 이하로 조정',
        legalBasis: '매뉴얼 온라인 강의 제한 규정'
      });
      validation.overall = false;
    }

    // 학기제 운영 확인
    if (!semesterWeeks || semesterWeeks < 15) {
      validation.warnings.push({
        code: 'SHORT_SEMESTER',
        message: '정규 학기제(15주 이상) 운영 여부 확인 필요',
        suggestion: '정규 교육과정 학기제 확인서 준비'
      });
    }

    // 연간 총 강의시수 계산 및 검증
    const annualHours = weeklyHours * semesterWeeks * 2; // 연간 2학기
    if (annualHours < 180) { // 연간 최소 180시간 (주 6시간 × 15주 × 2학기)
      validation.warnings.push({
        code: 'LOW_ANNUAL_HOURS',
        message: `연간 총 강의시수가 적습니다 (${annualHours}시간)`,
        suggestion: '방학 중 특강 또는 여름학기 강의 추가 고려'
      });
    }
  }

  /**
   * 교육기관 적격성 검증
   */
  validateInstitutionEligibility(activityData, validation) {
    const { institutionType, institutionName, accreditation } = activityData;

    // 고등교육법상 교육기관 여부
    const eligibleInstitutions = [
      'UNIVERSITY', 'GRADUATE_SCHOOL', 'JUNIOR_COLLEGE',
      'TECHNICAL_COLLEGE', 'CYBER_UNIVERSITY', 'BROADCAST_UNIV'
    ];

    if (!eligibleInstitutions.includes(institutionType)) {
      validation.issues.push({
        code: 'INELIGIBLE_INSTITUTION_TYPE',
        severity: 'CRITICAL',
        message: '고등교육법상 인정되지 않는 교육기관 유형',
        suggestion: '고등교육법 제2조에 의한 정규 교육기관 확인 필요'
      });
      validation.overall = false;
    }

    // 교육부 인가 여부 확인
    if (accreditation !== 'MINISTRY_APPROVED') {
      validation.issues.push({
        code: 'NOT_MINISTRY_APPROVED',
        severity: 'CRITICAL',
        message: '교육부 미인가 교육기관',
        suggestion: '교육부 인가 교육기관 확인서 필요'
      });
      validation.overall = false;
    }
  }

  /**
   * 금지 활동 체크
   */
  checkProhibitedActivities(activityData, validation) {
    const { additionalActivities, sideBusiness, otherJobs } = activityData;

    // 사설학원 강의 체크
    if (additionalActivities && additionalActivities.includes('academy_teaching')) {
      validation.issues.push({
        code: 'PROHIBITED_ACADEMY_TEACHING',
        severity: 'CRITICAL',
        message: '사설학원 강의는 E-1 비자 활동 범위에 포함되지 않습니다.',
        suggestion: 'E-2 비자로 변경하거나 해당 활동 제외'
      });
      validation.overall = false;
    }

    // 개인과외 체크
    if (additionalActivities && additionalActivities.includes('private_tutoring')) {
      validation.issues.push({
        code: 'PROHIBITED_PRIVATE_TUTORING',
        severity: 'CRITICAL',
        message: '개인과외는 허용되지 않는 활동입니다.',
        suggestion: '정규 교육기관 활동에만 집중'
      });
      validation.overall = false;
    }

    // 사업 활동 체크
    if (sideBusiness) {
      validation.issues.push({
        code: 'PROHIBITED_BUSINESS_ACTIVITY',
        severity: 'CRITICAL',
        message: 'E-1 비자로는 사업 활동이 불가능합니다.',
        suggestion: '사업 활동 중단 또는 D-8 비자로 변경'
      });
      validation.overall = false;
    }
  }

  /**
   * 부수 활동 검증
   */
  validateSecondaryActivities(activityData, validation) {
    const { secondaryActivities } = activityData;

    if (secondaryActivities && secondaryActivities.length > 0) {
      secondaryActivities.forEach(activity => {
        const category = this.categorizeSecondaryActivity(activity);
        
        switch (category) {
          case 'ALLOWED':
            validation.recommendations.push({
              code: 'BENEFICIAL_SECONDARY_ACTIVITY',
              message: `유익한 부수 활동: ${activity}`,
              benefit: '학술적 평판 향상에 도움'
            });
            break;
            
          case 'CONDITIONAL':
            validation.warnings.push({
              code: 'CONDITIONAL_SECONDARY_ACTIVITY',
              message: `조건부 허용 활동: ${activity}`,
              condition: '주된 교육 활동에 지장이 없는 범위 내'
            });
            break;
            
          case 'PROHIBITED':
            validation.issues.push({
              code: 'PROHIBITED_SECONDARY_ACTIVITY',
              severity: 'HIGH',
              message: `금지된 부수 활동: ${activity}`,
              suggestion: '해당 활동 중단 필요'
            });
            break;
        }
      });
    }
  }

  /**
   * 체류기간 적합성 검증
   */
  validateStayPeriod(activityData, validation) {
    const { contractPeriod, renewalPlan, stayPurpose } = activityData;

    // 계약기간별 적정성 검증
    if (contractPeriod < 365) {
      validation.warnings.push({
        code: 'SHORT_CONTRACT_PERIOD',
        message: '1년 미만 단기 계약입니다.',
        implications: [
          '비자 연장 시 추가 심사',
          '가족 동반 제한',
          '정착 지원 혜택 제한'
        ],
        suggestion: '가능하면 1년 이상 장기 계약 협상'
      });
    }

    // 5년 초과 체류 계획 체크
    if (contractPeriod > 1825) { // 5년
      validation.warnings.push({
        code: 'LONG_TERM_STAY_PLAN',
        message: '5년 초과 장기 체류 계획',
        requirements: [
          '지속적인 성실 이행 평가',
          '정기적인 활동 보고',
          'F-2 거주 비자 전환 고려'
        ]
      });
    }

    // 갱신 계획 적절성
    if (renewalPlan && renewalPlan.frequency > 5) {
      validation.warnings.push({
        code: 'FREQUENT_RENEWAL_PLAN',
        message: '너무 잦은 갱신 계획',
        suggestion: '장기 계약으로 안정성 확보 권장'
      });
    }
  }

  /**
   * 전체 활동 시간 배분 분석
   */
  analyzeActivityTimeAllocation(activityData) {
    const { 
      teachingHours,
      researchHours,
      adminHours,
      secondaryHours 
    } = activityData;

    const totalHours = teachingHours + researchHours + (adminHours || 0) + (secondaryHours || 0);
    
    const allocation = {
      teaching: (teachingHours / totalHours * 100).toFixed(1),
      research: (researchHours / totalHours * 100).toFixed(1),
      admin: ((adminHours || 0) / totalHours * 100).toFixed(1),
      secondary: ((secondaryHours || 0) / totalHours * 100).toFixed(1)
    };

    const analysis = {
      allocation,
      assessment: 'BALANCED',
      recommendations: []
    };

    // 교육 활동 비중 체크
    if (allocation.teaching < 60) {
      analysis.assessment = 'RESEARCH_HEAVY';
      analysis.recommendations.push('교육 활동 비중을 60% 이상으로 조정 권장');
    }

    // 연구 활동 비중 체크
    if (allocation.research < 20) {
      analysis.recommendations.push('연구 활동 비중 확대로 학술적 성과 향상');
    }

    return analysis;
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 교과목 적절성 검증
   */
  checkSubjectAppropiateness(subjects, position) {
    const inappropriate = [];
    
    // 직급별 적절한 교과목 수준 체크
    if (position === '교수' || position === '부교수') {
      subjects.forEach(subject => {
        if (subject.level === 'undergraduate_basic') {
          inappropriate.push(subject.name);
        }
      });
    }

    return inappropriate;
  }

  /**
   * 부수 활동 분류
   */
  categorizeSecondaryActivity(activity) {
    const allowedActivities = [
      '학회발표', '논문심사', '학술지편집', '정부자문',
      '학술서적저술', '교재개발', '국제학술대회'
    ];

    const conditionalActivities = [
      '방송출연', '언론기고', '공개강연', '세미나발표'
    ];

    const prohibitedActivities = [
      '사설학원강의', '개인과외', '상업적컨설팅', '투자자문'
    ];

    if (allowedActivities.some(allowed => activity.includes(allowed))) {
      return 'ALLOWED';
    } else if (conditionalActivities.some(conditional => activity.includes(conditional))) {
      return 'CONDITIONAL';
    } else if (prohibitedActivities.some(prohibited => activity.includes(prohibited))) {
      return 'PROHIBITED';
    } else {
      return 'UNKNOWN';
    }
  }

  /**
   * 매뉴얼 기반 활동 가이드 생성
   */
  generateActivityGuide(applicantData) {
    return {
      allowedActivities: this.allowedActivities,
      prohibitedActivities: this.prohibitedActivities,
      keyRequirements: {
        minimumWeeklyHours: 6,
        onlineTeachingLimit: '50%',
        regularSemester: '15주 이상',
        institutionType: '고등교육법상 인정 교육기관'
      },
      commonPitfalls: [
        '온라인 강의 비율 50% 초과',
        '주당 강의시수 6시간 미달',
        '사설학원 병행 강의',
        '개인과외 활동'
      ],
      bestPractices: [
        '정규 교육과정 중심의 강의',
        '학술연구 병행으로 전문성 강화',
        '교육기관과의 긴밀한 협조',
        '지속적인 자기계발'
      ]
    };
  }
}

module.exports = E1ActivityValidationService; 