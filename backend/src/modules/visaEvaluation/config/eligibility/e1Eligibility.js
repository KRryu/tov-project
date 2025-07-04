/**
 * E-1 비자 자격 요건 설정 (매뉴얼 기준)
 * 경로: /backend/src/modules/visaEvaluation/config/eligibility/e1Eligibility.js
 */

/**
 * 직급별 자격 요건 매트릭스 (매뉴얼 정확 반영)
 */
const POSITION_QUALIFICATION_MATRIX = {
  '교수': {
    '전문대학원': { 
      minimumDegree: 'bachelor',
      minimumExperience: 4,
      preferredDegree: 'phd',
      description: '학사학위 + 교육/연구경력 4년 이상'
    },
    '대학교원': { 
      minimumDegree: 'master',
      minimumExperience: 10,
      preferredDegree: 'phd',
      description: '석사학위 + 교육/연구경력 10년 이상'
    },
    '전문대학': { 
      minimumDegree: 'master',
      minimumExperience: 5,
      preferredDegree: 'phd',
      description: '석사학위 + 교육/연구경력 5년 이상'
    }
  },
  
  '부교수': {
    '전문대학원': { 
      minimumDegree: 'bachelor',
      minimumExperience: 3,
      preferredDegree: 'master',
      description: '학사학위 + 교육/연구경력 3년 이상'
    },
    '대학교원': { 
      minimumDegree: 'master',
      minimumExperience: 4,
      preferredDegree: 'phd',
      description: '석사학위 + 교육/연구경력 4년 이상'
    },
    '전문대학': { 
      minimumDegree: 'master',
      minimumExperience: 4,
      preferredDegree: 'phd',
      description: '석사학위 + 교육/연구경력 4년 이상'
    }
  },
  
  '조교수': {
    '전문대학원': { 
      minimumDegree: 'bachelor',
      minimumExperience: 2,
      preferredDegree: 'master',
      description: '학사학위 + 교육/연구경력 2년 이상'
    },
    '대학교원': { 
      minimumDegree: 'master',
      minimumExperience: 2,
      preferredDegree: 'phd',
      description: '석사학위 + 교육/연구경력 2년 이상'
    },
    '전문대학': { 
      minimumDegree: 'master',
      minimumExperience: 3,
      preferredDegree: 'phd',
      description: '석사학위 + 교육/연구경력 3년 이상'
    }
  },
  
  '강사': {
    '전문대학원': { 
      minimumDegree: 'bachelor',
      minimumExperience: 1,
      preferredDegree: 'master',
      description: '학사학위 + 교육/연구경력 1년 이상'
    },
    '대학교원': { 
      minimumDegree: 'master',
      minimumExperience: 1,
      preferredDegree: 'master',
      description: '석사학위 + 교육/연구경력 1년 이상'
    },
    '전문대학': { 
      minimumDegree: 'master',
      minimumExperience: 2,
      preferredDegree: 'master',
      description: '석사학위 + 교육/연구경력 2년 이상'
    }
  }
};

/**
 * 교육 활동 요구사항
 */
const EDUCATION_ACTIVITY_REQUIREMENTS = {
  minimumWeeklyHours: 6,
  maximumOnlinePercentage: 50,
  allowedActivities: [
    'lecture',           // 정규 강의
    'seminar',          // 세미나
    'laboratory',       // 실험/실습
    'thesis_guidance',  // 논문 지도
    'research'          // 연구 활동
  ],
  requiredActivities: ['lecture'], // 정규 강의는 필수
  prohibitedOnly: ['workshop_only', 'seminar_only'] // 워크샵이나 세미나만으로는 불가
};

/**
 * 교육기관 적격성 기준
 */
