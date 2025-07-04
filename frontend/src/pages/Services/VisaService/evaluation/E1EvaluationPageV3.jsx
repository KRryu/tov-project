import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon, CheckCircleIcon, CreditCardIcon, DocumentIcon, UserGroupIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

// 새로운 통합 서비스 import
import visaServiceV3 from '../../../../api/services/visaServiceV3';
import { useAuth } from '../../../../hooks/useAuth';

// UI 컴포넌트들
import ProgressStepper from './components/ProgressStepper';
import E1FormSection from './components/E1FormSection';
import EvaluationResultsSection from './components/EvaluationResultsSection';
import MatchingSection from './components/MatchingSection';
import PaymentSection from './components/PaymentSection';
import DocumentUploadSection from './components/DocumentUploadSection';
import CompletionSection from './components/CompletionSection';

/**
 * E-1 비자 평가 페이지 V3 (완전 새로운 디자인)
 * 원스톱 플로우: 평가 → 매칭 → 결제 → 서류업로드 → 완료
 */
const E1EvaluationPageV3 = () => {
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
  const [showEstimate, setShowEstimate] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(null);

  // 단계 정의
  const steps = [
    { id: 'form', title: '정보 입력', description: 'E-1 비자 신청 정보를 입력해주세요' },
    { id: 'evaluation', title: '평가 결과', description: '비자 승인 가능성을 분석합니다' },
    { id: 'matching', title: '행정사 매칭', description: '최적의 전문가를 찾아드립니다' },
    { id: 'payment', title: '결제', description: '서비스 비용을 결제합니다' },
    { id: 'documents', title: '서류 업로드', description: '필요한 서류를 제출합니다' },
    { id: 'completion', title: '완료', description: '서비스 신청이 완료되었습니다' }
  ];

  // E-1 폼 유효성 검사
  const E1ValidationSchema = Yup.object().shape({
    // 기본 정보
    educationLevel: Yup.string().required('학력을 선택해주세요'),
    position: Yup.string().required('직위를 선택해주세요'),
    institution: Yup.string().required('교육기관명을 입력해주세요'),
    researchField: Yup.string().required('연구 분야를 선택해주세요'),
    
    // 경력 정보
    experienceYears: Yup.number()
      .required('경력 연수를 입력해주세요')
      .min(0, '경력 연수는 0 이상이어야 합니다'),
    publications: Yup.number()
      .required('논문 수를 입력해주세요')
      .min(0, '논문 수는 0 이상이어야 합니다'),
    
    // 계약 조건
    salary: Yup.number()
      .required('연봉을 입력해주세요')
      .min(1000, '연봉은 1000만원 이상이어야 합니다'),
    contractPeriod: Yup.number()
      .required('계약 기간을 입력해주세요')
      .min(1, '계약 기간은 1개월 이상이어야 합니다'),

    // 행정 정보 (선택적)
    fullName: Yup.string(),
    nationality: Yup.string(),
    email: Yup.string().email('올바른 이메일 형식이 아닙니다'),
    phone: Yup.string()
  });

  // 초기값
  const initialValues = {
    // 기본 정보
    educationLevel: '',
    position: '',
    institutionType: 'university',
    institution: '',
    researchField: '',
    
    // 경력 정보
    experienceYears: 0,
    publications: 0,
    internationalPublications: 0,
    experienceTypes: [],
    
    // 계약 조건
    salary: 0,
    contractPeriod: 12,
    
    // 추가 정보
    hasInstitutionRecommendation: false,
    hasPresidentRecommendation: false,
    hasTeachingCertificate: false,
    institutionRanking: null,
    
    // 행정 정보
    fullName: user?.fullName || '',
    nationality: 'KOR',
    birthDate: '',
    gender: '',
    email: user?.email || '',
    phone: user?.phone || ''
  };

  // === Effect Hooks ===
  useEffect(() => {
    // 가격 견적 조회
    loadPriceEstimate();
  }, []);

  // === 메인 플로우 함수들 ===

  /**
   * 1단계: E-1 평가 및 매칭 시작
   */
  const handleStartFlow = async (formValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 신청자 데이터 구성
      const applicantData = {
        evaluation: {
          educationLevel: formValues.educationLevel,
          position: formValues.position,
          institutionType: formValues.institutionType,
          institution: formValues.institution,
          researchField: formValues.researchField,
          experienceYears: parseInt(formValues.experienceYears),
          publications: parseInt(formValues.publications),
          internationalPublications: parseInt(formValues.internationalPublications || 0),
          experienceTypes: formValues.experienceTypes || [],
          salary: parseInt(formValues.salary),
          contractPeriod: parseInt(formValues.contractPeriod),
          hasInstitutionRecommendation: formValues.hasInstitutionRecommendation,
          hasPresidentRecommendation: formValues.hasPresidentRecommendation,
          hasTeachingCertificate: formValues.hasTeachingCertificate,
          institutionRanking: formValues.institutionRanking ? parseInt(formValues.institutionRanking) : null
        },
        administrative: {
          fullName: formValues.fullName || '',
          nationality: formValues.nationality || 'KOR',
          birthDate: formValues.birthDate || '',
          gender: formValues.gender || '',
          email: formValues.email || '',
          phone: formValues.phone || ''
        }
      };

      // 플로우 옵션
      const options = {
        includeLegalMatching: true,
        includeDocumentReview: true,
        urgentProcessing: false,
        consultationIncluded: false
      };

      // V3 통합 서비스로 플로우 시작
      const result = await visaServiceV3.executeE1FullFlow(
        applicantData, 
        options, 
        handleProgressUpdate
      );

      if (result.success) {
        setFlowId(result.flowId);
        setEvaluationResult(result.evaluationResult);
        setMatchingResult(result.matchingResult);
        
        // 다음 단계로 이동
        setCurrentStep(1); // 평가 결과 화면
      }

    } catch (error) {
      console.error('플로우 시작 오류:', error);
      setError(error.message || '서비스 시작 중 오류가 발생했습니다.');
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
        flowId,
        paymentMethod,
        paymentData,
        selectedServices,
        handleProgressUpdate
      );

      if (result.success) {
        setPaymentResult(result);
        setCurrentStep(4); // 서류 업로드 단계로
      }

    } catch (error) {
      console.error('결제 오류:', error);
      setError(error.message || '결제 처리 중 오류가 발생했습니다.');
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
        flowId,
        documents,
        handleProgressUpdate
      );

      if (result.success) {
        setDocumentResult(result);
        setCurrentStep(5); // 완료 단계로
      }

    } catch (error) {
      console.error('서류 제출 오류:', error);
      setError(error.message || '서류 제출 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 진행상황 업데이트 핸들러
   */
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

  /**
   * 가격 견적 로드
   */
  const loadPriceEstimate = async () => {
    try {
      const estimate = await visaServiceV3.estimateFlowCost('E-1', []);
      setEstimatedCost(estimate);
    } catch (error) {
      console.error('가격 견적 오류:', error);
    }
  };

  // === 단계별 컴포넌트 렌더링 ===

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <E1FormSection 
            initialValues={initialValues}
            validationSchema={E1ValidationSchema}
            onSubmit={handleStartFlow}
            isLoading={isLoading}
            estimatedCost={estimatedCost}
          />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">E-1 비자 서비스</h1>
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

export default E1EvaluationPageV3; 