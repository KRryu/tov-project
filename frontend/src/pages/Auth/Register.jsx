// src/pages/Auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ChallengerForm from './components/ChallengerForm';
import CompanyForm from './components/CompanyForm';
import ProForm from './components/ProForm';

function Register() {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const purposes = {
    challenger: [
      { id: 'job', label: '취업 준비', icon: '💼' },
      { id: 'visa', label: '비자 상담', icon: '✈️' },
      { id: 'education', label: '한국어 교육', icon: '📚' },
      { id: 'community', label: '커뮤니티 활동', icon: '👥' },
      { id: 'entertainment', label: 'TOVplay 이용', icon: '🎮' }
    ]
  };

  // URL에서 쿼리 파라미터 추출
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const purpose = queryParams.get('purpose');
    
    // 비자 서비스에서 온 경우 자동으로 challenger 역할 선택
    if (purpose === 'visa') {
      setSelectedRole('challenger');
      setSelectedPurpose(purpose);
    }
  }, [location.search]);

  const handleBack = () => {
    if (selectedPurpose) {
      setSelectedPurpose('');
    } else if (selectedRole) {
      setSelectedRole('');
    } else {
      navigate('/');
    }
  };

  const BackButton = () => (
    <div className="flex items-center mb-8">
      <button
        onClick={handleBack}
        className="text-gray-600 hover:text-gray-900 flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        뒤로 가기
      </button>
    </div>
  );

  const renderRoleSelection = () => (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      <BackButton />
      <h1 className="text-3xl text-gray-800 dark:text-gray-100 font-bold mb-6">회원가입</h1>
      <div className="space-y-4">
        <button
          onClick={() => setSelectedRole('challenger')}
          className="w-full p-8 text-left border rounded-lg hover:border-violet-500 transition-colors hover:shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-3">TOVchallenger</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1">
            <li>• 취업 준비</li>
            <li>• 비자 상담</li>
            <li>• 한국어 교육</li>
            <li>• 커뮤니티 활동</li>
            <li>• TOVplay 이용</li>
          </ul>
        </button>

        <button
          onClick={() => setSelectedRole('company')}
          className="w-full p-8 text-left border rounded-lg hover:border-violet-500 transition-colors hover:shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Company</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1">
            <li>• 글로벌 인재 채용</li>
            <li>• 다양한 문화권의 인재 영입</li>
            <li>• 기업 맞춤형 인재 매칭</li>
            <li>• 채용 프로세스 관리</li>
          </ul>
        </button>

        <button
          onClick={() => setSelectedRole('pro')}
          className="w-full p-8 text-left border rounded-lg hover:border-violet-500 transition-colors hover:shadow-lg"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-3">TOVpro</h3>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1">
            <li>• 전문 서비스 제공</li>
            <li>• 행정 서비스</li>
            <li>• 언어/문화 교육</li>
            <li>• 심리 상담</li>
          </ul>
        </button>
      </div>
    </div>
  );

  const renderPurposeSelection = () => (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      <BackButton />
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">가입 목적 선택</h2>
        <p className="mt-2 text-gray-600">TOVmate에서 어떤 서비스를 이용하고 싶으신가요?</p>
      </div>
      <div className="space-y-4">
        {purposes[selectedRole].map(purpose => (
          <button
            key={purpose.id}
            onClick={() => setSelectedPurpose(purpose.id)}
            className="w-full p-8 text-left border rounded-lg hover:border-violet-500 transition-colors hover:shadow-lg"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">{purpose.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{purpose.label}</h3>
                <p className="text-sm text-gray-600">
                  {purpose.id === 'job' && '글로벌 기업에서의 새로운 기회'}
                  {purpose.id === 'visa' && '전문가와 함께하는 비자 상담'}
                  {purpose.id === 'education' && '체계적인 한국어 교육'}
                  {purpose.id === 'community' && '다양한 커뮤니티 활동'}
                  {purpose.id === 'entertainment' && '즐거운 TOVplay 서비스'}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderForm = () => {
    const formContent = (() => {
      switch (selectedRole) {
        case 'challenger':
          return selectedPurpose ? (
            <div className="max-w-md mx-auto w-full px-4 py-8">
              <BackButton />
              <ChallengerForm purpose={selectedPurpose} />
            </div>
          ) : renderPurposeSelection();
        case 'company':
          return (
            <div className="max-w-md mx-auto w-full px-4 py-8">
              <BackButton />
              <CompanyForm />
            </div>
          );
        case 'pro':
          return (
            <div className="max-w-md mx-auto w-full px-4 py-8">
              <BackButton />
              <ProForm />
            </div>
          );
        default:
          return renderRoleSelection();
      }
    })();

    return formContent;
  };

  return (
    <main className="bg-white dark:bg-gray-900">
      <div className="relative md:flex">
        {/* Content */}
        <div className="md:w-1/2">
          <div className="min-h-[100dvh] h-full flex flex-col">
            {renderForm()}
          </div>
        </div>

        {/* Image */}
        <div className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2" aria-hidden="true">
          <img 
            className="object-cover object-center w-full h-full" 
            src="/assets/images/register/register-image.jpg"
            width="760" 
            height="1024" 
            alt="Authentication" 
          />
        </div>
      </div>
    </main>
  );
}

export default Register;

