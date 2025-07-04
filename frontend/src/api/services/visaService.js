/* eslint-disable */
// -----------------------------------------------------------------------------
// TOVmate ▶ visaService.js (E1, E2 고도화 버전 대응)
// -----------------------------------------------------------------------------
// * Ensures visa code is always sent in canonical "E-4" style to backend
// * evaluationFields lookup now tolerant of both hyphen / non‑hyphen keys
// * Interceptor shows backend error message when present
// * E1, E2 visa enhanced fields and processing added
// -----------------------------------------------------------------------------

import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';
import { normalizeVisaCode as baseNormalizeVisa } from '../../utils/visaType';

/**
 * ---------------------------------------------------------------------------
 * 1. Helpers – visa code normalisation
 * ---------------------------------------------------------------------------
 */
export const normalizeVisaType = (code = '') => {
  // ① 라이브러리 기본 정규화 시도
  const tmp = baseNormalizeVisa ? baseNormalizeVisa(code) : code.toUpperCase();
  // ② 하이픈 없으면 삽입 (E4 → E-4, D10 → D-10)
  return tmp.includes('-') ? tmp : tmp.replace(/([A-Z])(\d+)/, '$1-$2');
};

/**
 * ---------------------------------------------------------------------------
 * 2. Axios instance
 * ---------------------------------------------------------------------------
 */
const http = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
});

// ▶ request: attach JWT if available
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ▶ response: global error toast
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message || err.message || 'Network error – please retry later.';
    toast.error(message);
    return Promise.reject(err);
  },
);

/**
 * ---------------------------------------------------------------------------
 * 3. evaluationFields & pick helper - E1, E2 고도화 필드 추가
 * ---------------------------------------------------------------------------
 */
const evaluationFields = {
  'E-1': [
    // 기존 필드
    'educationLevel',
    'experienceYears',
    'publications',
    'institutionType',
    'institution',
    'position',
    'salary',
    'contractPeriod',
    
    // E1 고도화 추가 필드
    'internationalPublications',     // 국제 논문 수
    'researchField',                // 연구 분야
    'experienceTypes',              // 경력 유형 (배열)
    'hasInstitutionRecommendation', // 기관 추천서 여부
    'hasPresidentRecommendation',   // 총장/학장 추천서 여부
    'hasTeachingCertificate',       // 교원자격증 보유 여부
    'institutionRanking',           // 기관 순위
  ],
  'E1': [], // alias – handled programmatically
  
  'E-2': [
    // 기본 필드
    'educationLevel',
    'experienceYears',
    'teachingExperience',
    'institutionType',
    
    // 언어 관련 필드
    'language',
    'citizenship',
    'isNativeSpeaker',
    
    // 자격증 필드
    'teachingCertificates',
    
    // 프로그램 관련 필드
    'programType',
    'hasGovernmentInvitation',
    
    // 계약 정보
    'salary',
    'contractPeriod',
    
    // 신원 및 건강 관련 필드
    'hasCriminalRecord',
    'criminalRecordDetails',
    'hasHealthCheck',
    'healthIssues',
    
    // 전공 필드
    'majorField',
    
    // 기타 선택 필드
    'koreanLevel',
    'languageLevel',
    'languageCertification',
    'languageScore',
  ],
  'E2': [], // alias
  
  'E-3': [
    // 기본 필드
    'educationLevel',
    'experienceYears',
    'researchField',
    'position',
    'institutionType',
    'institution',
    'salary',
    'contractPeriod',
    
    // E3 특화 필드
    'publications',               // 논문 배열
    'internationalActivities',    // 국제 활동 배열
    'projects',                   // 프로젝트 배열
    'patents',                    // 특허 수
    'experienceTypes',            // 경력 유형 배열
    'previousVisaTypes',          // 이전 비자 배열
    'hasAccreditation',           // 기관 인증 여부
    'institutionRanking',         // 기관 순위
    'topikLevel',                 // TOPIK 레벨
    'canCommunicate',             // 의사소통 가능 여부
    'researchExperienceYears',    // 연구 경력 년수 (호환성)
  ],
  'E3': [], // alias
  
  'E-4': [
    // 기본 정보
    'educationLevel',
    'experienceYears',
    'expertiseLevel',
    'koreanCompanyNeed',
    'relevantExperience',
    'internationalExperience',
    
    // 기술 정보
    'technologyField',
    'hasCertifications',
    'hasPatents',
    'technicalCertifications',
    'koreanAbility',
    'salary',
    'projectPortfolio',
    
    // 계약 정보
    'contractPeriod',
    'contractValue',
    'serviceType',
    
    // 초청기관 정보
    'organizationType',
    'hasGoldCard',
    'hasGovernmentApproval',
    'isNationalProject',
    
    // 체류 이력
    'hasPreviousE4',
    'previousStayMonths',
    'hasViolations'
  ],
  'E4': [], // alias
  
  'E-5': [
    'licenseType',              // 자격증 유형
    'nationality',              // 국적
    'koreanExamPassed',         // 한국 자격시험 통과 여부
    'licenseIssueCountry',      // 자격증 발급 국가
    'licenseIssueDate',         // 자격증 발급일
    'experienceYears',          // 총 경력
    'koreanExperienceYears',    // 한국 내 경력
    'majorFirmExperience',      // 대형 로펌/병원/회계법인 경력
    'experienceField',          // 경력 분야
    'educationLevel',           // 학력 수준
    'major',                    // 전공
    'prestigiousUniversity',    // 명문대 여부
    'expectedIncome',           // 예상 연소득
    'koreanBusinessLevel',      // 업무 수행 가능 수준
    'topikLevel'                // TOPIK 레벨
  ],
  'E5': [], // alias
};

