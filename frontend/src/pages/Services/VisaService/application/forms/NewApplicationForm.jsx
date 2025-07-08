import React, { useState, useEffect } from 'react';
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
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PassportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AcademicIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

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
  
  // currentStep을 사용하여 현재 폼 단계 결정
  const currentFormStep = currentStep <= 2 ? currentStep : 2;

  // Step별 필드 정의
  const getFieldsForStep = (step) => {
    switch (step) {
      case 1:
        return {
          // 개인 정보
          fullName: '',
          birthDate: '',
          nationality: '',
          gender: '',
          
          // 여권 정보
          passportNumber: '',
          passportExpiry: '',
          
          // 연락처
          email: '',
          phone: '',
          
          // 현재 거주지
          currentAddress: '',
          currentCity: '',
          currentCountry: '',
          
          // 입국 계획
          plannedEntryDate: '',
          purposeOfVisit: '',
          intendedStayDuration: ''
        };
        
      case 2:
        return {
          // 학력
          highestEducation: '',
          educationField: '',
          graduationDate: '',
          universityName: '',
          
          // 경력
          currentOccupation: '',
          yearsOfExperience: '',
          currentEmployer: '',
          jobTitle: '',
          
          // 연구 실적
          publicationsCount: '',
          majorPublications: '',
          
          // 언어 능력
          koreanProficiency: '',
          englishProficiency: '',
          
          // E-1 특화 필드
          institutionType: '',
          institutionPrestige: '',
          weeklyTeachingHours: '',
          onlineTeachingRatio: '',
          contractDuration: '',
          previousKoreaExperience: false,
          familyAccompanying: false,
          plannedWorkplaces: '',
          
          // 추가 정보
          criminalRecord: false,
          previousVisaRejection: false,
          healthIssues: false,
          financialCapability: ''
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
        birthDate: Yup.date().required('생년월일은 필수입니다').max(new Date(), '미래 날짜는 선택할 수 없습니다'),
        nationality: Yup.string().required('국적은 필수입니다'),
        gender: Yup.string().required('성별을 선택하세요'),
        passportNumber: Yup.string().required('여권번호는 필수입니다'),
        passportExpiry: Yup.date()
          .required('여권 만료일은 필수입니다')
          .min(new Date(), '만료된 여권은 사용할 수 없습니다'),
        email: Yup.string().email('유효한 이메일을 입력하세요').required('이메일은 필수입니다'),
        phone: Yup.string().required('전화번호는 필수입니다'),
        currentAddress: Yup.string().required('현재 주소는 필수입니다'),
        currentCity: Yup.string().required('거주 도시는 필수입니다'),
        currentCountry: Yup.string().required('거주 국가는 필수입니다'),
        plannedEntryDate: Yup.date().required('입국 예정일은 필수입니다'),
        purposeOfVisit: Yup.string().required('방문 목적은 필수입니다'),
        intendedStayDuration: Yup.number()
          .required('체류 기간은 필수입니다')
          .min(1, '최소 1개월 이상')
          .max(60, '최대 60개월까지 가능')
      }),
      
      2: Yup.object({
        highestEducation: Yup.string().required('학력은 필수입니다'),
        educationField: Yup.string().required('전공 분야는 필수입니다'),
        graduationDate: Yup.date().required('졸업일은 필수입니다'),
        universityName: Yup.string().required('대학명은 필수입니다'),
        currentOccupation: Yup.string().required('현재 직업은 필수입니다'),
        yearsOfExperience: Yup.number()
          .required('경력은 필수입니다')
          .min(0, '0 이상이어야 합니다'),
        jobTitle: Yup.string().required('직책은 필수입니다'),
        koreanProficiency: Yup.string().required('한국어 능력을 선택하세요'),
        englishProficiency: Yup.string().required('영어 능력을 선택하세요'),
        institutionType: Yup.string().required('기관 유형을 선택하세요'),
        weeklyTeachingHours: Yup.number()
          .required('주당 강의 시간은 필수입니다')
          .min(1, '최소 1시간 이상')
          .max(40, '최대 40시간까지 가능'),
        contractDuration: Yup.number()
          .required('계약 기간은 필수입니다')
          .min(1, '최소 1개월 이상'),
        financialCapability: Yup.string().required('재정 능력을 선택하세요')
      })
    };
    
    return schemas[step] || Yup.object();
  };

  // 필드별 실시간 검증
  const handleFieldValidation = async (fieldName, value, setFieldError) => {
    if (!onFieldValidate) return;
    
    try {
      const validation = await onFieldValidate(fieldName, value, {
        visaType,
        applicationType: 'NEW'
      });
      
      if (!validation.valid) {
        setFieldError(fieldName, validation.message);
      }
    } catch (error) {
      console.error('Field validation error:', error);
    }
  };

  // 옵션 정의
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

  const languageOptions = [
    { value: 'none', label: '불가' },
    { value: 'beginner', label: '초급' },
    { value: 'intermediate', label: '중급' },
    { value: 'advanced', label: '고급' },
    { value: 'native', label: '원어민' }
  ];

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

  const genderOptions = [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' }
  ];

  const financialOptions = [
    { 
      value: 'excellent', 
      label: '매우 충분', 
      description: '1년 이상 여유자금',
      icon: '💎' 
    },
    { 
      value: 'good', 
      label: '충분', 
      description: '6개월 이상 여유자금',
      icon: '💰' 
    },
    { 
      value: 'moderate', 
      label: '보통', 
      description: '3개월 정도 여유자금',
      icon: '💵' 
    },
    { 
      value: 'limited', 
      label: '제한적', 
      description: '최소 생활비 수준',
      icon: '💸' 
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
        applicationType: 'NEW',
        visaType,
        currentStep: currentFormStep
      };
      
      if (currentFormStep < 2) {
        // 다음 단계로 이동은 부모 컴포넌트가 처리
        onNext(mergedData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
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
                  {/* 개인 정보 */}
                  <FormCard 
                    title="개인 정보" 
                    subtitle="정확한 정보를 입력해주세요"
                    icon={<UserIcon />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        name="fullName"
                        label="이름 (영문)"
                        placeholder="여권상 영문명"
                        required
                        icon={<UserIcon />}
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
                        placeholder="예: USA, China"
                        required
                      />
                      
                      <FormRadioGroup
                        name="gender"
                        label="성별"
                        options={genderOptions}
                        required
                      />
                    </div>
                  </FormCard>

                  {/* 여권 정보 */}
                  <FormCard 
                    title="여권 정보" 
                    subtitle="유효한 여권 정보를 입력해주세요"
                    icon={<PassportIcon />}
                    delay={0.1}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        name="passportNumber"
                        label="여권 번호"
                        placeholder="예: M12345678"
                        required
                        icon={<PassportIcon />}
                      />
                      
                      <FormField
                        name="passportExpiry"
                        label="여권 만료일"
                        type="date"
                        required
                        helperText="6개월 이상 유효해야 합니다"
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
                        placeholder="+82-10-1234-5678"
                        required
                      />
                    </div>
                  </FormCard>

                  {/* 거주지 및 입국 정보 */}
                  <FormCard 
                    title="거주지 및 입국 계획" 
                    subtitle="현재 거주 정보와 한국 입국 계획"
                    icon={<LocationIcon />}
                    delay={0.2}
                  >
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="currentCountry"
                          label="현재 거주 국가"
                          placeholder="예: United States"
                          required
                        />
                        
                        <FormField
                          name="currentCity"
                          label="거주 도시"
                          placeholder="예: New York"
                          required
                        />
                      </div>
                      
                      <FormField
                        name="currentAddress"
                        label="상세 주소"
                        placeholder="도로명 또는 상세 주소"
                        required
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="plannedEntryDate"
                          label="입국 예정일"
                          type="date"
                          required
                        />
                        
                        <FormField
                          name="intendedStayDuration"
                          label="예상 체류 기간 (개월)"
                          type="number"
                          placeholder="12"
                          required
                        />
                      </div>
                      
                      <FormTextarea
                        name="purposeOfVisit"
                        label="방문 목적"
                        placeholder="한국 방문 목적을 상세히 설명해주세요"
                        rows={3}
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
                  {/* 학력 정보 */}
                  <FormCard 
                    title="학력 정보" 
                    subtitle="최종 학력을 기준으로 입력해주세요"
                    icon={<AcademicIcon />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <CategorySelector
                          name="highestEducation"
                          label="최종 학력"
                          options={educationOptions}
                          columns={2}
                          required
                        />
                      </div>
                      
                      <FormField
                        name="educationField"
                        label="전공 분야"
                        placeholder="예: Computer Science"
                        required
                      />
                      
                      <FormField
                        name="universityName"
                        label="대학명"
                        placeholder="대학교 이름"
                        required
                      />
                      
                      <FormField
                        name="graduationDate"
                        label="졸업일"
                        type="date"
                        required
                      />
                    </div>
                  </FormCard>

                  {/* 경력 정보 */}
                  <FormCard 
                    title="경력 정보" 
                    subtitle="현재 직업과 경력 사항"
                    icon={<BriefcaseIcon />}
                    delay={0.1}
                  >
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          name="currentOccupation"
                          label="현재 직업"
                          placeholder="예: Professor"
                          required
                        />
                        
                        <div className="md:col-span-2">
                          <RangeSlider
                            name="yearsOfExperience"
                            label="경력 연수"
                            min={0}
                            max={30}
                            step={1}
                            unit="년"
                            required
                          />
                        </div>
                        
                        <FormField
                          name="currentEmployer"
                          label="현재 소속"
                          placeholder="현재 소속 기관"
                        />
                        
                        <FormField
                          name="jobTitle"
                          label="직책"
                          placeholder="예: Assistant Professor"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <IncrementSelector
                          name="publicationsCount"
                          label="논문/출판물 수"
                          min={0}
                          max={50}
                          step={1}
                          unit="편"
                        />
                        
                        <FormTextarea
                          name="majorPublications"
                          label="주요 연구 실적"
                          placeholder="대표 논문이나 연구 실적을 간단히 기술"
                          rows={3}
                        />
                      </div>
                    </div>
                  </FormCard>

                  {/* E-1 비자 특화 정보 */}
                  <FormCard 
                    title="교육 활동 계획" 
                    subtitle="한국에서의 교육 활동 세부사항"
                    icon={<AcademicIcon />}
                    delay={0.2}
                  >
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <CategorySelector
                            name="institutionType"
                            label="근무 예정 기관"
                            options={institutionOptions}
                            columns={3}
                            required
                          />
                        </div>
                        
                        <IncrementSelector
                          name="weeklyTeachingHours"
                          label="주당 강의 시간"
                          min={1}
                          max={40}
                          step={1}
                          unit="시간"
                          required
                        />
                        
                        <RangeSlider
                          name="onlineTeachingRatio"
                          label="온라인 강의 비율"
                          min={0}
                          max={100}
                          step={5}
                          unit="%"
                        />
                        
                        <IncrementSelector
                          name="contractDuration"
                          label="계약 기간"
                          min={1}
                          max={60}
                          step={1}
                          unit="개월"
                          required
                        />
                      </div>
                      
                      <FormTextarea
                        name="plannedWorkplaces"
                        label="근무 예정 기관 정보"
                        placeholder="근무할 기관명과 위치를 입력해주세요"
                        rows={2}
                      />
                      
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

                  {/* 추가 정보 */}
                  <FormCard 
                    title="추가 정보" 
                    subtitle="비자 심사에 필요한 추가 사항"
                    delay={0.3}
                  >
                    <div className="space-y-4">
                      <CategorySelector
                        name="financialCapability"
                        label="재정 능력"
                        options={financialOptions}
                        columns={2}
                        required
                      />
                      
                      <div className="space-y-3">
                        <FormCheckbox
                          name="previousKoreaExperience"
                          label="한국 거주/근무 경험이 있습니다"
                        />
                        
                        <FormCheckbox
                          name="familyAccompanying"
                          label="가족 동반 예정입니다"
                        />
                        
                        <FormCheckbox
                          name="criminalRecord"
                          label="범죄 경력이 있습니다"
                          helperText="있는 경우 추가 서류가 필요합니다"
                        />
                        
                        <FormCheckbox
                          name="previousVisaRejection"
                          label="비자 거절 이력이 있습니다"
                        />
                        
                        <FormCheckbox
                          name="healthIssues"
                          label="건강상 문제가 있습니다"
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
                disabled={!onPrev}
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
  );
};

export default NewApplicationForm;