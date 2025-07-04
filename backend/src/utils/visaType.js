// 비자 코드 관련 공통 유틸 (Backend)
// 프론트 util 과 로직을 맞춰 backend 전역에서 동일 사용

/**
 * 비자 타입 전체 정의
 */
const VISA_TYPES = {
  'E-1': {
    name: '교수',
    fullName: '교수(E-1)',
    description: '전문대학 이상의 교육기관에서 교육 또는 연구하는 자',
    category: 'employment'
  },
  'E-2': {
    name: '회화지도',
    fullName: '회화지도(E-2)',
    description: '법무부장관이 정하는 자격요건을 갖춘 외국인으로서 외국어교육기관에서 회화지도하는 자',
    category: 'employment'
  },
  'E-3': {
    name: '연구',
    fullName: '연구(E-3)',
    description: '각종 연구소에서 자연과학 또는 첨단기술 분야의 연구개발에 종사하는 자',
    category: 'employment'
  },
  'E-4': {
    name: '기술지도',
    fullName: '기술지도(E-4)',
    description: '전문적인 지식·기술 또는 기능을 제공하거나 전수하는 자',
    category: 'employment'
  },
  'E-5': {
    name: '전문직업',
    fullName: '전문직업(E-5)',
    description: '대한민국 법률에 의해 자격이 인정된 전문직업에 종사하는 자',
    category: 'employment'
  },
  'E-6': {
    name: '예술흥행',
    fullName: '예술흥행(E-6)',
    description: '수익이 따르는 음악, 미술, 문학 등 예술활동과 연예, 연주, 연극, 운동경기 등',
    category: 'employment'
  },
  'E-7': {
    name: '특정활동',
    fullName: '특정활동(E-7)',
    description: '법무부장관이 특별히 지정하는 활동에 종사하는 자',
    category: 'employment'
  },
  'E-8': {
    name: '연수취업',
    fullName: '연수취업(E-8)',
    description: '산업기술 연수생이 연수 후 취업하는 자',
    category: 'employment'
  },
  'E-9': {
    name: '비전문취업',
    fullName: '비전문취업(E-9)',
    description: '비전문 취업활동을 하는 자',
    category: 'employment'
  },
  'E-10': {
    name: '방문취업',
    fullName: '방문취업(E-10)',
    description: '방문취업 자격으로 체류 중인 자',
    category: 'employment'
  },
  'F-1': {
    name: '방문동거',
    fullName: '방문동거(F-1)',
    description: '대한민국 국민의 배우자, 미성년 자녀, 부모를 방문하여 동거하는 자',
    category: 'family'
  }
};

/**
 * 하이픈 제거 & 대문자 (예: "E-1", "e1"  -> "E1")
 */
const normalizeVisaCode = (code = '') => code.toUpperCase().replace(/-/g, '');

/**
 * 표시용(하이픈 포함) 코드로 변환 (예: "E1" -> "E-1")
 */
const formatVisaCodeDisplay = (code = '') => {
  if (!code) return '';
  return code.includes('-') ? code.toUpperCase() : code.toUpperCase().replace(/^([A-Z])(\d+)$/, '$1-$2');
};

/**
 * 기존 backend 모듈에서 쓰이던 함수명 매핑 (하이픈 포함 정규화)
 * ex) normalizeVisaType('e1') => 'E-1'
 */
const normalizeVisaType = (code = '') => formatVisaCodeDisplay(code);

/**
 * 코드 -> 한글 비자명
 */
const getVisaName = (code = '') => {
  const displayCode = formatVisaCodeDisplay(code);
  const visaInfo = VISA_TYPES[displayCode];
  return visaInfo ? visaInfo.name : `${displayCode} 비자`;
};

/**
 * 지원되는 비자 타입 목록 반환
 */
const getSupportedVisaTypes = () => {
  return Object.entries(VISA_TYPES).map(([code, info]) => ({
    code,
    name: info.fullName,
    description: info.description,
    supported: true
  }));
};

const formatVisaTypeForDisplay = formatVisaCodeDisplay;

module.exports = {
  normalizeVisaCode,
  formatVisaCodeDisplay,
  normalizeVisaType, // alias (하이픈 포함)
  getVisaName,
  getSupportedVisaTypes,
  VISA_TYPES,
  formatVisaTypeForDisplay
}; 