/**
 * E1 비자 특수 필드 처리 함수
 */
const processE1Fields = (data) => {
  const processed = { ...data };
  
  // 경력 유형 배열 처리
  if (processed.experienceTypes) {
    if (typeof processed.experienceTypes === 'string') {
      processed.experienceTypes = processed.experienceTypes
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
    } else if (!Array.isArray(processed.experienceTypes)) {
      processed.experienceTypes = [processed.experienceTypes];
    }
  }
  
  // 불린 필드 변환
  ['hasInstitutionRecommendation', 'hasPresidentRecommendation', 'hasTeachingCertificate'].forEach(field => {
    if (processed[field] !== undefined) {
      processed[field] = processed[field] === true || 
                        processed[field] === 'true' || 
                        processed[field] === 1 || 
                        processed[field] === '1' ||
                        processed[field] === 'yes';
    }
  });
  
  // 숫자 필드 변환
  ['experienceYears', 'publications', 'internationalPublications', 'institutionRanking', 'salary', 'contractPeriod'].forEach(field => {
    if (processed[field] !== undefined && processed[field] !== null && processed[field] !== '') {
      const num = parseInt(processed[field], 10);
      if (!isNaN(num)) {
        processed[field] = num;
      }
    }
  });
  
  // 연구 분야 기본값
  if (!processed.researchField || processed.researchField === '') {
    processed.researchField = 'other';
  }
  
  // 국제 논문 수 검증 (전체 논문 수를 초과할 수 없음)
  if (processed.publications > 0 && processed.internationalPublications > processed.publications) {
    processed.internationalPublications = processed.publications;
  }
  
  return processed;
};

/**
 * E2 비자 특수 필드 처리 함수
 */
const processE2Fields = (data) => {
  const processed = { ...data };
  
  // 교원자격증 배열 처리
  if (processed.teachingCertificates) {
    if (typeof processed.teachingCertificates === 'string') {
      processed.teachingCertificates = processed.teachingCertificates
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
    } else if (!Array.isArray(processed.teachingCertificates)) {
      processed.teachingCertificates = [processed.teachingCertificates];
    }
  }
  
  // 불린 필드 변환
  ['isNativeSpeaker', 'hasGovernmentInvitation', 'hasCriminalRecord', 'hasHealthCheck'].forEach(field => {
    if (processed[field] !== undefined) {
      processed[field] = processed[field] === true || 
                        processed[field] === 'true' || 
                        processed[field] === 1 || 
                        processed[field] === '1' ||
                        processed[field] === 'yes';
    }
  });
  
  // 숫자 필드 변환
  ['experienceYears', 'teachingExperience', 'salary', 'contractPeriod'].forEach(field => {
    if (processed[field] !== undefined && processed[field] !== null && processed[field] !== '') {
      const num = parseInt(processed[field], 10);
      if (!isNaN(num)) {
        processed[field] = num;
      }
    }
  });
  
  // 언어 기본값
  if (!processed.language || processed.language === '') {
    processed.language = 'english';
  }
  
  // 프로그램 타입 기본값
  if (!processed.programType || processed.programType === '') {
    processed.programType = 'other';
  }
  
  // citizenship이 없으면 nationality 사용
  if (!processed.citizenship && data.nationality) {
    processed.citizenship = data.nationality;
  }
  
  return processed;
};

/**
 * E3 비자 특수 필드 처리 함수
 */
const processE3Fields = (data) => {
  const processed = { ...data };
  
  // 배열 필드 처리
  ['experienceTypes', 'previousVisaTypes'].forEach(field => {
    if (processed[field]) {
      if (typeof processed[field] === 'string') {
        processed[field] = processed[field]
          .split(',')
          .map(t => t.trim())
          .filter(t => t);
      } else if (!Array.isArray(processed[field])) {
        processed[field] = [processed[field]];
      }
    } else {
      processed[field] = [];
    }
  });
  
  // 복잡한 객체 배열 필드 초기화
  ['publications', 'internationalActivities', 'projects'].forEach(field => {
    if (!Array.isArray(processed[field])) {
      processed[field] = [];
    }
  });
  
  // 불린 필드 변환
  ['hasAccreditation', 'canCommunicate'].forEach(field => {
    if (processed[field] !== undefined) {
      processed[field] = processed[field] === true || 
                        processed[field] === 'true' || 
                        processed[field] === 1 || 
                        processed[field] === '1' ||
                        processed[field] === 'yes';
    }
  });
  
  // 숫자 필드 변환
  ['patents', 'institutionRanking', 'experienceYears', 'researchExperienceYears', 'salary', 'contractPeriod'].forEach(field => {
    if (processed[field] !== undefined && processed[field] !== null && processed[field] !== '') {
      const num = parseInt(processed[field], 10);
      if (!isNaN(num)) {
        processed[field] = num;
      }
    }
  });
  
  // 연구 분야 기본값
  if (!processed.researchField || processed.researchField === '') {
    processed.researchField = 'other';
  }
  
  // TOPIK 레벨 기본값
  if (!processed.topikLevel || processed.topikLevel === '') {
    processed.topikLevel = 'none';
  }
  
  // researchExperienceYears가 없으면 experienceYears 사용
  if (processed.experienceYears !== undefined && processed.researchExperienceYears === undefined) {
    processed.researchExperienceYears = processed.experienceYears;
  }
  
  return processed;
};

