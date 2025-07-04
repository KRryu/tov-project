/**
 * 사증발급인정서 서비스
 * 매뉴얼 기반 사증발급인정서 평가 및 신청 지원
 * 경로: /backend/src/modules/visaEvaluation/core/services/VisaIssuanceCertificateService.js
 */

class VisaIssuanceCertificateService {
  constructor() {
    // 매뉴얼 기반 사증발급인정서 발급대상
    this.eligibleInstitutions = {
      // 전문대학 이상 교육기관에서 91일 이상 교육 또는 연구지도
      longTermEducation: {
        minimumPeriod: 91, // 일
        institutionTypes: [
          'UNIVERSITY',
          'GRADUATE_SCHOOL', 
          'JUNIOR_COLLEGE',
          'TECHNICAL_COLLEGE',
          'RESEARCH_INSTITUTE'
        ],
        activities: ['교육', '연구지도'],
        positions: ['교수', '부교수', '조교수', '전임강사', '연구교수']
      },

      // 교육부장관의 고급과학기술인력 교육수행기관
      advancedScienceTech: {
        approvalRequired: '교육부장관',
        programTypes: [
          '고급과학기술인력양성',
          '교육훈련프로그램',
          '연구개발프로젝트'
        ],
        specialCategories: [
          'GOLD_CARD_HOLDER',
          'GOVERNMENT_INVITED',
          'STRATEGIC_TECHNOLOGY'
        ]
      }
    };

    // 사증발급인정서 신청 절차
    this.applicationProcess = {
      method: 'ONLINE_ONLY',
      website: 'www.visa.go.kr',
      requiredDocuments: [
        '사증발급인정신청서',
        '경력증명서',
        '학위증',
        '초청기관현황',
        '고용계약서_또는_임용예정확인서'
      ],
      processingTime: {
        standard: '5-7일',
        complex: '10-15일'
      }
    };
  }

  /**
   * 사증발급인정서 필요성 판단
   */
  assessCertificateNecessity(applicantData) {
    const { 
      applicationType, 
      contractPeriod, 
      institutionType, 
      position,
      nationality,
      activityType,
      governmentInvitation,
      goldCardHolder 
    } = applicantData;

    const assessment = {
      required: false,
      beneficial: false,
      reasoning: '',
      advantages: [],
      requirements: []
    };

    // 1. 91일 이상 계약 체크
    if (contractPeriod >= 91) {
      assessment.beneficial = true;
      assessment.advantages.push('91일 이상 계약으로 사증발급인정서 신청 가능');
      
      // 적격 교육기관 체크
      if (this.isEligibleInstitution(institutionType)) {
        assessment.required = true;
        assessment.reasoning = '전문대학 이상 교육기관에서 91일 이상 교육활동';
        assessment.advantages.push('신속한 사증 발급 가능');
        assessment.advantages.push('영사관에서 우선 처리');
      }
    }

    // 2. 특별 우대 대상
    if (goldCardHolder) {
      assessment.required = true;
      assessment.reasoning = 'GOLD CARD 소지자 - 사증발급인정서 우선 대상';
      assessment.advantages.push('GOLD CARD 특혜 적용');
      assessment.advantages.push('서류 간소화');
    }

    if (governmentInvitation) {
      assessment.beneficial = true;
      assessment.advantages.push('정부 초청자 우대 처리');
    }

    // 3. 국적별 고려사항
    const difficultyCountries = ['CN', 'VN', 'PH', 'TH', 'MM', 'KH'];
    if (difficultyCountries.includes(nationality)) {
      assessment.beneficial = true;
      assessment.advantages.push('해당 국가 국적자에게 유리한 절차');
    }

    return assessment;
  }

