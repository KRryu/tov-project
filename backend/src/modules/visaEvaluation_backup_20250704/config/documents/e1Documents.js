/**
 * E-1 비자 서류 요구사항 (매뉴얼 기준)
 * 신청 유형별 상세 서류 목록
 * 경로: /backend/src/modules/visaEvaluation/config/documents/e1Documents.js
 */

/**
 * 신규 신청 (사증발급) 서류
 */
const NEW_APPLICATION_DOCUMENTS = {
  basic: [
    {
      code: 'visa_application_form',
      name: '사증발급신청서',
      form: '별지 제17호 서식',
      mandatory: true,
      description: '법무부 지정 양식 사용'
    },
    {
      code: 'passport',
      name: '여권',
      mandatory: true,
      validity: '6개월 이상',
      description: '여권 잔여 유효기간 6개월 이상'
    },
    {
      code: 'passport_photo',
      name: '사진',
      mandatory: true,
      specification: '3.5×4.5cm, 6개월 이내 촬영',
      description: '최근 6개월 이내 촬영된 여권용 사진'
    },
    {
      code: 'application_fee',
      name: '수수료',
      mandatory: true,
      amount: {
        single: '60,000원 또는 미화 60불',
        multiple: '90,000원 또는 미화 90불'
      },
      description: '계약기간에 따라 단수/복수 결정'
    }
  ],

  education: [
    {
      code: 'diploma',
      name: '학위증명서',
      mandatory: true,
      apostille: true,
      description: '최종 학위증명서 (아포스티유/영사확인 필수)',
      alternatives: ['diploma_verification', 'degree_certificate']
    },
    {
      code: 'transcript',
      name: '성적증명서',
      mandatory: false,
      recommended: true,
      description: '학업 성취도 증빙'
    }
  ],

  employment: [
    {
      code: 'employment_contract',
      name: '고용계약서 또는 임용예정확인서',
      mandatory: true,
      mustInclude: [
        '직위/직급 명시',
        '담당 교과목',
        '주당 강의시수 (6시간 이상)',
        '급여',
        '계약기간'
      ],
      description: '교육기관과의 고용 관계 증빙'
    },
    {
      code: 'business_registration',
      name: '사업자등록증',
      mandatory: true,
      issuer: '교육기관',
      description: '고용기관(교육기관)의 사업자등록증'
    },
    {
      code: 'institution_profile',
      name: '교육기관 현황',
      mandatory: false,
      recommended: true,
      description: '학교 소개서, 학과 안내 등'
    }
  ],

  background: [
    {
      code: 'criminal_record',
      name: '범죄경력증명서',
      mandatory: 'conditional',
      requiredCountries: ['US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'ZA', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'],
      level: '연방/전국 단위',
      validity: '6개월 이내',
      apostille: true,
      description: '미국, 캐나다, 호주, 뉴질랜드, 영국, 아일랜드, 남아공 및 주요 유럽 국가 국적자 필수'
    },
    {
      code: 'health_certificate',
      name: '건강진단서',
      mandatory: true,
      validity: '3개월 이내',
      requirements: ['결핵', '전염성 질환 검사'],
      description: '지정병원 발급'
    }
  ],

  optional: [
    {
      code: 'recommendation_letter',
      name: '추천서',
      mandatory: false,
      highValue: true,
      preferredIssuer: ['대학 총장', '학장', '정부기관'],
      description: '기관장 추천서는 심사에 매우 유리'
    },
    {
      code: 'publication_list',
      name: '연구실적 목록',
      mandatory: false,
      description: '논문, 저서, 특허 등 연구 실적'
    },
    {
      code: 'teaching_certificate',
      name: '교원자격증',
      mandatory: false,
      description: '해당국 교원자격증 (있는 경우)'
    }
  ]
};

/**
 * 연장 신청 (체류기간연장) 서류
 */
const EXTENSION_DOCUMENTS = {
  basic: [
    {
      code: 'extension_application_form',
      name: '체류기간연장허가신청서',
      form: '별지 제34호',
      mandatory: true
    },
    {
      code: 'passport',
      name: '여권',
      mandatory: true
    },
    {
      code: 'alien_registration_card',
      name: '외국인등록증',
      mandatory: true
    },
    {
      code: 'application_fee',
      name: '수수료',
      mandatory: true,
      amount: '60,000원'
    }
  ],

  activity: [
    {
      code: 'attendance_certificate',
      name: '출강(전임)증명서',
      mandatory: true,
      mustInclude: [
        '주당 강의시수 명시',
        '담당 과목 목록',
        '고용 형태 (전임/비전임)',
        '출강 기간'
      ],
      description: '현재 교육 활동 실적 증빙',
      critical: true
    },
    {
      code: 'employment_contract',
      name: '고용계약서 (갱신)',
      mandatory: true,
      description: '갱신된 계약서 또는 계속 고용 확인서'
    }
  ],

  compliance: [
    {
      code: 'tax_payment_certificate',
      name: '납세증명서',
      mandatory: true,
      period: '최근 1년간',
      issuer: '국세청',
      description: '세금 납부 이행 증빙'
    },
    {
      code: 'residence_certificate',
      name: '거주지 확인서류',
      mandatory: true,
      types: ['임대차계약서', '숙소제공확인서', '등본'],
      description: '현재 거주지 증빙'
    },
    {
      code: 'insurance_certificate',
      name: '국민건강보험가입확인서',
      mandatory: false,
      recommended: true,
      description: '건강보험 가입 및 납부 확인'
    }
  ],

  optional: [
    {
      code: 'activity_report',
      name: '활동실적보고서',
      mandatory: false,
      recommended: true,
      description: '교육 및 연구 활동 실적'
    },
    {
      code: 'teaching_evaluation',
      name: '강의평가서',
      mandatory: false,
      description: '학생 강의 평가 결과'
    }
  ]
};

