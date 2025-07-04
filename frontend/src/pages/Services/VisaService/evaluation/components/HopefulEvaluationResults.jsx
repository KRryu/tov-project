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
  Cell,
  PieChart,
  Pie
} from 'recharts';
import confetti from 'canvas-confetti';

const HopefulEvaluationResults = ({ evaluationResult }) => {
  const { score = 0, details = {}, recommendations = [], passPreScreening } = evaluationResult || {};

  // 점수에 따라 confetti 효과
  React.useEffect(() => {
    if (passPreScreening && score >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [passPreScreening, score]);

  if (!evaluationResult) return null;

  // 스파이더 차트용 데이터 (백분율로 표시)
  const radarData = [];
  
  // scoreBreakdown이 있으면 우선 사용
  if (evaluationResult.scoreBreakdown && evaluationResult.scoreBreakdown.categories) {
    Object.entries(evaluationResult.scoreBreakdown.categories).forEach(([key, categoryData]) => {
      radarData.push({
        category: categoryData.name || getCategoryName(key),
        value: categoryData.percentage || 0,
        actualScore: categoryData.score,
        maxScore: categoryData.maxScore,
        fullMark: 100
      });
    });
  } else {
    // 기존 방식 fallback
    Object.entries(details).forEach(([key, value]) => {
      if (value.score !== undefined && value.maxScore) {
        const percentage = Math.round((value.score / value.maxScore) * 100);
        radarData.push({
          category: getCategoryName(key),
          value: percentage,
          actualScore: value.score,
          maxScore: value.maxScore,
          fullMark: 100
        });
      }
    });
  }

  // 점수에 따른 메시지와 색상
  const getScoreInfo = (score) => {
    if (score >= 90) return { 
      color: '#059669', 
      bgColor: 'bg-emerald-50', 
      borderColor: 'border-emerald-200',
      title: '축하합니다! 매우 우수한 결과입니다!',
      message: '귀하의 자격요건이 E-1 비자 기준을 훌륭하게 충족합니다. 비자 발급 가능성이 매우 높습니다.',
      icon: '🎉'
    };
    if (score >= 70) return { 
      color: '#3b82f6', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      title: '좋은 결과입니다!',
      message: '귀하의 자격요건이 E-1 비자 기준을 충족합니다. 몇 가지 보완으로 더 나은 결과를 얻을 수 있습니다.',
      icon: '👍'
    };
    if (score >= 50) return { 
      color: '#f59e0b', 
      bgColor: 'bg-amber-50', 
      borderColor: 'border-amber-200',
      title: '희망이 있습니다!',
      message: '현재 상태로도 가능성이 있으며, 권장사항을 따르시면 충분히 비자를 받으실 수 있습니다.',
      icon: '💪'
    };
    return { 
      color: '#ef4444', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      title: '더 준비가 필요합니다',
      message: '걱정하지 마세요. 체계적인 준비를 통해 비자 요건을 충족할 수 있습니다. 전문가의 도움을 받으시면 더 좋습니다.',
      icon: '📚'
    };
  };

  const scoreInfo = getScoreInfo(score);
  
  // 종합 평가 데이터 (고도화된 평가 결과 활용) - 먼저 정의
  const comprehensiveData = evaluationResult.comprehensive || null;

  // 개선 가능 점수 계산 (성장 가능성 기반)
  const calculateImprovableScore = () => {
    // comprehensive 데이터에서 성장 가능성 가져오기
    if (comprehensiveData && comprehensiveData.growthPotential) {
      return comprehensiveData.growthPotential.totalPotential || 0;
    }
    
    // scoreBreakdown에서 성장 가능성 가져오기
    if (evaluationResult.scoreBreakdown && evaluationResult.scoreBreakdown.details) {
      return evaluationResult.scoreBreakdown.details.growthPotential || 0;
    }
    
    // 기본 계산 (100점에서 현재 점수 빼기)
    return Math.max(0, 100 - score);
  };
  
  const improvableScore = calculateImprovableScore();
  
  // 강점과 약점 분석
  const analyzeStrengthsWeaknesses = () => {
    const strengths = [];
    const weaknesses = [];
    
    Object.entries(details).forEach(([key, value]) => {
      if (value && value.score !== undefined && value.maxScore) {
        const percentage = (value.score / value.maxScore) * 100;
        if (percentage >= 80) {
          strengths.push({ category: key, percentage, ...value });
        } else if (percentage < 60) {
          weaknesses.push({ category: key, percentage, ...value });
        }
      }
    });
    
    return { strengths, weaknesses };
  };
  
  const { strengths, weaknesses } = analyzeStrengthsWeaknesses();

  // 로드맵 단계
  const roadmapSteps = [
    {
      title: "현재 위치 확인",
      description: "사전평가 결과를 통해 현재 상태를 파악했습니다",
      status: "completed",
      icon: "📍"
    },
    {
      title: "부족한 부분 보완",
      description: recommendations.length > 0 ? "아래 추천사항을 참고하여 준비하세요" : "이미 좋은 조건을 갖추고 계십니다",
      status: "current",
      icon: "📝"
    },
    {
      title: "서류 준비",
      description: "필요한 서류를 체계적으로 준비합니다",
      status: "upcoming",
      icon: "📄"
    },
    {
      title: "법무대리인 선임",
      description: "전문가와 함께 완벽한 신청서를 작성합니다",
      status: "upcoming",
      icon: "👨‍⚖️"
    },
    {
      title: "비자 신청",
      description: "준비된 서류로 비자를 신청합니다",
      status: "upcoming",
      icon: "✈️"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* 헤로 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${scoreInfo.bgColor} ${scoreInfo.borderColor} border-2 rounded-2xl p-8 text-center`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-6xl mb-4"
        >
          {scoreInfo.icon}
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-900 mb-4"
        >
          {scoreInfo.title}
        </motion.h2>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <span className="text-6xl font-bold" style={{ color: scoreInfo.color }}>
            {score}
          </span>
          <span className="text-3xl text-gray-600"> / 100</span>
        </motion.div>
        
        {/* 점수 구성 상세 */}
        {evaluationResult.scoreBreakdown && evaluationResult.scoreBreakdown.details && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mb-4 text-sm text-gray-600"
          >
            <div className="flex justify-center items-center gap-4">
              <span>매뉴얼 점수: {evaluationResult.scoreBreakdown.details.manualPoints}점</span>
              <span>+</span>
              <span>추가 평가: {evaluationResult.scoreBreakdown.details.bonusPoints}점</span>
              <span>=</span>
              <span className="font-bold">총점: {score}점</span>
            </div>
          </motion.div>
        )}
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-700 max-w-2xl mx-auto"
        >
          {scoreInfo.message}
        </motion.p>

        {improvableScore > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-white bg-opacity-60 rounded-lg"
          >
            <p className="text-sm text-gray-600">
              💡 <strong>성장 가능성!</strong> 현재 점수({score}점)에서 최대 <span className="font-bold text-green-600">{improvableScore}점</span>을 더 올려 <span className="font-bold">{Math.min(score + improvableScore, 100)}점</span>까지 도달할 수 있습니다!
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* 점수 분석 카드들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 스파이더 차트 카드 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            종합 평가 분석
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                <Radar
                  name="현재 점수"
                  dataKey="value"
                  stroke={scoreInfo.color}
                  fill={scoreInfo.color}
                  fillOpacity={0.6}
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const data = props.payload;
                    if (data.actualScore !== undefined && data.maxScore !== undefined) {
                      return [
                        <div key="tooltip">
                          <div>{`${value}%`}</div>
                          <div className="text-xs text-gray-500">{`(${data.actualScore}/${data.maxScore}점)`}</div>
                        </div>,
                        name
                      ];
                    }
                    return [`${value}%`, name];
                  }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', padding: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* 강점 분석 */}
          {strengths.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 mb-2">🌟 강점 영역</h4>
              <div className="space-y-1">
                {strengths.slice(0, 2).map((item, idx) => (
                  <p key={idx} className="text-xs text-green-700">
                    • {getCategoryName(item.category)}: {Math.round(item.percentage)}% 달성
                  </p>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* 개선 가능 영역 카드 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            성장 가능성
          </h3>
          <div className="space-y-4">
            {Object.entries(details).map(([key, value]) => {
              if (!value || typeof value !== 'object' || !value.maxScore) return null;
              
              const currentScore = value.score || 0;
              const maxScore = value.maxScore || 0;
              const potential = maxScore - currentScore;
              
              if (potential <= 0 || maxScore <= 0) return null;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{getCategoryName(key)}</span>
                    <span className="text-sm text-green-600 font-semibold">+{Math.round(potential)}점 가능</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentScore / maxScore) * 100}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full relative"
                    >
                      <div 
                        className="absolute right-0 top-0 h-2 bg-green-300 opacity-50 rounded-full"
                        style={{ width: `${(potential / maxScore) * 100}%` }}
                      />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>현재: {Math.round(currentScore)}점</span>
                    <span>최대: {Math.round(maxScore)}점</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* 맞춤형 로드맵 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-8"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🗺️ 귀하만의 비자 취득 로드맵
        </h3>
        
        <div className="relative">
          {/* 진행 라인 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-300" />
          
          <div className="space-y-8">
            {roadmapSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                }`}
              >
                <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                  <div className={`p-4 rounded-lg ${
                    step.status === 'completed' ? 'bg-green-100' :
                    step.status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-2" style={{ justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start' }}>
                      <span className="text-2xl">{step.icon}</span>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                
                {/* 중앙 아이콘 */}
                <div className={`absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'current' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`}>
                  {step.status === 'completed' && (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {step.status === 'current' && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 점수 계산 방식 설명 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          점수 계산 방식
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <span className="font-semibold mr-2">1.</span>
            <div>
              <span className="font-medium">매뉴얼 기준 점수 (최대 80점)</span>
              <p className="text-xs mt-1">학력(5-13점) + 직급(2-10점) + 경력(1-5점) + 연구직위(2-7점)</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">2.</span>
            <div>
              <span className="font-medium">추가 평가 점수 (최대 20점)</span>
              <p className="text-xs mt-1">기관적합성 + 연구역량 + 언어능력 + 안정성 요인</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="font-semibold mr-2">3.</span>
            <div>
              <span className="font-medium">100점 만점 정규화</span>
              <p className="text-xs mt-1">매뉴얼 16점 이상 시 기본 60점 + 추가 점수</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 매뉴얼 기준 점수 확인 */}
      {comprehensiveData && comprehensiveData.manualScoreCheck && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={`${
            comprehensiveData.manualScoreCheck.passed ? 'bg-green-50' : 'bg-yellow-50'
          } rounded-xl shadow-lg p-6 border-2 ${
            comprehensiveData.manualScoreCheck.passed ? 'border-green-300' : 'border-yellow-300'
          }`}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            출입국 매뉴얼 기준 평가
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {comprehensiveData.manualScoreCheck.actualScore} / {comprehensiveData.manualScoreCheck.minimumRequired}점
              </p>
              <p className={`text-sm mt-1 ${
                comprehensiveData.manualScoreCheck.passed ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {comprehensiveData.manualScoreCheck.message}
              </p>
            </div>
            <div className={`text-4xl ${
              comprehensiveData.manualScoreCheck.passed ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {comprehensiveData.manualScoreCheck.passed ? '✅' : '⚠️'}
            </div>
          </div>
          {!comprehensiveData.manualScoreCheck.passed && (
            <p className="text-sm text-gray-600 mt-3">
              💡 팁: 학력, 직급, 경력을 통해 추가 점수를 획득할 수 있습니다.
            </p>
          )}
        </motion.div>
      )}

      {/* 상세 분석 카드 (고도화된 평가 결과 활용) */}
      {comprehensiveData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 상세 평가 분석</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 기본 자격 */}
            {comprehensiveData.basicQualification && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  기본 자격
                </h4>
                {Object.entries(comprehensiveData.basicQualification.details || {}).map(([key, detail]) => (
                  <div key={key} className="mb-2">
                    <p className="text-sm font-medium text-gray-700">{key}</p>
                    <p className="text-xs text-gray-600">{detail.message}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* 학술 전문성 */}
            {comprehensiveData.academicExpertise && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  학술 전문성
                </h4>
                {Object.entries(comprehensiveData.academicExpertise.details || {}).map(([key, detail]) => (
                  <div key={key} className="mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {key}: {detail.score}점
                    </p>
                    <p className="text-xs text-gray-600">{detail.message}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* 성장 가능성 */}
            {comprehensiveData.growthPotential && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  성장 잠재력
                </h4>
                <p className="text-2xl font-bold text-purple-600 mb-2">
                  +{comprehensiveData.growthPotential.totalPotential}점 가능
                </p>
                <div className="space-y-2">
                  {comprehensiveData.growthPotential.priorityActions?.slice(0, 3).map((action, idx) => (
                    <div key={idx} className="text-xs bg-purple-50 p-2 rounded">
                      <p className="font-medium text-gray-700">{action.action}</p>
                      <div className="flex justify-between text-gray-500 mt-1">
                        <span>{action.timeframe}</span>
                        <span className="font-semibold text-purple-600">+{action.potential}점</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * 실제 매뉴얼 점수 기준 환산
                </p>
              </div>
            )}
          </div>
          
          {/* 리스크 경고 */}
          {comprehensiveData.risks && comprehensiveData.risks.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                주의사항
              </h4>
              <div className="space-y-2">
                {comprehensiveData.risks.slice(0, 2).map((risk, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium text-amber-700">{risk.description}</p>
                    <p className="text-xs text-amber-600">→ {risk.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 추천사항 카드 */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-8 h-8 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            맞춤형 개선 제안
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`border-l-4 ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50' : 
                  rec.priority === 'medium' ? 'border-amber-500 bg-amber-50' : 
                  'border-indigo-500 bg-indigo-50'
                } p-4 rounded-r-lg hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className={`w-8 h-8 ${
                      rec.priority === 'high' ? 'bg-red-600' : 
                      rec.priority === 'medium' ? 'bg-amber-600' : 
                      'bg-indigo-600'
                    } text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                      {rec.priority === 'high' ? '!' : index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium">{rec.message || rec}</p>
                    {rec.actions && (
                      <ul className="mt-2 space-y-1">
                        {rec.actions.map((item, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-center">
                            <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {rec.expectedImprovement && (
                      <p className="mt-2 text-xs font-semibold text-green-600">
                        예상 개선: +{rec.expectedImprovement}점
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 다음 단계 CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white text-center"
      >
        <h3 className="text-2xl font-bold mb-4">준비되셨나요? 다음 단계로 진행하세요!</h3>
        <p className="mb-6 text-indigo-100">
          전문 법무대리인과 함께 더 확실한 비자 신청을 준비하세요.
        </p>
        <div className="flex justify-center gap-4">
          <button className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            추가 상담 받기
          </button>
          <button className="px-8 py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-400 transition-colors">
            법무대리인 매칭 진행
          </button>
        </div>
      </motion.div>
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

export default HopefulEvaluationResults;