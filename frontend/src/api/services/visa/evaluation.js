/**
 * 비자 평가 서비스
 * 백엔드의 평가 엔진과 연동
 */

import apiClient from '../../config/apiClient';

const BASE_PATH = '/api/v2/visa/evaluation';

const evaluationService = {
  /**
   * 사전 평가 실행
   * @param {Object} data - 평가 데이터
   * @param {string} data.visaType - 비자 타입 (E-1, E-2 등)
   * @param {string} data.applicationType - 신청 타입 (NEW, EXTENSION, CHANGE)
   * @param {Object} data.applicantInfo - 신청자 정보
   * @returns {Promise} 평가 결과
   */
  evaluate: async (data) => {
    try {
      const response = await apiClient.post(`${BASE_PATH}/evaluate`, data);
      return response.data;
    } catch (error) {
      console.error('Evaluation failed:', error);
      throw error;
    }
  },

  /**
   * 빠른 자격 체크
   * @param {Object} data - 기본 정보
   * @returns {Promise} 간단한 자격 여부
   */
  quickCheck: async (data) => {
    try {
      const response = await apiClient.post(`${BASE_PATH}/quick-check`, data);
      return response.data;
    } catch (error) {
      console.error('Quick check failed:', error);
      throw error;
    }
  },

  /**
   * 평가 이력 조회
   * @param {string} userId - 사용자 ID
   * @returns {Promise} 평가 이력 목록
   */
  getHistory: async (userId) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/history`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch evaluation history:', error);
      throw error;
    }
  },

  /**
   * 평가 결과 상세 조회
   * @param {string} evaluationId - 평가 ID
   * @returns {Promise} 평가 결과 상세
   */
  getDetail: async (evaluationId) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/${evaluationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch evaluation detail:', error);
      throw error;
    }
  },

  /**
   * 평가 결과 PDF 다운로드
   * @param {string} evaluationId - 평가 ID
   * @returns {Promise} PDF 다운로드 URL
   */
  downloadPDF: async (evaluationId) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/${evaluationId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `evaluation-${evaluationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  },

  /**
   * 평가 결과 공유
   * @param {string} evaluationId - 평가 ID
   * @param {Object} shareData - 공유 정보
   * @returns {Promise} 공유 링크
   */
  share: async (evaluationId, shareData) => {
    try {
      const response = await apiClient.post(`${BASE_PATH}/${evaluationId}/share`, shareData);
      return response.data;
    } catch (error) {
      console.error('Failed to share evaluation:', error);
      throw error;
    }
  },

  /**
   * 점수별 통계 조회
   * @param {string} visaType - 비자 타입
   * @returns {Promise} 통계 데이터
   */
  getStatistics: async (visaType) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/statistics`, {
        params: { visaType }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      throw error;
    }
  },

  /**
   * 재평가 요청
   * @param {string} evaluationId - 기존 평가 ID
   * @param {Object} updatedData - 업데이트된 데이터
   * @returns {Promise} 새로운 평가 결과
   */
  reevaluate: async (evaluationId, updatedData) => {
    try {
      const response = await apiClient.post(`${BASE_PATH}/${evaluationId}/reevaluate`, updatedData);
      return response.data;
    } catch (error) {
      console.error('Reevaluation failed:', error);
      throw error;
    }
  }
};

export default evaluationService;