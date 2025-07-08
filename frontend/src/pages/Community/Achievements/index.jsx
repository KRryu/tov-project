import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Lock, 
  Unlock,
  Zap,
  TrendingUp,
  Award,
  Gift,
  Target,
  Clock,
  Filter,
  Search,
  CheckCircle
} from 'lucide-react';
import { useBridgeJourney } from '../../../hooks/bridge/useBridgeJourney';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../../../constants/bridge/programs';
import { Card3D } from '../../../components/bridge';
import confetti from 'canvas-confetti';

const Achievements = () => {
  const { userJourney, loading } = useBridgeJourney();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // 업적 잠금 해제 애니메이션
  useEffect(() => {
    // 새로운 업적 확인 (실제 구현시 서버에서 받아온 데이터와 비교)
    const newAchievement = userJourney?.achievements?.find(
      a => !localStorage.getItem(`achievement_seen_${a.achievementId}`)
    );
    
    if (newAchievement) {
      // 컨페티 효과
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // 본 것으로 표시
      localStorage.setItem(`achievement_seen_${newAchievement.achievementId}`, 'true');
    }
  }, [userJourney?.achievements]);

  // 업적 필터링
  const getFilteredAchievements = () => {
    let achievements = Object.values(ACHIEVEMENTS);
    
    // 카테고리 필터
    if (selectedCategory !== 'all') {
      achievements = achievements.filter(a => a.category === selectedCategory);
    }
    
    // 검색어 필터
    if (searchTerm) {
      achievements = achievements.filter(a => 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 잠금 해제 필터
    if (showOnlyUnlocked) {
      achievements = achievements.filter(a => 
        userJourney?.achievements?.some(ua => ua.achievementId === a.id)
      );
    }
    
    return achievements;
  };

  // 업적 달성률 계산
  const calculateProgress = () => {
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const unlockedAchievements = userJourney?.achievements?.length || 0;
    return Math.round((unlockedAchievements / totalAchievements) * 100);
  };

  // 카테고리별 달성률
  const getCategoryProgress = (category) => {
    const categoryAchievements = Object.values(ACHIEVEMENTS).filter(a => a.category === category);
    const unlockedInCategory = categoryAchievements.filter(a => 
      userJourney?.achievements?.some(ua => ua.achievementId === a.id)
    ).length;
    return Math.round((unlockedInCategory / categoryAchievements.length) * 100);
  };

  // 다음 목표 업적 추천
  const getNextTargets = () => {
    const locked = Object.values(ACHIEVEMENTS).filter(a => 
      !userJourney?.achievements?.some(ua => ua.achievementId === a.id)
    );
    
    // 포인트가 낮은 순으로 정렬하여 쉬운 것부터 추천
    return locked.sort((a, b) => a.points - b.points).slice(0, 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">업적을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const filteredAchievements = getFilteredAchievements();
  const nextTargets = getNextTargets();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">업적 & 보상</h1>
        <p className="text-gray-600">여정을 통해 획득한 모든 업적을 확인하세요</p>
      </motion.div>

      {/* 전체 진행률 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card3D className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* 전체 진행률 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-8 h-8" />
                <h2 className="text-2xl font-bold">전체 달성률</h2>
              </div>
              <div className="relative">
                <div className="text-5xl font-bold mb-2">{calculateProgress()}%</div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateProgress()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-white h-3 rounded-full"
                  />
                </div>
                <p className="text-sm mt-2 opacity-90">
                  {userJourney?.achievements?.length || 0} / {Object.keys(ACHIEVEMENTS).length} 업적 달성
                </p>
              </div>
            </div>

            {/* 총 포인트 */}
            <div className="text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <Zap className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm opacity-80 mb-1">획득한 업적 포인트</p>
                <p className="text-3xl font-bold">
                  {userJourney?.achievements?.reduce((sum, a) => {
                    const achievement = Object.values(ACHIEVEMENTS).find(ach => ach.id === a.achievementId);
                    return sum + (achievement?.points || 0);
                  }, 0) || 0}
                </p>
              </div>
            </div>

            {/* 최근 업적 */}
            <div>
              <h3 className="text-lg font-semibold mb-3">최근 획득</h3>
              <div className="space-y-2">
                {userJourney?.achievements?.slice(-3).reverse().map((achievement, index) => {
                  const achInfo = Object.values(ACHIEVEMENTS).find(a => a.id === achievement.achievementId);
                  return achInfo ? (
                    <div key={index} className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                      <span className="text-2xl">{achInfo.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achInfo.name}</p>
                        <p className="text-xs opacity-80">+{achInfo.points} 포인트</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </Card3D>
      </motion.div>

      {/* 필터 및 검색 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6 bg-white rounded-xl shadow-lg p-4"
      >
        <div className="flex flex-wrap gap-4 items-center">
          {/* 카테고리 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">모든 카테고리</option>
              {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>
          </div>

          {/* 검색 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="업적 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* 필터 옵션 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyUnlocked}
              onChange={(e) => setShowOnlyUnlocked(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">획득한 업적만 보기</span>
          </label>
        </div>
      </motion.div>

      {/* 카테고리별 진행률 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
      >
        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, value]) => (
          <div
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`bg-white rounded-xl shadow-lg p-4 cursor-pointer transition-all ${
              selectedCategory === key ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <h4 className="font-medium text-gray-900 mb-2">{value.name}</h4>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {getCategoryProgress(key)}%
              </span>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                value.color === 'purple' ? 'bg-purple-100' :
                value.color === 'blue' ? 'bg-blue-100' :
                value.color === 'green' ? 'bg-green-100' :
                value.color === 'yellow' ? 'bg-yellow-100' :
                'bg-red-100'
              }`}>
                <div className={`w-6 h-6 rounded-full ${
                  value.color === 'purple' ? 'bg-purple-500' :
                  value.color === 'blue' ? 'bg-blue-500' :
                  value.color === 'green' ? 'bg-green-500' :
                  value.color === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* 업적 그리드 */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {filteredAchievements.map((achievement, index) => {
          const isUnlocked = userJourney?.achievements?.some(
            ua => ua.achievementId === achievement.id
          );
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={`relative cursor-pointer group ${!isUnlocked ? 'opacity-75' : ''}`}
            >
              <div className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${
                isUnlocked ? 'ring-2 ring-green-500' : ''
              }`}>
                {/* 잠금 상태 표시 */}
                <div className="absolute top-3 right-3">
                  {isUnlocked ? (
                    <Unlock className="w-5 h-5 text-green-500" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                {/* 업적 아이콘 */}
                <div className={`text-5xl mb-3 ${!isUnlocked ? 'grayscale' : ''}`}>
                  {achievement.icon}
                </div>
                
                {/* 업적 정보 */}
                <h3 className="font-bold text-gray-900 mb-1">{achievement.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                
                {/* 포인트 */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isUnlocked ? 'text-purple-600' : 'text-gray-400'
                  }`}>
                    +{achievement.points} 포인트
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    achievement.category === 'program' ? 'bg-purple-100 text-purple-800' :
                    achievement.category === 'activity' ? 'bg-blue-100 text-blue-800' :
                    achievement.category === 'social' ? 'bg-green-100 text-green-800' :
                    achievement.category === 'level' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {ACHIEVEMENT_CATEGORIES[achievement.category].name}
                  </span>
                </div>
                
                {/* 호버 효과 */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-gray-900/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-700">클릭하여 자세히 보기</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 다음 목표 추천 */}
      {nextTargets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            다음 목표 추천
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {nextTargets.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedAchievement(achievement)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                    <p className="text-sm font-medium text-purple-600 mt-2">
                      +{achievement.points} 포인트
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 업적 상세 모달 */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">{selectedAchievement.icon}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedAchievement.name}
                </h2>
                <p className="text-gray-600 mb-4">{selectedAchievement.description}</p>
                
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">보상 포인트</span>
                    <span className="font-bold text-purple-600">+{selectedAchievement.points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">카테고리</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedAchievement.category === 'program' ? 'bg-purple-100 text-purple-800' :
                      selectedAchievement.category === 'activity' ? 'bg-blue-100 text-blue-800' :
                      selectedAchievement.category === 'social' ? 'bg-green-100 text-green-800' :
                      selectedAchievement.category === 'level' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {ACHIEVEMENT_CATEGORIES[selectedAchievement.category].name}
                    </span>
                  </div>
                </div>
                
                {userJourney?.achievements?.some(ua => ua.achievementId === selectedAchievement.id) ? (
                  <div className="bg-green-100 text-green-800 rounded-xl p-4">
                    <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">획득 완료!</p>
                    <p className="text-sm mt-1">
                      {new Date(
                        userJourney.achievements.find(
                          ua => ua.achievementId === selectedAchievement.id
                        ).awardedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-600 rounded-xl p-4">
                    <Lock className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">미획득</p>
                    <p className="text-sm mt-1">조건을 달성하면 자동으로 획득됩니다</p>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-full font-medium hover:bg-purple-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Achievements;