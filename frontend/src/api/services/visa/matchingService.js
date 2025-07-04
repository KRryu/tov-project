/**
 * 행정사 매칭 서비스
 * 백엔드의 행정사 매칭 API와 연동
 */
import { apiClient, extractData } from '../../config/apiClient';

/**
 * 행정사 매칭 API 서비스
 */
export class VisaMatchingService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * 평가 결과 기반 행정사 매칭
   * @param {Object} evaluationResult - 평가 결과
   * @param {Object} clientPreferences - 고객 선호도
   */
  async findMatches(evaluationResult, clientPreferences = {}) {
    try {
      const response = await apiClient.post('/v2/visa/matching/find', {
        evaluationResult,
        clientPreferences
      });

      return extractData(response);
    } catch (error) {
      console.error('행정사 매칭 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 매칭 이력 조회
   * @param {Object} params - 조회 파라미터
   */
  async getMatchingHistory(params = {}) {
    try {
      const response = await apiClient.get('/v2/visa/matching/history', {
        params: {
          page: 1,
          limit: 10,
          ...params
        }
      });

      return extractData(response);
    } catch (error) {
      console.error('매칭 이력 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 행정사 매칭 수락
   * @param {string} matchId - 매칭 ID
   */
  async acceptMatch(matchId) {
    try {
      const response = await apiClient.post(`/v2/visa/matching/${matchId}/accept`);
      return extractData(response);
    } catch (error) {
      console.error('매칭 수락 실패:', error);
      throw error;
    }
  }

  /**
   * 행정사 매칭 거절
   * @param {string} matchId - 매칭 ID
   * @param {string} reason - 거절 사유
   */
  async rejectMatch(matchId, reason) {
    try {
      const response = await apiClient.post(`/v2/visa/matching/${matchId}/reject`, {
        reason
      });
      return extractData(response);
    } catch (error) {
      console.error('매칭 거절 실패:', error);
      throw error;
    }
  }

  /**
   * 매칭 상세 정보 조회
   * @param {string} matchId - 매칭 ID
   */
  async getMatchDetail(matchId) {
    try {
      const response = await apiClient.get(`/v2/visa/matching/${matchId}`);
      return extractData(response);
    } catch (error) {
      console.error('매칭 상세 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 행정사 서비스 피드백 제출
   * @param {string} matchId - 매칭 ID
   * @param {Object} feedback - 피드백 정보
   */
  async submitFeedback(matchId, feedback) {
    try {
      const response = await apiClient.post(`/v2/visa/matching/${matchId}/feedback`, feedback);
      return extractData(response);
    } catch (error) {
      console.error('피드백 제출 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스 생성
const visaMatchingService = new VisaMatchingService();

export default visaMatchingService; 