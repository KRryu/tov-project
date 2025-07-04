import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import visaServiceV2 from '../../../../api/services/visaServiceV2';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../../components/common/ErrorAlert';
import ProgressTracker from '../../../../components/common/ProgressTracker';

// 신청 유형별 컴포넌트
import NewApplicationForm from './forms/NewApplicationForm';
import ExtensionApplicationForm from './forms/ExtensionApplicationForm';
import ChangeApplicationForm from './forms/ChangeApplicationForm';

// 프로세스 단계별 컴포넌트
import LegalMatchingStep from './components/LegalMatchingStep';
import PaymentStep from './components/PaymentStep';
import DocumentUploadStep from './components/DocumentUploadStep';
import HopefulEvaluationResults from '../evaluation/components/HopefulEvaluationResults';

const DynamicApplicationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL 파라미터에서 정보 가져오기
  const applicationType = searchParams.get('type') || 'NEW';
  const visaType = searchParams.get('visa') || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [applicationId, setApplicationId] = useState(null);
  const [visaRequirements, setVisaRequirements] = useState(null);
  
  // 세션 스토리지에서 초기 데이터 가져오기
  const [initialData, setInitialData] = useState(() => {
    const sessionData = sessionStorage.getItem('applicationData');
    if (sessionData) {
      try {
        return JSON.parse(sessionData);
      } catch (e) {
        console.error('Failed to parse session data:', e);
      }
    }
    return { visaType, applicationType };
  });

  // 단계 정의 (순서 변경: 사전평가 → 법무대리인 → 결제 → 문서업로드)
  const steps = [
    { id: 1, title: '기본 정보', description: '개인 정보 입력' },
    { id: 2, title: '상세 정보', description: '비자별 상세 정보' },
    { id: 3, title: '사전 평가', description: '자격 요건 검토' },
    { id: 4, title: '법무대리인', description: '전문가 매칭' },
    { id: 5, title: '결제', description: '서비스 비용 결제' },
    { id: 6, title: '문서 업로드', description: '필요 서류 제출' }
  ];

  // 비자 요구사항 로드
  useEffect(() => {
    if (visaType && applicationType) {
      loadVisaRequirements();
    }
  }, [visaType, applicationType]);

  const loadVisaRequirements = async () => {
    try {
      setLoading(true);
      const requirements = await visaServiceV2.getDetailedRequirements(
        visaType,
        applicationType
      );
      setVisaRequirements(requirements);
    } catch (error) {
      console.error('Failed to load requirements:', error);
      setError('비자 요구사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };


  // 사전심사 수행
  const handlePreScreening = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      // 신청서 생성 (없는 경우)
      if (!applicationId) {
        const appResponse = await visaServiceV2.createAdvancedApplication(
          visaType,
          applicationType,
          formData
        );
        if (appResponse.success) {
          setApplicationId(appResponse.data.applicationId);
        }
      }

      // 사전심사 실행
      const result = await visaServiceV2.performPreScreening(
        visaType,
        applicationType,
        formData
      );

      if (result.success) {
        console.log('사전평가 결과:', result.data);
        setEvaluationResult(result.data);
        // 3단계에서 결과를 보여주고, 사용자가 다음 버튼을 누르면 4단계로 이동
        // setCurrentStep(4); // 이 줄을 제거하여 3단계에 머물도록 함
        
        if (result.data.passPreScreening) {
          toast.success('사전심사를 통과했습니다!');
        } else {
          toast.warning('사전심사 결과 보완이 필요한 사항이 있습니다.');
        }
      }
    } catch (error) {
      console.error('Pre-screening error:', error);
      setError('사전심사 중 오류가 발생했습니다.');
      toast.error('사전심사에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 실시간 필드 검증
  const handleFieldValidation = async (fieldName, value, context = {}) => {
    try {
      const result = await visaServiceV2.validateFieldRealTime(
        visaType,
        fieldName,
        value,
        context
      );
      return result.data;
    } catch (error) {
      console.error('Field validation error:', error);
      return { valid: true }; // 에러시 통과 처리
    }
  };

  // 다음 단계로 이동
  const handleNextStep = async (stepData) => {
    // 데이터 저장
    const updatedData = { ...initialData, ...stepData };
    setInitialData(updatedData);
    sessionStorage.setItem('applicationData', JSON.stringify(updatedData));
    
    // 다음 단계로 이동
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
    
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 2단계 완료 후 3단계로 이동했을 때 사전평가 자동 실행
    if (currentStep === 2) {
      setTimeout(() => {
        handlePreScreening(updatedData);
      }, 500);
    }
  };

  // 이전 단계로 이동
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 폼 컴포넌트 선택
  const getFormComponent = () => {
    const commonProps = {
      visaType,
      initialData,
      requirements: visaRequirements,
      onNext: handleNextStep,
      onPrev: handlePrevStep,
      onFieldValidate: handleFieldValidation,
      currentStep,
      steps
    };

    switch (applicationType) {
      case 'NEW':
        return <NewApplicationForm {...commonProps} />;
      case 'EXTENSION':
        return <ExtensionApplicationForm {...commonProps} />;
      case 'CHANGE':
        return <ChangeApplicationForm {...commonProps} />;
      default:
        return <NewApplicationForm {...commonProps} />;
    }
  };

  if (loading && !visaRequirements) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 진행 상황 표시 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ProgressTracker steps={steps} currentStep={currentStep} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            {visaType} 비자 {getApplicationTypeTitle(applicationType)}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            단계별로 정보를 입력하여 정확한 평가를 받아보세요
          </p>
        </motion.div>

        {/* 에러 표시 */}
        {error && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </motion.div>
        )}


        {/* 메인 폼 영역 */}
        <motion.div
          key={`step-${currentStep}-${applicationType}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep <= 2 ? (
            getFormComponent()
          ) : currentStep === 3 ? (
            <div>
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">사전 평가 진행 중</h2>
                  <div className="flex flex-col items-center justify-center py-12">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">평가가 진행되고 있습니다...</p>
                  </div>
                </div>
              ) : evaluationResult ? (
                <div className="space-y-6">
                  {/* 상세 평가 결과 표시 */}
                  <HopefulEvaluationResults evaluationResult={evaluationResult} />
                  
                  {/* 다음 단계 버튼 */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      이전으로
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep(4);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      법무대리인 매칭 진행
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <p className="text-gray-600">잠시만 기다려주세요...</p>
                </div>
              )}
            </div>
          ) : currentStep === 4 ? (
            <LegalMatchingStep
              applicationId={applicationId}
              visaType={visaType}
              evaluationResult={evaluationResult}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          ) : currentStep === 5 ? (
            <PaymentStep
              applicationId={applicationId}
              visaType={visaType}
              evaluationResult={evaluationResult}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          ) : currentStep === 6 ? (
            <DocumentUploadStep 
              applicationId={applicationId}
              visaType={visaType}
              requirements={visaRequirements}
              onComplete={() => navigate('/services/visa/complete')}
              onPrev={handlePrevStep}
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};

// 신청 유형 제목 변환
const getApplicationTypeTitle = (type) => {
  const titles = {
    NEW: '신규 신청',
    EXTENSION: '연장 신청',
    CHANGE: '변경 신청'
  };
  return titles[type] || '신청';
};


export default DynamicApplicationForm;