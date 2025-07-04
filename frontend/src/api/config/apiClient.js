/**
 * 백엔드 v2 API에 최적화된 API 클라이언트
 * 진행상황 추적, 캐싱, 에러 처리 등 고도화된 기능 포함
 */
import axios from 'axios';
import { toast } from 'react-toastify';

// 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

/**
 * 메인 API 클라이언트 (v2 API용)
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 파일 업로드용 API 클라이언트
 */
const fileApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 파일 업로드는 더 긴 타임아웃
  withCredentials: true,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

/**
 * 요청 인터셉터 - JWT 토큰 자동 첨부
 */
const setupAuthInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 요청 ID 생성 (진행상황 추적용)
      if (!config.headers['X-Request-ID']) {
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
};

/**
 * 응답 인터셉터 - 에러 처리 및 토스트
 */
const setupResponseInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => {
      // 성공 응답 처리
      const { data } = response;
      
      // 백엔드에서 success 메시지가 있으면 토스트 표시
      if (data?.message && data?.success !== false) {
        // 특정 상황에서만 성공 토스트 표시 (너무 많으면 방해가 됨)
        const showSuccessToast = [
          'evaluation', 'application', 'upload', 'submit'
        ].some(keyword => response.config.url.includes(keyword));
        
        if (showSuccessToast && data.message !== 'Success') {
          toast.success(data.message);
        }
      }
      
      return response;
    },
    (error) => {
      // 에러 응답 처리
      const { response, request, message } = error;
      
      if (response) {
        // 서버 응답이 있는 경우
        const { status, data } = response;
        let errorMessage = data?.message || data?.error || `HTTP ${status} Error`;
        
        // 상태 코드별 처리
        switch (status) {
          case 401:
            errorMessage = '로그인이 필요합니다.';
            // 토큰 제거 및 로그인 페이지로 리다이렉트
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            break;
          case 403:
            errorMessage = '접근 권한이 없습니다.';
            break;
          case 404:
            errorMessage = '요청한 리소스를 찾을 수 없습니다.';
            break;
          case 429:
            errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
            break;
          case 500:
            errorMessage = '서버 내부 오류가 발생했습니다.';
            break;
          default:
            break;
        }
        
        // 개발 환경에서는 더 자세한 에러 정보 표시
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', {
            url: response.config?.url,
            method: response.config?.method,
            status,
            data,
            headers: response.headers
          });
        }
        
        toast.error(errorMessage);
      } else if (request) {
        // 네트워크 오류
        const networkError = '네트워크 연결을 확인해주세요.';
        toast.error(networkError);
        console.error('Network Error:', error);
      } else {
        // 기타 오류
        toast.error(message || '예상치 못한 오류가 발생했습니다.');
        console.error('Request Error:', error);
      }
      
      return Promise.reject(error);
    }
  );
};

// 인터셉터 설정
setupAuthInterceptor(apiClient);
setupAuthInterceptor(fileApiClient);
setupResponseInterceptor(apiClient);
setupResponseInterceptor(fileApiClient);

/**
 * 진행상황 추적을 위한 WebSocket 연결 설정
 */
let wsConnection = null;
const progressCallbacks = new Map();

export const connectWebSocket = () => {
  if (wsConnection?.readyState === WebSocket.OPEN) {
    return wsConnection;
  }
  
  try {
    wsConnection = new WebSocket(`${WS_URL.replace('http', 'ws')}/progress`);
    
    wsConnection.onopen = () => {
      console.log('WebSocket connected for progress tracking');
    };
    
    wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { processId, ...progressData } = data;
        
        // 등록된 콜백 실행
        const callback = progressCallbacks.get(processId);
        if (callback) {
          callback(progressData);
        }
        
        // 프로세스 완료 시 콜백 제거
        if (progressData.completed) {
          progressCallbacks.delete(processId);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };
    
    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
      // 3초 후 재연결 시도
      setTimeout(connectWebSocket, 3000);
    };
    
    return wsConnection;
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    return null;
  }
};

/**
 * 진행상황 추적 등록
 */
export const subscribeToProgress = (processId, callback) => {
  progressCallbacks.set(processId, callback);
  
  // WebSocket이 연결되어 있지 않으면 연결
  if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
    connectWebSocket();
  }
  
  // 구독 메시지 전송
  if (wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      type: 'subscribe',
      processId
    }));
  }
};

/**
 * 진행상황 추적 해제
 */
export const unsubscribeFromProgress = (processId) => {
  progressCallbacks.delete(processId);
  
  if (wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      type: 'unsubscribe',
      processId
    }));
  }
};

/**
 * API 응답 데이터 추출 헬퍼
 */
export const extractData = (response) => {
  if (response?.data?.data) {
    return response.data.data;
  }
  if (response?.data) {
    return response.data;
  }
  return response;
};

/**
 * 캐시 키 생성 헬퍼
 */
export const generateCacheKey = (prefix, params) => {
  const paramStr = typeof params === 'object' 
    ? JSON.stringify(params, Object.keys(params).sort())
    : String(params);
  return `${prefix}_${btoa(paramStr).replace(/[/+=]/g, '')}`;
};

export { apiClient, fileApiClient, API_BASE_URL, WS_URL };
export default apiClient; 