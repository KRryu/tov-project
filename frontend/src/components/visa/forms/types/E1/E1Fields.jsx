/**
 * E-1 비자 전용 필드 컴포넌트들
 * E1Form에서 사용하는 세부 필드 그룹
 */

import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

// 학력 및 경력 필드
const AcademicFields = ({ errors }) => {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          최종 학위 *
        </label>
        <select
          {...register('academicInfo.education')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          <option value="BACHELOR">학사</option>
          <option value="MASTERS">석사</option>
          <option value="DOCTORATE">박사</option>
        </select>
        {errors.academicInfo?.education && (
          <p className="mt-1 text-sm text-red-600">{errors.academicInfo.education.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          교육 경력 (년) *
        </label>
        <input
          type="number"
          {...register('academicInfo.teachingExperience', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 5"
        />
        {errors.academicInfo?.teachingExperience && (
          <p className="mt-1 text-sm text-red-600">{errors.academicInfo.teachingExperience.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          연구 논문 수
        </label>
        <input
          type="number"
          {...register('academicInfo.researchPublications', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 10"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          한국어 능력 (TOPIK)
        </label>
        <select
          {...register('academicInfo.koreanLevel')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">해당없음</option>
          <option value="TOPIK_1">TOPIK 1급</option>
          <option value="TOPIK_2">TOPIK 2급</option>
          <option value="TOPIK_3">TOPIK 3급</option>
          <option value="TOPIK_4">TOPIK 4급</option>
          <option value="TOPIK_5">TOPIK 5급</option>
          <option value="TOPIK_6">TOPIK 6급</option>
        </select>
      </div>
    </div>
  );
};

// 교육기관 정보 필드
const InstitutionFields = ({ errors }) => {
  const { register, watch } = useFormContext();
  const weeklyHours = watch('institutionInfo.weeklyTeachingHours');
  const onlineHours = watch('institutionInfo.onlineTeachingHours');
  
  const onlineRatio = useMemo(() => {
    if (weeklyHours && onlineHours) {
      return Math.round((onlineHours / weeklyHours) * 100);
    }
    return 0;
  }, [weeklyHours, onlineHours]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          교육기관명 *
        </label>
        <input
          {...register('institutionInfo.institutionName')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 서울대학교"
        />
        {errors.institutionInfo?.institutionName && (
          <p className="mt-1 text-sm text-red-600">{errors.institutionInfo.institutionName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          기관 유형 *
        </label>
        <select
          {...register('institutionInfo.institutionType')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택하세요</option>
          <option value="UNIVERSITY">대학교</option>
          <option value="COLLEGE">대학</option>
          <option value="JUNIOR_COLLEGE">전문대학</option>
          <option value="RESEARCH_INSTITUTE">연구기관</option>
        </select>
        {errors.institutionInfo?.institutionType && (
          <p className="mt-1 text-sm text-red-600">{errors.institutionInfo.institutionType.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            주당 총 강의시간 *
          </label>
          <input
            type="number"
            {...register('institutionInfo.weeklyTeachingHours', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 15"
          />
          {errors.institutionInfo?.weeklyTeachingHours && (
            <p className="mt-1 text-sm text-red-600">{errors.institutionInfo.weeklyTeachingHours.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            온라인 강의 시간
          </label>
          <input
            type="number"
            {...register('institutionInfo.onlineTeachingHours', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 5"
          />
          {onlineRatio > 0 && (
            <p className={`mt-1 text-sm ${onlineRatio > 50 ? 'text-red-600' : 'text-green-600'}`}>
              온라인 강의 비율: {onlineRatio}%
            </p>
          )}
        </div>
      </div>

      <input
        type="hidden"
        {...register('institutionInfo.onlineTeachingRatio', { valueAsNumber: true })}
        value={onlineRatio}
      />
    </div>
  );
};

// 계약 정보 필드
const ContractFields = ({ errors }) => {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            계약 시작일 *
          </label>
          <input
            type="date"
            {...register('contractInfo.contractStartDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.contractInfo?.contractStartDate && (
            <p className="mt-1 text-sm text-red-600">{errors.contractInfo.contractStartDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            계약 종료일 *
          </label>
          <input
            type="date"
            {...register('contractInfo.contractEndDate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.contractInfo?.contractEndDate && (
            <p className="mt-1 text-sm text-red-600">{errors.contractInfo.contractEndDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          연봉 (원) *
        </label>
        <input
          type="number"
          {...register('contractInfo.salary', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 50000000"
        />
        {errors.contractInfo?.salary && (
          <p className="mt-1 text-sm text-red-600">{errors.contractInfo.salary.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          담당 과목/업무
        </label>
        <textarea
          {...register('contractInfo.subjects')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="담당할 과목이나 업무를 입력해주세요"
        />
      </div>
    </div>
  );
};

// 추가 활동 필드
const AdditionalActivities = ({ errors }) => {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          겸직 예정 기관
        </label>
        <input
          {...register('additionalActivities.concurrentInstitution')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="겸직할 기관이 있다면 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          추가 연구 활동 계획
        </label>
        <textarea
          {...register('additionalActivities.researchPlan')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="추가 연구 활동 계획을 입력하세요"
        />
      </div>
    </div>
  );
};

// 연장 신청 필드
const ExtensionFields = ({ errors }) => {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          현재까지 강의 실적 *
        </label>
        <textarea
          {...register('extensionInfo.teachingRecord')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="현재까지의 강의 실적을 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          연구 실적
        </label>
        <textarea
          {...register('extensionInfo.researchRecord')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="연구 실적이 있다면 입력하세요"
        />
      </div>
    </div>
  );
};

// 변경 사유 필드
const ChangeReasonFields = ({ errors }) => {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          현재 비자 타입 *
        </label>
        <input
          {...register('changeInfo.currentVisaType')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: D-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          변경 사유 *
        </label>
        <textarea
          {...register('changeInfo.changeReason')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="E-1 비자로 변경하려는 사유를 상세히 입력하세요"
        />
      </div>
    </div>
  );
};

// 점수제 평가 필드
const PointsEvaluationFields = ({ educationLevel, errors }) => {
  const { register, watch } = useFormContext();
  
  // 실시간 점수 계산
  const calculateScore = () => {
    let score = 0;
    
    // 학위 점수
    const educationScores = { BACHELOR: 20, MASTERS: 30, DOCTORATE: 40 };
    score += educationScores[educationLevel] || 0;
    
    // 경력 점수 (년당 5점, 최대 30점)
    const experience = watch('academicInfo.teachingExperience') || 0;
    score += Math.min(experience * 5, 30);
    
    // 연구실적 (논문당 5점, 최대 30점)
    const publications = watch('academicInfo.researchPublications') || 0;
    score += Math.min(publications * 5, 30);
    
    // 나이 점수
    const age = watch('pointsEvaluation.age') || 0;
    if (age < 30) score += 20;
    else if (age < 40) score += 15;
    else if (age < 50) score += 10;
    else if (age < 60) score += 5;
    
    // 한국어 능력
    const koreanLevel = watch('academicInfo.koreanLevel');
    const koreanScores = {
      TOPIK_3: 5, TOPIK_4: 10, TOPIK_5: 15, TOPIK_6: 20
    };
    score += koreanScores[koreanLevel] || 0;
    
    return score;
  };
  
  const currentScore = calculateScore();
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-blue-900">현재 예상 점수:</span>
          <span className={`text-2xl font-bold ${currentScore >= 60 ? 'text-green-600' : 'text-red-600'}`}>
            {currentScore}점 / 100점
          </span>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${currentScore >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(currentScore, 100)}%` }}
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {currentScore >= 60 ? '✓ 최소 점수 기준을 충족합니다' : '⚠ 최소 60점 이상이 필요합니다'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          나이
        </label>
        <input
          type="number"
          {...register('pointsEvaluation.age', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 35"
        />
      </div>
    </div>
  );
};

// E1Fields 객체로 모든 필드 컴포넌트 export
const E1Fields = {
  AcademicFields,
  InstitutionFields,
  ContractFields,
  AdditionalActivities,
  ExtensionFields,
  ChangeReasonFields,
  PointsEvaluationFields
};

export default E1Fields;