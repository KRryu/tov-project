import React from 'react';
import { Link } from 'react-router-dom';
import { useGetChallengesQuery } from '../../../api/services/tovsparkService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorAlert from '../../../components/common/ErrorAlert';

function ChallengeList() {
  const { data, isLoading, error } = useGetChallengesQuery();

  // reward 타입을 한글로 변환하는 함수
  const getRewardTypeText = (reward) => {
    if (!reward || !reward.type) return '';
    
    const rewardTypes = {
      'recruitment': '채용 연계',
      'internship': '인턴십',
      'mentoring': '멘토링',
      'certification': '수료증'
    };
    return rewardTypes[reward.type] || '';
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

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {data?.challenges?.map((challenge) => (
        <div 
          key={challenge._id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <h3 className="text-xl font-semibold text-gray-900">
            {challenge.title || ''}
          </h3>
          <p className="mt-2 text-gray-600">
            {challenge.shortDescription || ''}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
              {getChallengeTypeText(challenge.challengeType)}
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-md">
              {getRewardTypeText(challenge.reward)}
            </span>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              마감: {challenge.endDate ? new Date(challenge.endDate).toLocaleDateString() : ''}
            </span>
          </div>
          <Link
            to={`/tovspark/challenge/${challenge._id}`}
            className="mt-4 block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            과제 상세보기
          </Link>
        </div>
      ))}
    </div>
  );
}

export default ChallengeList; 