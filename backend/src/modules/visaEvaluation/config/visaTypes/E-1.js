/**
 * E-1 비자 (교수) 통합 설정
 * 경로: /backend/src/modules/visaEvaluation/config/visaTypes/E-1.js
 */

const { evaluateE1Visa } = require('../../types/e1Visa');

module.exports = {
  code: 'E-1',
  name: '교수',
  category: 'WORK',
  version: '2.0',
  
  /**
   * 평가 가중치
   */
  weights: {
    education: 0.25,        // 학력 (25%)
    experience: 0.20,       // 경력 (20%)
    language: 0.15,         // 언어능력 (15%)
    research: 0.20,         // 연구실적 (20%)
    recommendation: 0.10,   // 추천서 (10%)
    institution: 0.10       // 소속기관 (10%)
  },
  
  /**
   * 평가 임계값
   */
  thresholds: {
    pass: 70,           // 합격선
    borderline: 60,     // 보완 필요
    low: 40,           // 불합격
    excellent: 85       // 우수
  },
  
  /**
   * 문서 요구사항
   */
  documents: {
    common: [
      'passport',
      'passport_photo', 
      'application_form',
      'health_certificate'
    ],
    
    NEW: {
      required: [
        'visa_application_form',  // 별지 제17호 서식
        'passport',
        'passport_photo',
        'application_fee',        // 단수 60USD, 복수 90USD
        'diploma',               // 학위증명서
        'diploma_apostille',     // 아포스티유/영사확인
        'employment_contract',   // 고용계약서 (주당 강의시수 명시)
        'business_registration', // 교육기관 사업자등록증
        'criminal_record',       // 국적별 필수
        'health_certificate'
      ],
      optional: [
        'recommendation_letters',
        'publication_list',
        'teaching_certificate',
        'research_portfolio'
      ],
      conditional: {
        'criminal_record_countries': {
          countries: ['US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'ZA'],
          documents: ['federal_criminal_record']
        },
        'non_english_documents': ['korean_translation', 'notarization']
      }
    },
    
    EXTENSION: {
      required: [
        'extension_application_form',  // 별지 제34호
        'passport',
        'alien_registration_card',
        'application_fee',            // 6만원
        'attendance_certificate',     // 출강증명서 (주당 강의시수 명시)
        'employment_contract',        // 계약서 또는 갱신서
        'tax_payment_certificate',   // 납세증명서
        'residence_certificate'      // 체류지 증명
      ],
      optional: [
        'activity_report',           // 활동 실적 보고서
        'teaching_evaluation',       // 강의 평가서
        'recent_publications'        // 최근 연구 실적
      ],
      conditional: {
        'contract_change': ['new_business_registration'],
        'salary_increase': ['updated_contract_terms']
      }
    },
    
    CHANGE: {
      required: [
        'change_application_form',    // 통합신청서
        'passport',
        'alien_registration_card',
        'application_fee',           // 13만원
        'change_reason_statement',   // 변경사유서
        'diploma',                   // 학위증명서
        'employment_contract',       // 새 고용계약서
        'business_registration',     // 새 기관 사업자등록증
        'release_letter'            // 원 소속 동의서 (해당시)
      ],
      optional: [
        'experience_certificate',
        'recommendation_letters',
        'previous_activity_report'
      ],
      conditional: {
        'd2_graduates': ['graduation_certificate'],
        'e2_teachers': ['teaching_experience_certificate']
      }
    }
  },
  
  /**
   * 자격 요건 규칙
   */
  eligibilityRules: {
    // 기본 자격 요건 (매뉴얼 기준)
    basic: {
      minimumEducation: 'Bachelor',  // 최소 학사 학위
      minimumExperience: 0,          // 최소 경력 (직급별 상이)
      weeklyTeachingHours: 6,        // 주당 최소 강의시수
      onlineTeachingLimit: 50,       // 온라인 강의 최대 비율(%)
      ageLimit: null,                // 연령 제한 없음
      nationality: 'ANY'             // 모든 국적
    },
    
    // 직급별 자격 요건 (매뉴얼 정확 반영)
    positionRequirements: {
      '교수': {
        '전문대학원': { degree: 'Bachelor', experience: 4 },
        '대학교원': { degree: 'Master', experience: 10 },
        '전문대학': { degree: 'Master', experience: 5 }
      },
      '부교수': {
        '전문대학원': { degree: 'Bachelor', experience: 3 },
        '대학교원': { degree: 'Master', experience: 4 },
        '전문대학': { degree: 'Master', experience: 4 }
      },
      '조교수': {
        '전문대학원': { degree: 'Bachelor', experience: 2 },
        '대학교원': { degree: 'Master', experience: 2 },
        '전문대학': { degree: 'Master', experience: 3 }
      },
      '강사': {
        '대학교원': { degree: 'Master', experience: 1 }
      }
    },
    
    // 교육기관 적격성
    institutionEligibility: {
      eligible: ['대학', '산업대학', '교육대학', '전문대학', '원격대학', '기술대학'],
      ineligible: ['학원', '연구소', '기업연수원'],
      requiresAccreditation: true  // 교육부 인가 필수
    },
    
    // 제외 조건
    exclusions: [
      'criminal_record',
      'immigration_violations', 
      'false_documentation',
      'unaccredited_institution'
    ]
  },
  
  /**
   * 비자 변경 가능성 규칙
   */
  changeabilityRules: {
    // 직접 변경 가능 비자
    directChangeAllowed: [
      'D-2',    // 유학에서 교수로
      'D-10',   // 구직에서 교수로  
      'E-2',    // 회화지도에서 교수로
      'E-3',    // 연구에서 교수로
      'E-7',    // 특정활동에서 교수로
      'F-2',    // 거주에서 교수로
      'F-4',    // 재외동포에서 교수로
      'F-5'     // 영주에서 교수로
    ],
    
    // 조건부 변경 가능
    conditionalChangeAllowed: {
      'D-2': {
        condition: '졸업 또는 수료',
        documents: ['graduation_certificate', 'completion_certificate'],
        note: '박사수료도 인정'
      },
      'E-2': {
        condition: '석사 이상 학위 + 교육경력',
        documents: ['degree_certificate', 'teaching_experience'],
        note: '언어교육에서 학술교육으로 전환'
      }
    },
    
    // 변경 불가 비자
    changeNotAllowed: [
      'C-3',    // 단기방문
      'C-4',    // 단기취업  
      'B-1',    // 사증면제
      'B-2',    // 관광통과
      'G-1',    // 기타
      'H-1',    // 관광취업
      'H-2'     // 방문취업
    ],
    
    // 처리 시간 (매뉴얼 기준)
    processingTime: {
      standard: '15-20 영업일',
      expedited: '7-10 영업일 (추가 수수료)',
      complex: '20-30 영업일 (서류 보완 시)',
      firstTime: '신규 신청: 10-15 영업일',
      extension: '연장 신청: 5-7 영업일'
    },
    
    // 변경 시 특별 요구사항
    specialRequirements: {
      'D-2': '졸업 후 6개월 이내 신청 권장',
      'E-2': '교육 경력 연속성 증명',
      'E-3': '연구에서 교육으로의 활동 변경 사유서'
    }
  },
  
  /**
   * 평가 규칙
   */
  rules: {
    // 학력 평가
    education: {
      scores: {
        'PhD': 100,
        'Master': 70,
        'Bachelor': 30
      },
      
      bonuses: {
        'prestigious_university': 10,    // 명문대 졸업
        'korea_university': 5,          // 한국 대학 졸업
        'relevant_major': 10            // 관련 전공
      },
      
      penalties: {
        'unaccredited_institution': -20,  // 비인가 기관
        'online_degree': -10             // 온라인 학위
      }
    },
    
    // 경력 평가
    experience: {
      baseScore: 50,
      yearlyBonus: 5,        // 년차별 추가 점수
      maxYears: 20,          // 최대 인정 년수
      
      multipliers: {
        'university_professor': 1.5,     // 대학 교수 경력
        'research_institute': 1.3,       // 연구소 경력
        'industry_expert': 1.2,          // 산업체 전문가
        'high_school_teacher': 1.0       // 고등학교 교사
      }
    },
    
    // 언어 평가
    language: {
      korean: {
        scores: {
          'TOPIK_6': 100,
          'TOPIK_5': 90,
          'TOPIK_4': 70,
          'TOPIK_3': 50,
          'TOPIK_2': 30,
          'TOPIK_1': 10,
          'NONE': 0
        }
      },
      
      english: {
        scores: {
          'TOEFL_110+': 20,
          'TOEFL_100+': 15,
          'TOEFL_90+': 10,
          'IELTS_8+': 20,
          'IELTS_7+': 15,
          'IELTS_6+': 10,
          'NATIVE': 20
        }
      }
    },
    
    // 연구 실적 평가
    research: {
      publications: {
        'SCI_journal': 15,      // SCI 논문 당 점수
        'SSCI_journal': 12,     // SSCI 논문 당 점수
        'KCI_journal': 8,       // KCI 논문 당 점수
        'international_conference': 5,
        'domestic_conference': 3,
        'book_chapter': 10,
        'book_authored': 20
      },
      
      maxPublications: 10,      // 최대 인정 편수
      
      citations: {
        'high_impact': 10,      // 고영향력 논문
        'medium_impact': 5,     // 중영향력 논문
        'low_impact': 2         // 저영향력 논문
      }
    }
  },
  
  /**
   * 특별 고려사항
   */
  specialConsiderations: {
    // 우대 사항
    preferences: {
      'korea_study_experience': 10,     // 한국 유학 경험
      'korean_language_education': 5,   // 한국어 교육 경험
      'cultural_exchange': 5,           // 문화교류 활동
      'government_invitation': 15       // 정부 초청
    },
    
    // 가산점
    bonusPoints: {
      'shortage_field': 20,             // 부족 분야
      'regional_university': 10,        // 지방 대학
      'startup_support': 15,            // 창업 지원
      'social_contribution': 10         // 사회 기여
    },
    
    // 감점 사항
    penalties: {
      'frequent_job_changes': -10,      // 잦은 직장 변경
      'incomplete_contracts': -15,      // 계약 미이행
      'tax_issues': -20                // 세무 문제
    }
  },
  
  /**
   * 평가 함수
   */
  evaluator: evaluateE1Visa,
  
  /**
   * 메타 정보
   */
  metadata: {
    createdAt: new Date('2024-01-01'),
    lastUpdated: new Date(),
    author: 'Visa Evaluation System',
    description: 'E-1 비자 (교수) 종합 평가 설정',
    
    // 통계 정보
    statistics: {
      averageProcessingTime: 22,  // 평균 처리 일수
      approvalRate: 0.75,         // 승인율
      commonIssues: [
        '언어 능력 부족',
        '연구 실적 부족',
        '서류 미비'
      ]
    },
    
    // 법적 근거
    legalBasis: [
      '출입국관리법 제18조',
      '출입국관리법 시행령 제20조',
      '외국인 체류 및 취업에 관한 규정'
    ]
  }
}; 