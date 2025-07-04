/**
 * Visa Service V3
 * 새로운 백엔드 비자 모듈과 연동하는 서비스
 */

import apiClient from '../config/apiClient';

const BASE_PATH = '/api/v2/visa';

const visaServiceV3 = {
  // 평가 관련
  evaluation: {
    // 사전 평가 실행
    evaluate: async (visaType, data) => {
      const response = await apiClient.post(`${BASE_PATH}/evaluation/${visaType}`, data);
      return response.data;
    },
    
    // 평가 이력 조회
    getHistory: async () => {
      const response = await apiClient.get(`${BASE_PATH}/evaluation/history`);
      return response.data;
    },
    
    // 평가 상세 조회
    getDetail: async (evaluationId) => {
      const response = await apiClient.get(`${BASE_PATH}/evaluation/detail/${evaluationId}`);
      return response.data;
    }
  },

  // 신청서 관련
  application: {
    // 신청서 생성
    create: async (data) => {
      const response = await apiClient.post(`${BASE_PATH}/application/create`, data);
      return response.data;
    },
    
    // 신청서 목록
    getList: async () => {
      const response = await apiClient.get(`${BASE_PATH}/application/list`);
      return response.data;
    },
    
    // 신청서 상세
    getDetail: async (applicationId) => {
      const response = await apiClient.get(`${BASE_PATH}/application/${applicationId}`);
      return response.data;
    },
    
    // 신청서 업데이트
    update: async (applicationId, data) => {
      const response = await apiClient.put(`${BASE_PATH}/application/${applicationId}`, data);
      return response.data;
    }
  },

  // 문서 관련
  documents: {
    // 문서 업로드
    upload: async (applicationId, files) => {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`documents`, file);
      });
      
      const response = await apiClient.post(
        `${BASE_PATH}/documents/${applicationId}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    
    // 필수 문서 목록
    getRequirements: async (visaType, applicationType) => {
      const response = await apiClient.get(
        `${BASE_PATH}/documents/requirements/${visaType}/${applicationType}`
      );
      return response.data;
    }
  },

  // 매칭 관련
  matching: {
    // 법무대리인 목록
    getLawyers: async (criteria) => {
      const response = await apiClient.post(`${BASE_PATH}/matching/lawyers`, criteria);
      return response.data;
    },
    
    // 매칭 요청
    requestMatch: async (lawyerId, applicationId) => {
      const response = await apiClient.post(`${BASE_PATH}/matching/request`, {
        lawyerId,
        applicationId
      });
      return response.data;
    }
  },

  // 결제 관련
  payment: {
    // 결제 정보 생성
    createPayment: async (applicationId, amount) => {
      const response = await apiClient.post(`${BASE_PATH}/payment/create`, {
        applicationId,
        amount
      });
      return response.data;
    },
    
    // 결제 상태 확인
    getStatus: async (paymentId) => {
      const response = await apiClient.get(`${BASE_PATH}/payment/status/${paymentId}`);
      return response.data;
    }
  },

  // 워크플로우
  workflow: {
    // 현재 단계 조회
    getCurrentStep: async (applicationId) => {
      const response = await apiClient.get(`${BASE_PATH}/workflow/${applicationId}/current`);
      return response.data;
    },
    
    // 다음 단계로 진행
    proceed: async (applicationId) => {
      const response = await apiClient.post(`${BASE_PATH}/workflow/${applicationId}/proceed`);
      return response.data;
    }
  },

  // 유틸리티
  // 지원 비자 타입 목록
  getSupportedVisaTypes: async () => {
    const response = await apiClient.get(`${BASE_PATH}/visa-types`);
    return response.data;
  },
  
  // 비자 설정 조회
  getVisaConfig: async (visaType) => {
    const response = await apiClient.get(`${BASE_PATH}/visa-types/${visaType}`);
    return response.data;
  }
};

export default visaServiceV3;