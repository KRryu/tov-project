import { lazy } from 'react';

// 기본 폼 컴포넌트
import BaseForm from './BaseForm';

// E-1 비자 폼 (현재 지원)
const E1Form = lazy(() => import('./E1Form'));

// 비자 유형별 폼 매핑
const VISA_FORMS = {
  // E-1 비자 (교수) - 현재 지원
  'E-1': E1Form,
  'E1': E1Form,
  
  // 향후 추가 예정 비자들
  'E-2': null, // 회화지도 - 추후 개발
  'E-3': null, // 연구 - 추후 개발
  'E-4': null, // 기술지도 - 추후 개발
  'E-5': null, // 전문직업 - 추후 개발
  
  // 다른 비자 유형들도 필요시 추가
};

/**
 * 비자 유형에 따른 폼 컴포넌트 반환
 * @param {string} visaType - 비자 유형 (E-1, E-2 등)
 * @returns {React.Component|null} 해당 비자 유형의 폼 컴포넌트
 */
export const getVisaForm = (visaType) => {
  if (!visaType) return null;
  
  // 하이픈 정규화 (E1 → E-1, E-1 → E-1)
  const normalizedType = visaType.includes('-') ? visaType : visaType.replace(/([A-Z])(\d+)/, '$1-$2');
  
  return VISA_FORMS[normalizedType] || VISA_FORMS[visaType] || null;
};

/**
 * 지원되는 비자 유형 목록 반환
 * @returns {Array} 지원되는 비자 유형 배열
 */
export const getSupportedVisaTypes = () => {
  return Object.keys(VISA_FORMS).filter(type => VISA_FORMS[type] !== null);
};

/**
 * 비자 유형별 한국어 이름 매핑
 */
export const VISA_TYPE_NAMES = {
  'E-1': '교수',
  'E-2': '회화지도',
  'E-3': '연구',
  'E-4': '기술지도',
  'E-5': '전문직업',
  'E-6': '예술흥행',
  'E-7': '특정활동',
};

/**
 * 비자 유형의 한국어 이름 반환
 * @param {string} visaType - 비자 유형
 * @returns {string} 한국어 이름
 */
export const getVisaTypeName = (visaType) => {
  const normalizedType = visaType?.includes('-') ? visaType : visaType?.replace(/([A-Z])(\d+)/, '$1-$2');
  return VISA_TYPE_NAMES[normalizedType] || visaType;
};

// 기본 내보내기
export { BaseForm };

const visaFormsModule = {
  getVisaForm,
  getSupportedVisaTypes,
  getVisaTypeName,
  VISA_TYPE_NAMES,
  BaseForm
};

export default visaFormsModule; 