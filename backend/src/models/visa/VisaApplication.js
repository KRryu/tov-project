const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { normalizeVisaType } = require('../../utils/visaType');

// 지원되는 비자 타입 정의 (하이픈 형식으로 통일)
const SUPPORTED_VISA_TYPES = ['E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9', 'D-1', 'D-2', 'D-3', 'D-4', 'D-5', 'D-6', 'D-7', 'D-8', 'D-9', 'D-10'];

// 비자 타입별 필수 문서 정의 (하이픈 형식으로 통일)
const REQUIRED_DOCUMENTS = {
  'E-1': ['passport', 'photo', 'diploma', 'employment_contract', 'research_paper', 'publications'],
  'E-2': ['passport', 'photo', 'diploma', 'employment_contract', 'criminal_record'],
  'E-3': ['passport', 'photo', 'diploma', 'employment_contract', 'research_paper', 'publications', 'patent', 'project_plan'],
  'E-4': ['passport', 'photo', 'degree_certificate', 'career_certificate', 
          'technical_contract', 'project_description', 'company_registration'],
  'E-6': [],
  'E-7': [],
  'E-8': [],
  'E-9': [],
  // 다른 비자 타입들의 필수 문서는 필요에 따라 추가
};

// 비자 타입별 필수 평가 필드 정의 (하이픈 형식으로 통일)
const REQUIRED_EVALUATION_FIELDS = {
  'E-1': ['educationLevel', 'experienceYears', 'publications', 'institutionType', 'institution', 'position', 'researchField'],
  'E-2': ['educationLevel', 'teachingExperienceYears', 'institutionType', 'nationality'],
  'E-3': ['educationLevel', 'researchExperienceYears', 'researchField', 'position', 'publications', 'patents', 'institutionType', 'salary', 'contractPeriod'],
  'E-4': ['educationLevel', 'experienceYears', 'technologyField', 
          'contractPeriod', 'contractValue', 'serviceType', 'organizationType'],
  // 다른 비자 타입들의 필수 평가 필드는 필요에 따라 추가
};