/**
 * E4 비자 특수 필드 처리 함수
 */
const processE4Fields = (data) => {
  const processed = { ...data };
  
  // 불린 필드 변환
  const booleanFields = [
    'hasCertifications', 'hasPatents', 'hasGoldCard',
    'hasGovernmentApproval', 'isNationalProject',
    'hasPreviousE4', 'hasViolations'
  ];
  
  booleanFields.forEach(field => {
    if (processed[field] !== undefined) {
      processed[field] = processed[field] === true || 
                        processed[field] === 'true' || 
                        processed[field] === 1 || 
                        processed[field] === '1' ||
                        processed[field] === 'yes';
    }
  });
  
  // 숫자 필드 변환
  const numericFields = [
    'experienceYears', 'relevantExperience', 'internationalExperience',
    'contractPeriod', 'contractValue', 'previousStayMonths', 'salary'
  ];
  
  numericFields.forEach(field => {
    if (processed[field] !== undefined && processed[field] !== null && processed[field] !== '') {
      const num = parseInt(processed[field], 10);
      if (!isNaN(num)) {
        processed[field] = num;
      }
    }
  });
  
  // 기본값 설정
  if (!processed.technologyField || processed.technologyField === '') {
    processed.technologyField = 'other';
  }
  if (!processed.serviceType || processed.serviceType === '') {
    processed.serviceType = 'other';
  }
  if (!processed.organizationType || processed.organizationType === '') {
    processed.organizationType = 'other';
  }
  if (!processed.expertiseLevel || processed.expertiseLevel === '') {
    processed.expertiseLevel = 'intermediate';
  }
  if (!processed.koreanCompanyNeed || processed.koreanCompanyNeed === '') {
    processed.koreanCompanyNeed = 'moderate';
  }
  
  // 배열 필드 처리
  if (processed.technicalCertifications) {
    if (typeof processed.technicalCertifications === 'string') {
      processed.technicalCertifications = processed.technicalCertifications
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
    } else if (!Array.isArray(processed.technicalCertifications)) {
      processed.technicalCertifications = [processed.technicalCertifications];
    }
  }
  
  // 경력 필드 연동 (관련 경력과 국제 경력은 총 경력을 초과할 수 없음)
  if (processed.experienceYears) {
    if (processed.relevantExperience > processed.experienceYears) {
      processed.relevantExperience = processed.experienceYears;
    }
    if (processed.internationalExperience > processed.experienceYears) {
      processed.internationalExperience = processed.experienceYears;
    }
  }
  
  return processed;
};

/**
 * E5 비자 특수 필드 처리 함수
 */
const processE5Fields = (data) => {
  const processed = { ...data };
  
  // 불린 필드 변환
  const booleanFields = [
    'koreanExamPassed', 'majorFirmExperience', 'prestigiousUniversity', 'koreanBusinessLevel'
  ];
  
  booleanFields.forEach(field => {
    if (processed[field] !== undefined) {
      processed[field] = processed[field] === true || 
                        processed[field] === 'true' || 
                        processed[field] === 1 || 
                        processed[field] === '1' ||
                        processed[field] === 'yes';
    }
  });
  
  // 숫자 필드 변환
  const numericFields = [
    'experienceYears', 'koreanExperienceYears', 'expectedIncome', 'topikLevel'
  ];
  
  numericFields.forEach(field => {
    if (processed[field] !== undefined && processed[field] !== null && processed[field] !== '') {
      const num = parseInt(processed[field], 10);
      if (!isNaN(num)) {
        processed[field] = num;
      }
    }
  });
  
  // 기본값 설정
  if (!processed.licenseType || processed.licenseType === '') {
    processed.licenseType = 'other_professional';
  }
  if (!processed.experienceField || processed.experienceField === '') {
    processed.experienceField = 'other';
  }
  if (!processed.educationLevel || processed.educationLevel === '') {
    processed.educationLevel = 'bachelor';
  }
  
  // TOPIK 레벨 기본값 (0으로 설정하여 "없음" 상태 표시)
  if (processed.topikLevel === undefined || processed.topikLevel === null || processed.topikLevel === '') {
    processed.topikLevel = 0;
  }
  
  // 날짜 필드 처리
  if (processed.licenseIssueDate) {
    // 날짜 형식 검증 및 정규화
    const date = new Date(processed.licenseIssueDate);
    if (!isNaN(date.getTime())) {
      processed.licenseIssueDate = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    }
  }
  
  // 경력 연수 검증 (한국 내 경력은 총 경력을 초과할 수 없음)
  if (processed.experienceYears && processed.koreanExperienceYears) {
    if (parseInt(processed.koreanExperienceYears) > parseInt(processed.experienceYears)) {
      processed.koreanExperienceYears = processed.experienceYears;
    }
  }
  
  return processed;
};

