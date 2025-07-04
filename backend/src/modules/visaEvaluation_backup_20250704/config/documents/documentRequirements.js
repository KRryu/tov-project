/**
 * 비자별, 신청 유형별 문서 요구사항 정의
 * 경로: /backend/src/modules/visaEvaluation/config/documents/documentRequirements.js
 */

const { APPLICATION_TYPES } = require('../../core/models/ApplicationType');

/**
 * 문서 유형 정의
 */
const DOCUMENT_TYPES = {
  // 기본 서류
  PASSPORT: 'passport',
  PHOTO: 'photo',
  APPLICATION_FORM: 'application_form',
  
  // 학력 관련
  DIPLOMA: 'diploma',
  TRANSCRIPT: 'transcript',
  DIPLOMA_APOSTILLE: 'diploma_apostille',
  EDUCATION_VERIFICATION: 'education_verification',
  
  // 경력 관련
  EXPERIENCE_CERTIFICATE: 'experience_certificate',
  RECOMMENDATION_LETTER: 'recommendation_letter',
  PORTFOLIO: 'portfolio',
  
  // 고용 관련
  EMPLOYMENT_CONTRACT: 'employment_contract',
  JOB_OFFER: 'job_offer',
  BUSINESS_REGISTRATION: 'business_registration',
  COMPANY_PROFILE: 'company_profile',
  
  // 신원 관련
  CRIMINAL_RECORD: 'criminal_record',
  HEALTH_CERTIFICATE: 'health_certificate',
  FINANCIAL_STATEMENT: 'financial_statement',
  
  // 체류 관련
  CURRENT_VISA_COPY: 'current_visa_copy',
  RESIDENCE_CERTIFICATE: 'residence_certificate',
  TAX_PAYMENT_CERTIFICATE: 'tax_payment_certificate',
  INSURANCE_CERTIFICATE: 'insurance_certificate',
  
  // 특수 서류
  CHANGE_REASON_STATEMENT: 'change_reason_statement',
  RELEASE_LETTER: 'release_letter',
  ATTENDANCE_CERTIFICATE: 'attendance_certificate',
  ACTIVITY_REPORT: 'activity_report'
};

/**
 * 문서 검증 규칙
 */
const VALIDATION_RULES = {
  [DOCUMENT_TYPES.DIPLOMA]: {
    apostille: true,
    translation: true,
    issuedWithin: null, // 제한 없음
    minimumLevel: 'bachelor' // E-1, E-2의 경우
  },
  [DOCUMENT_TYPES.CRIMINAL_RECORD]: {
    apostille: true,
    translation: true,
    issuedWithin: 180, // 180일 이내
    coverage: 'federal' // 연방 단위
  },
  [DOCUMENT_TYPES.HEALTH_CERTIFICATE]: {
    apostille: false,
    translation: true,
    issuedWithin: 90, // 90일 이내
    tests: ['tuberculosis', 'infectious_diseases']
  },
  [DOCUMENT_TYPES.EMPLOYMENT_CONTRACT]: {
    apostille: false,
    translation: true,
    issuedWithin: null,
    minimumSalary: true, // 비자별 최소 급여 확인
    duration: 'minimum_1_year'
  },
  [DOCUMENT_TYPES.TAX_PAYMENT_CERTIFICATE]: {
    apostille: false,
    translation: false,
    issuedWithin: 30, // 30일 이내
    period: 'last_year'
  },
  [DOCUMENT_TYPES.ATTENDANCE_CERTIFICATE]: {
    apostille: false,
    translation: false,
    issuedWithin: 30,
    period: 'last_semester',
    minimumHours: 9 // 주당 최소 9시간
  }
};

/**
 * 비자별 문서 요구사항
 */
