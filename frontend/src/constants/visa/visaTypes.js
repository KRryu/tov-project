/**
 * 비자 타입 상수 정의
 * 백엔드의 37개 비자 타입과 동기화
 */

// 비자 카테고리
export const VISA_CATEGORIES = {
  WORK: 'work',
  STUDY: 'study',
  FAMILY: 'family',
  INVESTMENT: 'investment',
  OTHER: 'other'
};

// 비자 타입 정의
export const VISA_TYPES = {
  // Work Visas
  E1: {
    code: 'E-1',
    name: '교수',
    nameEn: 'Professor',
    category: VISA_CATEGORIES.WORK,
    description: '전문대학 이상 교육기관에서 교육 또는 연구지도'
  },
  E2: {
    code: 'E-2',
    name: '회화지도',
    nameEn: 'Foreign Language Instructor',
    category: VISA_CATEGORIES.WORK,
    description: '외국어 회화지도'
  },
  E3: {
    code: 'E-3',
    name: '연구',
    nameEn: 'Research',
    category: VISA_CATEGORIES.WORK,
    description: '연구기관에서 연구활동'
  },
  E4: {
    code: 'E-4',
    name: '기술지도',
    nameEn: 'Technology Transfer',
    category: VISA_CATEGORIES.WORK,
    description: '기술지도 활동'
  },
  E5: {
    code: 'E-5',
    name: '전문직업',
    nameEn: 'Professional Employment',
    category: VISA_CATEGORIES.WORK,
    description: '전문지식이나 기술을 요하는 직업'
  },
  E6: {
    code: 'E-6',
    name: '예술흥행',
    nameEn: 'Arts & Performance',
    category: VISA_CATEGORIES.WORK,
    description: '예술, 흥행 활동'
  },
  E7: {
    code: 'E-7',
    name: '특정활동',
    nameEn: 'Special Occupation',
    category: VISA_CATEGORIES.WORK,
    description: '법무부장관이 지정하는 특정활동'
  },
  E8: {
    code: 'E-8',
    name: '계절근로',
    nameEn: 'Seasonal Employment',
    category: VISA_CATEGORIES.WORK,
    description: '계절적 수요가 있는 업종의 단기근로'
  },
  E9: {
    code: 'E-9',
    name: '비전문취업',
    nameEn: 'Non-professional Employment',
    category: VISA_CATEGORIES.WORK,
    description: '비전문 분야 취업활동'
  },
  E10: {
    code: 'E-10',
    name: '선원취업',
    nameEn: 'Crew Employment',
    category: VISA_CATEGORIES.WORK,
    description: '선박에서의 승무원 활동'
  },
  
  // Study Visas
  D2: {
    code: 'D-2',
    name: '유학',
    nameEn: 'Student',
    category: VISA_CATEGORIES.STUDY,
    description: '전문대학 이상 교육기관 유학'
  },
  D4: {
    code: 'D-4',
    name: '일반연수',
    nameEn: 'General Training',
    category: VISA_CATEGORIES.STUDY,
    description: '어학연수 및 일반 연수'
  },
  
  // Family Visas
  F1: {
    code: 'F-1',
    name: '방문동거',
    nameEn: 'Visiting/Joining Family',
    category: VISA_CATEGORIES.FAMILY,
    description: '가족 방문 및 동거'
  },
  F2: {
    code: 'F-2',
    name: '거주',
    nameEn: 'Residence',
    category: VISA_CATEGORIES.FAMILY,
    description: '장기 거주'
  },
  F3: {
    code: 'F-3',
    name: '동반',
    nameEn: 'Dependent Family',
    category: VISA_CATEGORIES.FAMILY,
    description: '가족 동반'
  },
  F4: {
    code: 'F-4',
    name: '재외동포',
    nameEn: 'Overseas Korean',
    category: VISA_CATEGORIES.FAMILY,
    description: '재외동포'
  },
  F5: {
    code: 'F-5',
    name: '영주',
    nameEn: 'Permanent Residence',
    category: VISA_CATEGORIES.FAMILY,
    description: '영주권'
  },
  F6: {
    code: 'F-6',
    name: '결혼이민',
    nameEn: 'Marriage Migrant',
    category: VISA_CATEGORIES.FAMILY,
    description: '한국인 배우자'
  },
  
  // Investment Visas
  D7: {
    code: 'D-7',
    name: '주재',
    nameEn: 'Foreign Company',
    category: VISA_CATEGORIES.INVESTMENT,
    description: '외국기업 주재원'
  },
  D8: {
    code: 'D-8',
    name: '기업투자',
    nameEn: 'Corporate Investment',
    category: VISA_CATEGORIES.INVESTMENT,
    description: '기업 투자'
  },
  D9: {
    code: 'D-9',
    name: '무역경영',
    nameEn: 'Trade Management',
    category: VISA_CATEGORIES.INVESTMENT,
    description: '무역 경영'
  },
  
  // Other Visas
  H1: {
    code: 'H-1',
    name: '관광취업',
    nameEn: 'Working Holiday',
    category: VISA_CATEGORIES.OTHER,
    description: '워킹홀리데이'
  },
  H2: {
    code: 'H-2',
    name: '방문취업',
    nameEn: 'Working Visit',
    category: VISA_CATEGORIES.OTHER,
    description: '방문취업'
  }
  // ... 나머지 비자 타입들 추가
};

// 비자 타입 배열
export const VISA_TYPE_LIST = Object.values(VISA_TYPES);

// 비자 코드로 비자 정보 가져오기
export const getVisaByCode = (code) => {
  return Object.values(VISA_TYPES).find(visa => visa.code === code);
};

// 카테고리별 비자 목록 가져오기
export const getVisasByCategory = (category) => {
  return Object.values(VISA_TYPES).filter(visa => visa.category === category);
};

// 비자 코드 유효성 검사
export const isValidVisaCode = (code) => {
  return Object.values(VISA_TYPES).some(visa => visa.code === code);
};