  /**
   * 사증발급인정서 신청 조건 검증
   */
  validateCertificateApplication(applicantData) {
    const validation = {
      eligible: true,
      issues: [],
      requirements: [],
      recommendations: []
    };

    const { 
      institutionType, 
      contractPeriod, 
      position, 
      activityType,
      institutionAccreditation 
    } = applicantData;

    // 1. 교육기관 적격성
    if (!this.isEligibleInstitution(institutionType)) {
      validation.eligible = false;
      validation.issues.push({
        code: 'INSTITUTION_NOT_ELIGIBLE',
        message: '사증발급인정서 발급 대상 교육기관이 아님',
        severity: 'CRITICAL'
      });
    }

    // 2. 계약 기간
    if (contractPeriod < 91) {
      validation.eligible = false;
      validation.issues.push({
        code: 'CONTRACT_TOO_SHORT',
        message: '계약기간이 91일 미만 (현재: ' + contractPeriod + '일)',
        severity: 'CRITICAL'
      });
    }

    // 3. 직급 적합성
    const eligiblePositions = ['교수', '부교수', '조교수', '전임강사', '연구교수', '초빙교수'];
    if (!eligiblePositions.includes(position)) {
      validation.issues.push({
        code: 'POSITION_NOT_STANDARD',
        message: '비표준 직급 - 추가 설명 필요',
        severity: 'MEDIUM'
      });
      validation.recommendations.push('직급에 대한 상세 설명서 첨부 권장');
    }

    // 4. 활동 내용
    if (!activityType || !['교육', '연구지도', '학술연구'].includes(activityType)) {
      validation.issues.push({
        code: 'ACTIVITY_UNCLEAR',
        message: '교육 또는 연구지도 활동 명확히 명시 필요',
        severity: 'MEDIUM'
      });
    }

    // 5. 필수 서류 체크리스트
    validation.requirements = this.generateRequiredDocuments(applicantData);

    return validation;
  }

  /**
   * 사증발급인정서 신청 가이드 생성
   */
  generateApplicationGuide(applicantData) {
    const guide = {
      stepByStep: [],
      timeline: {},
      documents: [],
      tips: [],
      commonMistakes: []
    };

    // 단계별 가이드
    guide.stepByStep = [
      {
        step: 1,
        title: '온라인 신청',
        description: 'www.visa.go.kr 접속 → 전자사증 발급 확인시스템',
        timeRequired: '30분',
        tips: ['회원가입 미리 완료', '서류를 스캔해서 준비']
      },
      {
        step: 2,
        title: '서류 업로드',
        description: '필수 서류 온라인 업로드',
        timeRequired: '1시간',
        documents: this.generateRequiredDocuments(applicantData)
      },
      {
        step: 3,
        title: '심사 대기',
        description: '출입국사무소 심사',
        timeRequired: '5-15일',
        trackingMethod: '온라인 진행상황 확인'
      },
      {
        step: 4,
        title: '발급 완료',
        description: '사증발급인정서 발급',
        nextAction: '해외 한국영사관에서 사증 신청'
      }
    ];

    // 타임라인
    guide.timeline = {
      preparation: '2-3일',
      application: '1일',
      processing: '5-15일',
      total: '1-3주',
      criticalPath: ['교육기관 서류 발급', '계약서 준비']
    };

    // 실용적 팁
    guide.tips = [
      '교육기관 담당자와 미리 협의하여 서류 준비',
      '계약서에 주당 강의시수 명확히 기재',
      '영문 서류는 한국어 번역본도 함께 준비',
      '온라인 신청 중 저장 기능 활용하여 분할 작성 가능'
    ];

    // 흔한 실수들
    guide.commonMistakes = [
      '계약기간을 90일로 작성하여 자격 미달',
      '교육기관 사업자등록증 누락',
      '직급 증명서류 미첨부',
      '온라인 신청서 오타로 인한 반려'
    ];

    return guide;
  }

  /**
   * 사증발급인정서 vs 일반 사증신청 비교
   */
  compareApplicationMethods(applicantData) {
    return {
      certificateMethod: {
        pros: [
          '신속한 처리 (영사관에서 우선 처리)',
          '서류 간소화',
          '예측 가능한 결과',
          '교육기관의 신뢰성 보증'
        ],
        cons: [
          '사전 준비 기간 필요 (1-3주)',
          '교육기관 협조 필수',
          '온라인 신청 시스템만 이용 가능'
        ],
        processingTime: '영사관에서 3-5일',
        successRate: '95%'
      },

      directMethod: {
        pros: [
          '즉시 신청 가능',
          '교육기관 의존도 낮음'
        ],
        cons: [
          '심사 기간 장기화 (2-4주)',
          '서류 요구사항 까다로움',
          '불확실성 높음'
        ],
        processingTime: '영사관에서 2-4주',
        successRate: '75%'
      },

      recommendation: this.getRecommendation(applicantData)
    };
  }

