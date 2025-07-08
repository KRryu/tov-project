import React, { useState, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import visaServiceV2 from '../../../../../api/services/visaServiceV2';
import { 
  FormField, 
  FormTextarea, 
  FormSelect, 
  FormCheckbox,
  FormRadioGroup 
} from '../../../../../components/visa/forms/components/FormField';
import {
  CategorySelector,
  SkillLevelSelector,
  TagSelector,
  RangeSlider,
  IncrementSelector
} from '../../../../../components/visa/forms/components/CategorySelector';
import { 
  FormCard, 
  FormAlert, 
  FormActions, 
  FormButton,
  FormProgress 
} from '../../../../../components/visa/forms/components/FormCard';

// 아이콘 컴포넌트들
const ExchangeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const GraduationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ChangeApplicationForm = ({
  visaType,
  initialData = {},
  requirements,
  onNext,
  onPrev,
  onFieldValidate,
  onPreScreen,
  currentStep,
  steps
}) => {
  const [loading, setLoading] = useState(false);
  const [changeabilityResult, setChangeabilityResult] = useState(null);
  const [checkingChangeability, setCheckingChangeability] = useState(false);
  const [supportedVisaTypes, setSupportedVisaTypes] = useState([]);
  
  // currentStep을 사용하여 현재 폼 단계 결정
  const currentFormStep = currentStep <= 2 ? currentStep : 2;

  // 지원되는 비자 타입 로드
  useEffect(() => {
    loadSupportedVisaTypes();
    
    // 디버깅용 로그
    console.log('🔍 ChangeApplicationForm props:', { visaType, initialData });
    console.log('💾 Session data:', applicationData);
    console.log('🎯 Target visa type:', targetVisaType);
  }, []);

  const loadSupportedVisaTypes = async () => {
    try {
      const response = await visaServiceV2.getSupportedTypesWithDetails();
      if (response.success) {
        setSupportedVisaTypes(response.data.visaTypes);
      }
    } catch (error) {
      console.error('Failed to load visa types:', error);
    }
  };

  // 변경 가능성 확인
  const checkChangeability = async (fromVisa, toVisa) => {
    setCheckingChangeability(true);
    try {
      const result = await visaServiceV2.checkChangeability(fromVisa, toVisa);
      if (result.success) {
        setChangeabilityResult(result.data);
        if (!result.data.possible) {
          toast.warning('직접 변경이 불가능한 경로입니다. 상세 안내를 확인하세요.');
        } else {
          toast.success('변경 가능한 비자 타입입니다.');
        }
      }
    } catch (error) {
      console.error('Changeability check failed:', error);
      toast.error('변경 가능성 확인에 실패했습니다.');
    } finally {
      setCheckingChangeability(false);
    }
  };

  // Step별 필드 정의
  const getFieldsForStep = (step) => {
    switch (step) {
      case 1:
        return {
          // 기본 정보
          fullName: '',
          birthDate: '',
          nationality: '',
          passportNumber: '',
          email: '',
          phone: '',
          
          // 현재 비자 정보
          currentVisaType: '',
          currentVisaNumber: '',
          visaIssueDate: '',
          visaExpiryDate: '',
          alienRegistrationNumber: '',
          currentStayStatus: '',
          
          // 변경 정보
          targetVisaType: visaType,
          changeReason: '',
          urgencyLevel: '',
          
          // 현재 상황
          currentEmployer: '',
          currentPosition: '',
          currentCity: ''
        };
        
      case 2:
        return {
          // 새 비자 관련 정보
          newEmployer: '',
          newPosition: '',
          newJobDescription: '',
          employmentStartDate: '',
          
          // 자격 요건
          educationLevel: '',
          educationField: '',
          relevantExperience: '',
          specialQualifications: '',
          publicationsCount: '',
          institutionType: '',
          
          // 언어 능력
          koreanProficiency: '',
          englishProficiency: '',
          
          // 재정 상태
          monthlyIncome: '',
          savingsAmount: '',
          financialSponsor: '',
          
          // 준비 상태
          hasJobOffer: false,
          hasRequiredDocuments: false,
          meetsEducationRequirements: false,
          meetsExperienceRequirements: false,
          
          // 추가 정보
          criminalRecord: false,
          healthIssues: false,
          previousVisaViolations: false
        };
        
      default:
        return {};
    }
  };

  // 유효성 검사 스키마
  const getValidationSchema = (step) => {
    const schemas = {
      1: Yup.object({
        fullName: Yup.string().required('이름은 필수입니다'),
        birthDate: Yup.date().required('생년월일은 필수입니다'),
        nationality: Yup.string().required('국적은 필수입니다'),
        passportNumber: Yup.string().required('여권번호는 필수입니다'),
        email: Yup.string().email('유효한 이메일을 입력하세요').required('이메일은 필수입니다'),
        phone: Yup.string().required('전화번호는 필수입니다'),
        currentVisaType: Yup.string().required('현재 비자 타입은 필수입니다'),
        currentVisaNumber: Yup.string().required('현재 비자 번호는 필수입니다'),
        visaIssueDate: Yup.date().required('비자 발급일은 필수입니다'),
        visaExpiryDate: Yup.date().required('비자 만료일은 필수입니다'),
        alienRegistrationNumber: Yup.string().required('외국인등록번호는 필수입니다'),
        currentStayStatus: Yup.string().required('체류 상태는 필수입니다'),
        changeReason: Yup.string()
          .required('변경 사유는 필수입니다')
          .min(50, '변경 사유를 50자 이상 상세히 작성해주세요'),
        urgencyLevel: Yup.string().required('긴급도를 선택하세요'),
        currentEmployer: Yup.string().required('현재 소속은 필수입니다'),
        currentPosition: Yup.string().required('현재 직책은 필수입니다'),
        currentCity: Yup.string().required('거주 도시는 필수입니다')
      }),
      
      2: Yup.object({
        newEmployer: Yup.string().required('새 고용주는 필수입니다'),
        newPosition: Yup.string().required('새 직책은 필수입니다'),
        newJobDescription: Yup.string()
          .required('업무 설명은 필수입니다')
          .min(50, '업무 내용을 50자 이상 상세히 작성해주세요'),
        employmentStartDate: Yup.date().required('고용 시작일은 필수입니다'),
        educationLevel: Yup.string().required('학력은 필수입니다'),
        educationField: Yup.string().required('전공 분야는 필수입니다'),
        relevantExperience: Yup.string().required('관련 경력은 필수입니다'),
        koreanProficiency: Yup.string().required('한국어 능력을 선택하세요'),
        englishProficiency: Yup.string().required('영어 능력을 선택하세요'),
        monthlyIncome: Yup.string().required('예상 월 수입은 필수입니다'),
        hasJobOffer: Yup.boolean().oneOf([true], '고용 제안이 있어야 합니다')
      })
    };
    
    return schemas[step] || Yup.object();
  };

  // 체류 상태 옵션
  const stayStatusOptions = [
    { 
      value: 'legal', 
      label: '합법 체류', 
      description: '정상적인 체류 상태',
      icon: '✅' 
    },
    { 
      value: 'grace_period', 
      label: '유예 기간', 
      description: '출국 준비 기간',
      icon: '⚠️' 
    },
    { 
      value: 'pending_extension', 
      label: '연장 신청 중', 
      description: '연장 심사 진행 중',
      icon: '🔄' 
    }
  ];

  // 긴급도 옵션
  const urgencyOptions = [
    { 
      value: 'normal', 
      label: '보통', 
      description: '2-3개월 여유',
      icon: '🟢' 
    },
    { 
      value: 'urgent', 
      label: '긴급', 
      description: '1개월 이내',
      icon: '🟡' 
    },
    { 
      value: 'very_urgent', 
      label: '매우 긴급', 
      description: '2주 이내',
      icon: '🔴' 
    }
  ];

  // 학력 옵션
  const educationOptions = [
    { 
      value: 'high_school', 
      label: '고등학교', 
      description: '고등학교 졸업',
      icon: '📖' 
    },
    { 
      value: 'associate', 
      label: '전문학사', 
      description: '2-3년제 대학 졸업',
      icon: '📚' 
    },
    { 
      value: 'bachelor', 
      label: '학사', 
      description: '4년제 대학 졸업',
      icon: '🎓' 
    },
    { 
      value: 'master', 
      label: '석사', 
      description: '대학원 석사과정 졸업',
      icon: '📚' 
    },
    { 
      value: 'phd', 
      label: '박사', 
      description: '대학원 박사과정 졸업',
      icon: '🎯' 
    }
  ];

  // 언어 능력 옵션
  const languageProficiencyOptions = [
    { value: 'none', label: '불가' },
    { value: 'beginner', label: '초급' },
    { value: 'intermediate', label: '중급' },
    { value: 'advanced', label: '고급' },
    { value: 'native', label: '원어민' }
  ];

  // 기관 유형 옵션
  const institutionOptions = [
    { 
      value: 'university', 
      label: '대학교', 
      description: '4년제 정규 대학',
      icon: '🏛️' 
    },
    { 
      value: 'college', 
      label: '전문대학', 
      description: '2-3년제 전문대학',
      icon: '🏫' 
    },
    { 
      value: 'research', 
      label: '연구기관', 
      description: '국립/사립 연구소',
      icon: '🔬' 
    },
    { 
      value: 'language', 
      label: '어학원', 
      description: '외국어 교육기관',
      icon: '🗣️' 
    },
    { 
      value: 'international', 
      label: '국제학교', 
      description: '외국인학교/국제학교',
      icon: '🌍' 
    },
    { 
      value: 'company', 
      label: '기업', 
      description: '일반 기업체',
      icon: '🏢' 
    }
  ];

  // 언어 레벨 매핑
  const languageLevelMapping = ['none', 'beginner', 'intermediate', 'advanced', 'native'];

  // 폼 제출
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 언어 능력 값 변환 (숫자 -> 문자열)
      const transformedValues = {
        ...values,
        koreanProficiency: typeof values.koreanProficiency === 'number' 
          ? languageLevelMapping[values.koreanProficiency] 
          : values.koreanProficiency,
        englishProficiency: typeof values.englishProficiency === 'number' 
          ? languageLevelMapping[values.englishProficiency] 
          : values.englishProficiency
      };

      const mergedData = {
        ...initialData,
        ...transformedValues,
        applicationType: 'CHANGE',
        visaType,
        currentStep: currentFormStep,
        changeabilityResult
      };
      
      // 첫 단계 완료 시 변경 가능성 확인
      if (currentFormStep === 1 && values.currentVisaType && values.targetVisaType) {
        await checkChangeability(values.currentVisaType, values.targetVisaType);
      }
      
      // 마지막 단계에서 완료 메시지
      if (currentFormStep === 2) {
        toast.success('정보 입력이 완료되었습니다. 사전심사를 진행합니다.');
      }
      
      // 다음 단계로 이동
      onNext(mergedData);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (onPrev) {
      onPrev();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 세션에서 targetVisaType 가져오기
  const sessionData = sessionStorage.getItem('applicationData');
  const applicationData = sessionData ? JSON.parse(sessionData) : {};
  const targetVisaType = applicationData.targetVisaType || visaType || '';
  
  const initialValues = {
    ...getFieldsForStep(currentFormStep),
    ...initialData,
    targetVisaType: targetVisaType
  };

  return (
    <div className="max-w-4xl mx-auto">
      <FormProgress current={currentFormStep} total={2} />
      
      {/* 변경 신청 안내 */}
      <FormAlert type="warning">
        <div>
          <p className="font-medium">비자 변경 신청 시 유의사항</p>
          <ul className="mt-1 list-disc list-inside text-xs">
            <li>현재 비자가 유효한 상태에서만 변경 신청이 가능합니다</li>
            <li>모든 비자 간 직접 변경이 가능하지는 않습니다</li>
            <li>새로운 고용주와의 계약서가 필요합니다</li>
          </ul>
        </div>
      </FormAlert>

      {/* 변경 가능성 결과 표시 */}
      {changeabilityResult && !changeabilityResult.possible && (
        <div className="mt-4">
          <FormAlert type="error">
            <div>
              <p className="font-medium">직접 변경 불가</p>
              <p className="text-xs mt-1">{changeabilityResult.reason}</p>
              {changeabilityResult.alternatives && changeabilityResult.alternatives.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium">대안:</p>
                  <ul className="text-xs list-disc list-inside">
                    {changeabilityResult.alternatives.map((alt, idx) => (
                      <li key={idx}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </FormAlert>
        </div>
      )}

      <div className="mt-6">
        <Formik
          initialValues={initialValues}
          validationSchema={getValidationSchema(currentFormStep)}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, setFieldError, isSubmitting }) => (
            <Form className="space-y-6">
              <AnimatePresence mode="wait">
                {currentFormStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* 비자 변경 정보 */}
                    <FormCard 
                      title="비자 변경 정보" 
                      subtitle="현재 비자에서 변경하고자 하는 비자 정보"
                      icon={<ExchangeIcon />}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormSelect
                            name="currentVisaType"
                            label="현재 비자 타입"
                            options={supportedVisaTypes.map(type => ({
                              value: type.code,
                              label: `${type.code} - ${type.name}`
                            }))}
                            required
                          />
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              변경 희망 비자
                            </label>
                            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                              <span className="font-medium text-blue-600">
                                {supportedVisaTypes.find(type => type.code === targetVisaType)?.code || targetVisaType} - 
                                {supportedVisaTypes.find(type => type.code === targetVisaType)?.name || '비자 선택'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <CategorySelector
                            name="urgencyLevel"
                            label="긴급도"
                            options={urgencyOptions}
                            columns={3}
                            required
                          />
                        </div>
                        
                        <FormTextarea
                          name="changeReason"
                          label="변경 사유"
                          placeholder="비자 변경이 필요한 구체적인 사유를 작성해주세요..."
                          rows={4}
                          required
                          helperText="최소 50자 이상 작성해주세요"
                        />
                      </div>
                    </FormCard>

                    {/* 현재 비자 정보 */}
                    <FormCard 
                      title="현재 비자 정보" 
                      subtitle="현재 보유한 비자의 상세 정보"
                      delay={0.1}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="currentVisaNumber"
                          label="비자 번호"
                          placeholder="12345678"
                          required
                        />
                        
                        <FormField
                          name="alienRegistrationNumber"
                          label="외국인등록번호"
                          placeholder="000000-0000000"
                          required
                        />
                        
                        <FormField
                          name="visaIssueDate"
                          label="비자 발급일"
                          type="date"
                          required
                        />
                        
                        <FormField
                          name="visaExpiryDate"
                          label="비자 만료일"
                          type="date"
                          required
                        />
                        
                        <div className="md:col-span-2">
                          <CategorySelector
                            name="currentStayStatus"
                            label="현재 체류 상태"
                            options={stayStatusOptions}
                            columns={3}
                            required
                          />
                        </div>
                      </div>
                    </FormCard>

                    {/* 개인 정보 */}
                    <FormCard 
                      title="개인 정보" 
                      subtitle="신청자 기본 정보"
                      delay={0.2}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="fullName"
                          label="이름 (영문)"
                          placeholder="여권상 영문명"
                          required
                        />
                        
                        <FormField
                          name="birthDate"
                          label="생년월일"
                          type="date"
                          required
                        />
                        
                        <FormField
                          name="nationality"
                          label="국적"
                          placeholder="USA"
                          required
                        />
                        
                        <FormField
                          name="passportNumber"
                          label="여권 번호"
                          placeholder="M12345678"
                          required
                        />
                        
                        <FormField
                          name="email"
                          label="이메일"
                          type="email"
                          placeholder="your@email.com"
                          required
                        />
                        
                        <FormField
                          name="phone"
                          label="전화번호"
                          type="tel"
                          placeholder="010-1234-5678"
                          required
                        />
                      </div>
                    </FormCard>

                    {/* 현재 활동 정보 */}
                    <FormCard 
                      title="현재 활동 정보" 
                      subtitle="현재 근무 상황"
                      delay={0.3}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="currentEmployer"
                          label="현재 소속"
                          placeholder="현재 소속 기관"
                          required
                        />
                        
                        <FormField
                          name="currentPosition"
                          label="현재 직책"
                          placeholder="예: Researcher"
                          required
                        />
                        
                        <FormField
                          name="currentCity"
                          label="근무 도시"
                          placeholder="예: Seoul"
                          required
                        />
                      </div>
                    </FormCard>
                  </motion.div>
                )}

                {currentFormStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* 새 비자 관련 정보 */}
                    <FormCard 
                      title="새 비자 관련 정보" 
                      subtitle="변경하려는 비자에서의 활동 계획"
                      icon={<DocumentIcon />}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            name="newEmployer"
                            label="새 고용주/기관"
                            placeholder="근무 예정 기관명"
                            required
                          />
                          
                          <FormField
                            name="newPosition"
                            label="새 직책"
                            placeholder="예: Assistant Professor"
                            required
                          />
                          
                          <FormField
                            name="employmentStartDate"
                            label="고용 시작 예정일"
                            type="date"
                            required
                          />
                        </div>
                        
                        <FormTextarea
                          name="newJobDescription"
                          label="업무 내용"
                          placeholder="새로운 직책에서 수행할 업무를 상세히 설명해주세요..."
                          rows={4}
                          required
                          helperText="최소 50자 이상 작성해주세요"
                        />
                      </div>
                    </FormCard>

                    {/* 자격 요건 */}
                    <FormCard 
                      title="자격 요건" 
                      subtitle="새 비자에 필요한 자격 사항"
                      icon={<GraduationIcon />}
                      delay={0.1}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <CategorySelector
                              name="educationLevel"
                              label="최종 학력"
                              options={educationOptions}
                              columns={3}
                              required
                            />
                          </div>
                          
                          <FormField
                            name="educationField"
                            label="전공 분야"
                            placeholder="예: Computer Science"
                            required
                          />
                          
                          <div className="md:col-span-2">
                            <RangeSlider
                              name="relevantExperience"
                              label="관련 경력"
                              min={0}
                              max={30}
                              step={1}
                              unit="년"
                              required
                            />
                          </div>
                        </div>
                        
                        <FormTextarea
                          name="specialQualifications"
                          label="특별 자격사항"
                          placeholder="관련 자격증, 특허, 수상 경력 등..."
                          rows={3}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <IncrementSelector
                            name="publicationsCount"
                            label="논문/출판물 수"
                            min={0}
                            max={50}
                            step={1}
                            unit="편"
                          />
                          
                          <div className="md:col-span-2">
                            <CategorySelector
                              name="institutionType"
                              label="근무 예정 기관 유형"
                              options={institutionOptions}
                              columns={3}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <SkillLevelSelector
                              name="koreanProficiency"
                              label="한국어 능력"
                              levels={5}
                              labels={['불가', '초급', '중급', '고급', '원어민']}
                              required
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <SkillLevelSelector
                              name="englishProficiency"
                              label="영어 능력"
                              levels={5}
                              labels={['불가', '초급', '중급', '고급', '원어민']}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </FormCard>

                    {/* 재정 상태 */}
                    <FormCard 
                      title="재정 상태" 
                      subtitle="경제적 능력 확인"
                      delay={0.2}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="monthlyIncome"
                          label="예상 월 수입"
                          placeholder="3,000,000"
                          required
                          helperText="원화 기준, 숫자만 입력"
                        />
                        
                        <FormField
                          name="savingsAmount"
                          label="예금 잔액"
                          placeholder="10,000,000"
                          helperText="원화 기준, 숫자만 입력"
                        />
                        
                        <FormField
                          name="financialSponsor"
                          label="재정 보증인"
                          placeholder="보증인이 있는 경우 입력"
                        />
                      </div>
                    </FormCard>

                    {/* 준비 상태 확인 */}
                    <FormCard 
                      title="준비 상태 확인" 
                      subtitle="비자 변경을 위한 준비 사항"
                      icon={<AlertIcon />}
                      delay={0.3}
                    >
                      <div className="space-y-3">
                        <FormCheckbox
                          name="hasJobOffer"
                          label="새로운 고용 계약서가 준비되어 있습니다"
                          helperText="필수 - 고용 제안서 또는 계약서"
                        />
                        
                        <FormCheckbox
                          name="hasRequiredDocuments"
                          label="필요한 서류를 모두 준비했습니다"
                        />
                        
                        <FormCheckbox
                          name="meetsEducationRequirements"
                          label="새 비자의 학력 요건을 충족합니다"
                        />
                        
                        <FormCheckbox
                          name="meetsExperienceRequirements"
                          label="새 비자의 경력 요건을 충족합니다"
                        />
                        
                        <div className="mt-4 pt-4 border-t">
                          <FormCheckbox
                            name="criminalRecord"
                            label="범죄 경력이 있습니다"
                          />
                          
                          <FormCheckbox
                            name="healthIssues"
                            label="건강상 문제가 있습니다"
                          />
                          
                          <FormCheckbox
                            name="previousVisaViolations"
                            label="비자 관련 위반 사항이 있습니다"
                          />
                        </div>
                      </div>
                    </FormCard>
                  </motion.div>
                )}
              </AnimatePresence>

              <FormActions>
                <FormButton
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                >
                  이전
                </FormButton>
                
                <FormButton
                  type="submit"
                  loading={loading || checkingChangeability}
                  disabled={isSubmitting}
                >
                  {currentFormStep === 2 ? '사전심사 진행' : '다음'}
                </FormButton>
              </FormActions>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ChangeApplicationForm;