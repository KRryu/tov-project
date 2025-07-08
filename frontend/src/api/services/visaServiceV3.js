/**
 * Visa Service V3
 * 새로운 백엔드 비자 모듈과 연동하는 서비스
 */

import apiClient from '../config/apiClient';
import advancedVisaService from './visa/advancedService';

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
  },

  // === 통합 플로우 메서드들 ===
  
  /**
   * E-1 비자 전체 플로우 실행
   * @param {Object} applicantData - 신청자 데이터
   * @param {Object} options - 옵션
   * @param {Function} onProgress - 진행 상황 콜백
   */
  executeE1FullFlow: async (applicantData, options = {}, onProgress = null) => {
    try {
      // 1. 고급 평가 서비스를 사용한 상세 평가 실행
      if (onProgress) onProgress({ step: 'evaluation', progress: 10, message: '평가를 시작합니다...' });
      
      // advancedService의 상세 평가 사용
      const evaluationResult = await advancedVisaService.performDetailedEvaluation(
        'E-1',
        applicantData.applicationType || 'NEW',
        applicantData
      );
      
      if (onProgress) onProgress({ step: 'evaluation', progress: 40, message: '평가가 완료되었습니다.' });
      
      // 2. 매칭 가능한 행정사 조회 (옵션)
      let matchingResult = null;
      if (options.includeLegalMatching) {
        if (onProgress) onProgress({ step: 'matching', progress: 50, message: '행정사 매칭을 시작합니다...' });
        
        const matchingResponse = await apiClient.post(`${BASE_PATH}/matching/lawyers`, {
          visaType: 'E-1',
          evaluationScore: evaluationResult.data?.score || evaluationResult.score,
          specialization: applicantData.evaluation?.researchField
        });
        matchingResult = matchingResponse.data;
        
        if (onProgress) onProgress({ step: 'matching', progress: 70, message: '매칭이 완료되었습니다.' });
      }
      
      // 3. 플로우 ID 생성 (임시)
      const flowId = `FLOW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (onProgress) onProgress({ step: 'completed', progress: 100, message: '준비가 완료되었습니다.' });
      
      return {
        success: true,
        flowId,
        evaluationResult: evaluationResult.data || evaluationResult,
        matchingResult: matchingResult?.data || matchingResult,
        nextStep: 'payment'
      };
      
    } catch (error) {
      console.error('E-1 Full Flow Error:', error);
      throw error;
    }
  },

  /**
   * 결제 진행
   * @param {string} flowId - 플로우 ID
   * @param {string} paymentMethod - 결제 방법
   * @param {Object} paymentData - 결제 데이터
   * @param {Array} selectedServices - 선택된 서비스
   * @param {Function} onProgress - 진행 상황 콜백
   */
  proceedToPayment: async (flowId, paymentMethod, paymentData, selectedServices = [], onProgress = null) => {
    try {
      if (onProgress) onProgress({ step: 'payment', progress: 10, message: '결제를 처리중입니다...' });
      
      // 결제 정보 생성
      const paymentResponse = await apiClient.post(`${BASE_PATH}/payment/create`, {
        flowId,
        paymentMethod,
        paymentData,
        selectedServices,
        amount: paymentData.amount || 500000 // 기본 금액
      });
      
      if (onProgress) onProgress({ step: 'payment_completed', progress: 100, message: '결제가 완료되었습니다.' });
      
      return {
        success: true,
        paymentId: paymentResponse.data.paymentId,
        nextStep: {
          requiredDocuments: paymentResponse.data.requiredDocuments || [
            { type: 'passport', name: '여권 사본', required: true },
            { type: 'photo', name: '증명사진', required: true },
            { type: 'resume', name: '이력서', required: true },
            { type: 'degree', name: '학위증명서', required: true },
            { type: 'employment', name: '재직증명서', required: false }
          ]
        }
      };
      
    } catch (error) {
      console.error('Payment Error:', error);
      throw error;
    }
  },

  /**
   * 서류 제출
   * @param {string} flowId - 플로우 ID
   * @param {Object} documents - 서류 데이터
   * @param {Function} onProgress - 진행 상황 콜백
   */
  submitDocuments: async (flowId, documents, onProgress = null) => {
    try {
      if (onProgress) onProgress({ step: 'documents', progress: 10, message: '서류를 업로드중입니다...' });
      
      // FormData 생성
      const formData = new FormData();
      formData.append('flowId', flowId);
      
      // 문서 파일 추가
      Object.entries(documents).forEach(([key, file]) => {
        if (file instanceof File) {
          formData.append('documents', file);
          formData.append('documentTypes', key);
        }
      });
      
      const response = await apiClient.post(
        `${BASE_PATH}/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (onProgress) onProgress({ step: 'completed', progress: 100, message: '서류 제출이 완료되었습니다.' });
      
      return {
        success: true,
        documentIds: response.data.documentIds,
        status: 'completed',
        message: '모든 서류가 성공적으로 제출되었습니다.'
      };
      
    } catch (error) {
      console.error('Document Submit Error:', error);
      throw error;
    }
  },

  /**
   * 플로우 비용 예측
   * @param {string} visaType - 비자 타입
   * @param {Array} additionalServices - 추가 서비스
   */
  estimateFlowCost: async (visaType, additionalServices = []) => {
    try {
      // 기본 비용 구조
      const baseCosts = {
        'E-1': {
          evaluation: 50000,
          legalService: 300000,
          documentReview: 100000,
          governmentFee: 120000
        },
        'E-2': {
          evaluation: 50000,
          legalService: 250000,
          documentReview: 80000,
          governmentFee: 90000
        }
      };
      
      const costs = baseCosts[visaType] || baseCosts['E-1'];
      
      // 추가 서비스 비용
      const additionalCosts = additionalServices.reduce((total, service) => {
        const serviceCosts = {
          'urgent': 150000,
          'translation': 100000,
          'consultation': 80000
        };
        return total + (serviceCosts[service] || 0);
      }, 0);
      
      const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0) + additionalCosts;
      
      return {
        breakdown: costs,
        additionalServices: additionalCosts,
        total: totalCost,
        currency: 'KRW'
      };
      
    } catch (error) {
      console.error('Cost Estimate Error:', error);
      throw error;
    }
  }
};

export default visaServiceV3;