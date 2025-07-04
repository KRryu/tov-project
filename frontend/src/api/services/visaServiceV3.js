/**
 * 통합 비자 서비스 V3 (완전체)
 * 평가 → 매칭 → 결제 → 서류업로드 → 완료까지의 전체 플로우 통합 관리
 */
import visaEvaluationService from './visa/evaluationService';
import visaApplicationService from './visa/applicationService';
import visaDocumentService from './visa/documentService';
import visaMatchingService from './visa/matchingService';
import visaWorkflowService from './visa/workflowService';
import visaPaymentService from './visa/paymentService';

/**
 * 통합 비자 서비스 V3 클래스
 * 모든 비자 관련 기능을 하나의 인터페이스로 통합
 */
class VisaServiceV3 {
  constructor() {
    // 개별 서비스 인스턴스
    this.evaluation = visaEvaluationService;
    this.application = visaApplicationService;
    this.document = visaDocumentService;
    this.matching = visaMatchingService;
    this.workflow = visaWorkflowService;
    this.payment = visaPaymentService;
    
    // 활성 플로우 추적
    this.activeFlows = new Map();
    
    // 이벤트 리스너
    this.eventListeners = new Map();
  }

  // ===== 🚀 원스톱 플로우 메서드들 =====

  /**
   * E-1 비자 완전 통합 플로우 (원스톱 서비스)
   * @param {Object} applicantData - 신청자 데이터
   * @param {Object} options - 플로우 옵션
   * @param {Function} onProgress - 진행상황 콜백
   */
  async executeE1FullFlow(applicantData, options = {}, onProgress = null) {
    const flowId = `flow_${Date.now()}`;
    
    try {
      // 플로우 시작 알림
      this._emitProgress(flowId, 'started', 0, '비자 서비스를 시작합니다', onProgress);
      
      // 1단계: 워크플로우 시작 (평가 포함)
      this._emitProgress(flowId, 'evaluation', 20, 'E-1 비자 평가 중...', onProgress);
      
      const workflowResult = await this.workflow.startWorkflow('E-1', applicantData, {
        includeLegalMatching: options.includeLegalMatching !== false,
        includeDocumentReview: options.includeDocumentReview !== false,
        urgentProcessing: options.urgentProcessing === true,
        consultationIncluded: options.consultationIncluded === true
      });
      
      if (!workflowResult.success) {
        throw new Error('평가 단계 실패');
      }
      
      const { orderId, evaluationResult } = workflowResult;
      
      // 플로우 정보 저장
      this.activeFlows.set(flowId, {
        flowId,
        orderId,
        visaType: 'E-1',
        currentStep: 'evaluation_completed',
        evaluationResult,
        startedAt: new Date().toISOString()
      });
      
      // 2단계: 행정사 매칭 (선택적)
      let matchingResult = null;
      if (options.includeLegalMatching !== false) {
        this._emitProgress(flowId, 'matching', 40, '최적의 행정사를 찾고 있습니다...', onProgress);
        
        matchingResult = await this.workflow.proceedToMatching(orderId, {
          budget: options.budget,
          preferredLanguage: options.preferredLanguage,
          location: options.location
        });
        
        if (!matchingResult.success) {
          throw new Error('행정사 매칭 실패');
        }
        
        // 플로우 업데이트
        const flow = this.activeFlows.get(flowId);
        flow.currentStep = 'matching_completed';
        flow.matchingResult = matchingResult;
        this.activeFlows.set(flowId, flow);
      }
      
      // 3단계 준비: 결제 정보 준비
      this._emitProgress(flowId, 'payment_ready', 60, '결제 준비 완료', onProgress);
      
      return {
        success: true,
        flowId,
        orderId,
        currentStep: 'payment_ready',
        evaluationResult: workflowResult.evaluationResult,
        matchingResult,
        availableActions: [
          'proceed_to_payment',
          'view_evaluation_details',
          'change_matching_preferences'
        ],
        nextStep: {
          action: 'payment',
          description: '결제를 진행하여 서비스를 계속하세요',
          estimatedCost: workflowResult.estimatedCost
        }
      };
      
    } catch (error) {
      this._emitProgress(flowId, 'error', 0, `오류 발생: ${error.message}`, onProgress);
      
      // 플로우 정보 업데이트
      if (this.activeFlows.has(flowId)) {
        const flow = this.activeFlows.get(flowId);
        flow.currentStep = 'error';
        flow.error = error.message;
        this.activeFlows.set(flowId, flow);
      }
      
      throw error;
    }
  }

