import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../../api/services/authService';

function CompanyForm() {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    companyName: '',
    businessNumber: '',
    companyAddress: '',
    phoneNumber: '',
    role: 'company'
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = '이메일을 입력해주세요';
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    if (!formData.name) newErrors.name = '담당자 이름을 입력해주세요';
    if (!formData.companyName) newErrors.companyName = '회사명을 입력해주세요';
    if (!formData.businessNumber) newErrors.businessNumber = '사업자등록번호를 입력해주세요';
    if (!formData.companyAddress) newErrors.companyAddress = '회사 주소를 입력해주세요';
    if (!formData.phoneNumber) newErrors.phoneNumber = '전화번호를 입력해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await register(formData).unwrap();
      navigate('/login', { 
        state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' }
      });
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        submit: err.data?.message || '회원가입 중 오류가 발생했습니다.'
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-emerald-50 rounded-lg p-4 mb-6">
        <p className="text-emerald-700 text-sm font-medium">
          TOVmate와 함께 글로벌 인재를 만나보세요
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
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
            담당자 이름
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            회사명
          </label>
          <div className="relative">
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={formData.companyName}
              onChange={handleChange}
            />
            {errors.companyName && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.companyName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700">
            사업자등록번호
          </label>
          <div className="relative">
            <input
              id="businessNumber"
              name="businessNumber"
              type="text"
              required
              placeholder="000-00-00000"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={formData.businessNumber}
              onChange={handleChange}
            />
            {errors.businessNumber && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.businessNumber}</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">
            회사 주소
          </label>
          <div className="relative">
            <input
              id="companyAddress"
              name="companyAddress"
              type="text"
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={formData.companyAddress}
              onChange={handleChange}
            />
            {errors.companyAddress && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.companyAddress}</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            전화번호
          </label>
          <div className="relative">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              placeholder="02-0000-0000"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            {errors.phoneNumber && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.phoneNumber}</p>
            )}
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
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors duration-200"
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

export default CompanyForm; 