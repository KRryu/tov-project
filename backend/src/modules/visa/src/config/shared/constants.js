/**
 * 비자 평가 시스템 공통 상수
 */

module.exports = {
  // 신청 유형
  APPLICATION_TYPES: {
    NEW: 'NEW',
    EXTENSION: 'EXTENSION',
    CHANGE: 'CHANGE'
  },

  // 비자 카테고리
  VISA_CATEGORIES: {
    WORK: 'work',
    EDUCATION: 'education',
    INVESTMENT: 'investment',
    RESIDENCE: 'residence',
    DIPLOMATIC: 'diplomatic',
    TEMPORARY: 'temporary',
    SPECIAL: 'special'
  },

  // 복잡도 레벨
  COMPLEXITY_LEVELS: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    VERY_HIGH: 'VERY_HIGH'
  },

  // 교육 수준
  EDUCATION_LEVELS: {
    HIGH_SCHOOL: 'HIGH_SCHOOL',
    ASSOCIATE: 'ASSOCIATE',
    BACHELOR: 'BACHELOR',
    MASTERS: 'MASTERS',
    DOCTORATE: 'DOCTORATE'
  },

  // 평가 상태
  EVALUATION_STATUS: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
  },

  // 문서 상태
  DOCUMENT_STATUS: {
    NOT_SUBMITTED: 'NOT_SUBMITTED',
    SUBMITTED: 'SUBMITTED',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED'
  },

  // 점수 임계값
  SCORE_THRESHOLDS: {
    NEW: 70,
    EXTENSION: 65,
    CHANGE: 60
  },

  // 처리 시간 (일)
  PROCESSING_TIMES: {
    URGENT: { min: 1, max: 3 },
    NORMAL: { min: 7, max: 14 },
    COMPLEX: { min: 14, max: 30 }
  },

  // 에러 코드
  ERROR_CODES: {
    INVALID_VISA_TYPE: 'INVALID_VISA_TYPE',
    INVALID_APPLICATION_TYPE: 'INVALID_APPLICATION_TYPE',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
    EVALUATION_FAILED: 'EVALUATION_FAILED',
    CHANGE_NOT_ALLOWED: 'CHANGE_NOT_ALLOWED'
  },

  // 급여 기준
  SALARY_STANDARDS: {
    GNI_50: 0.5,  // 국민총소득 50%
    GNI_80: 0.8,  // 국민총소득 80%
    GNI_100: 1.0, // 국민총소득 100%
    GNI_150: 1.5  // 국민총소득 150%
  }
};