const VISA_DOCUMENT_REQUIREMENTS = {
  // E-1 교수 비자
  'E-1': {
    common: [
      DOCUMENT_TYPES.PASSPORT,
      DOCUMENT_TYPES.PHOTO,
      DOCUMENT_TYPES.APPLICATION_FORM
    ],
    
    [APPLICATION_TYPES.NEW]: {
      required: [
        DOCUMENT_TYPES.DIPLOMA,
        DOCUMENT_TYPES.DIPLOMA_APOSTILLE,
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.BUSINESS_REGISTRATION,
        DOCUMENT_TYPES.CRIMINAL_RECORD,
        DOCUMENT_TYPES.HEALTH_CERTIFICATE
      ],
      optional: [
        DOCUMENT_TYPES.RECOMMENDATION_LETTER,
        DOCUMENT_TYPES.PORTFOLIO,
        DOCUMENT_TYPES.TRANSCRIPT
      ],
      alternatives: {
        // 대체 가능한 서류 조합
        education_proof: [
          [DOCUMENT_TYPES.DIPLOMA, DOCUMENT_TYPES.DIPLOMA_APOSTILLE],
          [DOCUMENT_TYPES.EDUCATION_VERIFICATION, DOCUMENT_TYPES.TRANSCRIPT]
        ]
      }
    },
    
    [APPLICATION_TYPES.EXTENSION]: {
      required: [
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.ATTENDANCE_CERTIFICATE,
        DOCUMENT_TYPES.TAX_PAYMENT_CERTIFICATE,
        DOCUMENT_TYPES.RESIDENCE_CERTIFICATE
      ],
      optional: [
        DOCUMENT_TYPES.ACTIVITY_REPORT,
        DOCUMENT_TYPES.RECOMMENDATION_LETTER
      ],
      conditional: {
        // 조건부 필요 서류
        contract_change: [DOCUMENT_TYPES.BUSINESS_REGISTRATION],
        salary_increase: [DOCUMENT_TYPES.FINANCIAL_STATEMENT]
      }
    },
    
    [APPLICATION_TYPES.CHANGE]: {
      required: [
        DOCUMENT_TYPES.CURRENT_VISA_COPY,
        DOCUMENT_TYPES.CHANGE_REASON_STATEMENT,
        DOCUMENT_TYPES.DIPLOMA,
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.RELEASE_LETTER
      ],
      optional: [
        DOCUMENT_TYPES.EXPERIENCE_CERTIFICATE,
        DOCUMENT_TYPES.RECOMMENDATION_LETTER
      ]
    }
  },

  // E-2 회화지도 비자
  'E-2': {
    common: [
      DOCUMENT_TYPES.PASSPORT,
      DOCUMENT_TYPES.PHOTO,
      DOCUMENT_TYPES.APPLICATION_FORM
    ],
    
    [APPLICATION_TYPES.NEW]: {
      required: [
        DOCUMENT_TYPES.DIPLOMA,
        DOCUMENT_TYPES.DIPLOMA_APOSTILLE,
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.CRIMINAL_RECORD,
        DOCUMENT_TYPES.HEALTH_CERTIFICATE,
        DOCUMENT_TYPES.BUSINESS_REGISTRATION
      ],
      optional: [
        DOCUMENT_TYPES.EXPERIENCE_CERTIFICATE,
        DOCUMENT_TYPES.RECOMMENDATION_LETTER
      ],
      nationality_specific: {
        // 국적별 추가 요구사항
        non_native: [
          'english_proficiency_certificate',
          'native_speaker_verification'
        ]
      }
    },
    
    [APPLICATION_TYPES.EXTENSION]: {
      required: [
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.ATTENDANCE_CERTIFICATE,
        DOCUMENT_TYPES.TAX_PAYMENT_CERTIFICATE,
        DOCUMENT_TYPES.RESIDENCE_CERTIFICATE
      ],
      optional: [
        'student_evaluation_report',
        DOCUMENT_TYPES.ACTIVITY_REPORT
      ]
    },
    
    [APPLICATION_TYPES.CHANGE]: {
      required: [
        DOCUMENT_TYPES.CURRENT_VISA_COPY,
        DOCUMENT_TYPES.CHANGE_REASON_STATEMENT,
        DOCUMENT_TYPES.DIPLOMA,
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.RELEASE_LETTER
      ],
      optional: [
        DOCUMENT_TYPES.EXPERIENCE_CERTIFICATE
      ]
    }
  },

  // E-7 특정활동 비자
  'E-7': {
    common: [
      DOCUMENT_TYPES.PASSPORT,
      DOCUMENT_TYPES.PHOTO,
      DOCUMENT_TYPES.APPLICATION_FORM
    ],
    
    [APPLICATION_TYPES.NEW]: {
      required: [
        DOCUMENT_TYPES.DIPLOMA,
        DOCUMENT_TYPES.EXPERIENCE_CERTIFICATE,
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.BUSINESS_REGISTRATION,
        DOCUMENT_TYPES.CRIMINAL_RECORD
      ],
      optional: [
        DOCUMENT_TYPES.PORTFOLIO,
        DOCUMENT_TYPES.RECOMMENDATION_LETTER,
        'skill_certification'
      ],
      field_specific: {
        // 분야별 추가 요구사항
        it: ['technical_certification', 'project_portfolio'],
        engineering: ['license_certificate', 'project_experience'],
        finance: ['financial_license', 'work_experience']
      }
    },
    
    [APPLICATION_TYPES.EXTENSION]: {
      required: [
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        'work_performance_report',
        DOCUMENT_TYPES.TAX_PAYMENT_CERTIFICATE,
        DOCUMENT_TYPES.INSURANCE_CERTIFICATE
      ],
      optional: [
        'performance_evaluation',
        'salary_certificate'
      ]
    },
    
    [APPLICATION_TYPES.CHANGE]: {
      required: [
        DOCUMENT_TYPES.CURRENT_VISA_COPY,
        DOCUMENT_TYPES.CHANGE_REASON_STATEMENT,
        DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
        DOCUMENT_TYPES.EXPERIENCE_CERTIFICATE,
        DOCUMENT_TYPES.RELEASE_LETTER
      ],
      optional: [
        'career_development_plan',
        DOCUMENT_TYPES.RECOMMENDATION_LETTER
      ]
    }
  },

  // D-2 유학 비자
  'D-2': {
    common: [
      DOCUMENT_TYPES.PASSPORT,
      DOCUMENT_TYPES.PHOTO,
      DOCUMENT_TYPES.APPLICATION_FORM
    ],
    
    [APPLICATION_TYPES.NEW]: {
      required: [
        'admission_letter',
        'tuition_payment_certificate',
        DOCUMENT_TYPES.FINANCIAL_STATEMENT,
        DOCUMENT_TYPES.DIPLOMA,
        DOCUMENT_TYPES.CRIMINAL_RECORD,
        DOCUMENT_TYPES.HEALTH_CERTIFICATE
      ],
      optional: [
        'study_plan',
        'language_proficiency_certificate',
        'scholarship_certificate'
      ]
    },
    
    [APPLICATION_TYPES.EXTENSION]: {
      required: [
        'enrollment_certificate',
        'academic_transcript',
        'tuition_payment_certificate',
        DOCUMENT_TYPES.FINANCIAL_STATEMENT,
        DOCUMENT_TYPES.RESIDENCE_CERTIFICATE
      ],
      optional: [
        'academic_advisor_letter',
        'thesis_progress_report'
      ]
    },
    
    [APPLICATION_TYPES.CHANGE]: {
      required: [
        DOCUMENT_TYPES.CURRENT_VISA_COPY,
        DOCUMENT_TYPES.CHANGE_REASON_STATEMENT,
        'new_admission_letter',
        'academic_transcript',
        'transfer_approval_letter'
      ]
    }
  },

  // F-2 거주 비자
  'F-2': {
    common: [
      DOCUMENT_TYPES.PASSPORT,
      DOCUMENT_TYPES.PHOTO,
      DOCUMENT_TYPES.APPLICATION_FORM
    ],
    
    [APPLICATION_TYPES.NEW]: {
      required: [
        'points_calculation_sheet',
        DOCUMENT_TYPES.DIPLOMA,
        DOCUMENT_TYPES.EXPERIENCE_CERTIFICATE,
        'korean_language_certificate',
        DOCUMENT_TYPES.CRIMINAL_RECORD,
        DOCUMENT_TYPES.FINANCIAL_STATEMENT
      ],
      optional: [
        'spouse_information',
        'property_certificate',
        'investment_certificate'
      ]
    },
    
    [APPLICATION_TYPES.EXTENSION]: {
      required: [
        DOCUMENT_TYPES.RESIDENCE_CERTIFICATE,
        DOCUMENT_TYPES.TAX_PAYMENT_CERTIFICATE,
        DOCUMENT_TYPES.INSURANCE_CERTIFICATE,
        'activity_certificate'
      ],
      optional: [
        'employment_certificate',
        'business_registration'
      ]
    },
    
    [APPLICATION_TYPES.CHANGE]: {
      required: [
        DOCUMENT_TYPES.CURRENT_VISA_COPY,
        DOCUMENT_TYPES.CHANGE_REASON_STATEMENT,
        'points_calculation_sheet',
        'stay_period_certificate'
      ]
    }
  }
};

