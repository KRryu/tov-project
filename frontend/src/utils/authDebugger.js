/**
 * 인증 디버깅 유틸리티
 * 개발 환경에서 인증 관련 문제를 디버깅하기 위한 도구들을 제공합니다.
 */

import { jwtDecode } from 'jwt-decode';
import { store } from '../redux/store';

// localStorage에 저장된 토큰을 확인하고 디코딩하는 함수
export const checkStoredToken = () => {
  console.group('🔍 인증 토큰 디버그');
  
  try {
    // localStorage에서 토큰 가져오기
    const token = localStorage.getItem('token');
    console.log('LocalStorage 토큰 존재 여부:', Boolean(token));
    
    if (!token) {
      console.log('❌ 토큰이 없음: 로그인되지 않은 상태');
      console.groupEnd();
      return null;
    }
    
    // 토큰 디코딩 시도
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      const isExpired = decoded.exp < now;
      
      console.log('🎫 토큰 디코딩 결과:', {
        userId: decoded.id,
        발급시간: new Date(decoded.iat * 1000).toLocaleString(),
        만료시간: new Date(decoded.exp * 1000).toLocaleString(),
        만료여부: isExpired ? '❌ 만료됨' : '✅ 유효함'
      });
      
      if (isExpired) {
        console.log('⚠️ 토큰이 만료되었습니다! 재로그인이 필요합니다.');
      }
      
      console.groupEnd();
      return { decoded, isExpired };
    } catch (error) {
      console.error('❌ 토큰 디코딩 실패:', error.message);
      console.log('❌ 잘못된 형식의 토큰이 저장되어 있습니다.');
      console.groupEnd();
      return { error: '잘못된 토큰 형식' };
    }
  } catch (error) {
    console.error('❌ 토큰 확인 중 오류 발생:', error);
    console.groupEnd();
    return { error: '토큰 확인 실패' };
  }
};

// Redux 인증 상태를 확인하는 함수
export const checkReduxAuthState = () => {
  console.group('🔐 Redux 인증 상태 디버그');
  
  try {
    const state = store.getState();
    const auth = state.auth;
    
    console.log('Redux 인증 상태:', {
      authenticated: Boolean(auth.token),
      token일부: auth.token ? `${auth.token.substring(0, 10)}...` : 'null',
      user정보: auth.user ? {
        이메일: auth.user.email,
        역할: auth.user.role,
        아이디: auth.user._id
      } : 'null'
    });
    
    // Redux에 토큰은 있지만 사용자 정보가 없는 경우
    if (auth.token && !auth.user) {
      console.log('⚠️ 토큰은 있으나 사용자 정보가 없습니다. 비정상적인 상태일 수 있습니다.');
    }
    
    console.groupEnd();
    return auth;
  } catch (error) {
    console.error('❌ Redux 상태 확인 중 오류 발생:', error);
    console.groupEnd();
    return { error: 'Redux 상태 확인 실패' };
  }
};

// 인증 헤더를 디버깅하는 함수
export const debugAuthHeader = () => {
  console.group('🔏 인증 헤더 디버그');
  
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log('Authorization 헤더 형식:', `Bearer ${token.substring(0, 10)}...`);
    } else {
      console.log('❌ 토큰이 없어 Authorization 헤더를 설정할 수 없습니다.');
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('❌ 인증 헤더 디버깅 중 오류 발생:', error);
    console.groupEnd();
  }
};

// 전체 인증 상태를 종합적으로 확인하는 함수
export const debugFullAuthState = () => {
  console.group('🔍 인증 상태 종합 디버그');
  
  const tokenInfo = checkStoredToken();
  const reduxState = checkReduxAuthState();
  debugAuthHeader();
  
  // 상태 불일치 검사
  if (tokenInfo && reduxState) {
    if (Boolean(localStorage.getItem('token')) !== Boolean(reduxState.token)) {
      console.log('⚠️ 불일치 감지: LocalStorage와 Redux의 토큰 상태가 다릅니다!');
    }
  }
  
  console.groupEnd();
  
  return {
    tokenInfo,
    reduxState
  };
};

// 개발 환경에서만 window 객체에 디버깅 함수 노출
if (process.env.NODE_ENV === 'development') {
  window.authDebug = {
    checkStoredToken,
    checkReduxAuthState,
    debugAuthHeader,
    debugFullAuthState
  };
  
  console.log('🛠️ 인증 디버깅 유틸리티가 활성화되었습니다. 콘솔에서 authDebug 객체를 통해 사용할 수 있습니다.');
} 