const INSTITUTION_ELIGIBILITY = {
  eligible: {
    type: 'HIGHER_EDUCATION_LAW',
    institutions: [
      {
        name: '대학',
        code: 'UNIVERSITY',
        description: '고등교육법 제2조에 의한 대학',
        weight: 1.0
      },
      {
        name: '산업대학',
        code: 'INDUSTRIAL_UNIVERSITY', 
        description: '고등교육법 제2조에 의한 산업대학',
        weight: 0.95
      },
      {
        name: '교육대학',
        code: 'EDUCATION_UNIVERSITY',
        description: '고등교육법 제2조에 의한 교육대학',
        weight: 0.95
      },
      {
        name: '전문대학',
        code: 'COLLEGE',
        description: '고등교육법 제2조에 의한 전문대학',
        weight: 0.9
      },
      {
        name: '원격대학',
        code: 'CYBER_UNIVERSITY',
        description: '고등교육법 제2조에 의한 원격대학',
        weight: 0.85,
        specialRequirement: '원격강의 비율 체크 필요'
      },
      {
        name: '기술대학',
        code: 'TECHNICAL_COLLEGE',
        description: '고등교육법 제2조에 의한 기술대학',
        weight: 0.9
      },
      {
        name: '방송대학',
        code: 'BROADCAST_UNIV',
        description: '고등교육법 제2조에 의한 방송대학',
        weight: 0.85
      },
      {
        name: '통신대학',
        code: 'CORRESPONDENCE_UNIV',
        description: '고등교육법 제2조에 의한 통신대학',
        weight: 0.85
      },
      {
        name: '방송통신대학',
        code: 'BROADCAST_CORRESPONDENCE',
        description: '고등교육법 제2조에 의한 방송통신대학',
        weight: 0.85
      },
      {
        name: '사관학교',
        code: 'MILITARY_ACADEMY',
        description: '특별법에 의한 사관학교',
        weight: 0.95
      },
      {
        name: '경찰대학',
        code: 'POLICE_UNIV',
        description: '특별법에 의한 경찰대학',
        weight: 0.95
      },
      {
        name: '세무대학',
        code: 'TAX_UNIV',
        description: '특별법에 의한 세무대학',
        weight: 0.9
      },
      {
        name: '학점은행제 교육기관',
        code: 'CREDIT_BANK',
        description: '평생교육법에 의한 학점은행제 교육기관',
        weight: 0.8,
        condition: '일정 조건 충족시'
      }
    ]
  },
  
  ineligible: {
    institutions: [
      {
        name: '학원',
        code: 'ACADEMY',
        reason: '학원의 설립·운영 및 과외교습에 관한 법률 적용',
        alternative: 'E-2'
      },
      {
        name: '연구소',
        code: 'RESEARCH_INSTITUTE',
        reason: '교육 활동이 아닌 연구 활동',
        alternative: 'E-3'
      },
      {
        name: '기업연수원',
        code: 'CORPORATE_TRAINING',
        reason: '기업 내부 연수 목적',
        alternative: 'E-7'
      }
    ]
  },
  
  specialCases: {
    foreignSchool: {
      name: '외국인학교',
      eligible: true,
      condition: '초·중등교육법에 의한 외국인학교',
      additionalRequirements: ['curriculum_approval', 'ministry_recognition']
    },
    internationalSchool: {
      name: '국제학교',
      eligible: true,
      condition: '경제자유구역법에 의한 국제학교',
      additionalRequirements: ['international_curriculum', 'ministry_approval']
    }
  }
};

/**
 * 학력 요건
 */
const EDUCATION_REQUIREMENTS = {
  minimum: 'bachelor',
  hierarchy: [
    { level: 'phd', score: 100, description: '박사학위' },
    { level: 'phd_candidate', score: 90, description: '박사수료' },
    { level: 'master', score: 80, description: '석사학위' },
    { level: 'master_candidate', score: 70, description: '석사수료' },
    { level: 'bachelor', score: 60, description: '학사학위' },
    { level: 'associate', score: 40, description: '전문학사' }
  ],
  
  verification: {
    apostille: {
      required: true,
      description: '학위증명서 아포스티유 또는 영사확인 필수',
      exemptions: ['korean_universities']
    },
    translation: {
      required: true,
      condition: 'non_korean_documents',
      description: '한국어 번역 공증 필요'
    }
  }
};

