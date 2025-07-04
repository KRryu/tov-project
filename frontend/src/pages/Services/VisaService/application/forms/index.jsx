import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// 새로운 통합 서비스 import
import visaServiceV3 from '../../../../api/services/visaServiceV3';
import { useAuth } from '../../../../hooks/useAuth';

// V3 통합 워크플로우 컴포넌트들
import ProgressStepper from '../evaluation/components/ProgressStepper';
import EvaluationResultsSection from '../evaluation/components/EvaluationResultsSection';
import MatchingSection from '../evaluation/components/MatchingSection';
import PaymentSection from '../evaluation/components/PaymentSection';
import DocumentUploadSection from '../evaluation/components/DocumentUploadSection';
import CompletionSection from '../evaluation/components/CompletionSection';

// 폼 유효성 검사 스키마
const ValidationSchema = Yup.object().shape({
  visaType: Yup.string().required('비자 유형을 선택해주세요'),
  fullName: Yup.string().required('이름을 입력해주세요'),
  educationLevel: Yup.string().required('학력을 선택해주세요'),
  experienceYears: Yup.number()
    .required('경력 연수를 입력해주세요')
    .min(0, '경력 연수는 0 이상이어야 합니다'),
  email: Yup.string().email('올바른 이메일 형식이 아닙니다').required('이메일을 입력해주세요')
});

/**
 * 비자 신청 페이지 V3 (완전 새로운 통합 워크플로우)
 * 원스톱 플로우: 평가 → 매칭 → 결제 → 서류업로드 → 완료
 */
