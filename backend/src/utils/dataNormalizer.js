/**
 * 데이터 정규화 유틸리티 함수들
 */

/**
 * 수치 필드 정규화
 * @param {Object} data - 정규화할 데이터 객체
 * @param {string[]} fields - 정규화할 필드명 배열
 */
const normalizeNumericFields = (data, fields) => {
  fields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      data[field] = parseInt(data[field], 10) || 0;
    }
  });
};

/**
 * 불린 필드 정규화
 * @param {Object} data - 정규화할 데이터 객체
 * @param {string[]} fields - 정규화할 필드명 배열
 */
const normalizeBooleanFields = (data, fields) => {
  fields.forEach(field => {
    if (data[field] !== undefined) {
      data[field] = data[field] === true || 
                   data[field] === 'true' ||
                   data[field] === 1 ||
                   data[field] === '1';
    }
  });
};

module.exports = { normalizeNumericFields, normalizeBooleanFields }; 