import * as Yup from 'yup';

/**
 * 기본 비자 신청 스키마 - 모든 비자 유형에 공통 적용
 * 백엔드 VisaApplication.administrative 필드와 일치
 */
export const baseSchema = Yup.object().shape({
  // 비자 정보
  visaType: Yup.string().required('비자 유형은 필수입니다'),
  
  // 필수 행정 정보 (백엔드 administrative.required와 일치)
  fullName: Yup.string().required('이름은 필수입니다'),
  nationality: Yup.string().required('국적은 필수입니다'),
  email: Yup.string().email('유효한 이메일 주소를 입력하세요').required('이메일은 필수입니다'),
  phone: Yup.string().required('전화번호는 필수입니다'),
  currentCity: Yup.string().required('현재 거주 도시는 필수입니다'),
  
  // 선택 행정 정보 (백엔드 administrative.optional과 일치)
  birthDate: Yup.date().nullable().typeError('유효한 날짜를 입력하세요'),
  passportNumber: Yup.string().when('visaApplicationPurpose', {
    is: 'NEW',
    then: () => Yup.string().required('신규 신청 시 여권 번호는 필수입니다'),
    otherwise: () => Yup.string().nullable()
  }),
  currentVisaStatus: Yup.string().when(['nationality', 'visaApplicationPurpose'], {
    is: (nationality, purpose) => 
      (nationality !== 'KOR') || 
      (purpose === 'extension' || purpose === 'status_change'),
    then: () => Yup.string().required('현재 비자 상태는 필수입니다'),
    otherwise: () => Yup.string().nullable()
  }),
  currentVisaType: Yup.string().when('visaApplicationPurpose', {
    is: (purpose) => purpose === 'extension' || purpose === 'status_change',
    then: () => Yup.string().required('체류 자격 변경/연장 시 현재 비자 유형은 필수입니다'),
    otherwise: () => Yup.string().nullable()
  }),
  visaExpiryDate: Yup.string().when('visaApplicationPurpose', {
    is: (purpose) => purpose === 'extension' || purpose === 'status_change',
    then: () => Yup.string().required('체류 자격 변경/연장 시 비자 만료일은 필수입니다'),
    otherwise: () => Yup.string().nullable()
  }),
  alienRegistrationNumber: Yup.string().nullable(),
  stayDurationYears: Yup.number().nullable().min(0, '체류 기간은 0 이상이어야 합니다'),
  visaApplicationPurpose: Yup.string().nullable()
});

/**
 * E-1 비자 (교수) 검증 스키마
 * 백엔드 E-1 필드와 완벽히 일치
 */
