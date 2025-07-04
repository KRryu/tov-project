/**
 * 인증 상태 디버깅 유틸리티
 * 개발 환경에서 인증 정보를 확인하는 데 사용됩니다.
 */

// 현재 저장된 토큰 확인
export const checkStoredToken = () => {
  const token = localStorage.getItem('token');
  console.log('로컬 스토리지에 저장된 토큰:', token ? `${token.substring(0, 15)}...` : '없음');
  
  try {
    if (token) {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('토큰 페이로드:', payload);
        return payload;
      }
    }
    return null;
  } catch (e) {
    console.error('토큰 디코딩 오류:', e);
    return null;
  }
};

// Redux 스토어에 저장된 사용자 정보 확인
export const checkReduxAuthState = (store) => {
  const state = store.getState();
  if (state.auth) {
    console.log('Redux 인증 상태:', {
      isAuthenticated: Boolean(state.auth.token && state.auth.user),
      token: state.auth.token ? `${state.auth.token.substring(0, 15)}...` : '없음',
      user: state.auth.user
    });
    return state.auth;
  }
  return null;
};

// 인증 헤더 확인
export const debugAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('인증 헤더에 사용될 값:', token ? `Bearer ${token.substring(0, 15)}...` : '없음');
};

// 모든 인증 상태 확인
export const debugAllAuthState = (store) => {
  console.group('인증 상태 디버깅');
  checkStoredToken();
  checkReduxAuthState(store);
  debugAuthHeader();
  console.groupEnd();
};

export default {
  checkStoredToken,
  checkReduxAuthState,
  debugAuthHeader,
  debugAllAuthState
}; 