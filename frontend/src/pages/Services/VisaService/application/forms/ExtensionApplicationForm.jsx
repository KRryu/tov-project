import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
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
const VisaIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChecklistIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ExtensionApplicationForm = ({
  visaType,
  initialData = {},
  requirements,
  onNext,
  onPrev,
  onFieldValidate,
  currentStep,
  steps
}) => {
  const [loading, setLoading] = useState(false);
  
  // currentStep을 사용하여 현재 폼 단계 결정
  const currentFormStep = currentStep <= 2 ? currentStep : 2;

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
          currentVisaNumber: '',
          currentVisaType: visaType,
          visaIssueDate: '',
          visaExpiryDate: '',
          currentStayStatus: '',
          alienRegistrationNumber: '',
          
          // 현재 활동 정보
          currentEmployer: '',
          currentPosition: '',
          employmentStartDate: '',
          currentAddress: '',
          currentCity: '',
          
          // 학력/경력 정보 (평가에 필요)
          educationLevel: '',
          educationField: '',
          yearsOfExperience: '',
          institutionType: '',
          publicationsCount: ''
        };
        
      case 2:
        return {
          // 연장 정보
          extensionPeriod: '',
          extensionReason: '',
          
          // 활동 실적 (체크박스/선택형으로 변경)
          coursesTaught: 0,
          weeklyHours: 0,
          publications: 0,
          studentsSupervised: 0,
          attendanceRate: 0.95,
          studentEvaluation: 4.0,
          extraActivities: false,
          
          // 향후 계획 (선택형으로 변경)
          extensionPeriod: 12,
          extensionReason: 'continue_research',
          futurePlans: 'continue_current',
          
          // 재정 상태
          currentIncome: '',
          savingsAmount: '',
          financialSponsor: '',
          
          // 계약 연속성 관련 필드 추가
          contractRemainingMonths: 12,
          employerChangeCount: 0,
          contractGapDays: 0,
          salaryChange: 'stable',
          currentEmploymentLength: 12,
          
          // 추가 정보
          taxPaymentStatus: true,
          healthInsuranceStatus: true,
          criminalRecordSinceEntry: false,
          immigrationViolations: false,
          
          // 문서 체크리스트 추가
          submittedDocuments: {
            employment_cert: false,
            income_cert: false,
            passport_copy: false,
            alien_reg: false,
            tax_payment: false,
            health_insurance: false,
            contract_copy: false
          }
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
        currentVisaNumber: Yup.string().required('현재 비자 번호는 필수입니다'),
        visaIssueDate: Yup.date().required('비자 발급일은 필수입니다'),
        visaExpiryDate: Yup.date()
          .required('비자 만료일은 필수입니다')
          .min(new Date(), '이미 만료된 비자는 연장할 수 없습니다'),
        currentStayStatus: Yup.string().required('체류 상태는 필수입니다'),
        alienRegistrationNumber: Yup.string().required('외국인등록번호는 필수입니다'),
        currentEmployer: Yup.string().required('현재 소속은 필수입니다'),
        currentPosition: Yup.string().required('현재 직책은 필수입니다'),
        employmentStartDate: Yup.date().required('고용 시작일은 필수입니다'),
        currentAddress: Yup.string().required('현재 주소는 필수입니다'),
        currentCity: Yup.string().required('거주 도시는 필수입니다')
      }),
      
      2: Yup.object({
        extensionPeriod: Yup.number()
          .required('연장 기간은 필수입니다')
          .min(1, '최소 1개월 이상')
          .max(24, '최대 24개월까지 가능'),
        extensionReason: Yup.string().required('연장 사유는 필수입니다'),
        coursesTaught: Yup.number().min(0, '0 이상 입력해주세요'),
        weeklyHours: Yup.number().min(0, '0 이상 입력해주세요'),
        publications: Yup.number().min(0, '0 이상 입력해주세요'),
        studentsSupervised: Yup.number().min(0, '0 이상 입력해주세요'),
        attendanceRate: Yup.number().min(0, '0 이상').max(1, '1 이하'),
        contractRemainingMonths: Yup.number().min(0, '0 이상').max(36, '36 이하'),
        currentEmploymentLength: Yup.number().min(1, '1 이상').max(120, '120 이하'),
        employerChangeCount: Yup.number().min(0, '0 이상').max(10, '10 이하'),
        contractGapDays: Yup.number().min(0, '0 이상').max(365, '365 이하'),
        salaryChange: Yup.string().oneOf(['increasing', 'stable', 'decreasing'], '올바른 값을 선택해주세요'),
        currentIncome: Yup.string().required('현재 수입은 필수입니다')
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

  // 학력 옵션
  const educationOptions = [
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
    },
    { 
      value: 'postdoc', 
      label: '박사후연구원', 
      description: '박사 후 연구 경험',
      icon: '🔬' 
    }
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
    }
  ];

  // 언어 레벨 매핑
  const languageLevelMapping = ['none', 'beginner', 'intermediate', 'advanced', 'native'];
  
  // 연장 사유 옵션
  const extensionReasonOptions = [
    { 
      value: 'continue_research', 
      label: '연구 지속', 
      description: '현재 연구 프로젝트 지속',
      icon: '🔬' 
    },
    { 
      value: 'continue_teaching', 
      label: '교육 지속', 
      description: '현재 교육 활동 지속',
      icon: '📚' 
    },
    { 
      value: 'new_project', 
      label: '신규 프로젝트', 
      description: '새로운 프로젝트 참여',
      icon: '🚀' 
    },
    { 
      value: 'contract_renewal', 
      label: '계약 갱신', 
      description: '기관과 계약 갱신',
      icon: '📝' 
    }
  ];

  // 향후 계획 옵션
  const futurePlansOptions = [
    { 
      value: 'continue_current', 
      label: '현재 활동 지속', 
      description: '기존 업무/연구 지속',
      icon: '📈' 
    },
    { 
      value: 'expand_research', 
      label: '연구 확장', 
      description: '연구 범위 확대',
      icon: '🔬' 
    },
    { 
      value: 'collaboration', 
      label: '협력 강화', 
      description: '국내외 협력 확대',
      icon: '🤝' 
    },
    { 
      value: 'skill_development', 
      label: '역량 개발', 
      description: '전문 역량 강화',
      icon: '💡' 
    }
  ];

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

      // 📊 제출된 문서 데이터 디버깅
      console.log('🔍 폼 제출 데이터 디버깅:', {
        originalValues: values,
        transformedValues: transformedValues,
        submittedDocuments: transformedValues.submittedDocuments,
        submittedDocsKeys: Object.keys(transformedValues.submittedDocuments || {}),
        submittedDocsEntries: Object.entries(transformedValues.submittedDocuments || {}),
        allFormFields: Object.keys(transformedValues)
      });

      // 백엔드가 기대하는 evaluation 구조로 데이터 변환
      const evaluationData = {
        // 활동 실적 데이터
        performance: {
          coursesTaught: transformedValues.coursesTaught || 0,
          weeklyHours: transformedValues.weeklyHours || 0,
          publications: transformedValues.publications || 0,
          studentsSupervised: transformedValues.studentsSupervised || 0,
          attendanceRate: transformedValues.attendanceRate || 0.95,
          studentEvaluation: transformedValues.studentEvaluation || 4.0,
          extraActivities: transformedValues.extraActivities || false,
          unauthorizedWork: false,
          addressNotReported: false
        },
        
        // 체류 이력 데이터
        stayHistory: {
          violations: [],
          taxPayments: { consistent: transformedValues.taxPaymentStatus },
          socialContribution: transformedValues.contributionsToKorea || false,
          departureCount: 0,
          totalDays: 365,
          previousExtensions: transformedValues.previousExtensions || 0,
          totalStayMonths: transformedValues.totalStayMonths || 12
        },
        
        // 계약 연속성 데이터 (백엔드가 기대하는 구조)
        contractContinuity: {
          currentContract: {
            remainingMonths: transformedValues.contractRemainingMonths || 12
          },
          employmentHistory: [
            {
              employer: transformedValues.currentEmployer || '현재 직장',
              startDate: transformedValues.employmentStartDate || '2023-01-01',
              endDate: null, // 현재 재직 중
              lengthMonths: transformedValues.currentEmploymentLength || 12
            }
          ],
          salaryHistory: [
            {
              period: '현재',
              amount: parseInt(transformedValues.currentIncome) || 3000000,
              trend: transformedValues.salaryChange || 'stable'
            }
          ],
          employerChangeCount: transformedValues.employerChangeCount || 0,
          contractGaps: transformedValues.contractGapDays || 0,
          salaryProgression: transformedValues.salaryChange || 'stable'
        },
        
        // 제출 문서 체크리스트
        submittedDocuments: transformedValues.submittedDocuments || {}
      };

      // 📊 최종 evaluation 데이터 디버깅
      console.log('📋 백엔드 전송 evaluation 데이터:', {
        evaluationData: evaluationData,
        submittedDocuments: evaluationData.submittedDocuments,
        submittedDocsDetail: JSON.stringify(evaluationData.submittedDocuments, null, 2)
      });

      const mergedData = {
        ...initialData,
        ...transformedValues,
        applicationType: 'EXTENSION',
        visaType,
        currentStep: currentFormStep,
        evaluation: evaluationData
      };
      
      // 연장 신청 특별 검증 (2단계에서)
      if (currentFormStep === 2) {
        const remainingDays = Math.floor(
          (new Date(values.visaExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        
        if (remainingDays < 30) {
          toast.warning('비자 만료일이 30일 이내입니다. 신속한 처리가 필요합니다.');
        }
        
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

  const initialValues = {
    ...getFieldsForStep(currentFormStep),
    ...initialData
  };

  return (
    <div className="max-w-4xl mx-auto">
      <FormProgress current={currentFormStep} total={2} />
      
      {/* 연장 신청 안내 */}
      <FormAlert type="info">
        <div>
          <p className="font-medium">연장 신청 시 유의사항</p>
          <ul className="mt-1 list-disc list-inside text-xs">
            <li>비자 만료 최소 2개월 전 신청을 권장합니다</li>
            <li>활동 실적과 향후 계획을 구체적으로 작성해주세요</li>
            <li>세금 납부 및 건강보험 가입 상태를 확인해주세요</li>
          </ul>
        </div>
      </FormAlert>

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
                    {/* 현재 비자 정보 */}
                    <FormCard 
                      title="현재 비자 정보" 
                      subtitle="현재 보유한 비자의 정보를 입력해주세요"
                      icon={<VisaIcon />}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="currentVisaNumber"
                          label="현재 비자 번호"
                          placeholder="12345678"
                          required
                          icon={<VisaIcon />}
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
                          helperText="만료일 2개월 전 신청을 권장합니다"
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
                      subtitle="신청자의 기본 정보"
                      delay={0.1}
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
                      subtitle="한국에서의 현재 활동 상황"
                      delay={0.2}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            name="currentEmployer"
                            label="현재 소속"
                            placeholder="소속 기관명"
                            required
                          />
                          
                          <FormField
                            name="currentPosition"
                            label="현재 직책"
                            placeholder="예: Assistant Professor"
                            required
                          />
                          
                          <FormField
                            name="employmentStartDate"
                            label="고용 시작일"
                            type="date"
                            required
                          />
                          
                          <FormField
                            name="currentCity"
                            label="근무 도시"
                            placeholder="예: Seoul"
                            required
                          />
                        </div>
                        
                        <FormField
                          name="currentAddress"
                          label="현재 거주지 주소"
                          placeholder="한국 내 거주지 주소"
                          required
                        />
                      </div>
                    </FormCard>

                    {/* 학력/경력 정보 */}
                    <FormCard 
                      title="학력 및 경력 정보" 
                      subtitle="평가에 필요한 기본 정보"
                      delay={0.3}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <CategorySelector
                            name="educationLevel"
                            label="최종 학력"
                            options={educationOptions}
                            columns={2}
                          />
                        </div>
                        
                        <FormField
                          name="educationField"
                          label="전공 분야"
                          placeholder="예: Computer Science"
                        />
                        
                        <div className="md:col-span-2">
                          <RangeSlider
                            name="yearsOfExperience"
                            label="경력 연수"
                            min={0}
                            max={30}
                            step={1}
                            unit="년"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <CategorySelector
                            name="institutionType"
                            label="소속 기관 유형"
                            options={institutionOptions}
                            columns={3}
                          />
                        </div>
                        
                        <IncrementSelector
                          name="publicationsCount"
                          label="논문/출판물 수"
                          min={0}
                          max={50}
                          step={1}
                          unit="편"
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
                    {/* 연장 정보 */}
                    <FormCard 
                      title="연장 신청 정보" 
                      subtitle="비자 연장 관련 세부사항"
                      icon={<ClockIcon />}
                    >
                      <div className="space-y-6">
                        <IncrementSelector
                          name="extensionPeriod"
                          label="연장 신청 기간"
                          min={1}
                          max={24}
                          step={1}
                          unit="개월"
                          required
                        />
                        
                        <CategorySelector
                          name="extensionReason"
                          label="연장 사유"
                          options={extensionReasonOptions}
                          columns={2}
                          required
                        />
                        
                        <CategorySelector
                          name="futurePlans"
                          label="향후 계획"
                          options={futurePlansOptions}
                          columns={2}
                          required
                        />
                      </div>
                    </FormCard>

                    {/* 활동 실적 (E-1 교수 기준) */}
                    <FormCard 
                      title="활동 실적" 
                      subtitle="체류 기간 동안의 구체적인 활동 성과"
                      icon={<ChecklistIcon />}
                      delay={0.1}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <IncrementSelector
                            name="coursesTaught"
                            label="담당 과목 수 (연간)"
                            min={0}
                            max={20}
                            step={1}
                            unit="과목"
                            helperText="연간 담당한 강의 과목 수"
                          />
                          
                          <IncrementSelector
                            name="weeklyHours"
                            label="주당 강의 시간"
                            min={0}
                            max={40}
                            step={1}
                            unit="시간"
                            helperText="주당 총 강의 시간"
                          />
                          
                          <IncrementSelector
                            name="publications"
                            label="논문/출판물 (연간)"
                            min={0}
                            max={20}
                            step={1}
                            unit="편"
                            helperText="연간 발표한 논문/출판물 수"
                          />
                          
                          <IncrementSelector
                            name="studentsSupervised"
                            label="지도 학생 수"
                            min={0}
                            max={50}
                            step={1}
                            unit="명"
                            helperText="현재 지도 중인 학생 수"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <RangeSlider
                            name="attendanceRate"
                            label="출석률"
                            min={0.5}
                            max={1.0}
                            step={0.05}
                            unit=""
                            format={(value) => `${Math.round(value * 100)}%`}
                            helperText="지난 1년간 평균 출석률"
                          />
                          
                          <RangeSlider
                            name="studentEvaluation"
                            label="학생 평가 점수"
                            min={1.0}
                            max={5.0}
                            step={0.1}
                            unit="점"
                            format={(value) => `${value.toFixed(1)}점`}
                            helperText="학생들의 강의 평가 점수 (5점 만점)"
                          />
                        </div>
                        
                        <FormCheckbox
                          name="extraActivities"
                          label="추가 활동 참여 (학회, 세미나, 사회봉사 등)"
                        />
                      </div>
                    </FormCard>

                    {/* 문서 체크리스트 */}
                    <FormCard 
                      title="제출 문서 체크리스트" 
                      subtitle="연장 신청에 필요한 서류 준비 상황 (실제 제출은 결제 후)"
                      icon={<ChecklistIcon />}
                      delay={0.2}
                    >
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">서류 준비도 평가</p>
                            <p className="mt-1">현재 준비 가능한 서류를 체크해주세요. 실제 서류 제출은 결제 후 본격적으로 진행됩니다.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormCheckbox
                            name="submittedDocuments.employment_cert"
                            label="재직증명서 (20점)"
                            helperText="현재 소속 기관 발행"
                          />
                          
                          <FormCheckbox
                            name="submittedDocuments.income_cert"
                            label="소득금액증명원 (15점)"
                            helperText="국세청 발행 최근 것"
                          />
                          
                          <FormCheckbox
                            name="submittedDocuments.passport_copy"
                            label="여권 사본 (15점)"
                            helperText="전체 페이지 사본"
                          />
                          
                          <FormCheckbox
                            name="submittedDocuments.alien_reg"
                            label="외국인등록증 (15점)"
                            helperText="앞뒤 모두 사본"
                          />
                          
                          <FormCheckbox
                            name="submittedDocuments.tax_payment"
                            label="납세증명서 (15점)"
                            helperText="세무서 발행"
                          />
                          
                          <FormCheckbox
                            name="submittedDocuments.health_insurance"
                            label="건강보험납부확인서 (10점)"
                            helperText="국민건강보험공단 발행"
                          />
                          
                          <FormCheckbox
                            name="submittedDocuments.contract_copy"
                            label="고용계약서 사본 (10점)"
                            helperText="현재 유효한 계약서"
                          />
                        </div>
                      </div>
                    </FormCard>

                    {/* 계약 연속성 정보 */}
                    <FormCard 
                      title="계약 및 고용 상태" 
                      subtitle="현재 계약 상황과 고용 연속성"
                      icon={<TrendingUpIcon />}
                      delay={0.25}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <IncrementSelector
                            name="contractRemainingMonths"
                            label="현재 계약 잔여 기간"
                            min={0}
                            max={36}
                            step={1}
                            unit="개월"
                            helperText="현재 계약의 남은 기간"
                          />
                          
                          <IncrementSelector
                            name="currentEmploymentLength"
                            label="현재 직장 근무 기간"
                            min={1}
                            max={120}
                            step={1}
                            unit="개월"
                            helperText="현재 직장에서 근무한 총 기간"
                          />
                          
                          <IncrementSelector
                            name="employerChangeCount"
                            label="지난 3년간 직장 변경 횟수"
                            min={0}
                            max={10}
                            step={1}
                            unit="회"
                            helperText="최근 3년간 고용주 변경 횟수"
                          />
                          
                          <IncrementSelector
                            name="contractGapDays"
                            label="계약 공백 기간"
                            min={0}
                            max={365}
                            step={1}
                            unit="일"
                            helperText="지난 계약 간 공백 기간 (총합)"
                          />
                        </div>
                        
                        <CategorySelector
                          name="salaryChange"
                          label="급여 변화 추이"
                          options={[
                            { 
                              value: 'increasing', 
                              label: '상승', 
                              description: '지속적으로 급여가 증가',
                              icon: '📈' 
                            },
                            { 
                              value: 'stable', 
                              label: '안정', 
                              description: '급여가 안정적으로 유지',
                              icon: '📊' 
                            },
                            { 
                              value: 'decreasing', 
                              label: '하락', 
                              description: '급여가 감소하는 추세',
                              icon: '📉' 
                            }
                          ]}
                          columns={3}
                          helperText="지난 2년간 급여 변화 추이"
                        />
                      </div>
                    </FormCard>

                    {/* 재정 및 준법 정보 */}
                    <FormCard 
                      title="재정 및 준법 상태" 
                      subtitle="재정 능력과 체류 중 준법 여부"
                      icon={<CashIcon />}
                      delay={0.3}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            name="currentIncome"
                            label="현재 월 수입"
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
                        </div>
                        
                        <div className="space-y-3">
                          <FormCheckbox
                            name="taxPaymentStatus"
                            label="세금을 성실히 납부하고 있습니다"
                          />
                          
                          <FormCheckbox
                            name="healthInsuranceStatus"
                            label="건강보험에 가입되어 있습니다"
                          />
                          
                          <FormCheckbox
                            name="criminalRecordSinceEntry"
                            label="한국 체류 중 범죄 경력이 있습니다"
                          />
                          
                          <FormCheckbox
                            name="immigrationViolations"
                            label="출입국 관련 위반 사항이 있습니다"
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
                  loading={loading}
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

export default ExtensionApplicationForm;