/**
 * 변경 신청 (체류자격변경) 서류
 */
const CHANGE_DOCUMENTS = {
  basic: [
    {
      code: 'change_application_form',
      name: '체류자격변경허가신청서',
      form: '통합신청서',
      mandatory: true
    },
    {
      code: 'passport',
      name: '여권',
      mandatory: true
    },
    {
      code: 'alien_registration_card',
      name: '외국인등록증',
      mandatory: true
    },
    {
      code: 'application_fee',
      name: '수수료',
      mandatory: true,
      amount: '130,000원'
    }
  ],

  change_specific: [
    {
      code: 'change_reason_statement',
      name: '변경사유서',
      mandatory: true,
      description: '체류자격 변경 필요성에 대한 상세 설명',
      mustExplain: [
        '변경 사유',
        '새로운 활동 내용',
        '변경의 타당성'
      ]
    },
    {
      code: 'current_status_report',
      name: '현재 활동 보고서',
      mandatory: true,
      description: '현재 체류자격으로의 활동 현황'
    },
    {
      code: 'release_letter',
      name: '소속기관 동의서',
      mandatory: 'conditional',
      condition: '현재 계약 유효 중 변경시',
      alternative: '계약 만료 증명서',
      description: '현 소속기관의 변경 동의'
    }
  ],

  new_qualification: [
    {
      code: 'diploma',
      name: '학위증명서',
      mandatory: true,
      note: '신규 신청과 동일한 요구사항'
    },
    {
      code: 'employment_contract',
      name: '새 고용계약서',
      mandatory: true,
      description: 'E-1 활동을 위한 새로운 고용계약'
    },
    {
      code: 'business_registration',
      name: '새 기관 사업자등록증',
      mandatory: true,
      description: '새로운 교육기관의 사업자등록증'
    }
  ],

  visa_specific: {
    'D-2': [
      {
        code: 'graduation_certificate',
        name: '졸업증명서',
        mandatory: true,
        alternative: '수료증명서 (박사과정)',
        description: '학위 취득 또는 수료 증빙'
      }
    ],
    'E-2': [
      {
        code: 'teaching_experience_certificate',
        name: '교육경력증명서',
        mandatory: true,
        description: '회화지도 경력 증빙'
      }
    ]
  }
};

/**
 * 국적별 추가 서류
 */
const NATIONALITY_SPECIFIC_DOCUMENTS = {
  criminal_record_required: {
    countries: ['US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'ZA', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'],
    document: {
      code: 'federal_criminal_record',
      name: '연방/전국단위 범죄경력증명서',
      level: 'federal_or_national',
      validity: '6개월 이내',
      apostille: true
    }
  },

  translation_required: {
    non_korean_documents: {
      requirement: '한국어 번역 공증',
      exemptions: ['english_documents_from_english_speaking_countries'],
      description: '비영어권 서류는 한국어 번역 공증 필수'
    }
  }
};

/**
 * 서류 검증 기준
 */
const DOCUMENT_VALIDATION_CRITERIA = {
  apostille: {
    required_for: ['diploma', 'criminal_record'],
    alternative: 'consular_verification',
    exemptions: ['korean_issued_documents']
  },

  validity_periods: {
    'criminal_record': '6개월',
    'health_certificate': '3개월',
    'tax_certificate': '3개월',
    'residence_proof': '3개월'
  },

  issuer_requirements: {
    'diploma': 'accredited_institution',
    'business_registration': 'education_institution',
    'tax_certificate': 'national_tax_service',
    'health_certificate': 'designated_hospital'
  }
};

/**
 * 서류 체크리스트 생성 함수
 */
function generateDocumentChecklist(applicationType, applicantData = {}) {
  const { nationality, currentVisa, hasGraduated } = applicantData;
  
  let documents = {};
  
  switch (applicationType) {
    case 'NEW':
      documents = NEW_APPLICATION_DOCUMENTS;
      break;
    case 'EXTENSION':
      documents = EXTENSION_DOCUMENTS;
      break;
    case 'CHANGE':
      documents = CHANGE_DOCUMENTS;
      break;
    default:
      throw new Error(`지원하지 않는 신청 유형: ${applicationType}`);
  }

  // 국적별 추가 서류
  if (NATIONALITY_SPECIFIC_DOCUMENTS.criminal_record_required.countries.includes(nationality)) {
    documents.additional = documents.additional || [];
    documents.additional.push(NATIONALITY_SPECIFIC_DOCUMENTS.criminal_record_required.document);
  }

  // 비자별 특별 서류 (변경 신청시)
  if (applicationType === 'CHANGE' && CHANGE_DOCUMENTS.visa_specific[currentVisa]) {
    documents.visa_specific = CHANGE_DOCUMENTS.visa_specific[currentVisa];
  }

  return documents;
}

/**
 * 서류 완성도 검증 함수
 */
function validateDocumentCompleteness(submittedDocuments, requiredDocuments) {
  const validation = {
    complete: true,
    missingMandatory: [],
    missingRecommended: [],
    invalidDocuments: [],
    completenessScore: 0
  };

  // 구현 로직...

  return validation;
}

module.exports = {
  NEW_APPLICATION_DOCUMENTS,
  EXTENSION_DOCUMENTS,
  CHANGE_DOCUMENTS,
  NATIONALITY_SPECIFIC_DOCUMENTS,
  DOCUMENT_VALIDATION_CRITERIA,
  generateDocumentChecklist,
  validateDocumentCompleteness
};