/**
 * 문서 검증 클래스
 */
class DocumentValidator {
  constructor() {
    this.requirements = VISA_DOCUMENT_REQUIREMENTS;
    this.validationRules = VALIDATION_RULES;
  }

  /**
   * 문서 요구사항 검증
   */
  validateDocuments(visaType, applicationType, submittedDocuments, applicantData = {}) {
    const requirements = this.getDocumentRequirements(visaType, applicationType, applicantData);
    
    const validation = {
      isValid: true,
      score: 100,
      missing: [],
      invalid: [],
      warnings: [],
      recommendations: [],
      completeness: 0
    };

    // 필수 문서 확인
    const allRequired = [...requirements.common, ...requirements.required];
    let submittedCount = 0;

    allRequired.forEach(docType => {
      if (submittedDocuments[docType]) {
        submittedCount++;
        // 개별 문서 검증
        const docValidation = this.validateIndividualDocument(docType, submittedDocuments[docType]);
        if (!docValidation.isValid) {
          validation.invalid.push({
            document: docType,
            issues: docValidation.issues
          });
          validation.score -= 10;
        }
      } else {
        validation.missing.push(docType);
        validation.score -= 15;
        validation.isValid = false;
      }
    });

    // 완성도 계산
    validation.completeness = (submittedCount / allRequired.length) * 100;

    // 선택 문서 확인 (보너스 점수)
    requirements.optional.forEach(docType => {
      if (submittedDocuments[docType]) {
        validation.score += 2;
      }
    });

    // 조건부 문서 확인
    if (requirements.conditional) {
      Object.entries(requirements.conditional).forEach(([condition, docs]) => {
        if (this.checkCondition(condition, applicantData)) {
          docs.forEach(docType => {
            if (!submittedDocuments[docType]) {
              validation.missing.push(`${docType} (조건부 필요)`);
              validation.score -= 10;
            }
          });
        }
      });
    }

    // 최종 점수 조정
    validation.score = Math.max(0, Math.min(100, validation.score));

    // 추천사항 생성
    validation.recommendations = this.generateRecommendations(validation, requirements);

    return validation;
  }

