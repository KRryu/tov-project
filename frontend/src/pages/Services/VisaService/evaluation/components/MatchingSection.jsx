import React from 'react';
import { UserIcon, StarIcon, CheckBadgeIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const MatchingSection = ({ matchingResult, onNext, onBack, isLoading }) => {
  if (!matchingResult) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">최적의 행정사를 찾는 중입니다...</p>
      </div>
    );
  }

  const { matches, recommendedMatch } = matchingResult;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">행정사 매칭 결과</h2>
          <p className="text-gray-600">신청자님께 최적화된 전문 행정사를 추천해드립니다.</p>
        </div>

        {/* 추천 행정사 */}
        {recommendedMatch && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
              <div className="flex items-center mb-4">
                <CheckBadgeIcon className="w-6 h-6 text-blue-600 mr-2" />
                <span className="font-semibold text-blue-800">추천 행정사</span>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      {recommendedMatch.name}
                    </h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(recommendedMatch.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-gray-600">
                        ({recommendedMatch.rating})
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <p><strong>전문 분야:</strong> {recommendedMatch.specialization}</p>
                    <p><strong>경력:</strong> {recommendedMatch.experience}년</p>
                    <p><strong>성공률:</strong> {recommendedMatch.successRate}%</p>
                    <p><strong>매칭 점수:</strong> {recommendedMatch.matchScore}점</p>
                  </div>
                  
                  <div className="text-sm text-gray-700 mb-4">
                    {recommendedMatch.description}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      {recommendedMatch.phone}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 mr-1" />
                      {recommendedMatch.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">예상 서비스 비용</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('ko-KR').format(recommendedMatch.estimatedCost)}원
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  정부 수수료 별도 • 성공 시에만 지불
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 다른 매칭 옵션들 */}
        {matches && matches.length > 1 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">다른 매칭 옵션들</h3>
            <div className="space-y-4">
              {matches.slice(1).map((match, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{match.name}</h4>
                        <div className="text-lg font-semibold text-gray-900">
                          {new Intl.NumberFormat('ko-KR').format(match.estimatedCost)}원
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(match.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-gray-600">
                          ({match.rating})
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                        <span>경력: {match.experience}년</span>
                        <span>성공률: {match.successRate}%</span>
                        <span>매칭점수: {match.matchScore}점</span>
                        <span>{match.specialization}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 매칭 정보 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">매칭 정보</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• 평가 점수와 비자 유형에 따라 최적의 전문가를 선별했습니다</p>
            <p>• 모든 행정사는 TOV에서 검증된 전문가입니다</p>
            <p>• 서비스 만족도가 높은 순으로 우선 추천됩니다</p>
            <p>• 비용은 서비스 성공 시에만 지불하며, 실패 시 100% 환불됩니다</p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            이전 단계
          </button>
          
          <button
            onClick={onNext}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '처리 중...' : '선택한 행정사로 진행'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchingSection; 