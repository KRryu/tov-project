/**
 * 비자 평가 검증 스키마 통합 인덱스
 * E-1 비자 중심, 향후 확장 가능한 구조
 */

// schemas.js에서 모든 스키마와 유틸리티 함수들을 가져옴
export {
  baseSchema,
  e1Schema,
  e2Schema,
  e3Schema,
  e4Schema,
  e5Schema,
  VISA_SCHEMAS,
  getValidationSchema,
  getSupportedSchemas
} from './schemas';

// 기본 내보내기는 getValidationSchema 함수
export { getValidationSchema as default } from './schemas'; 