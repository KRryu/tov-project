/**
 * 비자 서비스 워크플로우 서비스
 * 평가 → 매칭 → 결제 → 서류업로드 → 완료까지의 전체 플로우 관리
 */
import { apiClient, extractData, subscribeToProgress } from '../../config/apiClient';

/**
 * 워크플로우 API 서비스
 */
export class VisaWorkflowService {
  constructor() {
    this.activeWorkflows = new Map();
  }

  /**
   * 비자 서비스 워크플로우 시작 (평가 단계)
   * @param {string} visaType - 비자 타입
   * @param {Object} applicantData - 신청자 데이터
   * @param {Object} options - 옵션
   */
  async startWorkflow(visaType, applicantData, options = {}) {
    try {
      const response = await apiClient.post('/v2/visa/workflow/start', {
        visaType,
        applicantData,
        options: {
          includeLegalMatching: true,
          includeDocumentReview: true,
          urgentProcessing: false,
          consultationIncluded: false,
          ...options
        }
      });

      const result = extractData(response);
      
      // 워크플로우 추적 시작
      if (result.orderId) {
        this.activeWorkflows.set(result.orderId, {
          orderId: result.orderId,
          visaType,
          currentStep: result.workflow?.currentStep || 'evaluation',
          startedAt: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('워크플로우 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 행정사 매칭 단계 진행
   * @param {string} orderId - 주문 ID
   * @param {Object} preferences - 고객 선호도
   */
  async proceedToMatching(orderId, preferences = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/workflow/${orderId}/matching`, {
        preferences
      });

      const result = extractData(response);
      this._updateWorkflowStatus(orderId, 'matching');
      
      return result;
    } catch (error) {
      console.error('매칭 단계 진행 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 처리 단계
   * @param {string} orderId - 주문 ID
   * @param {string} paymentMethod - 결제 방법
   * @param {Object} paymentData - 결제 데이터
   */
  async proceedToPayment(orderId, paymentMethod, paymentData = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/workflow/${orderId}/payment`, {
        paymentMethod,
        paymentData
      });

      const result = extractData(response);
      this._updateWorkflowStatus(orderId, 'payment');
      
      return result;
    } catch (error) {
      console.error('결제 단계 진행 실패:', error);
      throw error;
    }
  }

  /**
   * 서류 제출 단계
   * @param {string} orderId - 주문 ID
   * @param {Array} documents - 서류 목록
   */
  async submitDocuments(orderId, documents) {
    try {
      const response = await apiClient.post(`/v2/visa/workflow/${orderId}/documents`, {
        documents
      });

      const result = extractData(response);
      this._updateWorkflowStatus(orderId, 'documents');
      
      return result;
    } catch (error) {
      console.error('서류 제출 단계 실패:', error);
      throw error;
    }
  }

  /**
   * 워크플로우 진행상황 추적
   * @param {string} orderId - 주문 ID
   * @param {Function} onUpdate - 업데이트 콜백
   */
  async trackProgress(orderId, onUpdate = null) {
    try {
      const response = await apiClient.get(`/v2/visa/workflow/${orderId}/status`);
      const result = extractData(response);
      
      // 진행상황 업데이트
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(result);
      }
      
      this._updateWorkflowStatus(orderId, result.workflow?.currentStep);
      
      return result;
    } catch (error) {
      console.error('워크플로우 상태 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 모든 워크플로우 주문 조회
   * @param {Object} params - 조회 파라미터
   */
  async getWorkflowOrders(params = {}) {
    try {
      const response = await apiClient.get('/v2/visa/workflow/orders', {
        params: {
          page: 1,
          limit: 10,
          ...params
        }
      });

      return extractData(response);
    } catch (error) {
      console.error('워크플로우 주문 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 워크플로우 취소
   * @param {string} orderId - 주문 ID
   * @param {string} reason - 취소 사유
   */
  async cancelWorkflow(orderId, reason) {
    try {
      const response = await apiClient.post(`/v2/visa/workflow/${orderId}/cancel`, {
        reason
      });

      const result = extractData(response);
      this._updateWorkflowStatus(orderId, 'cancelled');
      
      return result;
    } catch (error) {
      console.error('워크플로우 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 실시간 진행상황 구독
   * @param {string} orderId - 주문 ID
   * @param {Function} onProgress - 진행상황 콜백
   */
  subscribeToWorkflowProgress(orderId, onProgress) {
    if (typeof subscribeToProgress === 'function') {
      return subscribeToProgress(orderId, onProgress);
    } else {
      // WebSocket이 없으면 폴링으로 대체
      return this._pollWorkflowProgress(orderId, onProgress);
    }
  }

  /**
   * 워크플로우 완전 통합 실행 (E-1 전용 원스톱)
   * @param {Object} applicantData - 신청자 데이터  
   * @param {Object} preferences - 고객 선호도
   * @param {Function} onStepComplete - 단계 완료 콜백
   */
  async executeE1FullWorkflow(applicantData, preferences = {}, onStepComplete = null) {
    try {
      // 1단계: 워크플로우 시작 (평가)
      const workflowResult = await this.startWorkflow('E-1', applicantData, {
        includeLegalMatching: true,
        includeDocumentReview: true
      });

      if (onStepComplete) {
        onStepComplete('evaluation', workflowResult);
      }

      const { orderId } = workflowResult;

      // 2단계: 행정사 매칭 (자동)
      const matchingResult = await this.proceedToMatching(orderId, preferences);
      
      if (onStepComplete) {
        onStepComplete('matching', matchingResult);
      }

      return {
        success: true,
        orderId,
        currentStep: 'matching_completed',
        nextStep: 'payment',
        matchingResult,
        availableActions: ['proceed_to_payment', 'view_match_details']
      };

    } catch (error) {
      console.error('E-1 풀 워크플로우 실행 실패:', error);
      throw error;
    }
  }

  /**
   * 워크플로우 상태 업데이트 (내부 사용)
   */
  _updateWorkflowStatus(orderId, currentStep) {
    if (this.activeWorkflows.has(orderId)) {
      const workflow = this.activeWorkflows.get(orderId);
      workflow.currentStep = currentStep;
      workflow.lastUpdated = new Date().toISOString();
      this.activeWorkflows.set(orderId, workflow);
    }
  }

  /**
   * 폴링 기반 진행상황 추적 (WebSocket 대체)
   */
  _pollWorkflowProgress(orderId, onProgress, interval = 5000) {
    const pollInterval = setInterval(async () => {
      try {
        const progress = await this.trackProgress(orderId);
        onProgress(progress);
        
        // 완료되면 폴링 중단
        if (['completed', 'cancelled', 'failed'].includes(progress.workflow?.currentStep)) {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('폴링 오류:', error);
        clearInterval(pollInterval);
      }
    }, interval);

    return () => clearInterval(pollInterval);
  }

  /**
   * 활성 워크플로우 정리
   */
  clearActiveWorkflows() {
    this.activeWorkflows.clear();
  }

  /**
   * 특정 워크플로우 정보 조회
   */
  getActiveWorkflow(orderId) {
    return this.activeWorkflows.get(orderId);
  }
}

// 싱글톤 인스턴스 생성
const visaWorkflowService = new VisaWorkflowService();

export default visaWorkflowService; 