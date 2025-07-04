import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetChallengeByIdQuery, useDeleteChallengeMutation } from '../../../api/services/tovsparkService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/common/ErrorAlert';

function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetChallengeByIdQuery(challengeId);
  const [deleteChallenge] = useDeleteChallengeMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteChallenge(challengeId).unwrap();
      navigate('/tovspark');
    } catch (err) {
      console.error('과제 삭제 중 오류 발생:', err);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error.message} />;

  const challenge = data?.challenge || {};

  // reward 타입을 한글로 변환하는 함수
  const getRewardTypeText = (rewardType) => {
    if (!rewardType) return '';
    
    const rewardTypes = {
      'recruitment': '채용 연계',
      'internship': '인턴십',
      'mentoring': '멘토링',
      'certification': '수료증'
    };
    return rewardTypes[rewardType] || '';
  };

  // challengeType을 한글로 변환하는 함수
  const getChallengeTypeText = (type) => {
    if (!type) return '';
    
    const challengeTypes = {
      'tech_development': '기술 개발',
      'business_strategy': '경영 전략',
      'marketing': '마케팅',
      'design': '디자인',
      'research': '연구/조사',
      'planning': '기획'
    };
    return challengeTypes[type] || type;
  };

  const rewardType = challenge.reward?.type || '';
  const challengeType = challenge.challengeType || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate('/tovspark')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          목록으로 돌아가기
        </button>
        
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-800"
        >
          과제 삭제
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* 헤더 섹션 */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{challenge.title}</h1>
              <div className="mt-2 flex items-center space-x-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {getChallengeTypeText(challengeType)}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {getRewardTypeText(rewardType)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 내용 섹션 */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">과제 설명</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 whitespace-pre-line">{challenge.description}</p>
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">진행 일정</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">시작일</div>
              <div className="mt-1 text-gray-900">
                {challenge.startDate && new Date(challenge.startDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">마감일</div>
              <div className="mt-1 text-gray-900">
                {challenge.endDate && new Date(challenge.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* 참여 버튼 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            과제 참여하기
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              과제를 삭제하시겠습니까?
            </h3>
            <p className="text-gray-600 mb-6">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChallengeDetail;