  /**
   * 추천 방법 결정
   */
  getRecommendation(applicantData) {
    const assessment = this.assessCertificateNecessity(applicantData);
    
    if (assessment.required) {
      return {
        method: 'CERTIFICATE_REQUIRED',
        reasoning: '사증발급인정서 신청 대상에 해당',
        action: '교육기관과 협의하여 사증발급인정서 신청'
      };
    } else if (assessment.beneficial) {
      return {
        method: 'CERTIFICATE_RECOMMENDED',
        reasoning: '사증발급인정서가 유리하나 필수는 아님',
        action: '시간적 여유가 있다면 사증발급인정서 신청 권장'
      };
    } else {
      return {
        method: 'DIRECT_APPLICATION',
        reasoning: '일반 사증 신청으로 충분',
        action: '해외 한국영사관에서 직접 사증 신청'
      };
    }
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 적격 교육기관 여부 확인
   */
  isEligibleInstitution(institutionType) {
    const eligible = [
      'UNIVERSITY',
      'GRADUATE_SCHOOL',
      'JUNIOR_COLLEGE', 
      'TECHNICAL_COLLEGE',
      'CYBER_UNIVERSITY',
      'BROADCAST_UNIV',
      'RESEARCH_INSTITUTE'
    ];
    
    return eligible.includes(institutionType);
  }

  /**
   * 필수 서류 목록 생성
   */
  generateRequiredDocuments(applicantData) {
    const baseDocuments = [
      {
        name: '사증발급인정신청서',
        form: '별지 제21호',
        description: '온라인 작성',
        required: true
      },
      {
        name: '경력증명서 및 학위증',
        description: '최종학력 및 교육/연구 경력',
        required: true
      },
      {
        name: '초청기관현황',
        description: '교육기관 소개서 및 사업자등록증',
        required: true
      },
      {
        name: '고용계약서 또는 임용예정확인서',
        description: '주당 강의시수 명시 필수',
        required: true,
        critical: true
      }
    ];

    // 조건별 추가 서류
    const additionalDocs = [];
    
    if (applicantData.institutionType === 'RESEARCH_INSTITUTE') {
      additionalDocs.push({
        name: '연구계획서',
        description: '연구 내용 및 기간 상세 기술',
        required: true
      });
    }

    if (applicantData.goldCardHolder) {
      additionalDocs.push({
        name: 'GOLD CARD 사본',
        description: 'GOLD CARD 소지자 특혜 적용',
        required: true
      });
    }

    return [...baseDocuments, ...additionalDocs];
  }

  /**
   * 온라인 신청 시스템 가이드
   */
  getOnlineSystemGuide() {
    return {
      website: 'www.visa.go.kr',
      path: '전자사증 발급 확인시스템 > 사증발급인정신청',
      systemRequirements: {
        browser: ['Chrome', 'Firefox', 'Safari'],
        plugins: ['PDF 뷰어'],
        fileFormats: ['JPG', 'PNG', 'PDF'],
        maxFileSize: '5MB per file'
      },
      businessHours: {
        application: '24시간 가능',
        inquiry: '평일 09:00-18:00',
        phone: '1345 (출입국 상담센터)'
      },
      troubleshooting: [
        {
          issue: '파일 업로드 실패',
          solution: '파일 크기를 5MB 이하로 조정'
        },
        {
          issue: '신청서 저장 안됨',
          solution: '브라우저 쿠키 설정 확인'
        },
        {
          issue: '진행상황 확인 안됨',
          solution: '신청번호와 휴대폰 번호로 조회'
        }
      ]
    };
  }
}

module.exports = VisaIssuanceCertificateService; 