import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../../api/services/authService';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../../redux/slices/authSlice';

const ChallengerForm = ({ purpose, onSuccess }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const returnPath = useSelector(state => state.auth.returnPath);
  const [register, { isLoading, error }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    nationality: '',
    phoneNumber: '',
    role: 'challenger',
    purpose: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (purpose === 'visa') {
      setFormData(prev => ({
        ...prev,
        purpose: '비자 상담'
      }));
    }
  }, [purpose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = '이메일을 입력해주세요';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = '유효한 이메일 형식이 아닙니다';
    
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';
    else if (formData.password.length < 6) newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다';
    
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    
    if (!formData.name) newErrors.name = '이름을 입력해주세요';
    if (!formData.nationality) newErrors.nationality = '국적을 입력해주세요';
    if (!formData.phoneNumber) newErrors.phoneNumber = '전화번호를 입력해주세요';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const { confirmPassword, ...registerData } = formData;
      
      const response = await register(registerData).unwrap();
      
      if (response.token && response.user) {
        dispatch(setCredentials({
          user: response.user,
          token: response.token
        }));
        
        if (onSuccess) {
          onSuccess();
        } else {
          if (purpose === 'visa' && returnPath) {
            navigate(returnPath);
          } else {
            navigate('/');
          }
        }
      }
    } catch (err) {
      console.error('회원가입 오류:', err);
      setErrors({
        submit: err.data?.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
      });
    }
  };

  const getPurposeLabel = () => {
    const purposeMap = {
      job: '취업 준비',
      visa: '비자 상담',
      education: '한국어 교육'
    };
    return purposeMap[purpose] || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-indigo-50 rounded-lg p-4 mb-6">
        <p className="text-indigo-700 text-sm font-medium">
          TOVmate에서 새로운 기회를 찾아보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            이메일
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            이름
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className={`appearance-none block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.name}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.password}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className={`appearance-none block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">국적</label>
          <div className="mt-1">
            <select
              id="nationality"
              name="nationality"
              className={`appearance-none block w-full px-3 py-2 border ${errors.nationality ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              value={formData.nationality}
              onChange={handleChange}
              required
            >
              <option value="">국적을 선택해주세요</option>
              <option value="Vietnam">베트남</option>
              <option value="Philippines">필리핀</option>
              <option value="Indonesia">인도네시아</option>
              <option value="Thailand">태국</option>
              <option value="Myanmar">미얀마</option>
              <option value="Malaysia">말레이시아</option>
              <option value="Singapore">싱가포르</option>
              <option value="India">인도</option>
              <option value="Nepal">네팔</option>
              <option value="Sri Lanka">스리랑카</option>
              <option value="Mongolia">몽골</option>
              <option value="Uzbekistan">우즈베키스탄</option>
              <option value="Cambodia">캄보디아</option>
              <option value="China">중국</option>
              <option value="Japan">일본</option>
              <option value="Taiwan">대만</option>
              <option value="Hong Kong">홍콩</option>
              <option value="USA">미국</option>
              <option value="Canada">캐나다</option>
              <option value="UK">영국</option>
              <option value="Australia">호주</option>
              <option value="New Zealand">뉴질랜드</option>
              <option value="France">프랑스</option>
              <option value="Germany">독일</option>
              <option value="Netherlands">네덜란드</option>
              <option value="Russia">러시아</option>
              <option value="Brazil">브라질</option>
              <option value="Mexico">멕시코</option>
              <option value="South Africa">남아프리카공화국</option>
              <option value="other">기타</option>
            </select>
            {errors.nationality && <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            전화번호
          </label>
          <div className="relative">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              required
              className={`appearance-none block w-full px-3 py-2 border ${errors.phoneNumber ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            {errors.phoneNumber && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
            가입 목적
          </label>
          <div className="relative">
            <select
              id="purpose"
              name="purpose"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.purpose}
              onChange={handleChange}
            >
              <option value="">선택해주세요</option>
              <option value="취업 준비">취업 준비</option>
              <option value="비자 상담">비자 상담</option>
              <option value="한국어 교육">한국어 교육</option>
              <option value="생활 정보">생활 정보</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="mt-8">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              처리중...
            </span>
          ) : (
            '가입하기'
          )}
        </button>
      </div>
    </form>
  );
}

export default ChallengerForm; 