/**
 * 평가 결과 표시 컴포넌트
 * 백엔드에서 받은 평가 결과를 시각적으로 표시
 */

import React, { useMemo } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  DownloadIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const EvaluationResult = ({ 
  result, 
  onProceed, 
  onDownload, 
  onShare,
  showActions = true 
}) => {
  if (!result) return null;

  const { eligible, score, details, recommendations, nextSteps } = result;

  // 상태별 색상 및 아이콘
  const statusConfig = useMemo(() => {
    if (eligible && score >= 80) {
      return {
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        icon: CheckCircleIcon,
        title: '우수한 자격 요건',
        message: '귀하는 해당 비자 신청 자격을 충분히 갖추고 있습니다.'
      };
    } else if (eligible && score >= 70) {
      return {
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        icon: CheckCircleIcon,
        title: '자격 요건 충족',
        message: '귀하는 해당 비자 신청 자격을 갖추고 있습니다.'
      };
    } else if (score >= 60) {
      return {
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        icon: ExclamationTriangleIcon,
        title: '조건부 적격',
        message: '일부 보완이 필요하지만 신청 가능합니다.'
      };
    } else {
      return {
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        icon: XCircleIcon,
        title: '자격 요건 미충족',
        message: '안타깝게도 현재 자격 요건을 충족하지 못합니다.'
      };
    }
  }, [eligible, score]);

  const StatusIcon = statusConfig.icon;

  // 레이더 차트 데이터 준비
  const radarData = useMemo(() => {
    if (!details?.scores) return [];
    
    return Object.entries(details.scores).map(([key, value]) => ({
      category: key === 'eligibility' ? '자격요건' : 
                key === 'documents' ? '서류완성도' : 
                key === 'expertise' ? '전문성/경력' : key,
      score: value.score || 0,
      fullMark: 100
    }));
  }, [details]);

  // 점수별 색상
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 전체 평가 결과 */}
      <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-lg p-6`}>
        <div className="flex items-start space-x-3">
          <StatusIcon className={`h-6 w-6 ${statusConfig.textColor} mt-0.5`} />
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${statusConfig.textColor}`}>
              {statusConfig.title}
            </h3>
            <p className={`mt-1 text-sm ${statusConfig.textColor}`}>
              {statusConfig.message}
            </p>
            
            {/* 전체 점수 */}
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">종합 점수</span>
                  <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                    {score}점
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      score >= 80 ? 'bg-green-500' :
                      score >= 70 ? 'bg-blue-500' :
                      score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 세부 점수 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 점수 상세 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">평가 항목별 점수</h4>
          <div className="space-y-3">
            {details?.scores && Object.entries(details.scores).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">
                    {key === 'eligibility' ? '자격요건' : 
                     key === 'documents' ? '서류완성도' : 
                     key === 'expertise' ? '전문성/경력' : key}
                  </span>
                  <span className={`font-medium ${getScoreColor(value.score)}`}>
                    {value.score}점 (가중치 {value.weight}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      value.score >= 80 ? 'bg-green-500' :
                      value.score >= 70 ? 'bg-blue-500' :
                      value.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${value.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 레이더 차트 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">평가 분석 차트</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar 
                name="점수" 
                dataKey="score" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 추천사항 */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">개선 권장사항</h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  rec.priority === 'HIGH' ? 'bg-red-500' :
                  rec.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="text-sm text-gray-700">{rec.message}</p>
                  {rec.action && (
                    <button className="mt-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      {rec.action === 'PREPARE_DOCUMENTS' ? '필요 서류 확인' :
                       rec.action === 'IMPROVE_QUALIFICATIONS' ? '자격 개선 방법' :
                       rec.action === 'CONSULT_LAWYER' ? '법무대리인 상담' : '자세히 보기'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다음 단계 */}
      {nextSteps && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">다음 단계 안내</h4>
          <div className="space-y-3">
            {nextSteps.nextSteps?.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.name}</p>
                  {step.description && (
                    <p className="text-sm text-gray-600">{step.description}</p>
                  )}
                </div>
                {index < nextSteps.nextSteps.length - 1 && (
                  <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
          
          {nextSteps.estimatedDays && (
            <p className="mt-4 text-sm text-gray-600">
              예상 소요 기간: <span className="font-medium">{nextSteps.estimatedDays}일</span>
            </p>
          )}
        </div>
      )}

      {/* 필수 서류 목록 */}
      {details?.requiredDocuments && details.requiredDocuments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">필수 제출 서류</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {details.requiredDocuments.map((doc, index) => (
              <div key={index} className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          {eligible && onProceed && (
            <button
              onClick={onProceed}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <span>다음 단계 진행</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          )}
          
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <DownloadIcon className="h-5 w-5" />
              <span>결과 다운로드</span>
            </button>
          )}
          
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ShareIcon className="h-5 w-5" />
              <span>결과 공유</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluationResult;