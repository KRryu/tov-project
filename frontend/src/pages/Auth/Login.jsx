import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { checkStoredToken } from '../../utils/authDebugger';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authLoading } = useAuth();
  const dispatch = useDispatch();
  const authState = useSelector(state => state.auth);
  
  // 페이지 로드 시 현재 인증 상태 디버깅
  useEffect(() => {
    console.group('🔐 로그인 페이지 로드: 인증 상태 확인');
    console.log('현재 Redux 인증 상태:', {
      isAuthenticated: Boolean(authState.token),
      hasUserInfo: Boolean(authState.user),
      userEmail: authState.user?.email || '없음'
    });
    
    // 저장된 토큰 확인 시도
    const tokenInfo = checkStoredToken();
    
    console.groupEnd();
  }, [authState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔄 로그인 시도:', formData.email);
      
      // login 함수 호출 시 객체로 묶어서 전달
      const result = await login({
        email: formData.email,
        password: formData.password
      });
      
      // 로그인 결과 디버깅
      console.log('✅ 로그인 응답:', {
        성공: Boolean(result?.success),
        토큰받음: Boolean(result?.token),
        사용자정보: result?.user?.email || '없음'
      });
      
      // 디버깅 로그 추가
      console.log('로그인 성공, 리디렉션 정보 확인:');
      console.log('- Query params:', location.search);
      console.log('- State:', location.state);
      console.log('- localStorage returnPath:', localStorage.getItem('returnPath'));
      
      // URL에서 from 파라미터 확인
      const queryParams = new URLSearchParams(location.search);
      const fromParam = queryParams.get('from');
      
      // 비자 서비스 관련 리디렉션 처리 (조건 명확화)
      if (fromParam === 'visa') {
        // URL 파라미터에 명시적으로 비자 서비스가 지정된 경우만 해당 페이지로 이동
        console.log('✅ 비자 서비스에서 온 요청으로 비자 서비스 페이지로 이동합니다.');
        // 비자 서비스 접근 플래그 설정
        sessionStorage.setItem('visaServiceAccess', 'true');
        navigate('/services/visa/step1');
        return;
      }
      
      // 리디렉션 경로 체크 (다른 경우 처리)
      if (location.state?.returnPath) {
        // location.state에 returnPath가 있는 경우
        console.log('✅ location.state의 returnPath로 이동:', location.state.returnPath);
        navigate(location.state.returnPath);
      } else if (localStorage.getItem('returnPath')) {
        // localStorage에 returnPath가 있는 경우
        const savedPath = localStorage.getItem('returnPath');
        console.log('✅ localStorage의 returnPath로 이동:', savedPath);
        localStorage.removeItem('returnPath'); // 사용 후 삭제
        navigate(savedPath);
      } else {
        // 그 외 경우 홈으로 리디렉션
        console.log('✅ 지정된 returnPath가 없어 홈으로 이동합니다.');
        navigate('/');
      }
      
      toast.success('로그인되었습니다!');
    } catch (err) {
      console.error('❌ 로그인 실패:', err);
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative md:flex">
        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col">
            <div className="flex-1">
              <div className="max-w-md mx-auto w-full px-4 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">로그인</h1>
                  <p className="text-gray-600">TOVmate에 오신 것을 환영합니다</p>
                </div>

                {location.state?.message && (
                  <div className="mb-8 p-4 bg-green-50 rounded-lg">
                    <p className="text-green-600">{location.state.message}</p>
                  </div>
                )}

                {error && (
                  <div className="mb-8 p-4 bg-red-50 rounded-lg">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      비밀번호
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        로그인 상태 유지
                      </label>
                    </div>
                    <Link to="/forgot-password" className="text-sm font-medium text-violet-600 hover:text-violet-500">
                      비밀번호 찾기
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        처리중...
                      </span>
                    ) : '로그인'}
                  </button>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      아직 계정이 없으신가요?{' '}
                      <Link 
                        to={location.search.includes('from=visa') ? "/register?purpose=visa" : "/register"} 
                        className="font-medium text-violet-600 hover:text-violet-500"
                      >
                        회원가입
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
          <img 
            className="object-cover object-center w-full h-full" 
            src="/assets/images/login/login-image.jpg"
            width="760" 
            height="1024" 
            alt="Authentication" 
          />
        </div>
      </div>
    </main>
  );
}

export default Login;