  /**
   * 문서 요구사항 조회
   */
  getDocumentRequirements(visaType, applicationType, applicantData = {}) {
    const visaRequirements = this.requirements[visaType];
    if (!visaRequirements) {
      throw new Error(`지원되지 않는 비자 타입: ${visaType}`);
    }

    const common = visaRequirements.common || [];
    const typeSpecific = visaRequirements[applicationType] || { required: [], optional: [] };

    let requirements = {
      common,
      required: typeSpecific.required || [],
      optional: typeSpecific.optional || [],
      conditional: typeSpecific.conditional || {},
      alternatives: typeSpecific.alternatives || {}
    };

    // 국적별 추가 요구사항
    if (typeSpecific.nationality_specific && applicantData.nationality) {
      const nationalityReqs = this.getNationalitySpecificRequirements(
        typeSpecific.nationality_specific, 
        applicantData.nationality
      );
      requirements.required = [...requirements.required, ...nationalityReqs];
    }

    // 분야별 추가 요구사항 (E-7 등)
    if (typeSpecific.field_specific && applicantData.field) {
      const fieldReqs = typeSpecific.field_specific[applicantData.field] || [];
      requirements.required = [...requirements.required, ...fieldReqs];
    }

    return requirements;
  }

  /**
   * 개별 문서 검증
   */
  validateIndividualDocument(docType, documentInfo) {
    const rules = this.validationRules[docType];
    const validation = { isValid: true, issues: [] };

    if (!rules) {
      return validation; // 규칙이 없으면 통과
    }

    // 아포스티유 확인
    if (rules.apostille && !documentInfo.apostilled) {
      validation.isValid = false;
      validation.issues.push('아포스티유 인증 필요');
    }

    // 번역 확인
    if (rules.translation && !documentInfo.translated) {
      validation.isValid = false;
      validation.issues.push('공식 번역 필요');
    }

    // 발급일 확인
    if (rules.issuedWithin && documentInfo.issuedDate) {
      const daysDiff = (new Date() - new Date(documentInfo.issuedDate)) / (1000 * 60 * 60 * 24);
      if (daysDiff > rules.issuedWithin) {
        validation.isValid = false;
        validation.issues.push(`${rules.issuedWithin}일 이내 발급 서류 필요`);
      }
    }

    // 특수 검증
    this.performSpecialValidation(docType, documentInfo, rules, validation);

    return validation;
  }