export const e1Schema = baseSchema.shape({
  // === 필수 평가 필드 (백엔드 evaluation.required와 일치) ===
  educationLevel: Yup.string()
    .required('학력 수준은 필수입니다')
    .oneOf(['bachelor', 'master_candidate', 'master', 'phd_candidate', 'phd'], '유효한 학력 수준을 선택하세요'),
    
  experienceYears: Yup.number()
    .typeError('경력 연수는 숫자로 입력해야 합니다')
    .required('경력 연수는 필수입니다')
    .min(0, '경력 연수는 0 이상이어야 합니다')
    .max(50, '경력 연수는 50년을 초과할 수 없습니다'),
    
  publications: Yup.number()
    .typeError('논문/출판물 수는 숫자로 입력해야 합니다')
    .required('논문/출판물 수는 필수입니다')
    .min(0, '논문/출판물 수는 0 이상이어야 합니다')
    .max(1000, '논문/출판물 수가 너무 많습니다'),
    
  institutionType: Yup.string()
    .required('기관 유형은 필수입니다')
    .oneOf([
      'university', 'college', 'graduate_school', 'industrial_university',
      'education_university', 'cyber_university', 'technical_college',
      'research_institute', 'government', 'company'
    ], '유효한 기관 유형을 선택하세요'),
    
  institution: Yup.string()
    .required('교육기관명은 필수입니다')
    .min(2, '교육기관명은 최소 2자 이상이어야 합니다')
    .max(100, '교육기관명은 100자를 초과할 수 없습니다'),
    
  position: Yup.string()
    .required('직위는 필수입니다')
    .oneOf(['교수', '부교수', '조교수', '강사'], '유효한 직위를 선택하세요'),
    
  researchField: Yup.string()
    .required('연구 분야는 필수입니다')
    .oneOf([
      'ai_ml', 'biotechnology', 'semiconductor', 'energy', 'medicine',
      'engineering', 'natural_science', 'social_science', 'humanities', 
      'arts', 'other'
    ], '유효한 연구 분야를 선택하세요'),

  // === 선택 평가 필드 (백엔드 evaluation.optional과 일치) ===
  salary: Yup.number()
    .typeError('연봉은 숫자로 입력해야 합니다')
    .min(1000, '연봉은 1000만원 이상이어야 합니다')
    .max(100000, '연봉이 너무 많습니다')
    .nullable(),
    
  contractPeriod: Yup.number()
    .typeError('계약 기간은 숫자로 입력해야 합니다')
    .min(1, '계약 기간은 최소 1개월 이상이어야 합니다')
    .max(60, '계약 기간은 60개월을 초과할 수 없습니다')
    .nullable(),
    
  // E-1 고도화 필드들
  internationalPublications: Yup.number()
    .typeError('국제 논문 수는 숫자로 입력해야 합니다')
    .min(0, '국제 논문 수는 0 이상이어야 합니다')
    .max(Yup.ref('publications'), '국제 논문 수는 전체 논문 수를 초과할 수 없습니다')
    .nullable(),
    
  hasInstitutionRecommendation: Yup.boolean()
    .nullable(),
    
  hasPresidentRecommendation: Yup.boolean()
    .nullable(),
    
  hasTeachingCertificate: Yup.boolean()
    .nullable(),
    
  institutionRanking: Yup.number()
    .typeError('기관 순위는 숫자로 입력해야 합니다')
    .min(1, '기관 순위는 1 이상이어야 합니다')
    .max(1000, '기관 순위는 1000 이하여야 합니다')
    .nullable(),
    
  experienceTypes: Yup.array()
    .of(Yup.string().oneOf([
      'university_teaching', 'international_teaching', 'research_institute',
      'government_research', 'industry_research', 'other'
    ]))
    .nullable(),
    
  teachingQualification: Yup.string()
    .nullable(),
    
  institutionRecommendation: Yup.string()
    .nullable()
});

/**
 * 향후 추가 예정 비자 스키마들 (플레이스홀더)
 */

// E-2 비자 (회화지도) - 추후 개발
export const e2Schema = baseSchema.shape({
  // TODO: E-2 필드 정의
});

// E-3 비자 (연구) - 추후 개발  
export const e3Schema = baseSchema.shape({
  // TODO: E-3 필드 정의
});

// E-4 비자 (기술지도) - 추후 개발
export const e4Schema = baseSchema.shape({
  // TODO: E-4 필드 정의
});

// E-5 비자 (전문직업) - 추후 개발
export const e5Schema = baseSchema.shape({
  // TODO: E-5 필드 정의
});

/**
 * 비자 유형별 스키마 매핑
 */
export const VISA_SCHEMAS = {
  'E-1': e1Schema,
  'E1': e1Schema,
  'E-2': e2Schema,
  'E2': e2Schema,
  'E-3': e3Schema,
  'E3': e3Schema,
  'E-4': e4Schema,
  'E4': e4Schema,
  'E-5': e5Schema,
  'E5': e5Schema,
  'base': baseSchema
};

/**
 * 비자 유형에 따른 검증 스키마 반환
 * @param {string} visaType - 비자 유형
 * @returns {Yup.ObjectSchema} 해당 비자 타입의 검증 스키마
 */
export const getValidationSchema = (visaType) => {
  if (!visaType) return baseSchema;
  
  // 하이픈 정규화
  const normalizedType = visaType.includes('-') ? visaType : visaType.replace(/([A-Z])(\d+)/, '$1-$2');
  
  return VISA_SCHEMAS[normalizedType] || VISA_SCHEMAS[visaType] || baseSchema;
};

/**
 * 지원되는 비자 유형의 검증 스키마 목록
 * @returns {Array} 지원되는 비자 유형 배열
 */
export const getSupportedSchemas = () => {
  return Object.keys(VISA_SCHEMAS).filter(type => type !== 'base');
};

// 기본 내보내기
const validationSchemas = {
  baseSchema,
  e1Schema,
  e2Schema,
  e3Schema,
  e4Schema,
  e5Schema,
  VISA_SCHEMAS,
  getValidationSchema,
  getSupportedSchemas
};

export default validationSchemas;