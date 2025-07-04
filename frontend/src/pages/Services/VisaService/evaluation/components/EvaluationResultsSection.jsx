import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const EvaluationResultsSection = ({ result, onNext, isLoading }) => {
  if (!result) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">평가 결과를 분석 중입니다...</p>
      </div>
    );
  }

  const { score, grade, recommendation, details, eligibility } = result;

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'EXCELLENT': return 'text-green-600 bg-green-100';
      case 'GOOD': return 'text-blue-600 bg-blue-100';
      case 'FAIR': return 'text-yellow-600 bg-yellow-100';
      case 'POOR': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeIcon = (grade) => {
    switch (grade) {
      case 'EXCELLENT':
      case 'GOOD':
        return <CheckCircleIcon className="w-8 h-8" />;
      case 'FAIR':
        return <ExclamationTriangleIcon className="w-8 h-8" />;
      case 'POOR':
        return <ExclamationTriangleIcon className="w-8 h-8" />;
      default:
        return <InformationCircleIcon className="w-8 h-8" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">E-1 비자 평가 결과</h2>
          <p className="text-gray-600">신청자님의 E-1 비자 승인 가능성을 분석했습니다.</p>
        </div>

        {/* 전체 점수 및 등급 */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center px-6 py-3 rounded-full ${getGradeColor(grade)} mb-4`}>
            {getGradeIcon(grade)}
            <span className="ml-2 text-lg font-semibold">
              {grade === 'EXCELLENT' && '매우 우수'}
              {grade === 'GOOD' && '우수'}
              {grade === 'FAIR' && '보통'}
              {grade === 'POOR' && '미흡'}
            </span>
          </div>
          
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {score}/100점
          </div>
          
          <div className="w-64 mx-auto bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${
                score >= 80 ? 'bg-green-500' :
                score >= 60 ? 'bg-blue-500' :
                score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          <p className="text-gray-600 text-lg">{recommendation}</p>
        </div>

        {/* 세부 평가 항목 */}
        {details && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">세부 평가 항목</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {key === 'education' && '학력 점수'}
                      {key === 'experience' && '경력 점수'}
                      {key === 'publications' && '논문 점수'}
                      {key === 'salary' && '연봉 점수'}
                      {key === 'bonus' && '추가 점수'}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{value.score}/{value.maxScore}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(value.score / value.maxScore) * 100}%` }}
                    />
                  </div>
                  {value.comment && (
                    <p className="text-xs text-gray-600 mt-2">{value.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 자격 요건 체크 */}
        {eligibility && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">자격 요건 체크</h3>
            <div className="space-y-3">
              {eligibility.map((item, index) => (
                <div key={index} className="flex items-center">
                  {item.passed ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  ) : (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${item.passed ? 'text-gray-700' : 'text-red-600'}`}>
                    {item.requirement}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다음 단계 안내 */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">다음 단계</h3>
          <p className="text-gray-700 mb-4">
            평가가 완료되었습니다. 이제 전문 행정사 매칭을 통해 실제 비자 신청을 진행할 수 있습니다.
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 평가 결과를 바탕으로 최적의 행정사를 매칭합니다</li>
            <li>• 필요한 서류 리스트와 신청 전략을 제공합니다</li>
            <li>• 전 과정을 모니터링하여 성공률을 높입니다</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={onNext}
            disabled={isLoading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '처리 중...' : '행정사 매칭 진행'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationResultsSection; 