/**
 * 경력 요건
 */
const EXPERIENCE_REQUIREMENTS = {
  types: {
    'university_teaching': {
      weight: 1.0,
      description: '대학교 강의 경력',
      verification: ['employment_certificate', 'attendance_record']
    },
    'research_institute': {
      weight: 0.9,
      description: '연구기관 연구 경력',
      verification: ['employment_certificate', 'research_output']
    },
    'industry_research': {
      weight: 0.8,
      description: '기업 연구 경력',
      verification: ['employment_certificate', 'project_portfolio']
    },
    'government_research': {
      weight: 0.85,
      description: '정부기관 연구 경력',
      verification: ['employment_certificate', 'official_records']
    }
  },
  
  calculation: {
    minimumPeriod: 1, // 개월
    maximumRecognition: 240, // 개월 (20년)
    continuityBonus: 1.1, // 연속 경력 보너스
    gapPenalty: 0.9 // 경력 단절 시 페널티
  }
};

/**
 * 특별 우대 조건
 */
const SPECIAL_PREFERENCES = {
  goldCard: {
    benefit: 'PRIORITY_PROCESSING',
    description: 'GOLD CARD 소지자 우선 처리',
    documentSimplification: true
  },
  
  governmentInvitation: {
    benefit: 'REQUIREMENT_WAIVER',
    description: '정부 초청 시 일부 요건 면제',
    flexibleRequirements: ['experience', 'language']
  },
  
  artsAndSports: {
    benefit: 'ALTERNATIVE_QUALIFICATION',
    description: '예술/체육 분야 특별 인정',
    alternativeProof: ['awards', 'international_recognition', 'portfolio']
  },
  
  koreanUniversity: {
    benefit: 'DOCUMENT_SIMPLIFICATION',
    description: '한국 대학 졸업자 서류 간소화',
    exemptions: ['apostille', 'translation']
  }
};

/**
 * 제외 조건
 */
const EXCLUSION_CONDITIONS = {
  absolute: [
    {
      condition: 'criminal_record',
      description: '범죄 경력 (일부 국가 의무 제출)',
      scope: 'FEDERAL_OR_NATIONAL'
    },
    {
      condition: 'immigration_violations',
      description: '출입국 관련 법규 위반',
      examples: ['overstay', 'illegal_employment', 'false_documentation']
    },
    {
      condition: 'unaccredited_institution',
      description: '교육부 미인가 교육기관',
      verification: 'MINISTRY_DATABASE'
    }
  ],
  
  conditional: [
    {
      condition: 'tax_delinquency',
      description: '세금 체납',
      waiver: 'PAYMENT_PLAN_AGREEMENT'
    },
    {
      condition: 'contract_breach',
      description: '이전 계약 위반',
      waiver: 'EXPLANATION_AND_RESOLUTION'
    }
  ]
};

/**
 * 자격 요건 검증 함수
 */
function validateEligibility(applicantData) {
  const results = {
    overall: false,
    position: null,
    education: null,
    experience: null,
    institution: null,
    exclusions: [],
    recommendations: []
  };

  // 각 요건별 검증 로직 구현
  // (실제 구현은 평가기에서 담당)

  return results;
}

module.exports = {
  POSITION_QUALIFICATION_MATRIX,
  EDUCATION_ACTIVITY_REQUIREMENTS,
  INSTITUTION_ELIGIBILITY,
  EDUCATION_REQUIREMENTS,
  EXPERIENCE_REQUIREMENTS,
  SPECIAL_PREFERENCES,
  EXCLUSION_CONDITIONS,
  validateEligibility
};