// 비자 타입별 필드 정의를 visaTypeFields.js와 일치시키기 (하이픈 형식으로 통일)
const VISA_FIELDS = {
  'E-1': {
    evaluation: {
      required: [
        'educationLevel',
        'experienceYears',
        'publications',
        'institutionType',
        'institution',
        'position',
        'researchField'
      ],
      optional: [
        'salary',
        'contractPeriod',
        'teachingQualification',
        'institutionRecommendation',
        'hasInstitutionRecommendation',
        'institutionRanking',
        'internationalPublications',
        'hasPresidentRecommendation',
        'hasTeachingCertificate',
        'experienceTypes'
      ]
    },
    administrative: {
      required: [
        'fullName',
        'nationality',
        'email',
        'phone',
        'currentCity'
      ],
      optional: [
        'birthDate',
        'passportNumber',
        'currentVisaStatus',
        'visaApplicationPurpose',
        'currentVisaType',
        'visaExpiryDate',
        'alienRegistrationNumber',
        'stayDurationYears'
      ]
    }
  },
  'E-2': {
    evaluation: {
      required: [
        'educationLevel',
        'experienceYears',        // teachingExperienceYears 대신
        'institutionType',
        'language',               // 추가
        'citizenship'             // nationality 대신 citizenship
      ],
      optional: [
        'teachingExperience',
        'teachingCertificates',   // certification 대신
        'isNativeSpeaker',
        'programType',
        'hasGovernmentInvitation',
        'salary',
        'contractPeriod',
        'hasCriminalRecord',
        'criminalRecordDetails',
        'hasHealthCheck',
        'healthIssues',
        'majorField',
        'koreanLevel',
        'languageLevel',
        'languageCertification',
        'languageScore'
      ]
    },
    administrative: {
      required: [
        'fullName',
        'nationality',
        'email',
        'phone',
        'currentCity'
      ],
      optional: [
        'birthDate',
        'passportNumber',
        'currentVisaStatus',
        'visaApplicationPurpose',
        'currentVisaType',
        'visaExpiryDate',
        'alienRegistrationNumber',
        'stayDurationYears'
      ]
    }
  },
  'E-3': {
    evaluation: {
      required: [
        'educationLevel',
        'experienceYears',        // researchExperienceYears 대신 통일
        'researchField',
        'position',
        'institutionType',
        'salary',
        'contractPeriod'
      ],
      optional: [
        'publications',           // 배열로 처리
        'internationalActivities', // 배열로 처리
        'projects',               // 배열로 처리
        'patents',
        'experienceTypes',
        'previousVisaTypes',
        'hasAccreditation',
        'institutionRanking',
        'topikLevel',
        'canCommunicate',
        'researchExperienceYears' // 호환성 위해 유지
      ]
    },
    administrative: {
      required: [
        'fullName',
        'nationality',
        'email',
        'phone',
        'currentCity'
      ],
      optional: [
        'birthDate',
        'passportNumber',
        'currentVisaStatus',
        'visaApplicationPurpose',
        'currentVisaType',
        'visaExpiryDate',
        'alienRegistrationNumber',
        'stayDurationYears'
      ]
    }
  },
  'E-4': {
    evaluation: {
      required: [
        'educationLevel',
        'experienceYears',
        'expertiseLevel',
        'koreanCompanyNeed',
        'technologyField',
        'contractPeriod',
        'contractValue',
        'serviceType',
        'organizationType'
      ],
      optional: [
        'relevantExperience',
        'internationalExperience',
        'hasCertifications',
        'hasPatents',
        'hasGoldCard',
        'hasGovernmentApproval',
        'isNationalProject',
        'hasPreviousE4',
        'previousStayMonths',
        'hasViolations'
      ]
    },
    administrative: {
      required: [
        'fullName',
        'nationality',
        'email',
        'phone',
        'currentCity'
      ],
      optional: [
        'birthDate',
        'passportNumber',
        'currentVisaStatus',
        'visaApplicationPurpose',
        'currentVisaType',
        'visaExpiryDate',
        'alienRegistrationNumber',
        'stayDurationYears'
      ]
    }
  },
  'E-5': {
    evaluation: {
      required: [
        'licenseType',
        'nationality',
        'koreanExamPassed',
        'licenseIssueCountry',
        'licenseIssueDate',
        'experienceYears',
        'koreanExperienceYears',
        'majorFirmExperience',
        'experienceField',
        'educationLevel',
        'major',
        'prestigiousUniversity',
        'expectedIncome',
        'topikLevel',
        'koreanBusinessLevel'
      ],
      optional: []
    },
    administrative: {
      required: [
        'fullName',
        'nationality',
        'email',
        'phone',
        'currentCity'
      ],
      optional: [
        'birthDate',
        'passportNumber',
        'currentVisaStatus',
        'visaApplicationPurpose',
        'currentVisaType',
        'visaExpiryDate',
        'alienRegistrationNumber',
        'stayDurationYears'
      ]
    }
  },
  'E5': {
    evaluation: {
      required: [
        'licenseType',
        'nationality',
        'koreanExamPassed',
        'licenseIssueCountry',
        'licenseIssueDate',
        'experienceYears',
        'koreanExperienceYears',
        'majorFirmExperience',
        'experienceField',
        'educationLevel',
        'major',
        'prestigiousUniversity',
        'expectedIncome',
        'topikLevel',
        'koreanBusinessLevel'
      ],
      optional: []
    },
    administrative: {
      required: [
        'fullName',
        'nationality',
        'email',
        'phone',
        'currentCity'
      ],
      optional: [
        'birthDate',
        'passportNumber',
        'currentVisaStatus',
        'visaApplicationPurpose',
        'currentVisaType',
        'visaExpiryDate',
        'alienRegistrationNumber',
        'stayDurationYears'
      ]
    }
  },
  'E-6': {
    evaluation: { required: [], optional: [] },
    administrative: {
      required: ['fullName', 'nationality', 'email', 'phone', 'currentCity'],
      optional: []
    }
  },
  'E-7': {
    evaluation: { required: [], optional: [] },
    administrative: {
      required: ['fullName', 'nationality', 'email', 'phone', 'currentCity'],
      optional: []
    }
  },
  'E-8': {
    evaluation: { required: [], optional: [] },
    administrative: {
      required: ['fullName', 'nationality', 'email', 'phone', 'currentCity'],
      optional: []
    }
  },
  'E-9': {
    evaluation: { required: [], optional: [] },
    administrative: {
      required: ['fullName', 'nationality', 'email', 'phone', 'currentCity'],
      optional: []
    }
  },
};

