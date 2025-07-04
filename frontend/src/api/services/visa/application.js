/**
 * 비자 신청 서비스
 * 백엔드의 신청 프로세스와 연동
 */

import apiClient from '../../config/apiClient';

const BASE_PATH = '/api/v2/visa/application';

const applicationService = {
  /**
   * 신청서 생성
   * @param {Object} data - 신청 데이터
   * @returns {Promise} 생성된 신청서 정보
   */
  create: async (data) => {
    try {
      const response = await apiClient.post(`${BASE_PATH}/create`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create application:', error);
      throw error;
    }
  },

  /**
   * 신청서 목록 조회
   * @param {Object} params - 조회 파라미터
   * @returns {Promise} 신청서 목록
   */
  getList: async (params = {}) => {
    try {
      const response = await apiClient.get(BASE_PATH, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      throw error;
    }
  },

  /**
   * 신청서 상세 조회
   * @param {string} applicationId - 신청서 ID
   * @returns {Promise} 신청서 상세 정보
   */
  getDetail: async (applicationId) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch application detail:', error);
      throw error;
    }
  },

  /**
   * 신청서 업데이트
   * @param {string} applicationId - 신청서 ID
   * @param {Object} data - 업데이트 데이터
   * @returns {Promise} 업데이트된 신청서
   */
  update: async (applicationId, data) => {
    try {
      const response = await apiClient.put(`${BASE_PATH}/${applicationId}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update application:', error);
      throw error;
    }
  },

  /**
   * 신청서 삭제
   * @param {string} applicationId - 신청서 ID
   * @returns {Promise} 삭제 결과
   */
  delete: async (applicationId) => {
    try {
      const response = await apiClient.delete(`${BASE_PATH}/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete application:', error);
      throw error;
    }
  },

  /**
   * 신청서 제출
   * @param {string} applicationId - 신청서 ID
   * @returns {Promise} 제출 결과
   */
  submit: async (applicationId) => {
    try {
      const response = await apiClient.post(`${BASE_PATH}/${applicationId}/submit`);
      return response.data;
    } catch (error) {
      console.error('Failed to submit application:', error);
      throw error;
    }
  },

  /**
   * 신청서 상태 조회
   * @param {string} applicationId - 신청서 ID
   * @returns {Promise} 신청서 상태
   */
  getStatus: async (applicationId) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/${applicationId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch application status:', error);
      throw error;
    }
  },

  /**
   * 지원 가능한 비자 타입 조회
   * @returns {Promise} 비자 타입 목록
   */
  getSupportedVisaTypes: async () => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/visa-types`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch visa types:', error);
      throw error;
    }
  },

  /**
   * 비자 타입별 설정 조회
   * @param {string} visaType - 비자 타입
   * @returns {Promise} 비자 설정 정보
   */
  getVisaTypeConfig: async (visaType) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/visa-types/${visaType}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch visa type config:', error);
      throw error;
    }
  },

  /**
   * 신청 타입별 요구사항 조회
   * @param {string} visaType - 비자 타입
   * @param {string} applicationType - 신청 타입
   * @returns {Promise} 요구사항 정보
   */
  getRequirements: async (visaType, applicationType) => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/requirements`, {
        params: { visaType, applicationType }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
      throw error;
    }
  },

  /**
   * 임시 저장
   * @param {Object} data - 임시 저장 데이터
   * @returns {Promise} 저장 결과
   */
  saveDraft: async (data) => {
    try {
      const response = await apiClient.post(`${BASE_PATH}/draft`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  },

  /**
   * 임시 저장 목록 조회
   * @returns {Promise} 임시 저장 목록
   */
  getDrafts: async () => {
    try {
      const response = await apiClient.get(`${BASE_PATH}/drafts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
      throw error;
    }
  }
};

export default applicationService;