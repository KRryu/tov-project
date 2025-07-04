import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { setReturnPath } from '../../../../redux/slices/authSlice';
import { useAuth } from '../../../../hooks/useAuth';

const CTASection = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  const handleStartDiagnosis = () => {
    // 비자 서비스 진입 플래그 설정
    sessionStorage.setItem('visaServiceAccess', 'true');
    
    if (isAuthenticated) {
      // 로그인된 상태라면 비자 신청 페이지로 이동
      navigate('/services/visa/application');
    } else {
      // 로그인 안 된 상태라면 returnPath 설정 후 로그인 페이지로 이동
      const returnPath = '/services/visa/application';
      // localStorage에도 저장 (중요)
      localStorage.setItem('returnPath', returnPath);
      dispatch(setReturnPath(returnPath));
      // query parameter와 state 모두 사용
      navigate('/login?from=visa', { 
        state: { returnPath: returnPath, from: 'visa' } 
      });
    }
  };

  return (
    <section className="py-16 relative bg-slate-900">
      <div className="absolute inset-0 opacity-5">
        <img 
          src="/assets/images/services/visa/frustrated-person.jpg" 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/90"></div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <motion.div 
            className="md:w-3/5 text-center md:text-left mb-8 md:mb-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-3 text-white">비자 문제, 지금 해결하세요</h2>
            <p className="text-gray-300">TOVmate와 함께 쉽고 빠르게</p>
            <p className="text-sm text-gray-400 mt-2">
              첫 두 단계는 무료로 진행할 수 있습니다
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={handleStartDiagnosis}
              className="inline-block px-8 py-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all"
            >
              무료로 진단하기 →
            </button>
          </motion.div>
        </div>
        
        {/* 성공 사례 - 세련된 디자인 */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { 
              visa: "E-7", 
              problem: "언어 장벽",
              days: 14
            },
            { 
              visa: "D-8", 
              problem: "서류 미비",
              days: 21
            },
            { 
              visa: "F-2", 
              problem: "비자 거부 경험",
              days: 28
            }
          ].map((case_, index) => (
            <motion.div 
              key={index}
              className="bg-slate-800 rounded-xl p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + (index * 0.1) }}
            >
              <div className="flex items-center justify-center space-x-2 mb-3">
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full"></span>
                <p className="text-sm text-gray-400">{case_.problem}</p>
              </div>
              <p className="text-white font-medium text-lg mb-1">{case_.visa} 비자 성공</p>
              <p className="text-gray-400 text-xs">{case_.days}일 소요</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection; 