// 상태 코드 정의
const APPLICATION_STATUS = {
  DRAFT: 'DRAFT',                           // 초안
  SUBMITTED: 'SUBMITTED',                   // 제출됨
  REVIEWING: 'REVIEWING',                   // 검토 중
  ADDITIONAL_INFO_REQUIRED: 'ADDITIONAL_INFO_REQUIRED', // 추가 정보 필요
  APPROVED: 'APPROVED',                     // 승인됨
  REJECTED: 'REJECTED',                     // 거절됨
  COMPLETED: 'COMPLETED'                    // 완료됨
};

// 평가 상태 정의
const EVALUATION_STATUS = {
  QUALIFIED: 'QUALIFIED',           // 자격 있음
  UNQUALIFIED: 'UNQUALIFIED',      // 자격 없음
  REVIEW_REQUIRED: 'REVIEW_REQUIRED' // 검토 필요
};

const visaApplicationSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 기본 비자 정보
  visaType: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return SUPPORTED_VISA_TYPES.includes(v);
      },
      message: props => `${props.value}는 지원되지 않는 비자 타입입니다.`
    }
  },
  // 사용자 기본 정보
  personalInfo: {
    fullName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    nationality: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    passportNumber: { type: String },
    currentVisaStatus: { type: String }
  },
  // 평가 데이터: 동적 구조 (공통)
  evaluationData: {
    type: Schema.Types.Mixed,
    default: {},
    validate: {
      validator: function(v) {
        if (!this.visaType) return true;
        const fields = VISA_FIELDS[this.visaType]?.evaluation;
        if (!fields) return true;
        return fields.required.every(field => v && v[field] !== undefined && v[field] !== null);
      },
      message: function(props) {
        // props.parent() 대신 this 사용
        const visaType = this.visaType || (this.parent && this.parent().visaType);
        const fields = VISA_FIELDS[visaType]?.evaluation;
        const missing = fields ? fields.required.filter(f => !props.value || props.value[f] === undefined || props.value[f] === null) : [];
        return `다음 필수 평가 필드가 누락되었습니다: ${missing.join(', ')}`;
      }
    }
  },
  // 행정 데이터 스키마 수정
  administrativeData: {
    type: new Schema({
      // 필수 필드
      fullName: { type: String, required: true },
      nationality: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      currentCity: { type: String, required: true },
      // 선택 필드
      birthDate: { type: Date },
      passportNumber: { type: String },
      currentVisaStatus: { type: String },
      visaApplicationPurpose: { type: String },
      currentVisaType: { type: String },
      visaExpiryDate: { type: Date },
      alienRegistrationNumber: { type: String },
      stayDurationYears: { type: Number }
    }, { _id: false }),
    validate: {
      validator: function(v) {
        if (!this.visaType) return true;
        const fields = VISA_FIELDS[this.visaType]?.administrative;
        if (!fields) return true;
        
        return fields.required.every(field => {
          return v && v[field] !== undefined && v[field] !== null;
        });
      }
    }
  },
  // 평가 결과: 동적 구조 (공통)
  evaluationResult: {
    type: Schema.Types.Mixed,
    default: {}
  },
  // 문서 관리
  documents: [{
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    documentType: { 
      type: String, 
      enum: ['passport', 'education', 'employment_certificate', 'resume', 'research_paper', 'recommendation', 'other', 'photo', 'diploma', 'degree', 'admission_letter', 'transcript', 'bank_statement', 'employment_contract', 'business_registration', 'career_certificate', 'visa_application_form', 'publication_list', 'teaching_certificate', 'institution_registration', 'contract_document', 'income_certificate', 'invitation_letter', 'application_form', 'publications', 'institution_certificate', 'patent', 'project_plan', 'research_proposal', 'research_certificate'],
      default: 'other'
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING'
    }
  }],
  // 상태 관리
  status: {
    type: String,
    enum: Object.values(APPLICATION_STATUS),
    default: APPLICATION_STATUS.DRAFT
  },
  // 메타데이터
  metadata: {
    lastModifiedBy: String,
    version: { type: Number, default: 1 },
    source: { type: String, default: 'WEB' },
    ipAddress: String,
    userAgent: String,
    evaluationVersion: {
      type: String,
      default: '1.0'
    }
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date }
}, { 
  timestamps: true,
  strict: false // 동적 필드 허용
});

