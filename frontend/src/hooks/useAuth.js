// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery 
} from '../api/services/authService';
import { 
  setCredentials, 
  clearCredentials,
  setAuthError,
  selectAuth 
} from '../redux/slices/authSlice';
import { checkStoredToken } from '../utils/authDebugger';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector(selectAuth);
  const [authLoading, setAuthLoading] = useState(false);
  
  useEffect(() => {
    console.group('🔐 useAuth 초기화');
    console.log('현재 인증 상태:', {
      isAuthenticated: Boolean(auth.token),
      hasUser: Boolean(auth.user),
      user: auth.user?.email
    });
    
    // 저장된 토큰 확인
    const tokenInfo = checkStoredToken();
    
    // 토큰은 있지만 사용자 정보가 없는 경우, 위의 useGetCurrentUserQuery 훅이 자동으로 사용자 정보를 가져옵니다.
    // 별도의 추가 호출은 필요하지 않습니다.
    // if (auth.token && !auth.user) {
    //   console.log('🔄 토큰은 있으나 사용자 정보가 없어 현재 사용자 정보를 가져옵니다.');
    //   getCurrentUser();
    // }
    
    console.groupEnd();
  }, []);

  const [login] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  // 토큰이 있을 때만 현재 사용자 정보를 요청
  const { data: currentUser, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !auth.token
  });
  
  // 디버그: 현재 사용자 정보
  if (currentUser) {
    console.log('현재 사용자 정보 로드됨:', currentUser);
  }

  const handleLogin = async (email, password) => {
    console.group('🔐 로그인 시도');
    
    // 입력 형식 검사 및 통일
    let loginData = {};
    
    if (typeof email === 'object' && email !== null) {
      console.log('객체 형식 로그인 데이터:', email);
      // 이미 객체 형태로 전달된 경우
      loginData = email;
    } else {
      // email, password가 별도 인자로 전달된 경우
      console.log('인자 형식 로그인 데이터:', { email, password: '***' });
      loginData = {
        email,
        password
      };
    }
    
    console.log('로그인 정보:', { email: loginData.email });
    
    // 필수 필드 검사
    if (!loginData.email || !loginData.password) {
      console.error('❌ 로그인 실패: 이메일 또는 비밀번호 누락');
      dispatch(setAuthError('이메일과 비밀번호를 모두 입력해주세요.'));
      return { success: false, message: '이메일과 비밀번호를 모두 입력해주세요.' };
    }
    
    setAuthLoading(true);
    
    try {
      const result = await login(loginData).unwrap();
      
      console.log('✅ 로그인 성공:', {
        토큰: result.token ? '받음' : '없음',
        사용자: result.user?.email
      });
      
      dispatch(setCredentials(result));
      console.log('✅ Redux 상태 업데이트 및 localStorage에 토큰 저장됨');
      console.groupEnd();
      
      return result;
    } catch (error) {
      console.error('❌ 로그인 실패:', error.response?.data?.message || error.message);
      const errorMessage = error.response?.data?.message || '로그인에 실패했습니다.';
      dispatch(setAuthError(errorMessage));
      toast.error(errorMessage);
      console.groupEnd();
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    console.group('🚪 로그아웃 시도');
    
    setAuthLoading(true);
    
    try {
      await logoutMutation().unwrap();
      dispatch(clearCredentials());
      navigate('/login');
      console.log('✅ 로그아웃 성공: Redux 상태 및 localStorage 초기화됨');
      toast.success('로그아웃되었습니다.');
    } catch (error) {
      console.error('⚠️ 로그아웃 API 호출 실패:', error.message);
      console.log('로컬 상태는 초기화됨');
      
      // API 오류가 있더라도 로컬 상태는 초기화
      dispatch(clearCredentials());
    } finally {
      setAuthLoading(false);
      console.groupEnd();
    }
  };

  return {
    user: currentUser || auth.user,
    token: auth.token,
    isAuthenticated: Boolean(auth.token && (currentUser || auth.user)),
    isLoading,
    error: auth.error,
    login: handleLogin,
    logout: handleLogout,
    authLoading,
    register: handleLogin, // Assuming register function is the same as login
  };
};

export default useAuth;
