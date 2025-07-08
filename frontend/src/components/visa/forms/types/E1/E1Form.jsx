/**
 * E-1 교수 비자 전용 폼
 * BaseVisaForm을 확장하여 E-1 특화 필드 추가
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import * as yup from 'yup';
import BaseVisaForm from '../../base/BaseVisaForm';
import FormSection from '../../base/FormSection';
import E1Fields from './E1Fields';

// E-1 비자 전용 유효성 검사 스키마
const e1ValidationSchema = yup.object().shape({
  academicInfo: yup.object().shape({
    education: yup.string()
      .required('학위를 선택해주세요')
      .oneOf(['MASTERS', 'DOCTORATE'], 'E-1 비자는 최소 석사 학위가 필요합니다'),
    teachingExperience: yup.number()
      .required('교육 경력을 입력해주세요')
      .min(2, 'E-1 비자는 최소 2년의 경력이 필요합니다'),
    researchPublications: yup.number()
      .min(0, '유효한 숫자를 입력해주세요'),
    koreanLevel: yup.string()
  }),
  
  institutionInfo: yup.object().shape({
    institutionName: yup.string().required('교육기관명을 입력해주세요'),
    institutionType: yup.string()
      .required('기관 유형을 선택해주세요')
      .oneOf(['UNIVERSITY', 'COLLEGE', 'JUNIOR_COLLEGE', 'RESEARCH_INSTITUTE']),
    weeklyTeachingHours: yup.number()
      .required('주당 강의시간을 입력해주세요')
      .min(6, 'E-1 비자는 최소 주당 6시간 이상 강의가 필요합니다'),
    onlineTeachingRatio: yup.number()
      .max(50, '온라인 강의는 전체의 50% 이하여야 합니다')
  }),
  
  contractInfo: yup.object().shape({
    contractStartDate: yup.date().required('계약 시작일을 입력해주세요'),
    contractEndDate: yup.date()
      .required('계약 종료일을 입력해주세요')
      .min(yup.ref('contractStartDate'), '계약 종료일은 시작일 이후여야 합니다'),
    salary: yup.number()
      .required('연봉을 입력해주세요')
      .positive('유효한 금액을 입력해주세요')
  })
});

const E1Form = ({ 
  applicationType, 
  initialData = {}, 
  onSubmit,
  onSaveDraft 
}) => {
  return (
    <BaseVisaForm
      visaType="E-1"
      applicationType={applicationType}
      initialData={initialData}
      onSubmit={onSubmit}
      onSaveDraft={onSaveDraft}
      validationSchema={e1ValidationSchema}
    >
      <E1SpecificFields applicationType={applicationType} />
    </BaseVisaForm>
  );
};

// E-1 특화 필드 컴포넌트
const E1SpecificFields = ({ applicationType }) => {
  const { register, watch, formState: { errors } } = useFormContext();
  const educationLevel = watch('academicInfo.education');

  // 연장 신청인 경우 다른 필드 세트 사용
  if (applicationType === 'EXTENSION') {
    return (
      <>
        {/* 체류 이력 정보 */}
        <FormSection 
          title="체류 이력 정보" 
          description="한국 체류 기간 동안의 이력을 입력해주세요"
          required
        >
          <E1Fields.StayHistoryFields errors={errors} />
        </FormSection>

        {/* 활동 실적 */}
        <FormSection 
          title="활동 실적" 
          description="체류 기간 동안의 주요 활동과 성과를 입력해주세요"
          required
        >
          <E1Fields.PerformanceEvaluationFields errors={errors} />
        </FormSection>

        {/* 계약 연속성 */}
        <FormSection 
          title="계약 및 고용 정보" 
          description="현재 고용 상태와 계약 정보를 입력해주세요"
          required
        >
          <E1Fields.ContinuityFields errors={errors} />
        </FormSection>

        {/* 문서 준비도 */}
        <FormSection 
          title="제출 가능 서류 확인" 
          description="현재 준비된 서류를 체크해주세요 (실제 업로드는 결제 후)"
        >
          <E1Fields.DocumentReadinessFields errors={errors} />
        </FormSection>
      </>
    );
  }

  // 신규 신청인 경우 기존 필드 사용
  return (
    <>
      {/* 학력 및 경력 정보 */}
      <FormSection 
        title="학력 및 경력 정보" 
        description="교육 및 연구 경력을 입력해주세요"
        required
      >
        <E1Fields.AcademicFields errors={errors} />
      </FormSection>

      {/* 교육기관 정보 */}
      <FormSection 
        title="교육기관 정보" 
        description="근무할 교육기관 정보를 입력해주세요"
        required
      >
        <E1Fields.InstitutionFields errors={errors} />
      </FormSection>

      {/* 계약 정보 */}
      <FormSection 
        title="고용 계약 정보" 
        description="고용 계약 관련 정보를 입력해주세요"
        required
      >
        <E1Fields.ContractFields errors={errors} />
      </FormSection>

      {/* 추가 활동 (해당되는 경우) */}
      {applicationType === 'NEW' && (
        <FormSection 
          title="추가 활동 계획" 
          description="겸직이나 추가 활동 계획이 있다면 입력해주세요"
        >
          <E1Fields.AdditionalActivities errors={errors} />
        </FormSection>
      )}

      {/* 연장/변경 신청의 경우 추가 정보 */}
      {applicationType === 'EXTENSION' && (
        <FormSection 
          title="현재 활동 증명" 
          description="현재까지의 활동 내역을 입력해주세요"
          required
        >
          <E1Fields.ExtensionFields errors={errors} />
        </FormSection>
      )}

      {applicationType === 'CHANGE' && (
        <FormSection 
          title="비자 변경 사유" 
          description="현재 비자에서 E-1으로 변경하려는 사유를 입력해주세요"
          required
        >
          <E1Fields.ChangeReasonFields errors={errors} />
        </FormSection>
      )}

      {/* 점수제 평가 정보 (신규 신청만) */}
      {applicationType === 'NEW' && (
        <FormSection 
          title="점수제 평가 정보" 
          description="점수제 평가를 위한 추가 정보를 입력해주세요"
        >
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              E-1 비자 신규 신청은 점수제 평가를 통해 최소 60점 이상을 획득해야 합니다.
              현재 예상 점수를 확인하며 작성해주세요.
            </p>
          </div>
          <E1Fields.PointsEvaluationFields 
            educationLevel={educationLevel} 
            errors={errors} 
          />
        </FormSection>
      )}
    </>
  );
};

export default E1Form;