import React, { useState, useEffect, useCallback } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../../../components/common/LoadingSpinner';

// 신규 신청 전용 폼 컴포넌트
const NewApplicationForm = ({
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
  // currentStep이 1-2일 때는 기본/상세 정보, 3일 때는 사전평가로 넘어감
  const currentFormStep = currentStep <= 2 ? currentStep : 2;

  // 신규 신청용 필드 정의
  const getFieldsForStep = (step) => {
    switch (step) {
      case 1: // 기본 정보
        return {
          // 개인 정보
          fullName: '',
          birthDate: '',
          nationality: '',
          gender: '',
          passportNumber: '',
          passportExpiry: '',
          
          // 연락처 정보
          email: '',
          phone: '',
          currentAddress: '',
          currentCity: '',
          currentCountry: '',
          
          // 입국 정보
          plannedEntryDate: '',
          purposeOfVisit: '',
          intendedStayDuration: ''
        };
        
      case 2: // 상세 정보
        return {
          // 학력 정보
          highestEducation: '',
          educationField: '',
          graduationDate: '',
          universityName: '',
          
          // 경력 정보
          currentOccupation: '',
          yearsOfExperience: '',
          currentEmployer: '',
          jobTitle: '', // 교수/연구원 직급
          
          // 연구 실적
          publicationsCount: 0,
          majorPublications: '',
          
          // 언어 능력
          koreanProficiency: '',
          englishProficiency: '',
          otherLanguages: '',
          
          // 추가 정보
          criminalRecord: false,
          previousVisaRejection: false,
          healthIssues: false,
          financialCapability: '',
          
          // 고도화된 평가를 위한 추가 필드
          institutionType: 'university',
          institutionPrestige: 'regular',
          weeklyTeachingHours: '',
          onlineTeachingRatio: 0,
          contractDuration: 12,
          previousKoreaExperience: false,
          familyAccompanying: false,
          plannedWorkplaces: 1
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
        birthDate: Yup.date()
          .required('생년월일은 필수입니다')
          .max(new Date(), '유효한 생년월일을 입력하세요'),
        nationality: Yup.string().required('국적은 필수입니다'),
        gender: Yup.string().required('성별을 선택하세요'),
        passportNumber: Yup.string()
          .required('여권번호는 필수입니다')
          .matches(/^[A-Z0-9]+$/, '유효한 여권번호를 입력하세요'),
        passportExpiry: Yup.date()
          .required('여권 만료일은 필수입니다')
          .min(new Date(), '만료된 여권은 사용할 수 없습니다'),
        email: Yup.string()
          .email('유효한 이메일을 입력하세요')
          .required('이메일은 필수입니다'),
        phone: Yup.string()
          .required('전화번호는 필수입니다')
          .matches(/^[0-9+\-\s]+$/, '유효한 전화번호를 입력하세요'),
        currentCity: Yup.string().required('현재 거주 도시는 필수입니다'),
        currentCountry: Yup.string().required('현재 거주 국가는 필수입니다'),
        plannedEntryDate: Yup.date()
          .required('입국 예정일은 필수입니다')
          .min(new Date(), '과거 날짜는 선택할 수 없습니다'),
        purposeOfVisit: Yup.string().required('방문 목적은 필수입니다'),
        intendedStayDuration: Yup.number()
          .required('체류 기간은 필수입니다')
          .positive('유효한 기간을 입력하세요')
      }),
      
      2: Yup.object({
        highestEducation: Yup.string().required('최종 학력은 필수입니다'),
        educationField: Yup.string().required('전공 분야는 필수입니다'),
        graduationDate: Yup.date().required('졸업일은 필수입니다'),
        universityName: Yup.string().required('학교명은 필수입니다'),
        currentOccupation: Yup.string().required('현재 직업은 필수입니다'),
        yearsOfExperience: Yup.number()
          .required('경력 연수는 필수입니다')
          .min(0, '유효한 경력을 입력하세요'),
        koreanProficiency: Yup.string().required('한국어 능력을 선택하세요'),
        englishProficiency: Yup.string().required('영어 능력을 선택하세요'),
        financialCapability: Yup.string().required('재정 능력을 선택하세요')
      })
    };
    
    return schemas[step] || Yup.object({});
  };

  // 실시간 필드 검증
  const handleFieldBlur = async (fieldName, value, setFieldError) => {
    if (!onFieldValidate) return;
    
    try {
      const validation = await onFieldValidate(fieldName, value, {
        applicationType: 'NEW',
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

  // 폼 제출 처리
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 현재 단계 데이터와 이전 데이터 병합
      const mergedData = {
        ...initialData,
        ...values,
        applicationType: 'NEW',
        visaType,
        currentStep: currentFormStep
      };
      
      // 항상 부모 컴포넌트로 데이터 전달
      onNext(mergedData);
      
      // 페이지 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (currentFormStep === 2) {
        toast.success('기본 정보 입력이 완료되었습니다. 사전심사를 진행합니다.');
      } else if (currentFormStep === 1) {
        toast.success('기본 정보가 저장되었습니다. 상세 정보를 입력해주세요.');
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
    if (onPrev) {
      onPrev();
    }
  };

  // 국적 옵션
  const nationalityOptions = [
    { value: 'US', label: '미국' },
    { value: 'CN', label: '중국' },
    { value: 'JP', label: '일본' },
    { value: 'VN', label: '베트남' },
    { value: 'PH', label: '필리핀' },
    { value: 'TH', label: '태국' },
    { value: 'ID', label: '인도네시아' },
    { value: 'IN', label: '인도' },
    { value: 'GB', label: '영국' },
    { value: 'CA', label: '캐나다' },
    { value: 'AU', label: '호주' },
    { value: 'OTHER', label: '기타' }
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

  const initialValues = {
    ...getFieldsForStep(currentFormStep),
    ...initialData
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          {visaType} 비자 신규 신청
        </h2>
        <p className="mt-2 text-gray-600">
          단계 {currentFormStep}/2: {currentFormStep === 1 ? '기본 정보' : '상세 정보'}
        </p>
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
                  {/* 개인 정보 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">개인 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          이름 (영문) *
                        </label>
                        <Field
                          name="fullName"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="HONG GILDONG"
                          onBlur={(e) => handleFieldBlur('fullName', e.target.value, setFieldError)}
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
                          as="select"
                          name="nationality"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">선택하세요</option>
                          {nationalityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        {errors.nationality && touched.nationality && (
                          <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          성별 *
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <Field
                              type="radio"
                              name="gender"
                              value="M"
                              className="mr-2"
                            />
                            남성
                          </label>
                          <label className="flex items-center">
                            <Field
                              type="radio"
                              name="gender"
                              value="F"
                              className="mr-2"
                            />
                            여성
                          </label>
                        </div>
                        {errors.gender && touched.gender && (
                          <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
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
                          여권 만료일 *
                        </label>
                        <Field
                          name="passportExpiry"
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.passportExpiry && touched.passportExpiry && (
                          <p className="mt-1 text-sm text-red-600">{errors.passportExpiry}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 연락처 정보 섹션 */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">연락처 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          이메일 *
                        </label>
                        <Field
                          name="email"
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="example@email.com"
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
                          placeholder="+1-234-567-8900"
                        />
                        {errors.phone && touched.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
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
                          placeholder="123 Main St, Apt 4B"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 거주 도시 *
                        </label>
                        <Field
                          name="currentCity"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="New York"
                        />
                        {errors.currentCity && touched.currentCity && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentCity}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 거주 국가 *
                        </label>
                        <Field
                          name="currentCountry"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="USA"
                        />
                        {errors.currentCountry && touched.currentCountry && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentCountry}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 입국 정보 섹션 */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">입국 정보</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          입국 예정일 *
                        </label>
                        <Field
                          name="plannedEntryDate"
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.plannedEntryDate && touched.plannedEntryDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.plannedEntryDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          체류 예정 기간 (개월) *
                        </label>
                        <Field
                          name="intendedStayDuration"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="12"
                        />
                        {errors.intendedStayDuration && touched.intendedStayDuration && (
                          <p className="mt-1 text-sm text-red-600">{errors.intendedStayDuration}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          방문 목적 *
                        </label>
                        <Field
                          as="textarea"
                          name="purposeOfVisit"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="한국에서의 활동 목적을 구체적으로 설명해주세요"
                        />
                        {errors.purposeOfVisit && touched.purposeOfVisit && (
                          <p className="mt-1 text-sm text-red-600">{errors.purposeOfVisit}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentFormStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* 학력 정보 카드 */}
                  <motion.div 
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        학력 정보
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            </svg>
                            최종 학력 *
                          </span>
                        </label>
                        <Field
                          as="select"
                          name="highestEducation"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">선택하세요</option>
                          {educationOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        {errors.highestEducation && touched.highestEducation && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.highestEducation}
                          </motion.p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">E-1 비자는 최소 석사 학위가 권장됩니다</p>
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          졸업일 *
                        </label>
                        <Field
                          name="graduationDate"
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        {errors.graduationDate && touched.graduationDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.graduationDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          학교명 *
                        </label>
                        <Field
                          name="universityName"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Harvard University"
                        />
                        {errors.universityName && touched.universityName && (
                          <p className="mt-1 text-sm text-red-600">{errors.universityName}</p>
                        )}
                      </div>
                    </div>
                    </div>
                  </motion.div>

                  {/* 경력 정보 카드 */}
                  <motion.div 
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        경력 정보
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 직업 *
                        </label>
                        <Field
                          name="currentOccupation"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Software Engineer"
                        />
                        {errors.currentOccupation && touched.currentOccupation && (
                          <p className="mt-1 text-sm text-red-600">{errors.currentOccupation}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          경력 연수 *
                        </label>
                        <Field
                          name="yearsOfExperience"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="5"
                        />
                        {errors.yearsOfExperience && touched.yearsOfExperience && (
                          <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          현재 회사명
                        </label>
                        <Field
                          name="currentEmployer"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Google Inc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          직책/직급 (E-1 비자)
                        </label>
                        <Field
                          as="select"
                          name="jobTitle"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">직급을 선택하세요</option>
                          <optgroup label="교수">
                            <option value="정교수">정교수 (Full Professor)</option>
                            <option value="부교수">부교수 (Associate Professor)</option>
                            <option value="조교수">조교수 (Assistant Professor)</option>
                            <option value="강사">강사 (Lecturer)</option>
                          </optgroup>
                          <optgroup label="연구원">
                            <option value="수석연구원">수석연구원 (Senior Researcher)</option>
                            <option value="선임연구원">선임연구원 (Lead Researcher)</option>
                            <option value="연구원">연구원 (Researcher)</option>
                          </optgroup>
                        </Field>
                      </div>
                    </div>
                    </div>
                  </motion.div>

                  {/* 연구 실적 카드 */}
                  <motion.div 
                    className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        연구 실적
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              논문 수
                            </span>
                          </label>
                          <Field
                            name="publicationsCount"
                            type="number"
                            min="0"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            placeholder="0"
                          />
                          <p className="mt-1 text-xs text-gray-500">SCI/SSCI/SCIE 등 국제학술지 게재 논문 수</p>
                        </div>

                        <div className="relative md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              주요 연구 실적
                            </span>
                          </label>
                          <Field
                            as="textarea"
                            name="majorPublications"
                            rows="3"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                            placeholder="주요 논문 제목, 학술지명, 발표년도 등을 간략히 기재하세요"
                          />
                          <p className="mt-1 text-xs text-gray-500">대표 논문 2-3편의 제목과 게재 정보를 입력해주세요</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 언어 능력 카드 */}
                  <motion.div 
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        언어 능력
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          기타 언어
                        </label>
                        <Field
                          name="otherLanguages"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Spanish (Advanced), French (Intermediate)"
                        />
                      </div>
                    </div>
                    </div>
                  </motion.div>

                  {/* 교육기관 정보 카드 */}
                  <motion.div 
                    className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        교육기관 정보
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              기관 유형 *
                            </span>
                          </label>
                          <Field
                            as="select"
                            name="institutionType"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="university">4년제 대학교</option>
                            <option value="junior_college">전문대학</option>
                            <option value="graduate_school">대학원</option>
                            <option value="research_institute">연구기관</option>
                            <option value="special_school">특수학교</option>
                            <option value="international_school">외국인학교</option>
                          </Field>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              기관 수준
                            </span>
                          </label>
                          <Field
                            as="select"
                            name="institutionPrestige"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="top_tier">최상위권 (SKY, KAIST 등)</option>
                            <option value="high_tier">상위권 (주요 국립대)</option>
                            <option value="mid_tier">중위권 (일반 4년제)</option>
                            <option value="regular">일반</option>
                          </Field>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              주당 강의 시수
                            </span>
                          </label>
                          <Field
                            name="weeklyTeachingHours"
                            type="number"
                            min="0"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            placeholder="9"
                          />
                          <p className="mt-1 text-xs text-gray-500">최소 6시간 이상 필요</p>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              온라인 강의 비율 (%)
                            </span>
                          </label>
                          <Field
                            name="onlineTeachingRatio"
                            type="number"
                            min="0"
                            max="100"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            placeholder="0"
                          />
                          <p className="mt-1 text-xs text-gray-500">50% 이하 권장</p>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              계약 기간 (개월)
                            </span>
                          </label>
                          <Field
                            name="contractDuration"
                            type="number"
                            min="1"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            placeholder="12"
                          />
                          <p className="mt-1 text-xs text-gray-500">2년 이상 장기 계약 유리</p>
                        </div>

                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              예상 근무처 수
                            </span>
                          </label>
                          <Field
                            name="plannedWorkplaces"
                            type="number"
                            min="1"
                            max="2"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            placeholder="1"
                          />
                          <p className="mt-1 text-xs text-gray-500">최대 2개 기관까지 가능</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 추가 정보 카드 */}
                  <motion.div 
                    className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                      <h3 className="text-xl font-semibold text-white flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        추가 정보
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
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
                          name="previousVisaRejection"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          이전에 비자 거부 경험이 있습니다
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
                          name="previousKoreaExperience"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          한국 체류/방문 경험이 있습니다
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          name="familyAccompanying"
                          className="mr-2"
                        />
                        <label className="text-sm text-gray-700">
                          가족 동반 예정입니다
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          재정 능력 *
                        </label>
                        <Field
                          as="select"
                          name="financialCapability"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">선택하세요</option>
                          <option value="sufficient">충분함 (생활비 6개월 이상)</option>
                          <option value="moderate">보통 (생활비 3-6개월)</option>
                          <option value="limited">제한적 (생활비 3개월 미만)</option>
                          <option value="sponsored">후원 받음</option>
                        </Field>
                        {errors.financialCapability && touched.financialCapability && (
                          <p className="mt-1 text-sm text-red-600">{errors.financialCapability}</p>
                        )}
                      </div>
                    </div>
                    </div>
                  </motion.div>
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
                    다음: 상세 정보 입력
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

export default NewApplicationForm;