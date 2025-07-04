import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../../api/services/authService';

function ProForm() {
  const navigate = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    expertise: '',
    certification: [''],
    experience: '',
    phoneNumber: '',
    role: 'pro'
  });

  const [errors, setErrors] = useState({});

  const expertiseOptions = [
    { value: 'administrative', label: '행정' },
    { value: 'language', label: '언어' },
    { value: 'culture', label: '문화' },
    { value: 'psychology', label: '심리' }
  ];

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

  const addCertificationField = () => {
    setFormData(prev => ({
      ...prev,
      certification: [...prev.certification, '']
    }));
  };

  const removeCertificationField = (index) => {
    if (formData.certification.length > 1) {
      setFormData(prev => ({
        ...prev,
        certification: prev.certification.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCertificationChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      certification: prev.certification.map((cert, i) => 
        i === index ? value : cert
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = '이메일을 입력해주세요';
    if (!formData.password) newErrors.password = '비밀번호를 입력해주세요';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    if (!formData.name) newErrors.name = '이름을 입력해주세요';
    if (!formData.expertise) newErrors.expertise = '전문 분야를 선택해주세요';
    if (!formData.certification[0]) newErrors.certification = '최소 하나의 자격증을 입력해주세요';
    if (!formData.experience) newErrors.experience = '경력 연차를 입력해주세요';
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
      <div className="bg-violet-50 rounded-lg p-4 mb-6">
        <p className="text-violet-700 text-sm font-medium">
          TOVmate의 전문가 파트너가 되어주세요
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
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="expertise" className="block text-sm font-medium text-gray-700">
            전문 분야
          </label>
          <div className="relative">
            <select
              id="expertise"
              name="expertise"
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              value={formData.expertise}
              onChange={handleChange}
            >
              <option value="">전문 분야를 선택하세요</option>
              {expertiseOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.expertise && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.expertise}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
            경력 (연차)
          </label>
          <div className="relative">
            <input
              id="experience"
              name="experience"
              type="number"
              min="0"
              required
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              value={formData.experience}
              onChange={handleChange}
            />
            {errors.experience && (
              <p className="absolute -bottom-5 text-xs text-red-600">{errors.experience}</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            자격증
          </label>
          <div className="space-y-3">
            {formData.certification.map((cert, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={cert}
                  onChange={(e) => handleCertificationChange(index, e.target.value)}
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="자격증명을 입력하세요"
                />
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeCertificationField(index)}
                    className="p-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCertificationField}
              className="inline-flex items-center px-3 py-2 border border-violet-300 text-sm font-medium rounded-md text-violet-700 bg-white hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              자격증 추가
            </button>
          </div>
          {errors.certification && (
            <p className="text-xs text-red-600 mt-1">{errors.certification}</p>
          )}
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
              placeholder="01012345678"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors duration-200"
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

export default ProForm; 