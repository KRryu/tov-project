import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../../../components/common/LoadingSpinner';

// 연장 신청 전용 폼 컴포넌트
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentFormStep, setCurrentFormStep] = useState(1);
  const [showActivityDetails, setShowActivityDetails] = useState(false);

  // 연장 신청용 필드 정의
  const getFieldsForStep = (step) => {
    switch (step) {
      case 1: // 현재 비자 정보
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
          currentCity: ''
        };
        
      case 2: // 연장 사유 및 활동 실적
        return {
          // 연장 정보
          extensionPeriod: '',
          extensionReason: '',
          
          // 활동 실적
          activitiesPerformed: '',
          achievements: '',
          contributionsToKorea: '',
          
          // 향후 계획
          futurePlans: '',
          expectedAchievements: '',
          
          // 재정 상태
          currentIncome: '',
          savingsAmount: '',
          financialSponsor: '',
          
          // 추가 정보
          taxPaymentStatus: true,
          healthInsuranceStatus: true,
          criminalRecordSinceEntry: false,
          immigrationViolations: false
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
        employmentStartDate: Yup.date().required('근무 시작일은 필수입니다'),
        currentCity: Yup.string().required('현재 거주 도시는 필수입니다')
      }),
      
      2: Yup.object({
        extensionPeriod: Yup.number()
          .required('연장 기간은 필수입니다')
          .positive('유효한 기간을 입력하세요')
          .max(24, '최대 24개월까지 신청 가능합니다'),
        extensionReason: Yup.string()
          .required('연장 사유는 필수입니다')
          .min(50, '연장 사유를 50자 이상 상세히 작성해주세요'),
        activitiesPerformed: Yup.string()
          .required('수행한 활동은 필수입니다')
          .min(100, '활동 내용을 100자 이상 상세히 작성해주세요'),
        achievements: Yup.string().required('주요 성과는 필수입니다'),
        futurePlans: Yup.string()
          .required('향후 계획은 필수입니다')
          .min(50, '향후 계획을 50자 이상 작성해주세요'),
        currentIncome: Yup.number()
          .required('현재 소득은 필수입니다')
          .positive('유효한 금액을 입력하세요'),
        savingsAmount: Yup.number()
          .required('저축액은 필수입니다')
          .min(0, '유효한 금액을 입력하세요')
      })
    };
    
    return schemas[step] || Yup.object({});
  };

  // 실시간 필드 검증
  const handleFieldBlur = async (fieldName, value, setFieldError) => {
    if (!onFieldValidate) return;
    
    try {
      const validation = await onFieldValidate(fieldName, value, {
        applicationType: 'EXTENSION',
        visaType
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

  // 폼 제출 처리
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const mergedData = {
        ...initialData,
        ...values,
        applicationType: 'EXTENSION',
        visaType,
        currentStep: currentFormStep
      };
      
      if (currentFormStep < 2) {
        setCurrentFormStep(currentFormStep + 1);
        onNext(mergedData);
      } else {
        // 연장 신청 특별 검증
        const remainingDays = Math.floor(
          (new Date(values.visaExpiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        
        if (remainingDays < 30) {
          toast.warning('비자 만료일이 30일 이내입니다. 신속한 처리가 필요합니다.');
        }
        
        onNext(mergedData);
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
          {visaType} 비자 연장 신청
        </h2>
        <p className="mt-2 text-gray-600">
          단계 {currentFormStep}/2: {currentFormStep === 1 ? '현재 비자 정보' : '연장 사유 및 활동 실적'}
        </p>
      </div>

      {/* 연장 신청 안내 */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">연장 신청 시 유의사항</p>
            <ul className="mt-1 list-disc list-inside">
              <li>비자 만료 최소 2개월 전 신청을 권장합니다</li>
              <li>활동 실적과 향후 계획을 구체적으로 작성해주세요</li>
              <li>세금 납부 및 건강보험 가입 상태를 확인해주세요</li>
            </ul>
          </div>
        </div>
      </div>

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
                  {/* 기본 정보 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
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

                  {/* 현재 비자 정보 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">현재 비자 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          비자 타입
                        </label>
                        <Field
                          name="currentVisaType"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                          disabled
                        />
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
                          onBlur={(e) => handleFieldBlur('visaExpiryDate', e.target.value, setFieldError)}
                        />
                        {errors.visaExpiryDate && touched.visaExpiryDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.visaExpiryDate}</p>
                        )}
                        {values.visaExpiryDate && (
                          <p className="mt-1 text-sm text-gray-500">
                            잔여 기간: {Math.floor((new Date(values.visaExpiryDate) - new Date()) / (1000 * 60 * 60 * 24))}일
                          </p>
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
                    </div>
                  </div>

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
                          placeholder="Seoul National University"
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
                          placeholder="Assistant Professor"
                        />
                        {errors.currentPosition && touched.currentPosition && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentPosition}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          근무 시작일 *
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

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 주소
                        </label>
                        <Field
                          name="currentAddress"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="서울시 강남구..."
                        />
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
                  {/* 연장 정보 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">연장 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          연장 신청 기간 (개월) *
                        </label>
                        <Field
                          name="extensionPeriod"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="12"
                          min="1"
                          max="24"
                        />
                        {errors.extensionPeriod && touched.extensionPeriod && (
                          <p className="mt-1 text-sm text-red-600">{errors.extensionPeriod}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">최대 24개월까지 신청 가능</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          연장 사유 *
                        </label>
                        <Field
                          as="textarea"
                          name="extensionReason"
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="비자 연장이 필요한 구체적인 사유를 작성해주세요..."
                        />
                        {errors.extensionReason && touched.extensionReason && (
                          <p className="mt-1 text-sm text-red-600">{errors.extensionReason}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 활동 실적 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">활동 실적</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재까지 수행한 주요 활동 *
                        </label>
                        <Field
                          as="textarea"
                          name="activitiesPerformed"
                          rows="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="한국에서 수행한 교육, 연구, 프로젝트 등의 활동을 상세히 기술해주세요..."
                        />
                        {errors.activitiesPerformed && touched.activitiesPerformed && (
                          <p className="mt-1 text-sm text-red-600">{errors.activitiesPerformed}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          주요 성과 및 업적 *
                        </label>
                        <Field
                          as="textarea"
                          name="achievements"
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="논문 발표, 특허, 수상 경력, 프로젝트 성과 등..."
                        />
                        {errors.achievements && touched.achievements && (
                          <p className="mt-1 text-sm text-red-600">{errors.achievements}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          한국 사회/경제 기여도
                        </label>
                        <Field
                          as="textarea"
                          name="contributionsToKorea"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="한국 사회나 경제에 기여한 내용이 있다면 작성해주세요..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* 향후 계획 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">향후 계획</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          연장 기간 동안의 활동 계획 *
                        </label>
                        <Field
                          as="textarea"
                          name="futurePlans"
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="향후 수행할 프로젝트, 연구, 교육 활동 등을 구체적으로 작성해주세요..."
                        />
                        {errors.futurePlans && touched.futurePlans && (
                          <p className="mt-1 text-sm text-red-600">{errors.futurePlans}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          예상 성과
                        </label>
                        <Field
                          as="textarea"
                          name="expectedAchievements"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="연장 기간 동안 달성할 것으로 예상되는 성과..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* 재정 상태 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">재정 상태</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 월 소득 (원) *
                        </label>
                        <Field
                          name="currentIncome"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="3000000"
                        />
                        {errors.currentIncome && touched.currentIncome && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentIncome}</p>
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

                  {/* 추가 확인 사항 섹션 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">추가 확인 사항</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="taxPaymentStatus"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          세금을 성실히 납부하고 있습니다
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="healthInsuranceStatus"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          건강보험에 가입되어 있습니다
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="criminalRecordSinceEntry"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          한국 체류 중 범죄 기록이 있습니다
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="immigrationViolations"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          출입국 관련 법규 위반 사실이 있습니다
                        </label>
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
                    다음: 활동 실적 및 연장 사유
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
                disabled={isSubmitting || loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
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

export default ExtensionApplicationForm;