  /**
   * 특수 검증 로직
   */
  performSpecialValidation(docType, documentInfo, rules, validation) {
    switch (docType) {
      case DOCUMENT_TYPES.EMPLOYMENT_CONTRACT:
        if (rules.minimumSalary && documentInfo.salary) {
          // 최소 급여 확인 로직
          if (documentInfo.salary < this.getMinimumSalary(documentInfo.visaType)) {
            validation.isValid = false;
            validation.issues.push('최소 급여 기준 미달');
          }
        }
        break;

      case DOCUMENT_TYPES.ATTENDANCE_CERTIFICATE:
        if (rules.minimumHours && documentInfo.hoursPerWeek < rules.minimumHours) {
          validation.isValid = false;
          validation.issues.push(`주당 최소 ${rules.minimumHours}시간 필요`);
        }
        break;

      case DOCUMENT_TYPES.HEALTH_CERTIFICATE:
        if (rules.tests && documentInfo.tests) {
          const missingTests = rules.tests.filter(test => !documentInfo.tests.includes(test));
          if (missingTests.length > 0) {
            validation.isValid = false;
            validation.issues.push(`필수 검사 누락: ${missingTests.join(', ')}`);
          }
        }
        break;
    }
  }

  /**
   * 조건 확인
   */
  checkCondition(condition, applicantData) {
    switch (condition) {
      case 'contract_change':
        return applicantData.contractChanged === true;
      case 'salary_increase':
        return applicantData.salaryIncreased === true;
      default:
        return false;
    }
  }

  /**
   * 국적별 요구사항 조회
   */
  getNationalitySpecificRequirements(nationalityRequirements, nationality) {
    const nativeEnglishCountries = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'];
    
    if (nationalityRequirements.non_native && !nativeEnglishCountries.includes(nationality)) {
      return nationalityRequirements.non_native;
    }
    
    return [];
  }

  /**
   * 최소 급여 기준 조회
   */
  getMinimumSalary(visaType) {
    const minimumSalaries = {
      'E-1': 2500000,  // 250만원
      'E-2': 2200000,  // 220만원
      'E-7': 2800000   // 280만원
    };
    
    return minimumSalaries[visaType] || 2000000;
  }

  /**
   * 추천사항 생성
   */
  generateRecommendations(validation, requirements) {
    const recommendations = [];

    // 필수 문서 누락
    if (validation.missing.length > 0) {
      recommendations.push({
        type: 'MISSING_DOCUMENTS',
        priority: 'HIGH',
        message: '필수 서류를 제출해주세요.',
        documents: validation.missing
      });
    }

    // 문서 오류
    if (validation.invalid.length > 0) {
      recommendations.push({
        type: 'INVALID_DOCUMENTS',
        priority: 'HIGH',
        message: '서류 오류를 수정해주세요.',
        issues: validation.invalid
      });
    }

    // 선택 문서 추천
    if (requirements.optional.length > 0) {
      recommendations.push({
        type: 'OPTIONAL_DOCUMENTS',
        priority: 'LOW',
        message: '추가 서류 제출로 평가를 개선할 수 있습니다.',
        documents: requirements.optional
      });
    }

    return recommendations;
  }

