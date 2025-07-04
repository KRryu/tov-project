import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { setReturnPath } from '../../../redux/slices/authSlice';
import useAuth from '../../../hooks/useAuth';
import ProcessOverviewSection from './sections/ProcessOverviewSection';
import CTASection from './sections/CTASection';

const VisaService = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const handleStartDiagnosis = () => {
    // 로그인 상태 확인
    if (isAuthenticated) {
      // 비자 신청 페이지로 이동
      navigate('/services/visa/application');
    } else {
      // 미로그인시 로그인 페이지로 이동 (반환 경로 설정)
      const returnPath = '/services/visa/application';
      localStorage.setItem('returnPath', returnPath);
      dispatch(setReturnPath(returnPath));
      navigate('/login?from=visa', { 
        state: { returnPath: returnPath, from: 'visa' } 
      });
    }
  };

  return (
    <div className="bg-gray-50">
      {/* 세련된 히어로 섹션 - 이미지 기반 배경 */}
      <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 py-16 overflow-hidden">
        {/* 배경 오버레이 */}
        <div className="absolute inset-0 bg-indigo-900/30 mix-blend-multiply"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div 
              className="md:w-1/2 text-white text-center md:text-left"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold">비자, 혼자 힘들지 않게</h1>
              <p className="mt-4 text-xl text-gray-300">
                복잡한 비자 문제, 전문가와 함께 해결하세요
              </p>
              
              <p className="mt-3 text-sm text-gray-400">
                처음 두 단계는 무료, 전문가 상담 단계에서 결제가 진행됩니다
              </p>
              
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <button 
                  onClick={handleStartDiagnosis}
                  className="inline-block px-8 py-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  무료로 진단하기
                </button>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2 mt-10 md:mt-0 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src="/assets/images/services/visa/frustrated-person.jpg" 
                  alt="비자 문제로 고민하는 모습" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 비자 고민 포인트 */}
      <div className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">이런 고민이 있으신가요?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "언어 장벽",
                description: "한국어 서류 이해 어려움",
                image: "/assets/images/services/visa/language-barrier.jpg"
              },
              {
                title: "복잡한 절차",
                description: "어디서부터 시작해야 할지 모름",
                image: "/assets/images/services/visa/complex-process.jpg"
              },
              {
                title: "불안한 대기",
                description: "비자 결과 기다림의 스트레스",
                image: "/assets/images/services/visa/anxious-waiting.jpg"
              }
            ].map((pain, index) => (
              <motion.div 
                key={index}
                className="bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="h-40 overflow-hidden">
                  <img 
                    src={pain.image} 
                    alt={pain.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">{pain.title}</h3>
                  <p className="mt-2 text-gray-600">{pain.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 비자별 평가 섹션 */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">비자별 맞춤 평가</h2>
            <p className="mt-4 text-lg text-gray-600">
              정확한 평가로 성공 가능성을 미리 확인하세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* E-1 비자 카드 */}
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">E-1 교육 활동</h3>
                <p className="text-gray-600 mb-4">
                  대학 교원, 연구원 등 교육 관련 전문직을 위한 비자
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <div>• AI 기반 지능형 평가</div>
                  <div>• 실시간 진행상황 추적</div>
                  <div>• 상세한 개선 로드맵 제공</div>
                </div>
                <button
                  onClick={() => navigate('/services/visa/evaluation/e1-v3')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  E-1 평가 시작
                </button>
              </div>
            </motion.div>

            {/* E-2 비자 카드 (준비 중) */}
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 opacity-75"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">E-2 회화지도</h3>
                <p className="text-gray-600 mb-4">
                  외국어 회화지도를 위한 비자
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <div>• 원어민 자격 검증</div>
                  <div>• 교육 경력 평가</div>
                  <div>• 언어 능력 확인</div>
                </div>
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  준비 중
                </button>
              </div>
            </motion.div>

            {/* 더 많은 비자 */}
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">더 많은 비자</h3>
                <p className="text-gray-600 mb-4">
                  37개 비자 유형 순차적 출시 예정
                </p>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <div>• E-3, E-4, E-5 등</div>
                  <div>• F-6, D-10 등</div>
                  <div>• 맞춤형 평가 시스템</div>
                </div>
                <button
                  onClick={handleStartDiagnosis}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  일반 상담 신청
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 프로세스 개요 섹션 */}
      <ProcessOverviewSection />

      {/* CTA 섹션 */}
      <CTASection />
    </div>
  );
};

export default VisaService; 