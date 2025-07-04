import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateChallengeMutation } from '../../../api/services/tovsparkService';

function CreateChallenge() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [createChallenge, { isLoading }] = useCreateChallengeMutation();

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split('T')[0];

  // 기본 정보만 필수로 입력받고, 나머지는 선택사항으로 처리
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    challengeType: 'tech_development',
    industry: 'it_software',
    requirements: {
      essential: [''],
      optional: []
    },
    timeline: {
      startDate: '',
      endDate: ''
    },
    rewardType: 'recruitment'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const challengeData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        challengeType: formData.challengeType,
        industry: formData.industry,
        requirements: {
          essential: formData.requirements.essential.filter(req => req.trim() !== ''),
          optional: formData.requirements.optional
        },
        startDate: formData.timeline.startDate,
        endDate: formData.timeline.endDate,
        reward: {
          type: formData.rewardType
        }
      };

      console.log('Submitting challenge data:', challengeData);

      const response = await createChallenge(challengeData).unwrap();
      
      if (response.success) {
        alert('과제가 성공적으로 생성되었습니다.');
        navigate('/tovspark');
      }
    } catch (err) {
      console.error('과제 생성 중 오류 발생:', err);
      alert(err.data?.message || '과제 생성 중 오류가 발생했습니다.');
    }
  };

  // 단계별 진행 상태 표시
  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {['기본 정보', '과제 상세', '일정'].map((step, index) => (
          <div
            key={index}
            className={`text-sm font-medium ${
              currentStep >= index + 1 ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-blue-600 rounded-full transition-all"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  // 1단계: 기본 정보
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          과제 제목 *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          간단 소개 (200자 이내) *
        </label>
        <textarea
          name="shortDescription"
          value={formData.shortDescription}
          onChange={handleChange}
          maxLength={200}
          rows={3}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            과제 유형 *
          </label>
          <select
            name="challengeType"
            value={formData.challengeType}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="tech_development">기술 개발</option>
            <option value="business_strategy">경영 전략</option>
            <option value="marketing">마케팅</option>
            <option value="design">디자인</option>
            <option value="research">연구/조사</option>
            <option value="planning">기획</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            산업 분야 *
          </label>
          <select
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="it_software">IT/소프트웨어</option>
            <option value="finance">금융</option>
            <option value="healthcare">의료/헬스케어</option>
            <option value="education">교육</option>
            <option value="retail">유통/소매</option>
            <option value="manufacturing">제조</option>
          </select>
        </div>
      </div>
    </div>
  );

  // 2단계: 과제 상세
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          과제 설명 *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={6}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          마크다운 형식을 지원합니다.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          필수 요구사항 *
        </label>
        <div className="space-y-2">
          {formData.requirements.essential.map((req, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={req}
                onChange={(e) => {
                  const newEssential = [...formData.requirements.essential];
                  newEssential[index] = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    requirements: {
                      ...prev.requirements,
                      essential: newEssential
                    }
                  }));
                }}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="예: REST API 설계 및 구현"
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const newEssential = formData.requirements.essential.filter((_, i) => i !== index);
                    setFormData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        essential: newEssential
                      }
                    }));
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setFormData(prev => ({
              ...prev,
              requirements: {
                ...prev.requirements,
                essential: [...prev.requirements.essential, '']
              }
            }));
          }}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + 요구사항 추가
        </button>
      </div>
    </div>
  );

  // 3단계: 일정
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시작일 *
          </label>
          <input
            type="date"
            name="timeline.startDate"
            value={formData.timeline.startDate}
            onChange={handleChange}
            min={today}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            마감일 *
          </label>
          <input
            type="date"
            name="timeline.endDate"
            value={formData.timeline.endDate}
            onChange={handleChange}
            min={formData.timeline.startDate || today}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
          {formData.timeline.endDate && formData.timeline.startDate && 
           formData.timeline.endDate < formData.timeline.startDate && (
            <p className="mt-1 text-sm text-red-600">
              마감일은 시작일 이후여야 합니다.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          과제 유형 *
        </label>
        <select
          name="rewardType"
          value={formData.rewardType}
          onChange={handleChange}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="recruitment">채용 연계</option>
          <option value="internship">인턴십</option>
          <option value="mentoring">멘토링</option>
          <option value="certification">수료증</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">새로운 과제 생성</h1>
        
        {renderProgressBar()}

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/tovspark')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
            <div className="space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  이전
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isLoading ? '생성 중...' : '과제 생성'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChallenge; 