const VisaApplication = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // === 상태 관리 ===
  const [currentStep, setCurrentStep] = useState(0);
  const [flowId, setFlowId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  
  // 플로우 데이터
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [matchingResult, setMatchingResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [documentResult, setDocumentResult] = useState(null);
  
  // UI 상태
  const [estimatedCost, setEstimatedCost] = useState(null);

  // 폼 초기값
  const initialValues = {
    visaType: '',
    fullName: user?.fullName || '',
    educationLevel: '',
    experienceYears: 0,
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: 'KOR'
  };

  // 단계 정의 (V3 통합 워크플로우)
  const steps = [
    { id: 'form', title: '정보 입력', description: '비자 신청 정보를 입력해주세요' },
    { id: 'evaluation', title: '평가 결과', description: '비자 승인 가능성을 분석합니다' },
    { id: 'matching', title: '행정사 매칭', description: '최적의 전문가를 찾아드립니다' },
    { id: 'payment', title: '결제', description: '서비스 비용을 결제합니다' },
    { id: 'documents', title: '서류 업로드', description: '필요한 서류를 제출합니다' },
    { id: 'completion', title: '완료', description: '서비스 신청이 완료되었습니다' }
  ];

  // === Effect Hooks ===
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/services/visa/application' } });
      return;
    }
    
    // 가격 견적 조회
    loadPriceEstimate();
  }, [isAuthenticated, navigate]);

  // === 가격 견적 로드 ===
  const loadPriceEstimate = async () => {
    try {
      const estimate = await visaServiceV3.estimateFlowCost('E-1', []);
      setEstimatedCost(estimate);
    } catch (error) {
      console.error('가격 견적 오류:', error);
    }
  };

  // === 진행상황 업데이트 핸들러 ===
  const handleProgressUpdate = (progressInfo) => {
    setProgress(progressInfo.progress);
    
    // 단계별 자동 전환
    switch (progressInfo.step) {
      case 'evaluation':
        setCurrentStep(1);
        break;
      case 'matching':
        setCurrentStep(2);
        break;
      case 'payment_ready':
        setCurrentStep(3);
        break;
      case 'payment_completed':
        setCurrentStep(4);
        break;
      case 'completed':
        setCurrentStep(5);
        break;
    }
  };

  // === 메인 플로우 함수들 ===

  /**
   * 1단계: 비자 평가 시작 (실제 사용자 입력 데이터 사용)
   */
  const handleStartFlow = async (formValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 실제 사용자 입력 데이터로 구성
      const applicantData = {
        evaluation: {
          visaType: formValues.visaType,
          educationLevel: formValues.educationLevel,
          experienceYears: parseInt(formValues.experienceYears),
          // E-1 비자의 경우 추가 필드들
          ...(formValues.visaType === 'E-1' && {
            position: 'professor',
            institutionType: 'university',
            publications: 0,
            contractPeriod: 12
          })
        },
        administrative: {
          fullName: formValues.fullName,
          email: formValues.email,
          phone: formValues.phone,
          nationality: formValues.nationality
        }
      };

      const result = await visaServiceV3.executeE1FullFlow(
        applicantData, 
        { includeLegalMatching: true, includeDocumentReview: true }, 
        handleProgressUpdate
      );

      if (result.success) {
        setFlowId(result.flowId);
        setEvaluationResult(result.evaluationResult);
        setMatchingResult(result.matchingResult);
        setCurrentStep(1);
        toast.success('비자 평가가 완료되었습니다!');
      }

    } catch (error) {
      console.error('플로우 시작 오류:', error);
      setError(error.message || '서비스 시작 중 오류가 발생했습니다.');
      toast.error(`평가 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 2단계: 결제 진행
   */
  const handleProceedToPayment = async (paymentMethod, paymentData, selectedServices = []) => {
    if (!flowId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await visaServiceV3.proceedToPayment(
        flowId, paymentMethod, paymentData, selectedServices, handleProgressUpdate
      );

      if (result.success) {
        setPaymentResult(result);
        setCurrentStep(4);
        toast.success('결제가 완료되었습니다!');
      }

    } catch (error) {
      console.error('결제 오류:', error);
      setError(error.message || '결제 처리 중 오류가 발생했습니다.');
      toast.error(`결제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 3단계: 서류 제출
   */
  const handleSubmitDocuments = async (documents) => {
    if (!flowId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await visaServiceV3.submitDocuments(
        flowId, documents, handleProgressUpdate
      );

      if (result.success) {
        setDocumentResult(result);
        setCurrentStep(5);
        toast.success('서류 제출이 완료되었습니다!');
      }

    } catch (error) {
      console.error('서류 제출 오류:', error);
      setError(error.message || '서류 제출 중 오류가 발생했습니다.');
      toast.error(`서류 제출 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // === 단계별 컴포넌트 렌더링 ===
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">비자 신청 정보</h2>
                <p className="text-gray-600">정확한 평가를 위해 모든 정보를 입력해주세요.</p>
              </div>
              
              <Formik
                initialValues={initialValues}
                validationSchema={ValidationSchema}
                onSubmit={handleStartFlow}
              >
                {({ isSubmitting, values }) => (
                  <Form className="space-y-6">
                    {/* 비자 유형 */}
                    <div>
                      <label htmlFor="visaType" className="block text-sm font-medium text-gray-700 mb-2">
                        비자 유형 *
                      </label>
                      <Field
                        as="select"
                        id="visaType"
                        name="visaType"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택해주세요</option>
                        <option value="E-1">E-1 (교수)</option>
                        <option value="E-2">E-2 (회화지도)</option>
                        <option value="E-3">E-3 (연구)</option>
                        <option value="E-7">E-7 (특정활동)</option>
                      </Field>
                      <ErrorMessage name="visaType" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* 이름 */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        이름 *
                      </label>
                      <Field
                        type="text"
                        id="fullName"
                        name="fullName"
                        placeholder="이름을 입력해주세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="fullName" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* 학력 */}
                    <div>
                      <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-2">
                        학력 *
                      </label>
                      <Field
                        as="select"
                        id="educationLevel"
                        name="educationLevel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">선택해주세요</option>
                        <option value="bachelors">학사</option>
                        <option value="masters">석사</option>
                        <option value="phd">박사</option>
                        <option value="professional">전문학위</option>
                      </Field>
                      <ErrorMessage name="educationLevel" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* 경력 */}
                    <div>
                      <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-2">
                        관련 경력 (년) *
                      </label>
                      <Field
                        type="number"
                        id="experienceYears"
                        name="experienceYears"
                        min="0"
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="experienceYears" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* 이메일 */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 *
                      </label>
                      <Field
                        type="email"
                        id="email"
                        name="email"
                        placeholder="example@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* 전화번호 (선택) */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        전화번호
                      </label>
                      <Field
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="010-0000-0000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end pt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSubmitting || isLoading ? '평가 중...' : '비자 평가 시작'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        );
      
      case 1:
        return (
          <EvaluationResultsSection
            result={evaluationResult}
            onNext={() => setCurrentStep(2)}
            isLoading={isLoading}
          />
        );
      
      case 2:
        return (
          <MatchingSection
            matchingResult={matchingResult}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            isLoading={isLoading}
          />
        );
      
      case 3:
        return (
          <PaymentSection
            flowId={flowId}
            estimatedCost={estimatedCost}
            onPaymentComplete={handleProceedToPayment}
            onBack={() => setCurrentStep(2)}
            isLoading={isLoading}
          />
        );
      
      case 4:
        return (
          <DocumentUploadSection
            flowId={flowId}
            requiredDocuments={paymentResult?.nextStep?.requiredDocuments}
            onSubmitDocuments={handleSubmitDocuments}
            onBack={() => setCurrentStep(3)}
            isLoading={isLoading}
          />
        );
      
      case 5:
        return (
          <CompletionSection
            flowId={flowId}
            documentResult={documentResult}
            paymentResult={paymentResult}
          />
        );
      
      default:
        return null;
    }
  };

  // 인증되지 않은 경우 처리
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">비자 신청 서비스를 이용하려면 로그인해주세요.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">비자 신청 서비스 V3</h1>
          <p className="text-gray-600">전문가와 함께하는 원스톱 비자 신청 서비스</p>
        </div>

        {/* 진행상황 표시 */}
        <ProgressStepper 
          steps={steps} 
          currentStep={currentStep} 
          progress={progress} 
        />

        {/* 오류 메시지 */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 현재 단계별 컴포넌트 렌더링 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VisaApplication;