  /**
   * 결제 단계 진행
   * @param {string} flowId - 플로우 ID
   * @param {string} paymentMethod - 결제 방법
   * @param {Object} paymentData - 결제 정보
   * @param {Array} selectedServices - 추가 서비스
   * @param {Function} onProgress - 진행상황 콜백
   */
  async proceedToPayment(flowId, paymentMethod, paymentData = {}, selectedServices = [], onProgress = null) {
    try {
      const flow = this.activeFlows.get(flowId);
      if (!flow) {
        throw new Error('플로우를 찾을 수 없습니다');
      }
      
      this._emitProgress(flowId, 'payment_processing', 70, '결제를 처리하고 있습니다...', onProgress);
      
      // 1. 결제 초기화
      const paymentInit = await this.payment.initiatePayment(flow.orderId, selectedServices);
      
      // 2. 실제 결제 처리
      const paymentResult = await this.payment.processPayment(
        paymentInit.paymentId,
        paymentMethod,
        paymentData
      );
      
      if (!paymentResult.success) {
        throw new Error('결제 처리 실패');
      }
      
      // 3. 워크플로우 결제 단계 진행
      const workflowPayment = await this.workflow.proceedToPayment(
        flow.orderId,
        paymentMethod,
        paymentData
      );
      
      // 플로우 업데이트
      flow.currentStep = 'payment_completed';
      flow.paymentResult = paymentResult;
      flow.paymentId = paymentInit.paymentId;
      this.activeFlows.set(flowId, flow);
      
      this._emitProgress(flowId, 'payment_completed', 80, '결제가 완료되었습니다', onProgress);
      
      return {
        success: true,
        flowId,
        paymentId: paymentInit.paymentId,
        currentStep: 'document_upload_ready',
        receipt: paymentResult.receipt,
        nextStep: {
          action: 'document_upload',
          description: '필요한 서류를 업로드해주세요',
          requiredDocuments: workflowPayment.documentsRequired
        }
      };
      
    } catch (error) {
      this._emitProgress(flowId, 'payment_error', 70, `결제 오류: ${error.message}`, onProgress);
      throw error;
    }
  }

  /**
   * 서류 업로드 및 제출
   * @param {string} flowId - 플로우 ID
   * @param {Array} documents - 업로드할 서류들
   * @param {Function} onProgress - 진행상황 콜백
   */
  async submitDocuments(flowId, documents, onProgress = null) {
    try {
      const flow = this.activeFlows.get(flowId);
      if (!flow) {
        throw new Error('플로우를 찾을 수 없습니다');
      }
      
      this._emitProgress(flowId, 'document_uploading', 90, '서류를 업로드하고 있습니다...', onProgress);
      
      // 워크플로우를 통한 서류 제출
      const documentResult = await this.workflow.submitDocuments(flow.orderId, documents);
      
      if (!documentResult.success) {
        throw new Error('서류 제출 실패');
      }
      
      // 플로우 완료
      flow.currentStep = 'completed';
      flow.completedAt = new Date().toISOString();
      flow.documentResult = documentResult;
      this.activeFlows.set(flowId, flow);
      
      this._emitProgress(flowId, 'completed', 100, '비자 서비스가 완료되었습니다!', onProgress);
      
      return {
        success: true,
        flowId,
        currentStep: 'completed',
        estimatedCompletion: documentResult.estimatedCompletion,
        trackingInfo: {
          orderId: flow.orderId,
          status: 'processing'
        }
      };
      
    } catch (error) {
      this._emitProgress(flowId, 'document_error', 90, `서류 제출 오류: ${error.message}`, onProgress);
      throw error;
    }
  }

  // ===== 📊 상태 관리 및 추적 =====

  /**
   * 플로우 상태 조회
   * @param {string} flowId - 플로우 ID
   */
  getFlowStatus(flowId) {
    return this.activeFlows.get(flowId) || null;
  }

  /**
   * 활성 플로우 목록 조회
   */
  getActiveFlows() {
    return Array.from(this.activeFlows.values());
  }

  /**
   * 플로우 진행상황 실시간 추적
   * @param {string} flowId - 플로우 ID
   * @param {Function} onUpdate - 업데이트 콜백
   */
  watchFlowProgress(flowId, onUpdate) {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      throw new Error('플로우를 찾을 수 없습니다');
    }
    
