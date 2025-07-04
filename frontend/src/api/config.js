/**
 * API 설정
 */

// 개발 환경에서는 로컬호스트 주소 사용, 프로덕션에서는 상대 경로 사용
export const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : '';

console.log('🌐 API_BASE_URL 설정됨:', API_BASE_URL);

// 공통 요청 헤더
export const COMMON_HEADERS = {
  'Content-Type': 'application/json'
};

// API 엔드포인트
export const API_ENDPOINTS = {
  // 인증 관련 엔드포인트
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    CURRENT_USER: `${API_BASE_URL}/api/auth/me`,
    REFRESH_TOKEN: `${API_BASE_URL}/api/auth/refresh-token`,
  },
  
  // 비자 서비스 관련 엔드포인트
  VISA: {
    BASE: `${API_BASE_URL}/api/visa`,
    STATUS: `${API_BASE_URL}/api/visa/status`,
    DOCUMENTS: `${API_BASE_URL}/api/visa/documents`,
  },
  
  // 파일 업로드 관련 엔드포인트
  FILES: {
    UPLOAD: `${API_BASE_URL}/api/upload`,
    DOWNLOAD: `${API_BASE_URL}/api/files`,
  }
};

// 디버깅용 토큰 유틸리티
export const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('🔑 토큰 확인 (일부):', token.substring(0, 10) + '...');
  } else {
    console.log('❌ 토큰 없음');
  }
  return token;
};

// 인증 헤더 생성 함수
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}; 