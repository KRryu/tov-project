import axios from 'axios';
import { API_BASE_URL } from './config';

console.log('🌐 API 기본 URL 설정됨:', API_BASE_URL);

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - 요청 전에 토큰 추가
api.interceptors.request.use(
  (config) => {
    console.group(`🔄 API 요청 [${config.method?.toUpperCase()}] ${config.url}`);
    
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // 토큰 상태 로깅
    console.log('토큰 상태:', token ? '존재함' : '없음');
    
    // 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('인증 헤더 추가됨:', `Bearer ${token.substring(0, 10)}...`);
    } else {
      console.log('인증 헤더 없음: 토큰이 없습니다');
    }
    
    // 요청 데이터 로깅 (민감 정보 제외)
    if (config.data) {
      const safeData = { ...config.data };
      
      // 민감 정보 마스킹
      if (safeData.password) safeData.password = '******';
      if (safeData.token) safeData.token = '******';
      
      console.log('요청 데이터:', safeData);
    }
    
    console.groupEnd();
    return config;
  },
  (error) => {
    console.error('❌ API 요청 인터셉터 오류:', error.message);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 오류 처리
api.interceptors.response.use(
  (response) => {
    console.group(`✅ API 응답 성공 [${response.config.method?.toUpperCase()}] ${response.config.url}`);
    console.log('상태 코드:', response.status);
    
    // 응답 데이터 로깅 (토큰 마스킹)
    const safeData = { ...response.data };
    if (safeData.token) {
      safeData.token = `${safeData.token.substring(0, 10)}...`;
    }
    
    console.log('응답 데이터:', safeData);
    console.groupEnd();
    
    return response;
  },
  (error) => {
    console.group(`❌ API 응답 오류 [${error.config?.method?.toUpperCase() || 'UNKNOWN'}] ${error.config?.url || 'UNKNOWN'}`);
    console.log('오류 정보:', {
      상태: error.response?.status,
      메시지: error.response?.data?.message || error.message
    });
    
    // 401 오류 처리 (인증 오류)
    if (error.response && error.response.status === 401) {
      console.error('🔐 인증 오류 감지: 토큰이 유효하지 않거나 만료되었습니다.');
      
      // 토큰 정보 확인
      const token = localStorage.getItem('token');
      if (token) {
        console.log('로컬 스토리지에 토큰이 존재합니다. 토큰 첫 부분:', token.substring(0, 10));
      } else {
        console.log('로컬 스토리지에 토큰이 없습니다.');
      }
    }
    
    console.groupEnd();
    return Promise.reject(error);
  }
);

export default api; 