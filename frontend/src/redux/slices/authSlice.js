import { createSlice } from '@reduxjs/toolkit';

// 초기 상태 설정 개선
const getInitialState = () => {
  // localStorage에서 토큰 가져오기
  const token = localStorage.getItem('token');
  
  // 초기 상태 반환
  return {
    user: null, // 사용자 정보는 항상 새로 요청
    token,
    error: null,
    returnPath: '/'
  };
};

const initialState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      
      // 디버그 로그
      console.log('Redux setCredentials:', {
        userReceived: Boolean(user),
        tokenReceived: Boolean(token),
        userEmail: user?.email
      });
      
      // 상태 업데이트
      state.user = user;
      state.token = token;
      state.error = null;
      
      // localStorage 업데이트
      if (token) {
        localStorage.setItem('token', token);
        console.log('토큰을 localStorage에 저장함');
      } else {
        console.warn('토큰이 없어 localStorage에 저장하지 않음');
      }
    },
    clearCredentials: (state) => {
      // 디버그 로그
      console.log('Redux clearCredentials 호출됨');
      
      // 상태 초기화
      state.user = null;
      state.token = null;
      state.error = null;
      state.returnPath = '/';
      
      // localStorage 초기화
      localStorage.removeItem('token');
      console.log('localStorage에서 토큰 제거됨');
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      console.log('인증 오류 설정:', action.payload);
    },
    setReturnPath: (state, action) => {
      state.returnPath = action.payload;
      console.log('반환 경로 설정:', action.payload);
    }
  }
});

export const { 
  setCredentials, 
  clearCredentials, 
  setAuthError, 
  setReturnPath 
} = authSlice.actions;

export const selectAuth = (state) => state.auth;

export default authSlice.reducer; 