    // 워크플로우 진행상황 구독
    return this.workflow.subscribeToWorkflowProgress(flow.orderId, (progress) => {
      // 플로우 정보 업데이트
      const updatedFlow = { ...flow, workflowProgress: progress };
      this.activeFlows.set(flowId, updatedFlow);
      
      onUpdate(updatedFlow);
    });
  }

  // ===== 🛠️ 유틸리티 메서드들 =====

  /**
   * 비자 타입별 지원 여부 확인
   * @param {string} visaType - 비자 타입
   */
  async isVisaTypeSupported(visaType) {
    try {
      const supportedTypes = await this.evaluation.getSupportedTypes();
      return supportedTypes.some(type => type.code === visaType || type.name === visaType);
    } catch (error) {
      console.error('지원 비자 타입 확인 실패:', error);
      return false;
    }
  }

  /**
   * 플로우 가격 견적
   * @param {string} visaType - 비자 타입
   * @param {Array} selectedServices - 선택된 서비스
   */
  async estimateFlowCost(visaType, selectedServices = []) {
    // 기본 비용 계산
    let totalCost = 200000; // 기본 평가 비용
    
    // 비자별 기본 비용
    const visaCosts = {
      'E-1': 800000,
      'E-2': 600000,
      'E-3': 900000,
      'E-4': 700000,
      'E-5': 1000000
    };
    
    totalCost += visaCosts[visaType] || 600000;
    
    // 추가 서비스 비용
    const serviceCosts = {
      urgent: 300000,
      consultation: 150000,
      translation: 200000,
      document_review: 100000
    };
    
    selectedServices.forEach(service => {
      totalCost += serviceCosts[service] || 0;
    });
    
    return {
      baseServiceFee: 200000,
      legalRepresentativeFee: visaCosts[visaType] || 600000,
      governmentFee: 200000,
      additionalServices: selectedServices.reduce((sum, service) => 
        sum + (serviceCosts[service] || 0), 0),
      totalEstimate: totalCost + 200000, // 정부 수수료 포함
      breakdown: {
        evaluation: 200000,
        legal: visaCosts[visaType] || 600000,
        government: 200000,
        additional: selectedServices.map(service => ({
          name: service,
          cost: serviceCosts[service] || 0
        }))
      }
    };
  }

  /**
   * 플로우 취소
   * @param {string} flowId - 플로우 ID
   * @param {string} reason - 취소 사유
   */
  async cancelFlow(flowId, reason) {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      throw new Error('플로우를 찾을 수 없습니다');
    }
    
    try {
      // 워크플로우 취소
      await this.workflow.cancelWorkflow(flow.orderId, reason);
      
      // 플로우 상태 업데이트
      flow.currentStep = 'cancelled';
      flow.cancelledAt = new Date().toISOString();
      flow.cancellationReason = reason;
      this.activeFlows.set(flowId, flow);
      
      return { success: true, flowId, status: 'cancelled' };
    } catch (error) {
      throw new Error(`플로우 취소 실패: ${error.message}`);
    }
  }

  // ===== 🔧 내부 헬퍼 메서드들 =====

  /**
   * 진행상황 알림 (내부 사용)
   */
  _emitProgress(flowId, step, progress, message, onProgress) {
    const progressInfo = {
      flowId,
      step,
      progress,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (onProgress && typeof onProgress === 'function') {
      onProgress(progressInfo);
    }
    
    // 이벤트 리스너들에게도 알림
    const listeners = this.eventListeners.get('progress') || [];
    listeners.forEach(listener => listener(progressInfo));
  }

  /**
   * 이벤트 리스너 등록
   * @param {string} event - 이벤트 타입
   * @param {Function} listener - 리스너 함수
   */
  addEventListener(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(listener);
  }

  /**
   * 이벤트 리스너 제거
   * @param {string} event - 이벤트 타입
   * @param {Function} listener - 리스너 함수
   */
  removeEventListener(event, listener) {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 모든 캐시 정리
   */
  clearAllCaches() {
    this.evaluation.clearCache();
    this.matching.clearCache();
    this.payment.clearCache();
    this.workflow.clearActiveWorkflows();
    this.activeFlows.clear();
  }
}

// 싱글톤 인스턴스 생성
const visaServiceV3 = new VisaServiceV3();

export default visaServiceV3; 