import axios from 'axios';
import { API_BASE_URL } from '../config';

// 인증 헤더 가져오기
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 사용자 정보 관련 API 서비스
 */
const userService = {
  /**
   * 현재 로그인한 사용자의 프로필 정보를 가져옵니다.
   * @returns {Promise<Object>} 사용자 프로필 정보
   */
  async getUserProfile() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/profile`,
        { headers: getAuthHeader() }
      );
      console.log('API 응답 원본:', response);
      
      // 백엔드 응답 구조에 따라 올바른 데이터 반환
      // response.data.data 구조인 경우와 response.data 구조 모두 지원
      const userData = response.data.data || response.data;
      
      console.log('반환할 사용자 데이터:', userData);
      return userData;
    } catch (error) {
      console.error('사용자 프로필 정보를 가져오는 중 오류 발생:', error);
      console.log('오류 상세:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      // 개발 중에는 임시 데이터 반환
      console.log('개발용 임시 사용자 데이터 사용');
      return {
        id: 'user123',
        name: '홍길동',
        email: 'user@example.com',
        phoneNumber: '010-1234-5678',
        nationality: '대한민국',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-02-01T00:00:00.000Z'
      };
    }
  },

  /**
   * 사용자 프로필 정보를 업데이트합니다.
   * @param {Object} profileData - 업데이트할 프로필 정보
   * @returns {Promise<Object>} 업데이트된 사용자 프로필
   */
  async updateUserProfile(profileData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        profileData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('사용자 프로필 업데이트 중 오류 발생:', error);
      throw error;
    }
  },

  /**
   * 비자 신청에 필요한 사용자 관련 정보를 가져옵니다.
   * 회원가입 시 이미 입력된 정보와 비자 신청 시 필요한 추가 정보를 포함합니다.
   * @returns {Promise<Object>} 비자 신청에 필요한 사용자 정보
   */
  async getVisaUserInfo() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/visa-info`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('비자 신청 관련 사용자 정보를 가져오는 중 오류 발생:', error);
      // 개발 중에는 임시 데이터 반환
      console.log('개발용 임시 비자 사용자 데이터 사용');
      return {
        personalInfo: {
          name: '홍길동',
          email: 'user@example.com',
          phone: '010-1234-5678',
          nationality: '대한민국',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          address: '서울시 강남구'
        },
        visaHistory: {
          hasVisaHistory: true,
          previousVisaTypes: ['D-2', 'D-4'],
          currentVisaType: 'D-2',
          currentVisaExpiryDate: '2023-12-31'
        }
      };
    }
  }
};

export default userService; 