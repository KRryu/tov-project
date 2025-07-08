import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Trophy, 
  Clock, 
  CheckCircle, 
  Circle,
  ChevronRight,
  Star,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { useBridgeJourney } from '../../../hooks/bridge/useBridgeJourney';
import { BRIDGE_PROGRAMS, JOURNEY_LEVELS } from '../../../constants/bridge/programs';
import { Card3D } from '../../../components/bridge';

const MyJourney = () => {
  const navigate = useNavigate();
  const { userJourney, loading, refreshJourney } = useBridgeJourney();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // 페이지 진입 시 최신 데이터 가져오기
    refreshJourney();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">여정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!userJourney) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">여정 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/community')}
            className="text-purple-600 hover:text-purple-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 현재 레벨 정보 가져오기
  const currentLevelInfo = Object.values(JOURNEY_LEVELS).find(
    level => level.name === userJourney.level
  ) || JOURNEY_LEVELS.NEWCOMER;

  // 다음 레벨까지의 진행률 계산
  const calculateLevelProgress = () => {
    const currentPoints = userJourney.points;
    const currentMin = currentLevelInfo.minPoints;
    const currentMax = currentLevelInfo.maxPoints || 9999;
    
    const progress = ((currentPoints - currentMin) / (currentMax - currentMin)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // 여정 단계 정보
  const journeySteps = [
    { step: 1, title: '시작', description: '한국 도착 & 적응' },
    { step: 2, title: '탐험', description: '문화 체험 & 친구 만들기' },
    { step: 3, title: '성장', description: '언어 습득 & 네트워크 확장' },
    { step: 4, title: '정착', description: '전문가 & 멘토 되기' }
  ];

  const tabs = [
    { id: 'overview', label: '전체 보기', icon: MapPin },
    { id: 'programs', label: '프로그램 진행', icon: Target },
    { id: 'achievements', label: '업적', icon: Trophy },
    { id: 'activity', label: '활동 기록', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">나의 여정</h1>
        <p className="text-gray-600">한국 정착 여정의 모든 기록이 여기에 있습니다</p>
      </motion.div>

      {/* 레벨 & 포인트 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card3D className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-5xl">{currentLevelInfo.badge}</div>
                <div>
                  <p className="text-purple-200 text-sm">CURRENT LEVEL</p>
                  <h2 className="text-3xl font-bold">{currentLevelInfo.title}</h2>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-purple-200">레벨 진행도</span>
                  <span className="text-sm font-bold">{calculateLevelProgress().toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateLevelProgress()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-white h-3 rounded-full relative"
                  >
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm mb-1">총 포인트</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-300" />
                    {userJourney.points}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm mb-1">완료 프로그램</p>
                  <p className="text-2xl font-bold">
                    {userJourney.completedPrograms?.length || 0}/4
                  </p>
                </div>
              </div>
            </div>

            {/* 여정 단계 표시 */}
            <div className="relative">
              <div className="flex items-center justify-between relative">
                {journeySteps.map((step, index) => (
                  <div key={step.step} className="relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                        userJourney.currentStep >= step.step
                          ? 'bg-white text-purple-600'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {userJourney.currentStep > step.step ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        step.step
                      )}
                    </motion.div>
                    <p className="text-xs text-center mt-2 text-white/80 font-medium">
                      {step.title}
                    </p>
                  </div>
                ))}
                
                {/* Progress Line */}
                <div className="absolute top-8 left-0 right-0 h-1 bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((userJourney.currentStep - 1) / 3) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card3D>
      </motion.div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 컨텐츠 */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* 진행 중인 프로그램 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Circle className="w-5 h-5 text-blue-600" />
                진행 중인 프로그램
              </h3>
              {userJourney.inProgressPrograms?.length > 0 ? (
                <div className="space-y-3">
                  {userJourney.inProgressPrograms.map((program) => {
                    const programInfo = BRIDGE_PROGRAMS[program.programId];
                    return (
                      <div
                        key={program.programId}
                        onClick={() => navigate(`/community/${program.programId.toLowerCase()}`)}
                        className="cursor-pointer hover:bg-gray-50 rounded-lg p-3 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{programInfo?.icon}</span>
                            <span className="font-medium">{programInfo?.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${program.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">진행 중인 프로그램이 없습니다</p>
              )}
            </div>

            {/* 최근 업적 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                최근 업적
              </h3>
              {userJourney.achievements?.length > 0 ? (
                <div className="space-y-3">
                  {userJourney.achievements.slice(-3).reverse().map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-gray-500">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">아직 획득한 업적이 없습니다</p>
              )}
            </div>

            {/* 다음 목표 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                다음 목표
              </h3>
              <div className="space-y-3">
                {userJourney.completedPrograms?.length < 4 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900 text-sm">
                      프로그램 {4 - userJourney.completedPrograms.length}개 더 완료하기
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      모든 프로그램을 완료하고 Journey Master가 되세요!
                    </p>
                  </div>
                )}
                {currentLevelInfo.maxPoints && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900 text-sm">
                      {currentLevelInfo.maxPoints - userJourney.points} 포인트 더 모으기
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      다음 레벨까지 조금만 더 힘내세요!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="grid md:grid-cols-2 gap-6">
            {Object.values(BRIDGE_PROGRAMS).map((program) => {
              const isCompleted = userJourney.completedPrograms?.some(
                p => p.programId === program.id
              );
              const inProgress = userJourney.inProgressPrograms?.find(
                p => p.programId === program.id
              );
              
              return (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/community/${program.id.toLowerCase()}`)}
                  className="cursor-pointer"
                >
                  <div className={`relative bg-white rounded-xl shadow-lg overflow-hidden ${
                    isCompleted ? 'ring-2 ring-green-500' : ''
                  }`}>
                    <div className={`h-2 ${program.color}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{program.icon}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{program.name}</h3>
                            <p className="text-sm text-gray-600">{program.title}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            완료
                          </div>
                        )}
                        {inProgress && (
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            진행중
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-4">{program.description}</p>
                      
                      {inProgress && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">진행률</span>
                            <span className="font-medium">{inProgress.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                              style={{ width: `${inProgress.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {!isCompleted && !inProgress && (
                        <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-all">
                          시작하기
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-3 gap-6">
              {userJourney.achievements?.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-3">{achievement.icon}</div>
                  <h4 className="font-bold text-gray-900">{achievement.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(achievement.awardedAt).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
            {(!userJourney.achievements || userJourney.achievements.length === 0) && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">아직 획득한 업적이 없습니다</p>
                <p className="text-sm text-gray-400 mt-2">
                  프로그램을 완료하고 업적을 획득하세요!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-4">
              {userJourney.activityHistory?.slice(-10).reverse().map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    {activity.type === 'program_start' && <Star className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'program_complete' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {activity.type === 'achievement_earned' && <Trophy className="w-5 h-5 text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.type === 'program_start' && `${activity.programId} 프로그램 시작`}
                      {activity.type === 'program_complete' && `${activity.programId} 프로그램 완료`}
                      {activity.type === 'achievement_earned' && `업적 획득: ${activity.achievementName}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(!userJourney.activityHistory || userJourney.activityHistory.length === 0) && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">아직 활동 기록이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MyJourney;