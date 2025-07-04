import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import visaServiceV2 from '../../../../api/services/visaServiceV2';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../../components/common/ErrorAlert';

const ApplicationTypeSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visaTypes, setVisaTypes] = useState([]);
  const [selectedVisaType, setSelectedVisaType] = useState('');
  const [selectedApplicationType, setSelectedApplicationType] = useState('');
  const [currentVisaType, setCurrentVisaType] = useState(''); // 변경/연장 시 현재 비자
  const [targetVisaType, setTargetVisaType] = useState(''); // 변경 시 목표 비자

  // 지원되는 비자 타입 로드
  useEffect(() => {
    loadVisaTypes();
  }, []);

  const loadVisaTypes = async () => {
    try {
      setLoading(true);
      const response = await visaServiceV2.getSupportedTypesWithDetails();
      if (response.success) {
        setVisaTypes(response.data.visaTypes);
      }
    } catch (error) {
      console.error('Failed to load visa types:', error);
      setError('비자 타입을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const applicationTypes = [
    {
      id: 'NEW',
      title: '신규 신청',
      description: '처음 비자를 신청하는 경우',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'blue',
      features: ['처음 한국에 입국', '새로운 비자 발급', '전체 서류 준비 필요']
    },
    {
      id: 'EXTENSION',
      title: '연장 신청',
      description: '현재 비자를 연장하는 경우',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green',
      features: ['동일 비자 연장', '활동 실적 평가', '간소화된 서류']
    },
    {
      id: 'CHANGE',
      title: '변경 신청',
      description: '다른 비자로 변경하는 경우',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      color: 'purple',
      features: ['비자 타입 변경', '변경 가능성 사전 확인', '추가 요건 검토']
    }
  ];

  const handleApplicationTypeSelect = (type) => {
    setSelectedApplicationType(type);
  };

  const handleProceed = () => {
    if (!selectedApplicationType) {
      setError('신청 유형을 선택해주세요.');
      return;
    }

    let finalVisaType = '';
    let applicationData = {
      applicationType: selectedApplicationType,
      timestamp: new Date().toISOString()
    };

    // 신청 유형별 검증
    if (selectedApplicationType === 'NEW') {
      if (!selectedVisaType) {
        setError('신청할 비자 타입을 선택해주세요.');
        return;
      }
      finalVisaType = selectedVisaType;
      applicationData.visaType = selectedVisaType;
    } else if (selectedApplicationType === 'EXTENSION') {
      if (!currentVisaType) {
        setError('현재 비자 타입을 선택해주세요.');
        return;
      }
      finalVisaType = currentVisaType;
      applicationData.visaType = currentVisaType;
      applicationData.currentVisaType = currentVisaType;
    } else if (selectedApplicationType === 'CHANGE') {
      if (!currentVisaType || !targetVisaType) {
        setError('현재 비자와 변경하고자 하는 비자를 모두 선택해주세요.');
        return;
      }
      finalVisaType = targetVisaType;
      applicationData.visaType = targetVisaType;
      applicationData.currentVisaType = currentVisaType;
      applicationData.targetVisaType = targetVisaType;
    }

    // 선택한 정보 저장
    sessionStorage.setItem('applicationData', JSON.stringify(applicationData));

    // 다음 단계로 이동
    navigate(`/services/visa/application/form?type=${selectedApplicationType}&visa=${finalVisaType}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">비자 신청 시작하기</h1>
          <p className="mt-4 text-lg text-gray-600">
            신청 유형을 선택하고 비자 정보를 입력해주세요
          </p>
        </motion.div>

        {error && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </motion.div>
        )}

        {/* Step 1: 신청 유형 선택 */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            1단계: 신청 유형을 선택하세요
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {applicationTypes.map((type) => (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleApplicationTypeSelect(type.id)}
                className={`cursor-pointer rounded-lg p-6 border-2 transition-all ${
                  selectedApplicationType === type.id
                    ? `border-${type.color}-500 bg-${type.color}-50`
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`flex justify-center mb-4 text-${type.color}-500`}>
                  {type.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  {type.description}
                </p>
                <ul className="space-y-1">
                  {type.features.map((feature, idx) => (
                    <li key={idx} className="text-xs text-gray-500 flex items-start">
                      <span className="mr-1">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step 2: 비자 타입 선택 (신청 유형에 따라 다르게 표시) */}
        {selectedApplicationType && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              2단계: 비자 정보 입력
            </h2>

            {/* 신규 신청 */}
            {selectedApplicationType === 'NEW' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  신청하고자 하는 비자 타입을 선택하세요
                </label>
                <select
                  value={selectedVisaType}
                  onChange={(e) => setSelectedVisaType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">비자 타입을 선택하세요</option>
                  {visaTypes.map((visa) => (
                    <option key={visa.code} value={visa.code}>
                      {visa.code} - {visa.name}
                    </option>
                  ))}
                </select>
                {selectedVisaType && (
                  <motion.div 
                    className="mt-4 p-4 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-sm text-gray-600">
                      {visaTypes.find(v => v.code === selectedVisaType)?.description}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* 연장 신청 */}
            {selectedApplicationType === 'EXTENSION' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 보유하고 있는 비자 타입을 선택하세요
                </label>
                <select
                  value={currentVisaType}
                  onChange={(e) => {
                    setCurrentVisaType(e.target.value);
                    setSelectedVisaType(e.target.value); // 연장은 동일 비자
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">현재 비자 타입을 선택하세요</option>
                  {visaTypes.map((visa) => (
                    <option key={visa.code} value={visa.code}>
                      {visa.code} - {visa.name}
                    </option>
                  ))}
                </select>
                {currentVisaType && (
                  <motion.div 
                    className="mt-4 p-4 bg-green-50 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-sm text-green-700 font-medium mb-2">
                      ✓ {currentVisaType} 비자 연장을 신청합니다
                    </p>
                    <p className="text-sm text-gray-600">
                      {visaTypes.find(v => v.code === currentVisaType)?.description}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* 변경 신청 */}
            {selectedApplicationType === 'CHANGE' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 보유하고 있는 비자 타입을 선택하세요
                  </label>
                  <select
                    value={currentVisaType}
                    onChange={(e) => setCurrentVisaType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">현재 비자 타입을 선택하세요</option>
                    {visaTypes.map((visa) => (
                      <option key={visa.code} value={visa.code}>
                        {visa.code} - {visa.name}
                      </option>
                    ))}
                  </select>
                </div>

                {currentVisaType && (
                  <motion.div
                    className="bg-white rounded-lg shadow-sm p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      변경하고자 하는 비자 타입을 선택하세요
                    </label>
                    <select
                      value={targetVisaType}
                      onChange={(e) => {
                        setTargetVisaType(e.target.value);
                        setSelectedVisaType(e.target.value); // 변경 시 목표 비자
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">목표 비자 타입을 선택하세요</option>
                      {visaTypes
                        .filter(visa => visa.code !== currentVisaType)
                        .map((visa) => (
                          <option key={visa.code} value={visa.code}>
                            {visa.code} - {visa.name}
                          </option>
                        ))}
                    </select>
                    {targetVisaType && (
                      <motion.div 
                        className="mt-4 p-4 bg-purple-50 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-sm text-purple-700 font-medium mb-2">
                          ✓ {currentVisaType} → {targetVisaType} 비자 변경을 신청합니다
                        </p>
                        <p className="text-sm text-gray-600">
                          {visaTypes.find(v => v.code === targetVisaType)?.description}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* 특별 안내 */}
        {selectedApplicationType === 'CHANGE' && currentVisaType && targetVisaType && (
          <motion.div
            className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex">
              <svg className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-lg font-medium text-amber-900">변경 신청 안내</h4>
                <p className="mt-2 text-amber-700">
                  {currentVisaType}에서 {targetVisaType}로 변경 가능 여부를 먼저 확인해드립니다.
                  변경이 불가능한 경우 대안을 제시해드립니다.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {selectedApplicationType === 'EXTENSION' && currentVisaType && (
          <motion.div
            className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-lg font-medium text-green-900">연장 신청 안내</h4>
                <p className="mt-2 text-green-700">
                  {currentVisaType} 비자 연장을 위한 활동 실적과 요건을 검토합니다.
                  연장이 어려운 경우 대안을 제시해드립니다.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 진행 버튼 */}
        <motion.div 
          className="mt-12 flex justify-between items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={() => navigate('/services/visa')}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors"
          >
            이전으로
          </button>
          <button
            onClick={handleProceed}
            disabled={
              !selectedApplicationType || 
              (selectedApplicationType === 'NEW' && !selectedVisaType) ||
              (selectedApplicationType === 'EXTENSION' && !currentVisaType) ||
              (selectedApplicationType === 'CHANGE' && (!currentVisaType || !targetVisaType))
            }
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              (selectedApplicationType === 'NEW' && selectedVisaType) ||
              (selectedApplicationType === 'EXTENSION' && currentVisaType) ||
              (selectedApplicationType === 'CHANGE' && currentVisaType && targetVisaType)
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            다음 단계로
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ApplicationTypeSelection;