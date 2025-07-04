import React from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

const DetailedEvaluationResults = ({ evaluationResult }) => {
  if (!evaluationResult) return null;

  const { score = 0, details = {}, recommendations = [], passPreScreening } = evaluationResult;

  // 스파이더 차트용 데이터 준비
  const radarData = [];
  
  // E-1 비자의 경우
  if (details.education) {
    radarData.push({
      category: '학력',
      value: details.education?.score || 0,
      fullMark: details.education?.maxScore || 40
    });
  }
  if (details.experience) {
    radarData.push({
      category: '경력',
      value: details.experience?.score || 0,
      fullMark: details.experience?.maxScore || 30
    });
  }
  if (details.research) {
    radarData.push({
      category: '연구실적',
      value: details.research?.score || 0,
      fullMark: details.research?.maxScore || 30
    });
  }
  if (details.age) {
    radarData.push({
      category: '나이',
      value: details.age?.score || 0,
      fullMark: details.age?.maxScore || 20
    });
  }
  if (details.language) {
    radarData.push({
      category: '언어능력',
      value: details.language?.score || 0,
      fullMark: details.language?.maxScore || 20
    });
  }
  
  // 데이터가 없는 경우 기본값
  if (radarData.length === 0) {
    radarData.push(
      { category: '학력', value: 0, fullMark: 40 },
      { category: '경력', value: 0, fullMark: 30 },
      { category: '전문성', value: 0, fullMark: 30 },
      { category: '기관', value: 0, fullMark: 10 },
      { category: '추가점수', value: 0, fullMark: 10 }
    );
  }

  // 세부 점수 바 차트 데이터
  const barData = Object.entries(details).map(([key, value]) => ({
    name: getCategoryName(key),
    score: value.score || 0,
    maxScore: value.maxScore || 0
  }));

  // 점수에 따른 색상
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 space-y-6"
    >
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          비자 사전평가 상세 결과
        </h2>
        <p className="text-gray-600">
          E-1 (교수) 비자 신규 신청 평가
        </p>
      </div>

      {/* 종합 점수 */}
      <div className={`text-center p-6 rounded-lg ${
        passPreScreening ? 'bg-green-50' : 'bg-amber-50'
      }`}>
        <div className="mb-4">
          <span className="text-5xl font-bold" style={{ color: getScoreColor(score) }}>
            {score}
          </span>
          <span className="text-2xl text-gray-600"> / 100</span>
        </div>
        <div className="text-lg font-medium">
          {passPreScreening ? (
            <span className="text-green-700">✅ 사전심사 통과</span>
          ) : (
            <span className="text-amber-700">⚠️ 보완 필요</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {passPreScreening 
            ? '귀하의 자격요건이 E-1 비자 기준을 충족합니다.'
            : '일부 요건이 부족하나 보완 가능합니다.'}
        </p>
      </div>

      {/* 스파이더 차트 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          평가 항목별 점수
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 'dataMax']} 
                tick={{ fontSize: 12 }}
              />
              <Radar
                name="취득 점수"
                dataKey="value"
                stroke={getScoreColor(score)}
                fill={getScoreColor(score)}
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 세부 점수 막대 차트 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          세부 평가 결과
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" name="취득 점수" fill="#3b82f6">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score / entry.maxScore * 100)} />
                ))}
              </Bar>
              <Bar dataKey="maxScore" name="최대 점수" fill="#e5e7eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 평가 내역 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          평가 내역
        </h3>
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">
                {getCategoryName(key)}
              </h4>
              <span className="text-lg font-semibold" style={{ color: getScoreColor(value.score / value.maxScore * 100) }}>
                {value.score} / {value.maxScore}점
              </span>
            </div>
            {value.details && (
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(value.details).map(([detailKey, detailValue]) => (
                  <li key={detailKey} className="flex justify-between">
                    <span>{getDetailName(detailKey)}</span>
                    <span className="font-medium">{detailValue}</span>
                  </li>
                ))}
              </ul>
            )}
            {value.message && (
              <p className="text-sm text-gray-600 mt-2">{value.message}</p>
            )}
          </div>
        ))}
      </div>

      {/* 추천사항 */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            개선 추천사항
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-blue-900">{rec.message || rec}</p>
                  {rec.actionItems && (
                    <ul className="mt-1 text-xs text-blue-700 list-disc list-inside">
                      {rec.actionItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다음 단계 안내 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">다음 단계</h4>
        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
          <li>평가 결과를 바탕으로 부족한 부분을 보완하세요</li>
          <li>필요한 서류를 준비하여 업로드하세요</li>
          <li>법무대리인과 상담하여 구체적인 전략을 수립하세요</li>
          <li>최종 신청서를 작성하여 제출하세요</li>
        </ol>
      </div>
    </motion.div>
  );
};

// 카테고리 이름 한글 변환
const getCategoryName = (key) => {
  const names = {
    education: '학력',
    experience: '경력',
    expertise: '전문성',
    institution: '소속기관',
    additional: '추가점수',
    language: '언어능력',
    research: '연구실적',
    teaching: '강의경력',
    age: '나이'
  };
  return names[key] || key;
};

// 상세 항목 이름 한글 변환
const getDetailName = (key) => {
  const names = {
    degree: '학위',
    years: '연수',
    publications: '논문수',
    type: '유형',
    qualification: '자격',
    topik: 'TOPIK',
    english: '영어'
  };
  return names[key] || key;
};

export default DetailedEvaluationResults;