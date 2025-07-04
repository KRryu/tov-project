import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { setReturnPath } from '../../../../redux/slices/authSlice';
import { useAuth } from '../../../../hooks/useAuth';

const ProcessOverviewSection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  
  const handleGoToStep = (step) => {
    if (isAuthenticated) {
      // 로그인된 상태라면 바로 해당 스텝으로 이동
      navigate(step);
    } else {
      // 로그인 안 된 상태라면 returnPath 설정 후 로그인 페이지로 이동
      // localStorage에도 저장 (중요)
      localStorage.setItem('returnPath', step);
      dispatch(setReturnPath(step));
      // query parameter와 state 모두 사용
      navigate('/login?from=visa', { 
        state: { returnPath: step, from: 'visa' } 
      });
    }
  };

  const steps = [
    {
      id: 1,
      title: '정보 입력',
      description: '현재 상황 및 목표 공유',
      painPoint: '어디서 시작할지 모름',
      solution: '간편한 정보 입력 시스템',
      link: '/services/visa/step1',
      status: 'current'
    },
    {
      id: 2,
      title: '자격 평가',
      description: '비자 취득 가능성 진단',
      painPoint: '합격 가능성 예측 어려움',
      solution: 'AI 기반 정확한 평가',
      link: '/services/visa/step2',
      status: 'upcoming'
    },
    {
      id: 3,
      title: '전문가 매칭',
      description: '맞춤형 행정사 연결',
      painPoint: '신뢰할 수 있는 전문가 찾기',
      solution: '검증된 전문가 매칭',
      link: '/services/visa/step3',
      isPaid: true,
      status: 'upcoming'
    },
    {
      id: 4,
      title: '서류 준비',
      description: '필요 서류 검토 및 제출',
      painPoint: '복잡한 서류 준비',
      solution: '맞춤형 서류 준비 가이드',
      link: '/dashboard/visa-result',
      status: 'upcoming'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-gray-900">4단계로 해결합니다</h2>
        </motion.div>

        {/* 세련된 프로세스 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm ${
                step.status === 'current' ? 'border-l-4 border-indigo-500' : 'border border-gray-100'
              } cursor-pointer hover:shadow-md transition-shadow`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleGoToStep(step.link)}
            >
              <div className="p-5">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full font-medium">
                    {step.id}
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{step.title}</h3>
                  
                  {/* 결제 뱃지 강조 */}
                  {step.isPaid && (
                    <span className="ml-2 px-3 py-1 bg-indigo-500 text-white rounded-full text-xs font-medium shadow-sm animate-pulse">
                      결제
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{step.description}</p>
                
                <div className="flex items-start mb-2">
                  <span className="flex-shrink-0 inline-block w-4 h-4 mt-0.5 mr-2 bg-gray-100 rounded-full text-gray-500 text-xs flex items-center justify-center">
                    ✕
                  </span>
                  <p className="text-xs text-gray-500">{step.painPoint}</p>
                </div>
                <div className="flex items-start">
                  <span className="flex-shrink-0 inline-block w-4 h-4 mt-0.5 mr-2 bg-indigo-50 rounded-full text-indigo-600 text-xs flex items-center justify-center">
                    ✓
                  </span>
                  <p className="text-xs text-indigo-600">{step.solution}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 결제 안내 */}
        <motion.div 
          className="mt-10 bg-white p-5 rounded-xl shadow-sm border border-gray-100"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-medium text-gray-900">안내사항</h3>
          </div>
          <p className="text-sm text-gray-600">
            처음 두 단계는 무료로 진행되며, 전문가 상담 단계에서만 비용이 발생합니다.
            상담 방식과 시간에 따라 비용이 달라지며, 결제 전에 정확한 금액을 안내해 드립니다.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProcessOverviewSection; 