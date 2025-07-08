/**
 * 고급 비자 서비스 API 클라이언트
 * 플러그인 기반 v2 백엔드의 고급 기능 활용
 */

import apiClient from '../../config/apiClient';

class AdvancedVisaService {
  constructor() {
    this.baseURL = '/v2/visa/advanced';
  }

  /**
   * 비자 사전심사
   * @param {string} visaType - 비자 타입 (예: E-1, E-2, E-7)
   * @param {string} applicationType - 신청 유형 (NEW, EXTENSION, CHANGE)
   * @param {Object} applicantData - 신청자 데이터
   */
  async performPreScreening(visaType, applicationType, applicantData) {
    try {
      // 전송 데이터 로깅
      console.log('Pre-screening request data:', {
        visaType,
        applicationType,
        applicantData
      });
      
      const response = await apiClient.post(`${this.baseURL}/pre-screening`, {
        visaType,
        applicationType,
        applicantData
      });
      
      console.log('Pre-screening response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Pre-screening error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 상세 비자 평가
   * @param {string} visaType 
   * @param {string} applicationType 
   * @param {Object} applicantData 
   * @param {string} applicationId - 선택적 신청서 ID
   */
  async performDetailedEvaluation(visaType, applicationType, applicantData, applicationId = null) {
    try {
      const response = await apiClient.post(`${this.baseURL}/detailed-evaluation`, {
        visaType,
        applicationType,
        applicantData,
        applicationId
      });
      return response.data;
    } catch (error) {
      console.error('Detailed evaluation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 실시간 필드 검증
   * @param {string} visaType 
   * @param {string} fieldName 
   * @param {any} value 
   * @param {Object} context 
   */
  async validateField(visaType, fieldName, value, context = {}) {
    try {
      const response = await apiClient.post(`${this.baseURL}/validate-field`, {
        visaType,
        fieldName,
        value,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Field validation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 비자 요구사항 조회
   * @param {string} visaType 
   * @param {string} applicationType 
   * @param {string} nationality 
   */
  async getRequirements(visaType, applicationType = 'NEW', nationality = null) {
    try {
      const params = { applicationType };
      if (nationality) params.nationality = nationality;

      const response = await apiClient.get(`${this.baseURL}/requirements/${visaType}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Requirements fetch error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 비자 변경 가능성 확인
   * @param {string} fromVisa 
   * @param {string} toVisa 
   */
  async checkChangeability(fromVisa, toVisa) {
    try {
      const response = await apiClient.post(`${this.baseURL}/check-changeability`, {
        fromVisa,
        toVisa
      });
      return response.data;
    } catch (error) {
      console.error('Changeability check error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 법무대리인 매칭
   * @param {Object} matchingData 
   */
  async matchLegalRepresentative(matchingData) {
    try {
      const response = await apiClient.post(`${this.baseURL}/legal-matching`, matchingData);
      return response.data;
    } catch (error) {
      console.error('Legal matching error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 문서 업로드
   * @param {string} applicationId 
   * @param {string} visaType 
   * @param {File[]} files 
   * @param {string} documentType 
   */
  async uploadDocuments(applicationId, visaType, files, documentType = 'general') {
    try {
      const formData = new FormData();
      formData.append('applicationId', applicationId);
      formData.append('visaType', visaType);
      formData.append('documentType', documentType);
      
      files.forEach(file => {
        formData.append('documents', file);
      });

      const response = await apiClient.post(`${this.baseURL}/document-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Document upload error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 문서 상태 확인
   * @param {string} applicationId 
   */
  async getDocumentStatus(applicationId) {
    try {
      const response = await apiClient.get(`${this.baseURL}/document-status/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Document status check error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 비자 신청서 생성
   * @param {string} visaType 
   * @param {string} applicationType 
   * @param {Object} applicationData 
   */
  async createApplication(visaType, applicationType, applicationData) {
    try {
      // 전송 데이터 로깅
      console.log('Create application request data:', {
        visaType,
        applicationType,
        applicationData
      });
      
      const response = await apiClient.post(`${this.baseURL}/create-application`, {
        visaType,
        applicationType,
        applicationData
      });
      
      console.log('Create application response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Application creation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 지원되는 비자 타입 목록 (확장 정보 포함)
   * @param {Object} filters 
   */
  async getSupportedTypes(filters = {}) {
    try {
      const response = await apiClient.get(`${this.baseURL}/supported-types`, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Supported types fetch error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 평가 진행 상황 추적
   * @param {string} evaluationId 
   */
  async trackEvaluationProgress(evaluationId) {
    // WebSocket 또는 Server-Sent Events를 사용한 실시간 추적
    // 현재는 폴링 방식으로 구현
    return new Promise((resolve, reject) => {
      const checkProgress = async () => {
        try {
          const response = await apiClient.get(`${this.baseURL}/evaluation-progress/${evaluationId}`);
          return response.data;
        } catch (error) {
          reject(error);
        }
      };

      // 5초마다 진행 상황 확인
      const interval = setInterval(async () => {
        const progress = await checkProgress();
        if (progress.status === 'COMPLETED' || progress.status === 'FAILED') {
          clearInterval(interval);
          resolve(progress);
        }
      }, 5000);

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Progress tracking timeout'));
      }, 300000);
    });
  }

  /**
   * 비자 타입별 통계 조회
   * @param {string} visaType 
   */
  async getVisaTypeStatistics(visaType) {
    try {
      const response = await apiClient.get(`${this.baseURL}/statistics/${visaType}`);
      return response.data;
    } catch (error) {
      console.error('Statistics fetch error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 배치 평가
   * @param {Array} evaluationRequests 
   */
  async performBatchEvaluation(evaluationRequests) {
    try {
      const response = await apiClient.post(`${this.baseURL}/batch-evaluation`, {
        evaluations: evaluationRequests
      });
      return response.data;
    } catch (error) {
      console.error('Batch evaluation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 에러 처리
   * @param {Error} error 
   */
  handleError(error) {
    if (error.response) {
      // 서버 응답 에러
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return new Error(data.message || 'Invalid request data');
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Resource not found');
        case 500:
          return new Error(data.message || 'Server error');
        default:
          return new Error(data.message || 'Unknown error');
      }
    } else if (error.request) {
      // 네트워크 에러
      return new Error('Network error - please check your connection');
    } else {
      // 기타 에러
      return error;
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    // 필요시 구현
    console.log('Advanced service cache cleared');
  }
}

// 싱글톤 인스턴스
const advancedVisaService = new AdvancedVisaService();

export default advancedVisaService;