const pickFieldsByVisa = (visaType, data) => {
  const normalizedType = visaType.replace(/-/g, '');
  const keys = evaluationFields[visaType] || evaluationFields[normalizedType] || [];
  
  const picked = keys.reduce((obj, key) => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
      obj[key] = data[key];
    }
    return obj;
  }, {});
  
  // E1 비자의 경우 특수 처리
  if (normalizedType === 'E1') {
    return processE1Fields(picked);
  }
  
  // E2 비자의 경우 특수 처리
  if (normalizedType === 'E2') {
    return processE2Fields(picked);
  }
  
  // E3 비자의 경우 특수 처리
  if (normalizedType === 'E3') {
    return processE3Fields(picked);
  }
  
  // E4 비자의 경우 특수 처리
  if (normalizedType === 'E4') {
    return processE4Fields(picked);
  }
  
  // E5 비자의 경우 특수 처리
  if (normalizedType === 'E5') {
    return processE5Fields(picked);
  }
  
  return picked;
};

const extractData = (response) => response.data?.data ?? response.data ?? {};

/**
 * ---------------------------------------------------------------------------
 * 4. Public visaService API - E1, E2, E3 고도화 대응
 * ---------------------------------------------------------------------------
 */
export const visaService = {
  /** GET /visa/evaluate/supported-types */
  async getSupportedVisaTypes() {
    const res = await http.get('/visa/evaluate/supported-types');
    return extractData(res);
  },

  /** POST /visa/evaluate/:visaType – 자격 평가 (E1, E2, E3 고도화 지원) */
  async evaluateVisa(formData) {
    if (!formData?.visaType) throw new Error('visaType is required');

    const visaType = normalizeVisaType(formData.visaType);
    const normalizedType = visaType.replace(/-/g, '');
    
    // E-3 비자 특수 디버깅 로깅
    if (normalizedType === 'E3') {
      console.log('🔬 E-3 visa evaluation request started:', {
        originalVisaType: formData.visaType,
        normalizedVisaType: visaType,
        normalizedType: normalizedType,
        hasRequiredFields: {
          educationLevel: !!formData.educationLevel,
          experienceYears: !!formData.experienceYears,
          researchField: !!formData.researchField,
          institutionType: !!formData.institutionType,
          publications: !!formData.publications,
          salary: !!formData.salary
        },
        allFormDataKeys: Object.keys(formData)
      });
    }
    
    // E1 비자 특수 로깅
    if (normalizedType === 'E1') {
      console.log('▶︎ E1 visa evaluation (enhanced version)', {
        position: formData.position,
        institutionType: formData.institutionType,
        researchField: formData.researchField,
        hasAdvancedFields: !!(formData.internationalPublications !== undefined || 
                             formData.institutionRanking !== undefined ||
                             formData.experienceTypes)
      });
    }
    
    // E2 비자 특수 로깅
    if (normalizedType === 'E2') {
      console.log('▶︎ E2 visa evaluation (enhanced version)', {
        language: formData.language,
        citizenship: formData.citizenship,
        institutionType: formData.institutionType,
        hasAdvancedFields: !!(formData.teachingCertificates || 
                             formData.programType ||
                             formData.hasCriminalRecord !== undefined)
      });
    }
    
    // E4 비자 특수 로깅
    if (normalizedType === 'E4') {
      console.log('🔧 E-4 visa evaluation request started:', {
        originalVisaType: formData.visaType,
        normalizedVisaType: visaType,
        hasRequiredFields: {
          educationLevel: !!formData.educationLevel,
          experienceYears: !!formData.experienceYears,
          expertiseLevel: !!formData.expertiseLevel,
          koreanCompanyNeed: !!formData.koreanCompanyNeed,
          technologyField: !!formData.technologyField,
          contractPeriod: !!formData.contractPeriod,
          contractValue: !!formData.contractValue,
          serviceType: !!formData.serviceType,
          organizationType: !!formData.organizationType
        },
        experienceDetail: {
          total: formData.experienceYears,
          relevant: formData.relevantExperience,
          international: formData.internationalExperience
        },
        goldCardEligible: ['semiconductor', 'battery', 'advanced_manufacturing', 'it_software'].includes(formData.technologyField)
      });
    }
    
    // E5 비자 특수 로깅
    if (normalizedType === 'E5') {
      console.log('⚖️ E-5 visa evaluation request started:', {
        originalVisaType: formData.visaType,
        normalizedVisaType: visaType,
        hasRequiredFields: {
          licenseType: !!formData.licenseType,
          nationality: !!formData.nationality,
          koreanExamPassed: formData.koreanExamPassed !== undefined,
          licenseIssueCountry: !!formData.licenseIssueCountry,
          licenseIssueDate: !!formData.licenseIssueDate,
          experienceYears: !!formData.experienceYears,
          educationLevel: !!formData.educationLevel,
          expectedIncome: !!formData.expectedIncome,
          topikLevel: formData.topikLevel !== undefined
        },
        licenseDetails: {
          type: formData.licenseType,
          country: formData.licenseIssueCountry,
          examPassed: formData.koreanExamPassed
        },
        experienceDetails: {
          total: formData.experienceYears,
          korean: formData.koreanExperienceYears,
          field: formData.experienceField,
          majorFirm: formData.majorFirmExperience
        },
        topikLevel: formData.topikLevel || 0
      });
    }
    
    const evaluationData = pickFieldsByVisa(visaType, formData);
    
    const payload = {
      visaType,
      evaluation: evaluationData,
      administrative: {
        fullName: formData.fullName,
        nationality: formData.nationality,
        email: formData.email,
        phone: formData.phone,
        currentCity: formData.currentCity,
        birthDate: formData.birthDate,
        currentVisaStatus: formData.currentVisaStatus,
        currentVisaType: formData.currentVisaType,
        visaExpiryDate: formData.visaExpiryDate,
        alienRegistrationNumber: formData.alienRegistrationNumber,
        stayDurationYears: formData.stayDurationYears,
        visaApplicationPurpose: formData.visaApplicationPurpose
      }
    };

    // E-3 디버깅 정보 (더 상세하게)
    if (normalizedType === 'E3') {
      console.log('🔬 E-3 evaluation payload being sent:', {
        visaType: payload.visaType,
        evaluationFields: Object.keys(payload.evaluation),
        evaluationData: payload.evaluation,
        administrativeFields: Object.keys(payload.administrative),
        payloadSize: JSON.stringify(payload).length,
        url: `/visa/evaluate/${visaType}`
      });
    }

    // E1 디버깅 정보
    if (normalizedType === 'E1') {
      console.log('▶︎ E1 evaluation payload', {
        evaluationFields: Object.keys(payload.evaluation),
        hasInternationalPublications: payload.evaluation.internationalPublications !== undefined,
        experienceTypes: payload.evaluation.experienceTypes,
        researchField: payload.evaluation.researchField
      });
    }
    
    // E2 디버깅 정보
    if (normalizedType === 'E2') {
      console.log('▶︎ E2 evaluation payload', {
        evaluationFields: Object.keys(payload.evaluation),
        language: payload.evaluation.language,
        citizenship: payload.evaluation.citizenship,
        isNativeSpeaker: payload.evaluation.isNativeSpeaker,
        teachingCertificates: payload.evaluation.teachingCertificates,
        programType: payload.evaluation.programType
      });
    }

    // E4 디버깅 정보 (payload 생성 후)
    if (normalizedType === 'E4') {
      console.log('🔧 E-4 evaluation payload being sent:', {
        visaType: payload.visaType,
        evaluationFields: Object.keys(payload.evaluation),
        evaluationData: payload.evaluation,
        hasRequiredFields: {
          expertiseLevel: !!payload.evaluation.expertiseLevel,
          koreanCompanyNeed: !!payload.evaluation.koreanCompanyNeed
        },
        hasGoldCard: payload.evaluation.hasGoldCard,
        technologyField: payload.evaluation.technologyField,
        contractValue: payload.evaluation.contractValue,
        experienceCheck: payload.evaluation.experienceYears >= 5
      });
    }

    try {
      console.log(`🚀 Sending ${visaType} evaluation request to: /visa/evaluate/${visaType}`);
      const res = await http.post(`/visa/evaluate/${visaType}`, payload);
      const result = extractData(res);
      
      // E-3 응답 검증 (더 상세하게)
      if (normalizedType === 'E3') {
        console.log('🔬 E-3 evaluation response received:', {
          success: !!result,
          hasResult: !!result,
          resultKeys: result ? Object.keys(result) : [],
          totalScore: result?.totalScore,
          visaType: result?.visaType,
          status: result?.status,
          hasApprovalPrediction: !!result?.approvalPrediction,
          approvalPercentage: result?.approvalPrediction?.percentage,
          hasRoadmap: !!result?.roadmap,
          hasIssues: !!(result?.issues && result.issues.length > 0),
          issueCount: result?.issues?.length || 0,
          categoryScores: result?.categoryScores,
          hasDetails: !!result?.details,
          responseSize: result ? JSON.stringify(result).length : 0
        });
        
        if (!result || !result.totalScore) {
          console.error('❌ E-3 evaluation failed - no valid result received');
        }
      }
      
      // E1 응답 검증
      if (normalizedType === 'E1' && result) {
        console.log('▶︎ E1 evaluation result (enhanced)', {
          totalScore: result.totalScore,
          hasApprovalPrediction: !!result.approvalPrediction,
          approvalPercentage: result.approvalPrediction?.percentage,
          hasRoadmap: !!result.roadmap,
          issueCount: result.issues?.length || 0
        });
      }
      
      // E2 응답 검증
      if (normalizedType === 'E2' && result) {
        console.log('▶︎ E2 evaluation result (enhanced)', {
          totalScore: result.totalScore,
          hasApprovalPrediction: !!result.approvalPrediction,
          approvalPercentage: result.approvalPrediction?.percentage,
          hasRoadmap: !!result.roadmap,
          languageMatch: result.details?.languageMatch,
          backgroundCheckStatus: result.details?.backgroundCheckStatus,
          healthStatus: result.details?.healthStatus,
          issueCount: result.issues?.length || 0
        });
      }
      
      // E4 응답 검증
      if (normalizedType === 'E4' && result) {
        console.log('🔧 E-4 evaluation result received:', {
          success: !!result,
          totalScore: result?.totalScore,
          status: result?.status,
          hasApprovalPrediction: !!result?.approvalPrediction,
          approvalPercentage: result?.approvalPrediction?.percentage,
          technicalQualification: result?.details?.technicalQualification,
          goldCardEligible: result?.details?.goldCardEligible,
          hasRoadmap: !!result?.roadmap,
          issueCount: result?.issues?.length || 0
        });
        
        if (!result || !result.totalScore) {
          console.error('❌ E-4 evaluation failed - no valid result received');
        }
      }
      
      // E5 응답 검증
      if (normalizedType === 'E5' && result) {
        console.log('⚖️ E-5 evaluation result received:', {
          success: !!result,
          totalScore: result?.totalScore,
          status: result?.status,
          hasApprovalPrediction: !!result?.approvalPrediction,
          approvalPercentage: result?.approvalPrediction?.percentage,
          licenseQualification: result?.details?.licenseQualification,
          koreanExamStatus: result?.details?.koreanExamStatus,
          experienceLevel: result?.details?.experienceLevel,
          hasRoadmap: !!result?.roadmap,
          issueCount: result?.issues?.length || 0
        });
        
        if (!result || !result.totalScore) {
          console.error('❌ E-5 evaluation failed - no valid result received');
        }
      }
      
      return result;
      
    } catch (error) {
      if (normalizedType === 'E3') {
        console.error('❌ E-3 evaluation request failed:', {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          url: error.config?.url
        });
      }
      if (normalizedType === 'E4') {
        console.error('❌ E-4 evaluation request failed:', {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          url: error.config?.url
        });
      }
      if (normalizedType === 'E5') {
        console.error('❌ E-5 evaluation request failed:', {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          url: error.config?.url
        });
      }
      throw error;
    }
  },

  /** POST /visa/applications/draft – 임시 저장 */
  async saveDraft(applicationData) {
    const res = await http.post('/visa/applications/draft', applicationData);
    return extractData(res);
  },

  /** POST /visa/documents/:visaType – 파일 업로드 */
  async uploadDocument({ visaType, applicationId, file, documentType }) {
    if (!file) throw new Error('file is required');

    const form = new FormData();
    form.append('documents', file);
    form.append('applicationId', applicationId);
    form.append('documentType', documentType);

    const res = await http.post(`/visa/documents/${visaType}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },

  /** GET /visa/applications/current */
  async getCurrentApplication() {
    const res = await http.get('/visa/applications/current', {
      validateStatus: (status) => status < 500,
    });
    if (res.status === 204 || res.status === 404) return null;
    return extractData(res);
  },

  /** GET /visa/applications/:id */
  async getApplicationDetails(applicationId) {
    if (!applicationId) throw new Error('신청서 ID가 필요합니다');
    const res = await http.get(`/visa/applications/${applicationId}`);
    return extractData(res);
  },

  /** POST /visa/applications/:id/submit */
  async submitApplication(applicationId) {
    if (!applicationId) throw new Error('신청서 ID가 필요합니다');
    const res = await http.post(`/visa/applications/${applicationId}/submit`);
    return extractData(res);
  },

  /** GET /visa/applications/:id/documents/:documentId */
  async downloadDocument(applicationId, documentId) {
    if (!applicationId || !documentId) {
      throw new Error('신청서 ID와 문서 ID가 모두 필요합니다');
    }
    const res = await http.get(
      `/visa/applications/${applicationId}/documents/${documentId}`,
      { responseType: 'blob' }
    );
    return res.data;
  },

  /** DELETE /visa/applications/:id/documents/:documentId */
  async deleteDocument(applicationId, documentId) {
    if (!applicationId || !documentId) {
      throw new Error('신청서 ID와 문서 ID가 모두 필요합니다');
    }
    const res = await http.delete(
      `/visa/applications/${applicationId}/documents/${documentId}`
    );
    return extractData(res);
  },

  /** POST /visa/applications – 신청서 생성/업데이트 (E1, E2, E3 고도화 지원) */
  async createOrUpdateApplication(applicationData) {
    const visaType = normalizeVisaType(applicationData.visaType);
    const normalizedType = visaType.replace(/-/g, '');
    
    // E1 비자 데이터 전처리
    let processedData = { ...applicationData };
    if (normalizedType === 'E1' && processedData.evaluation) {
      processedData.evaluation = processE1Fields(processedData.evaluation);
    }
    
    // E2 비자 데이터 전처리
    if (normalizedType === 'E2' && processedData.evaluation) {
      processedData.evaluation = processE2Fields(processedData.evaluation);
    }
    
    // E3 비자 데이터 전처리
    if (normalizedType === 'E3' && processedData.evaluation) {
      processedData.evaluation = processE3Fields(processedData.evaluation);
    }
    
    // E4 비자 데이터 전처리
    if (normalizedType === 'E4' && processedData.evaluation) {
      processedData.evaluation = processE4Fields(processedData.evaluation);
    }
    
    const res = await http.post('/visa/applications', processedData);
    return extractData(res);
  },

  /** GET /visa/applications – 신청 목록 조회 (E1, E2, E3, E4 고도화 정보 포함) */
  async getUserApplications(status = null) {
    const params = status ? { status } : {};
    const res = await http.get('/visa/applications', { params });
    const applications = extractData(res);
    
    // E1, E2, E3, E4 신청서에 고도화 정보 표시
    return applications.map(app => {
      if ((app.visaType === 'E1' || app.visaType === 'E-1') && app.evaluationResult) {
        return {
          ...app,
          hasEnhancedEvaluation: !!app.evaluationResult.approvalPrediction,
          approvalChance: app.evaluationResult.approvalPrediction?.chance,
          approvalPercentage: app.evaluationResult.approvalPrediction?.percentage,
          evaluationVersion: app.metadata?.evaluationVersion || '2.0'
        };
      }
      
      if ((app.visaType === 'E2' || app.visaType === 'E-2') && app.evaluationResult) {
        return {
          ...app,
          hasEnhancedEvaluation: !!app.evaluationResult.approvalPrediction,
          approvalChance: app.evaluationResult.approvalPrediction?.chance,
          approvalPercentage: app.evaluationResult.approvalPrediction?.percentage,
          languageMatch: app.evaluationResult.details?.languageMatch,
          backgroundCheckStatus: app.evaluationResult.details?.backgroundCheckStatus
        };
      }
      
      if ((app.visaType === 'E3' || app.visaType === 'E-3') && app.evaluationResult) {
        return {
          ...app,
          hasEnhancedEvaluation: !!app.evaluationResult.approvalPrediction,
          approvalChance: app.evaluationResult.approvalPrediction?.chance,
          approvalPercentage: app.evaluationResult.approvalPrediction?.percentage,
          researchField: app.evaluationResult.details?.researchField,
          isHighDemandField: app.evaluationResult.details?.isHighDemandField
        };
      }
      
      if ((app.visaType === 'E4' || app.visaType === 'E-4') && app.evaluationResult) {
        return {
          ...app,
          hasEnhancedEvaluation: !!app.evaluationResult.approvalPrediction,
          approvalChance: app.evaluationResult.approvalPrediction?.chance,
          approvalPercentage: app.evaluationResult.approvalPrediction?.percentage,
          technicalQualification: app.evaluationResult.details?.technicalQualification,
          goldCardEligible: app.evaluationResult.details?.goldCardEligible,
          technologyField: app.evaluationResult.details?.technologyField
        };
      }
      
      return app;
    });
  }
};

/**
 * E1 비자 평가 결과 포맷터 (UI 표시용)
 */
export const formatE1EvaluationResult = (result) => {
  if (!result || (result.visaType !== 'E-1' && result.visaType !== 'E1')) return result;
  
  const formatted = { ...result };
  
  // 승인 예측 정보 포맷팅
  if (result.approvalPrediction) {
    formatted.approvalInfo = {
      percentage: result.approvalPrediction.percentage,
      level: result.approvalPrediction.chance,
      description: result.approvalPrediction.description,
      color: getApprovalColor(result.approvalPrediction.chance)
    };
  }
  
  // 로드맵 요약
  if (result.roadmap) {
    formatted.roadmapSummary = {
      total: (result.roadmap.immediate?.length || 0) + 
             (result.roadmap.shortTerm?.length || 0) + 
             (result.roadmap.mediumTerm?.length || 0) + 
             (result.roadmap.longTerm?.length || 0),
      urgent: result.roadmap.immediate?.length || 0,
      hasActions: true
    };
  }
  
  // 이슈 요약
  if (result.issues) {
    formatted.issueSummary = {
      total: result.issues.length,
      critical: result.issues.filter(i => i.severity === 'critical').length,
      high: result.issues.filter(i => i.severity === 'high').length,
      medium: result.issues.filter(i => i.severity === 'medium').length,
      low: result.issues.filter(i => i.severity === 'low').length
    };
  }
  
  return formatted;
};

/**
 * E2 비자 평가 결과 포맷터 (UI 표시용)
 */
export const formatE2EvaluationResult = (result) => {
  if (!result || result.visaType !== 'E-2') return result;
  
  const formatted = { ...result };
  
  // 승인 예측 정보 포맷팅
  if (result.approvalPrediction) {
    formatted.approvalInfo = {
      percentage: result.approvalPrediction.percentage,
      level: result.approvalPrediction.chance,
      description: result.approvalPrediction.description,
      color: getApprovalColor(result.approvalPrediction.chance)
    };
  }
  
  // 로드맵 요약
  if (result.roadmap) {
    formatted.roadmapSummary = {
      total: (result.roadmap.immediate?.length || 0) + 
             (result.roadmap.shortTerm?.length || 0) + 
             (result.roadmap.mediumTerm?.length || 0) + 
             (result.roadmap.longTerm?.length || 0),
      urgent: result.roadmap.immediate?.length || 0,
      hasActions: true
    };
  }
  
  // 이슈 요약
  if (result.issues) {
    formatted.issueSummary = {
      total: result.issues.length,
      critical: result.issues.filter(i => i.severity === 'critical').length,
      high: result.issues.filter(i => i.severity === 'high').length,
      medium: result.issues.filter(i => i.severity === 'medium').length,
      low: result.issues.filter(i => i.severity === 'low').length
    };
  }
  
  // E2 특화 정보 요약
  if (result.details) {
    formatted.e2Summary = {
      languageMatch: result.details.languageMatch || false,
      isNativeSpeaker: result.details.isNativeSpeaker || false,
      backgroundCheckStatus: result.details.backgroundCheckStatus || '확인 필요',
      healthStatus: result.details.healthStatus || '확인 필요',
      hasCertificate: result.details.hasCertificate || false,
      isProgramSupported: result.details.isProgramSupported || false
    };
  }
  
  return formatted;
};

/**
 * E3 비자 평가 결과 포맷터 (UI 표시용)
 */
export const formatE3EvaluationResult = (result) => {
  if (!result || (result.visaType !== 'E-3' && result.visaType !== 'E3')) return result;
  
  const formatted = { ...result };
  
  // 승인 예측 정보 포맷팅
  if (result.approvalPrediction) {
    formatted.approvalInfo = {
      percentage: result.approvalPrediction.percentage,
      level: result.approvalPrediction.chance,
      description: result.approvalPrediction.description,
      color: getApprovalColor(result.approvalPrediction.chance)
    };
  }
  
  // 로드맵 요약
  if (result.roadmap) {
    formatted.roadmapSummary = {
      total: (result.roadmap.immediate?.length || 0) + 
             (result.roadmap.shortTerm?.length || 0) + 
             (result.roadmap.mediumTerm?.length || 0) + 
             (result.roadmap.longTerm?.length || 0),
      urgent: result.roadmap.immediate?.length || 0,
      hasActions: true
    };
  }
  
  // 이슈 요약
  if (result.issues) {
    formatted.issueSummary = {
      total: result.issues.length,
      critical: result.issues.filter(i => i.severity === 'critical').length,
      high: result.issues.filter(i => i.severity === 'high').length,
      medium: result.issues.filter(i => i.severity === 'medium').length,
      low: result.issues.filter(i => i.severity === 'low').length
    };
  }
  
  // E3 특화 정보 요약
  if (result.details) {
    formatted.e3Summary = {
      researchField: result.details.researchField || 'other',
      fieldDemand: result.details.fieldDemand || 1.0,
      isHighDemandField: result.details.isHighDemandField || false,
      publicationCount: result.details.publicationCount || 0,
      internationalActivityCount: result.details.internationalActivityCount || 0,
      projectCount: result.details.projectCount || 0,
      hasPatents: (result.details.patents || 0) > 0,
      koreanProficiency: result.details.koreanProficiency || '없음',
      institutionSuitability: result.details.institutionSuitability || null
    };
  }
  
  return formatted;
};

/**
 * E4 비자 평가 결과 포맷터 (UI 표시용)
 */
export const formatE4EvaluationResult = (result) => {
  if (!result || (result.visaType !== 'E-4' && result.visaType !== 'E4')) return result;
  
  const formatted = { ...result };
  
  // 승인 예측 정보 포맷팅
  if (result.approvalPrediction) {
    formatted.approvalInfo = {
      percentage: result.approvalPrediction.percentage,
      level: result.approvalPrediction.chance,
      description: result.approvalPrediction.description,
      color: getApprovalColor(result.approvalPrediction.chance)
    };
  }
  
  // 로드맵 요약
  if (result.roadmap) {
    formatted.roadmapSummary = {
      total: (result.roadmap.immediate?.length || 0) + 
             (result.roadmap.shortTerm?.length || 0) + 
             (result.roadmap.mediumTerm?.length || 0) + 
             (result.roadmap.longTerm?.length || 0),
      urgent: result.roadmap.immediate?.length || 0,
      hasActions: true
    };
  }
  
  // 이슈 요약
  if (result.issues) {
    formatted.issueSummary = {
      total: result.issues.length,
      critical: result.issues.filter(i => i.severity === 'critical').length,
      high: result.issues.filter(i => i.severity === 'high').length,
      medium: result.issues.filter(i => i.severity === 'medium').length,
      low: result.issues.filter(i => i.severity === 'low').length
    };
  }
  
  // E4 특화 정보 요약
  if (result.details) {
    formatted.e4Summary = {
      technologyField: result.details.technologyField || 'other',
      technologyFieldDisplay: result.details.technologyFieldDisplay || '기타',
      technicalQualification: result.details.technicalQualification || '미확인',
      goldCardEligible: result.details.goldCardEligible || false,
      hasGoldCard: result.details.hasGoldCard || false,
      contractPeriodCategory: result.details.contractPeriodCategory || '',
      contractValueLevel: result.details.contractValueLevel || '',
      organizationType: result.details.organizationType || 'other',
      organizationTypeDisplay: result.details.organizationTypeDisplay || '기타',
      experienceCheck: result.details.experienceYears >= 5,
      visaValidity: result.details.visaValidity || '단수사증'
    };
  }
  
  return formatted;
};

const getApprovalColor = (chance) => {
  const colors = {
    'very_low': '#dc2626',  // red-600
    'low': '#f59e0b',       // amber-500
    'medium': '#3b82f6',    // blue-500
    'high': '#10b981',       // emerald-500
    'very_high': '#059669'  // emerald-600
  };
  return colors[chance] || '#6b7280'; // gray-500
};

export default visaService;