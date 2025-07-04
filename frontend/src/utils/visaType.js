// 비자 코드/이름 관련 공통 유틸 함수 모음
// 다른 모듈에서 import { normalizeVisaCode, formatVisaCodeDisplay, getVisaName } 형태로 사용하세요.

// 비자 코드 정규화: 하이픈 제거 후 대문자 (예: "E-1" | "e1" -> "E1")
export const normalizeVisaCode = (code = '') => code.toUpperCase().replace(/-/g, '');

// 표시용 코드 포맷: 하이픈 포함 (예: "E1" -> "E-1")
export const formatVisaCodeDisplay = (code = '') => {
  if (!code) return '';
  return code.includes('-') ? code.toUpperCase() : code.toUpperCase().replace(/^([A-Z])(\d+)$/, '$1-$2');
};

// 코드에 대응하는 한글 비자명 반환
export const getVisaName = (code = '') => {
  const displayCode = formatVisaCodeDisplay(code);
  const names = {
    'E-1': '교수',
    'E-2': '회화지도',
    'E-3': '연구',
    'E-4': '기술지도',
    'E-5': '전문직업',
    'E-6': '예술흥행',
    'E-7': '특정활동',
    'D-2': '유학',
    'D-8': '기업투자'
    // 필요 시 추가
  };
  return names[displayCode] || `${displayCode} 비자`;
}; 