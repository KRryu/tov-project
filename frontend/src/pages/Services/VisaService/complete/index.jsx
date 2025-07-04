import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const VisaApplicationComplete = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 10초 후 자동으로 홈으로 이동
    const timer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <svg 
            className="w-10 h-10 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          비자 신청이 완료되었습니다!
        </h1>
        
        <p className="text-gray-600 mb-6">
          신청번호: <span className="font-mono font-bold">VSA{Date.now().toString().slice(-8)}</span>
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-blue-900 mb-2">다음 단계</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>24시간 이내에 담당 법무대리인이 연락드립니다.</li>
            <li>업로드하신 서류를 검토 후 피드백을 드립니다.</li>
            <li>필요시 추가 서류를 요청할 수 있습니다.</li>
            <li>모든 준비가 완료되면 비자 신청이 진행됩니다.</li>
          </ol>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/my/applications')}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            내 신청 내역 보기
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          10초 후 자동으로 홈으로 이동합니다.
        </p>
      </motion.div>
    </div>
  );
};

export default VisaApplicationComplete;