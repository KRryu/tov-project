/**
 * E-1 비자 신청자 데이터를 API에서 기대하는 형식으로 변환합니다.
 * @param {Object} values - 폼 값
 * @param {Object} personalInfo - 사용자 개인 정보
 * @returns {Object} 변환된 신청자 데이터
 */
export const formatE1ApplicantData = (values, personalInfo = {}) => {
  return {
    personalInfo: {
      ...personalInfo,
      nationality: values.nationality || personalInfo.nationality
    },
    education: { 
      level: values.educationLevel 
    },
    position: values.position,
    institution: { 
      type: values.institutionType, 
      name: values.institution 
    },
    experience: { 
      years: Number(values.experienceYears) || 0 
    },
    publications: Array(Number(values.publications) || 0).fill({}),
    salary: Number(values.salary) || 0,
    contractPeriod: Number(values.contractPeriod) || 0,
    field: values.researchField
  };
};

/**
 * E-2 비자 신청자 데이터를 API에서 기대하는 형식으로 변환합니다.
 * @param {Object} values - 폼 값
 * @param {Object} personalInfo - 사용자 개인 정보
 * @returns {Object} 변환된 신청자 데이터
 */
export const formatE2ApplicantData = (values, personalInfo = {}) => {
  return {
    personalInfo: {
      ...personalInfo,
      nationality: values.nationality || personalInfo.nationality
    },
    education: { 
      level: values.educationLevel 
    },
    nationality: values.nationality,
    teaching_experience: { 
      years: Number(values.teachingYears) || 0 
    },
    certification: values.certification === 'true',
    korean_ability: { 
      level: values.koreanLevel 
    }
  };
};

/**
 * 비자 유형에 따라 적절한 데이터 형식 변환 함수를 반환합니다.
 * @param {string} visaType - 비자 유형 코드
 * @returns {Function} 데이터 형식 변환 함수
 */
export const getDataFormatter = (visaType) => {
  const formatters = {
    'E-1': formatE1ApplicantData,
    'E-2': formatE2ApplicantData,
    // TODO: 추가 비자 유형에 대한 변환 함수를 여기에 등록
  };
  
  return formatters[visaType] || ((values) => values);
};

/**
 * 비자 유형 코드에서 사람이 읽기 쉬운 이름으로 변환합니다.
 * @param {string} visaTypeCode - 비자 유형 코드
 * @returns {string} 비자 유형 이름
 */
export const getVisaTypeName = (visaTypeCode) => {
  const visaTypes = {
    'E-1': '교수(E-1)',
    'E-2': '회화지도(E-2)',
    'E-3': '연구(E-3)',
    'E-4': '기술지도(E-4)',
    'E-5': '전문직업(E-5)',
    'E-6': '예술흥행(E-6)',
    'E-7': '특정활동(E-7)',
    // TODO: 추가 비자 유형에 대한 이름을 여기에 등록
  };
  
  return visaTypes[visaTypeCode] || visaTypeCode;
}; 