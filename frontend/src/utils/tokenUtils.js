// tokenUtils.js
// 인증 토큰 관리 유틸리티

/**
 * 토큰 저장 (로컬 스토리지 또는 세션 스토리지)
 * @param {string} token 저장할 토큰
 * @param {boolean} rememberMe 로그인 유지 여부
 */
export const saveToken = (token, rememberMe = false) => {
  if (!token) return;
  
  // 로그인 유지가 체크되면 로컬 스토리지에 저장, 아니면 세션 스토리지에 저장
  if (rememberMe) {
    localStorage.setItem('token', token);
    // 세션 스토리지에서 제거
    sessionStorage.removeItem('token');
  } else {
    sessionStorage.setItem('token', token);
    // 로컬 스토리지에서 제거
    localStorage.removeItem('token');
  }
};

/**
 * 토큰 가져오기 (로컬 스토리지 또는 세션 스토리지)
 * @returns {string|null} 저장된 토큰
 */
export const getToken = () => {
  // 로컬 스토리지 먼저 확인, 없으면 세션 스토리지 확인
  return localStorage.getItem('token') || sessionStorage.getItem('token') || null;
};

/**
 * 토큰 삭제 (로그아웃용)
 */
export const removeToken = () => {
  // 모든 스토리지에서 토큰 제거
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

/**
 * 토큰 유효성 검사 (만료 여부)
 * @returns {boolean} 토큰 유효 여부
 */
export const isTokenValid = () => {
  const token = getToken();
  
  if (!token) return false;
  
  try {
    // JWT 토큰 구조: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return false;
    
    // Base64 디코딩
    const decodedPayload = JSON.parse(atob(payload));
    
    // 만료 시간 확인
    if (decodedPayload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedPayload.exp > currentTime;
    }
    
    return true;
  } catch (error) {
    console.error('토큰 유효성 검사 오류:', error);
    return false;
  }
};

/**
 * 사용자 정보 가져오기 (토큰에서)
 * @returns {Object|null} 사용자 정보
 */
export const getUserFromToken = () => {
  const token = getToken();
  
  if (!token) return null;
  
  try {
    // JWT 토큰 구조: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return null;
    
    // Base64 디코딩
    const decodedPayload = JSON.parse(atob(payload));
    
    return {
      id: decodedPayload.id || decodedPayload.userId || null,
      email: decodedPayload.email || null,
      name: decodedPayload.name || null,
      role: decodedPayload.role || null
    };
  } catch (error) {
    console.error('토큰에서 사용자 정보 추출 오류:', error);
    return null;
  }
};

export default {
  saveToken,
  getToken,
  removeToken,
  isTokenValid,
  getUserFromToken
}; 