import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:5000/api/auth/',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: credentials
      })
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: 'register',
        method: 'POST',
        body: userData,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: 'logout',
        method: 'POST'
      })
    }),
    getCurrentUser: builder.query({
      query: () => 'me',
      transformResponse: (response) => response.data
    })
  })
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
} = authApi;

// 인증 서비스 모듈
const authService = {
  /**
   * 사용자 로그인
   * @param {string} email - 사용자 이메일
   * @param {string} password - 사용자 비밀번호
   * @returns {Promise<Object>} 로그인 응답 객체 (사용자 정보와 토큰 포함)
   */
  login: async (email, password) => {
    console.group('🔄 authService.login 호출');
    console.log('로그인 시도 이메일:', email);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      console.log('✅ 로그인 API 응답 성공:', {
        상태코드: response.status,
        데이터포함여부: Boolean(response.data),
        토큰포함여부: Boolean(response.data?.token)
      });
      
      console.groupEnd();
      return response.data;
    } catch (error) {
      console.error('❌ 로그인 API 호출 실패:', {
        상태코드: error.response?.status,
        오류메시지: error.response?.data?.message || error.message
      });
      
      console.groupEnd();
      throw error;
    }
  },
  
  /**
   * 사용자 로그아웃
   * @returns {Promise<Object>} 로그아웃 응답 객체
   */
  logout: async () => {
    console.group('🔄 authService.logout 호출');
    
    try {
      const token = localStorage.getItem('token');
      console.log('로그아웃 요청 토큰 존재 여부:', Boolean(token));
      
      if (!token) {
        console.log('⚠️ 토큰이 없어 로컬에서만 로그아웃 처리');
        console.groupEnd();
        return { success: true };
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ 로그아웃 API 응답 성공:', {
        상태코드: response.status,
        성공여부: response.data?.success
      });
      
      console.groupEnd();
      return response.data;
    } catch (error) {
      console.error('❌ 로그아웃 API 호출 실패:', {
        상태코드: error.response?.status,
        오류메시지: error.response?.data?.message || error.message
      });
      
      // 로그아웃은 클라이언트 측에서 항상 성공해야 함
      console.log('⚠️ API 오류가 있어도 로컬에서 로그아웃 처리');
      console.groupEnd();
      return { success: true };
    }
  },
  
  /**
   * 현재 로그인한 사용자 정보 가져오기
   * @returns {Promise<Object>} 사용자 정보 객체
   */
  getCurrentUser: async () => {
    console.group('🔄 authService.getCurrentUser 호출');
    
    try {
      const token = localStorage.getItem('token');
      console.log('토큰 존재 여부:', Boolean(token));
      
      if (!token) {
        console.log('❌ 토큰이 없어 사용자 정보를 가져올 수 없음');
        console.groupEnd();
        throw new Error('No token found');
      }
      
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('✅ 사용자 정보 가져오기 성공:', {
        이메일: response.data?.user?.email,
        역할: response.data?.user?.role
      });
      
      console.groupEnd();
      return response.data;
    } catch (error) {
      console.error('❌ 사용자 정보 가져오기 실패:', {
        상태코드: error.response?.status,
        오류메시지: error.response?.data?.message || error.message
      });
      
      console.groupEnd();
      throw error;
    }
  },
  
  /**
   * 사용자 등록
   * @param {Object} userData - 사용자 등록 데이터
   * @returns {Promise<Object>} 등록 응답 객체
   */
  register: async (userData) => {
    console.group('🔄 authService.register 호출');
    console.log('등록 데이터:', {
      이메일: userData.email,
      이름포함: Boolean(userData.name)
    });
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      console.log('✅ 사용자 등록 성공:', {
        상태코드: response.status,
        데이터포함여부: Boolean(response.data)
      });
      
      console.groupEnd();
      return response.data;
    } catch (error) {
      console.error('❌ 사용자 등록 실패:', {
        상태코드: error.response?.status,
        오류메시지: error.response?.data?.message || error.message
      });
      
      console.groupEnd();
      throw error;
    }
  }
};

export default authService; 