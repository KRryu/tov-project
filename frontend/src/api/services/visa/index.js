/**
 * 통합 비자 서비스 - 메인 export
 * 백엔드의 새로운 비자 모듈과 연동
 */

import applicationService from './application';
import evaluationService from './evaluation';
import documentService from './document';
import paymentService from './payment';
import workflowService from './workflow';
import matchingService from './matching';

const visaService = {
  // 신청 관련
  application: applicationService,
  
  // 평가 관련
  evaluation: evaluationService,
  
  // 문서 관련
  document: documentService,
  
  // 결제 관련
  payment: paymentService,
  
  // 워크플로우
  workflow: workflowService,
  
  // 법무대리인 매칭
  matching: matchingService,
  
  // 유틸리티 메서드
  getSupportedVisaTypes: async () => {
    try {
      const response = await applicationService.getSupportedVisaTypes();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch supported visa types:', error);
      throw error;
    }
  },
  
  getVisaTypeConfig: async (visaType) => {
    try {
      const response = await applicationService.getVisaTypeConfig(visaType);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch config for ${visaType}:`, error);
      throw error;
    }
  }
};

export default visaService;

// Named exports for direct access
export {
  applicationService,
  evaluationService,
  documentService,
  paymentService,
  workflowService,
  matchingService
};