  /**
   * 문서 체크리스트 생성
   */
  generateDocumentChecklist(visaType, applicationType, applicantData = {}) {
    const requirements = this.getDocumentRequirements(visaType, applicationType, applicantData);
    
    const checklist = {
      essential: [],
      optional: [],
      conditional: []
    };

    // 필수 문서
    [...requirements.common, ...requirements.required].forEach(docType => {
      checklist.essential.push({
        type: docType,
        name: this.getDocumentName(docType),
        description: this.getDocumentDescription(docType),
        validationRules: this.validationRules[docType] || {}
      });
    });

    // 선택 문서
    requirements.optional.forEach(docType => {
      checklist.optional.push({
        type: docType,
        name: this.getDocumentName(docType),
        description: this.getDocumentDescription(docType),
        benefit: '추가 점수 획득 가능'
      });
    });

    // 조건부 문서
    Object.entries(requirements.conditional).forEach(([condition, docs]) => {
      docs.forEach(docType => {
        checklist.conditional.push({
          type: docType,
          name: this.getDocumentName(docType),
          condition: this.getConditionDescription(condition),
          description: this.getDocumentDescription(docType)
        });
      });
    });

    return checklist;
  }

  /**
   * 문서명 조회
   */
  getDocumentName(docType) {
    const names = {
      [DOCUMENT_TYPES.PASSPORT]: '여권',
      [DOCUMENT_TYPES.PHOTO]: '증명사진',
      [DOCUMENT_TYPES.APPLICATION_FORM]: '비자 신청서',
      [DOCUMENT_TYPES.DIPLOMA]: '학위증명서',
      [DOCUMENT_TYPES.DIPLOMA_APOSTILLE]: '학위증명서 아포스티유',
      [DOCUMENT_TYPES.EMPLOYMENT_CONTRACT]: '고용계약서',
      [DOCUMENT_TYPES.CRIMINAL_RECORD]: '범죄경력증명서',
      [DOCUMENT_TYPES.HEALTH_CERTIFICATE]: '건강진단서',
      [DOCUMENT_TYPES.BUSINESS_REGISTRATION]: '사업자등록증',
      [DOCUMENT_TYPES.TAX_PAYMENT_CERTIFICATE]: '납세증명서',
      [DOCUMENT_TYPES.ATTENDANCE_CERTIFICATE]: '출강증명서',
      [DOCUMENT_TYPES.RESIDENCE_CERTIFICATE]: '거주지 증명서',
      [DOCUMENT_TYPES.CURRENT_VISA_COPY]: '현재 비자 사본',
      [DOCUMENT_TYPES.CHANGE_REASON_STATEMENT]: '변경사유서',
      [DOCUMENT_TYPES.RELEASE_LETTER]: '원직장 해지확인서'
    };
    
    return names[docType] || docType;
  }

  /**
   * 문서 설명 조회
   */
  getDocumentDescription(docType) {
    const descriptions = {
      [DOCUMENT_TYPES.DIPLOMA_APOSTILLE]: '외국 대학 학위의 경우 해당 국가 정부의 아포스티유 인증 필요',
      [DOCUMENT_TYPES.CRIMINAL_RECORD]: '본국 및 거주국에서 발급한 범죄경력증명서 (180일 이내 발급)',
      [DOCUMENT_TYPES.HEALTH_CERTIFICATE]: '결핵, 전염병 검사 포함 (90일 이내 발급)',
      [DOCUMENT_TYPES.ATTENDANCE_CERTIFICATE]: '최근 학기 출강증명서 (주당 최소 9시간)',
      [DOCUMENT_TYPES.TAX_PAYMENT_CERTIFICATE]: '최근 1년간 납세증명서 (30일 이내 발급)'
    };
    
    return descriptions[docType] || '';
  }

  /**
   * 조건 설명 조회
   */
  getConditionDescription(condition) {
    const descriptions = {
      contract_change: '고용계약 변경 시',
      salary_increase: '급여 인상 시'
    };
    
    return descriptions[condition] || condition;
  }
}

module.exports = {
  DOCUMENT_TYPES,
  VALIDATION_RULES,
  VISA_DOCUMENT_REQUIREMENTS,
  DocumentValidator
}; 