// 상수 export
visaApplicationSchema.statics.APPLICATION_STATUS = APPLICATION_STATUS;
visaApplicationSchema.statics.EVALUATION_STATUS = EVALUATION_STATUS;
visaApplicationSchema.statics.SUPPORTED_VISA_TYPES = SUPPORTED_VISA_TYPES;
visaApplicationSchema.statics.REQUIRED_DOCUMENTS = REQUIRED_DOCUMENTS;
visaApplicationSchema.statics.REQUIRED_EVALUATION_FIELDS = REQUIRED_EVALUATION_FIELDS;
visaApplicationSchema.statics.VISA_FIELDS = VISA_FIELDS;

// 비자 신청 상태 변경 메서드
visaApplicationSchema.methods.updateStatus = function(newStatus, metadata = {}) {
  this.status = newStatus;
  this.updatedAt = new Date();
  this.metadata = { ...this.metadata, ...metadata };
  return this.save();
};

// 평가 데이터 업데이트 메서드
visaApplicationSchema.methods.updateEvaluationData = function(data) {
  this.evaluationData = {
    ...this.evaluationData,
    ...data
  };
  this.updatedAt = new Date();
  return this.save();
};

// 행정 데이터 업데이트 메서드
visaApplicationSchema.methods.updateAdministrativeData = function(data) {
  this.administrativeData = {
    ...this.administrativeData,
    ...data
  };
  this.updatedAt = new Date();
  return this.save();
};

// 문서 추가 메서드
visaApplicationSchema.methods.addDocument = function(document) {
  // 문서 유형이 필수인지 확인
  const requiredDocs = REQUIRED_DOCUMENTS[this.visaType] || [];
  document.isRequired = requiredDocs.includes(document.documentType);
  
  this.documents.push(document);
  this.updatedAt = new Date();
  return this.save();
};

// 가상 필드: 제출 후 경과 시간 (일)
visaApplicationSchema.virtual('daysSinceSubmission').get(function() {
  if (!this.submittedAt) return null;
  const diffTime = Date.now() - this.submittedAt.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// 인덱스 설정
visaApplicationSchema.index({ userId: 1, status: 1 });
visaApplicationSchema.index({ visaType: 1 });
visaApplicationSchema.index({ createdAt: -1 });

// 영어권 국가 확인 함수
visaApplicationSchema.statics.isEnglishSpeakingCountry = function(nationality) {
  if (!nationality) return false;
  
  const englishSpeakingCountries = [
    'usa', 'uk', 'canada', 'australia', 'new zealand', 'ireland', 'south africa'
  ];
  
  return englishSpeakingCountries.includes(nationality.toLowerCase().trim());
};

// 저장 전 미들웨어: 특화 처리 제거 (통일)
visaApplicationSchema.pre('save', function(next) { next(); });

// 누락 필드 검사 static 메소드
visaApplicationSchema.statics.getMissingFields = function(visaType, evaluationData = {}, administrativeData = {}) {
  const normalizedType = normalizeVisaType(visaType);
  const visaFields = this.VISA_FIELDS[normalizedType];
  if (!visaFields) {
    return { missingEvaluation: [], missingAdministrative: [] };
  }
  const missingEvaluation = visaFields.evaluation.required.filter(field => {
    const value = evaluationData[field];
    return value === undefined || value === null || value === '';
  });
  const missingAdministrative = visaFields.administrative.required.filter(field => {
    const value = administrativeData[field];
    return value === undefined || value === null || value === '';
  });
  return { missingEvaluation, missingAdministrative };
};

const VisaApplication = mongoose.model('VisaApplication', visaApplicationSchema);

module.exports = VisaApplication; 