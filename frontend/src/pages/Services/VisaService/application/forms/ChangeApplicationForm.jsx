import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../../../components/common/LoadingSpinner';
import visaServiceV2 from '../../../../../api/services/visaServiceV2';

// 변경 신청 전용 폼 컴포넌트
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentFormStep, setCurrentFormStep] = useState(1);
  const [changeabilityResult, setChangeabilityResult] = useState(null);
  const [checkingChangeability, setCheckingChangeability] = useState(false);
  const [supportedVisaTypes, setSupportedVisaTypes] = useState([]);

  // 변경 신청용 필드 정의
  const getFieldsForStep = (step) => {
    switch (step) {
      case 1: // 현재 비자 및 변경 정보
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
        
      case 2: // 변경 자격 요건 및 준비 사항
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

  // 지원되는 비자 타입 로드
  useEffect(() => {
    loadSupportedVisaTypes();
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
        currentCity: Yup.string().required('현재 거주 도시는 필수입니다')
      }),
      
      2: Yup.object({
        newEmployer: Yup.string().required('새로운 소속은 필수입니다'),
        newPosition: Yup.string().required('새로운 직책은 필수입니다'),
        newJobDescription: Yup.string()
          .required('직무 설명은 필수입니다')
          .min(50, '직무 설명을 50자 이상 작성해주세요'),
        employmentStartDate: Yup.date()
          .required('근무 시작 예정일은 필수입니다')
          .min(new Date(), '과거 날짜는 선택할 수 없습니다'),
        educationLevel: Yup.string().required('학력은 필수입니다'),
        educationField: Yup.string().required('전공 분야는 필수입니다'),
        relevantExperience: Yup.string().required('관련 경력은 필수입니다'),
        koreanProficiency: Yup.string().required('한국어 능력을 선택하세요'),
        englishProficiency: Yup.string().required('영어 능력을 선택하세요'),
        monthlyIncome: Yup.number()
          .required('예상 월 소득은 필수입니다')
          .positive('유효한 금액을 입력하세요'),
        savingsAmount: Yup.number()
          .required('저축액은 필수입니다')
          .min(0, '유효한 금액을 입력하세요')
      })
    };
    
    return schemas[step] || Yup.object({});
  };

  // 비자 변경 가능성 확인
  const checkChangeability = async (currentVisa, targetVisa) => {
    setCheckingChangeability(true);
    try {
      const result = await visaServiceV2.checkChangeability(currentVisa, targetVisa);
      setChangeabilityResult(result.data);
      
      if (!result.data.changeable) {
        toast.warning(currentVisa + '에서 ' + targetVisa + '로 직접 변경이 불가능합니다.');
        if (result.data.alternatives?.length > 0) {
          toast.info('대안을 확인해주세요.');
        }
      } else {
        toast.success('비자 변경이 가능합니다.');
      }
    } catch (error) {
      console.error('Changeability check error:', error);
      toast.error('변경 가능성 확인 중 오류가 발생했습니다.');
    } finally {
      setCheckingChangeability(false);
    }
  };

  // 실시간 필드 검증
  const handleFieldBlur = async (fieldName, value, setFieldError) => {
    if (!onFieldValidate) return;
    
    try {
      const validation = await onFieldValidate(fieldName, value, {
        applicationType: 'CHANGE',
        visaType,
        currentVisaType: fieldName === 'currentVisaType' ? value : undefined
      });
      
      if (!validation.valid) {
        setFieldError(fieldName, validation.message);
        setFieldErrors(prev => ({ ...prev, [fieldName]: validation.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Field validation error:', error);
    }
  };

  // 체류 상태 옵션
  const stayStatusOptions = [
    { value: 'legal', label: '합법 체류' },
    { value: 'grace_period', label: '유예 기간' },
    { value: 'pending_extension', label: '연장 신청 중' }
  ];

  // 긴급도 옵션
  const urgencyOptions = [
    { value: 'normal', label: '보통 (2-3개월 여유)' },
    { value: 'urgent', label: '긴급 (1개월 이내)' },
    { value: 'very_urgent', label: '매우 긴급 (2주 이내)' }
  ];

  // 학력 옵션
  const educationOptions = [
    { value: 'high_school', label: '고등학교' },
    { value: 'associate', label: '전문학사' },
    { value: 'bachelor', label: '학사' },
    { value: 'master', label: '석사' },
    { value: 'phd', label: '박사' }
  ];

  // 언어 능력 옵션
  const languageProficiencyOptions = [
    { value: 'none', label: '불가' },
    { value: 'beginner', label: '초급' },
    { value: 'intermediate', label: '중급' },
    { value: 'advanced', label: '고급' },
    { value: 'native', label: '원어민' }
  ];

  // 폼 제출 처리
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const mergedData = {
        ...initialData,
        ...values,
        applicationType: 'CHANGE',
        visaType,
        currentStep: currentFormStep,
        changeabilityResult
      };
      
      if (currentFormStep < 2) {
        // 첫 단계 완료 시 변경 가능성 확인
        if (values.currentVisaType && values.targetVisaType) {
          await checkChangeability(values.currentVisaType, values.targetVisaType);
        }
        setCurrentFormStep(currentFormStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        onNext(mergedData);
      } else {
        // 마지막 단계 - 사전심사로 진행
        if (onPreScreen) {
          await onPreScreen(mergedData);
        } else {
          onNext(mergedData);
        }
        toast.success('정보 입력이 완료되었습니다. 사전심사를 진행합니다.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이전 단계로
  const handlePrevious = () => {
    if (currentFormStep > 1) {
      setCurrentFormStep(currentFormStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onPrev) {
      onPrev();
    }
  };

  const initialValues = {
    ...getFieldsForStep(currentFormStep),
    ...initialData
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {visaType} 비자로 변경 신청
        </h2>
        <p className="mt-2 text-gray-600">
          단계 {currentFormStep}/2: {currentFormStep === 1 ? '현재 비자 및 변경 정보' : '변경 자격 요건'}
        </p>
      </div>

      {/* 변경 신청 안내 */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-amber-800">
            <p className="font-medium">비자 변경 신청 시 주의사항</p>
            <ul className="mt-1 list-disc list-inside">
              <li>모든 비자 간 직접 변경이 가능한 것은 아닙니다</li>
              <li>변경 불가 시 출국 후 재입국이 필요할 수 있습니다</li>
              <li>현재 비자 만료 전에 신청해야 합니다</li>
              <li>새로운 비자의 모든 요건을 충족해야 합니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 변경 가능성 결과 표시 */}
      {changeabilityResult && (
        <motion.div
          className={`mb-6 rounded-lg p-4 ${
            changeabilityResult.changeable 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className={`font-medium ${
            changeabilityResult.changeable ? 'text-green-900' : 'text-red-900'
          }`}>
            변경 가능성 검토 결과
          </h4>
          <p className={`mt-1 text-sm ${
            changeabilityResult.changeable ? 'text-green-700' : 'text-red-700'
          }`}>
            {changeabilityResult.message}
          </p>
          
          {changeabilityResult.requirements && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">필요 요건:</p>
              <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                {changeabilityResult.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          {changeabilityResult.alternatives && changeabilityResult.alternatives.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">대안:</p>
              <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                {changeabilityResult.alternatives.map((alt, idx) => (
                  <li key={idx}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

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
                  {/* 기본 정보 카드 */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg overflow-hidden"> 
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        기본 정보
                      </h3>
                    </div>
                    <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          이름 (영문) *
                        </label>
                        <Field
                          name="fullName"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="여권상 영문명"
                        />
                        {errors.fullName && touched.fullName && (
                          <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          생년월일 *
                        </label>
                        <Field
                          name="birthDate"
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.birthDate && touched.birthDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          국적 *
                        </label>
                        <Field
                          name="nationality"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="USA"
                        />
                        {errors.nationality && touched.nationality && (
                          <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          여권번호 *
                        </label>
                        <Field
                          name="passportNumber"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="M12345678"
                        />
                        {errors.passportNumber && touched.passportNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.passportNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          이메일 *
                        </label>
                        <Field
                          name="email"
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.email && touched.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          전화번호 *
                        </label>
                        <Field
                          name="phone"
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="010-1234-5678"
                        />
                        {errors.phone && touched.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                    </div>
                  </div>

                  {/* 현재 비자 정보 카드 */}
                  <motion.div 
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        현재 비자 정보
                      </h3>
                    </div>
                    <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 비자 타입 *
                        </label>
                        <Field
                          as="select"
                          name="currentVisaType"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          onBlur={(e) => {
                            handleFieldBlur('currentVisaType', e.target.value, setFieldError);
                            // 비자 타입 선택 시 변경 가능성 자동 확인
                            if (e.target.value && values.targetVisaType) {
                              checkChangeability(e.target.value, values.targetVisaType);
                            }
                          }}
                        >
                          <option value="">선택하세요</option>
                          {supportedVisaTypes.map((visa) => (
                            <option key={visa.code} value={visa.code}>
                              {visa.code} - {visa.name}
                            </option>
                          ))}
                        </Field>
                        {errors.currentVisaType && touched.currentVisaType && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentVisaType}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          변경 희망 비자
                        </label>
                        <Field
                          name="targetVisaType"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                          disabled
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 비자 번호 *
                        </label>
                        <Field
                          name="currentVisaNumber"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="12345678"
                        />
                        {errors.currentVisaNumber && touched.currentVisaNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentVisaNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          외국인등록번호 *
                        </label>
                        <Field
                          name="alienRegistrationNumber"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="123456-1234567"
                        />
                        {errors.alienRegistrationNumber && touched.alienRegistrationNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.alienRegistrationNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          비자 발급일 *
                        </label>
                        <Field
                          name="visaIssueDate"
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.visaIssueDate && touched.visaIssueDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.visaIssueDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          비자 만료일 *
                        </label>
                        <Field
                          name="visaExpiryDate"
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.visaExpiryDate && touched.visaExpiryDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.visaExpiryDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 체류 상태 *
                        </label>
                        <Field
                          as="select"
                          name="currentStayStatus"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">선택하세요</option>
                          {stayStatusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        {errors.currentStayStatus && touched.currentStayStatus && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentStayStatus}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          긴급도 *
                        </label>
                        <Field
                          as="select"
                          name="urgencyLevel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">선택하세요</option>
                          {urgencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        {errors.urgencyLevel && touched.urgencyLevel && (
                          <p className="mt-1 text-sm text-red-600">{errors.urgencyLevel}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        비자 변경 사유 *
                      </label>
                      <Field
                        as="textarea"
                        name="changeReason"
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="비자를 변경하려는 구체적인 사유를 작성해주세요. 예: 직장 변경, 활동 범위 변경, 자격 요건 충족 등"
                      />
                      {errors.changeReason && touched.changeReason && (
                        <p className="mt-1 text-sm text-red-600">{errors.changeReason}</p>
                      )}
                    </div>
                  </div>
                  </motion.div>

                  {/* 현재 활동 정보 섹션 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">현재 활동 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 소속 기관/회사 *
                        </label>
                        <Field
                          name="currentEmployer"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.currentEmployer && touched.currentEmployer && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentEmployer}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 직책/직위 *
                        </label>
                        <Field
                          name="currentPosition"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.currentPosition && touched.currentPosition && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentPosition}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 거주 도시 *
                        </label>
                        <Field
                          name="currentCity"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Seoul"
                        />
                        {errors.currentCity && touched.currentCity && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentCity}</p>
                        )}
                      </div>
                    </div>
                  </div>
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
                  {/* 새 비자 관련 정보 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">새 비자 관련 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          새로운 소속 기관/회사 *
                        </label>
                        <Field
                          name="newEmployer"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="새로 근무할 기관명"
                        />
                        {errors.newEmployer && touched.newEmployer && (
                          <p className="mt-1 text-sm text-red-600">{errors.newEmployer}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          새로운 직책/직위 *
                        </label>
                        <Field
                          name="newPosition"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="새로운 직책명"
                        />
                        {errors.newPosition && touched.newPosition && (
                          <p className="mt-1 text-sm text-red-600">{errors.newPosition}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          근무 시작 예정일 *
                        </label>
                        <Field
                          name="employmentStartDate"
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.employmentStartDate && touched.employmentStartDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.employmentStartDate}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          직무 설명 *
                        </label>
                        <Field
                          as="textarea"
                          name="newJobDescription"
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="새로운 직책에서 수행할 구체적인 업무 내용을 작성해주세요..."
                        />
                        {errors.newJobDescription && touched.newJobDescription && (
                          <p className="mt-1 text-sm text-red-600">{errors.newJobDescription}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 자격 요건 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">자격 요건</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          최종 학력 *
                        </label>
                        <Field
                          as="select"
                          name="educationLevel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">선택하세요</option>
                          {educationOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        {errors.educationLevel && touched.educationLevel && (
                          <p className="mt-1 text-sm text-red-600">{errors.educationLevel}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          전공 분야 *
                        </label>
                        <Field
                          name="educationField"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Computer Science"
                        />
                        {errors.educationField && touched.educationField && (
                          <p className="mt-1 text-sm text-red-600">{errors.educationField}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          관련 경력 *
                        </label>
                        <Field
                          as="textarea"
                          name="relevantExperience"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="새 비자와 관련된 경력 사항을 구체적으로 작성해주세요..."
                        />
                        {errors.relevantExperience && touched.relevantExperience && (
                          <p className="mt-1 text-sm text-red-600">{errors.relevantExperience}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          특별 자격사항
                        </label>
                        <Field
                          name="specialQualifications"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="자격증, 특허, 수상 경력 등"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 언어 능력 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">언어 능력</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          한국어 능력 *
                        </label>
                        <Field
                          as="select"
                          name="koreanProficiency"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">선택하세요</option>
                          {languageProficiencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        {errors.koreanProficiency && touched.koreanProficiency && (
                          <p className="mt-1 text-sm text-red-600">{errors.koreanProficiency}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          영어 능력 *
                        </label>
                        <Field
                          as="select"
                          name="englishProficiency"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">선택하세요</option>
                          {languageProficiencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        {errors.englishProficiency && touched.englishProficiency && (
                          <p className="mt-1 text-sm text-red-600">{errors.englishProficiency}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 재정 상태 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">재정 상태</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          예상 월 소득 (원) *
                        </label>
                        <Field
                          name="monthlyIncome"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="3000000"
                        />
                        {errors.monthlyIncome && touched.monthlyIncome && (
                          <p className="mt-1 text-sm text-red-600">{errors.monthlyIncome}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          예금 잔액 (원) *
                        </label>
                        <Field
                          name="savingsAmount"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="10000000"
                        />
                        {errors.savingsAmount && touched.savingsAmount && (
                          <p className="mt-1 text-sm text-red-600">{errors.savingsAmount}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          재정 후원자 (있는 경우)
                        </label>
                        <Field
                          name="financialSponsor"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="기관명 또는 개인명"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 준비 상태 확인 섹션 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">준비 상태 확인</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="hasJobOffer"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          새로운 고용주로부터 정식 채용 제안을 받았습니다
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="hasRequiredDocuments"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          필요한 서류를 준비했거나 준비 중입니다
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="meetsEducationRequirements"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          새 비자의 학력 요건을 충족합니다
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="meetsExperienceRequirements"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          새 비자의 경력 요건을 충족합니다
                        </label>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name="criminalRecord"
                            className="mr-2"
                          />
                          <label className="text-sm text-gray-700">
                            범죄 기록이 있습니다
                          </label>
                        </div>

                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name="healthIssues"
                            className="mr-2"
                          />
                          <label className="text-sm text-gray-700">
                            건강상의 문제가 있습니다
                          </label>
                        </div>

                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name="previousVisaViolations"
                            className="mr-2"
                          />
                          <label className="text-sm text-gray-700">
                            이전 비자 관련 위반 사항이 있습니다
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 버튼 영역 */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                이전
              </button>

              <div className="flex items-center gap-2">
                {currentFormStep === 1 && (
                  <span className="text-sm text-gray-500">
                    다음: 변경 자격 요건
                  </span>
                )}
                {currentFormStep === 2 && (
                  <span className="text-sm text-gray-500">
                    다음: 사전심사
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading || checkingChangeability}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading || checkingChangeability ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="small" className="mr-2" />
                    처리중...
                  </span>
                ) : (
                  currentFormStep === 2 ? '사전심사 진행' : '다음'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ChangeApplicationForm;