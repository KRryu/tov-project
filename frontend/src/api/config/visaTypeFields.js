/**
 * 비자 유형별 필드 정의
 * 형식: E-1 (하이픈 있는 형식으로 통일)
 */
export const VISA_TYPE_FIELDS = {
  'E-1': {
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
      'contractPeriod'
    ]
  },
  'E-2': {
    required: [
      'educationLevel',
      'teachingExperienceYears',
      'institutionType'
    ],
    optional: [
      'teachingCertification',
      'salary',
      'contractPeriod'
    ]
  }
};

/**
 * 비자 유형별 필수 문서 요구사항
 */
export const VISA_DOCUMENT_REQUIREMENTS = {
  'E-1': [
    'passport',
    'photo',
    'degreeDocument',
    'careerDocument',
    'employmentContract',
    'companyRegistration'
  ],
  'E-2': [
    'passport',
    'photo',
    'criminalRecord',
    'healthCertificate',
    'degreeDocument',
    'employmentContract'
  ]
};

/**
 * 비자 유형별 평가 기준
 */
export const VISA_EVALUATION_CRITERIA = {
  'E-1': {
    educationLevel: {
      'PhD': 30,
      'Masters': 20,
      'Bachelors': 10
    },
    experienceYears: {
      perYear: 2,
      maxYears: 10
    },
    publications: {
      perPublication: 3,
      maxPublications: 10
    }
  },
  'E-2': {
    educationLevel: {
      'Bachelors': 25,
      'Associates': 10
    },
    teachingExperienceYears: {
      perYear: 5,
      maxYears: 5
    },
    teachingCertification: {
      value: 15
    }
  }
};

/**
 * 행정 섹션 필수 필드
 */
export const ADMINISTRATIVE_REQUIRED_FIELDS = [
  'fullName',
  'nationality',
  'email',
  'phone'
];

/**
 * 행정 섹션 선택 필드
 */
export const ADMINISTRATIVE_OPTIONAL_FIELDS = [
  'birthDate',
  'passportNumber',
  'currentVisaStatus',
  'currentVisaType',
  'visaExpiryDate',
  'alienRegistrationNumber',
  'currentCity',
  'stayDurationYears',
  'visaApplicationPurpose'
];

export default VISA_TYPE_FIELDS; 