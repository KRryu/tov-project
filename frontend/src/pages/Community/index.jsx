import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  Compass, 
  Gift,
  Sparkles,
  Trophy
} from 'lucide-react';
import { 
  Card3D, 
  AnimatedBackground, 
  QuestCard, 
  ProgramCard,
  Sidebar 
} from '../../components/bridge';
import { BRIDGE_PROGRAMS } from '../../constants/bridge/programs';
import { useBridgeJourney } from '../../hooks/bridge/useBridgeJourney';

const BridgeCommunity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Use Bridge journey hook
  const { userJourney } = useBridgeJourney();

  // 퀘스트 시스템
  const quests = [
    {
      id: 'first_buddy',
      title: '첫 번째 친구 만들기',
      description: 'BUDDY 프로그램에서 첫 매칭을 완료하세요',
      reward: { points: 50, badge: '🤝' },
      progress: 0,
      total: 1
    },
    {
      id: 'language_warrior',
      title: '언어 전사',
      description: 'KOKO 프로그램에서 5개 레슨을 완료하세요',
      reward: { points: 100, badge: '🗣️' },
      progress: 2,
      total: 5
    },
    {
      id: 'culture_explorer',
      title: '문화 탐험가',
      description: '3개의 다른 문화 이벤트에 참여하세요',
      reward: { points: 75, badge: '🌏' },
      progress: 1,
      total: 3
    }
  ];


  const handleQuestClick = (quest) => {
    // 퀘스트 관련 페이지로 이동
    if (quest.id === 'first_buddy') navigate('/community/buddy');
    else if (quest.id === 'language_warrior') navigate('/community/koko');
    else if (quest.id === 'culture_explorer') navigate('/community/events');
  };

  // 메인 페이지인지 확인
  const isMainPage = location.pathname === '/community' || location.pathname === '/community/';

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="flex">
        <Sidebar 
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
          userJourney={userJourney}
          isAuthenticated={isAuthenticated}
        />

        {/* 메인 컨텐츠 */}
        <main className={`flex-1 ${isSidebarOpen ? 'ml-64' : ''} transition-all duration-300`}>
          {isMainPage ? (
            <div className="min-h-screen p-8">
              {/* 히어로 섹션 */}
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-12 relative"
              >
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-red-600 via-purple-600 to-blue-600 p-1">
                  <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                      {/* 왼쪽 컨텐츠 */}
                      <div className="p-12 relative z-10">
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/20 to-purple-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-red-500/30"
                          >
                            <Sparkles className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium text-red-200">LEVEL UP YOUR LIFE IN KOREA</span>
                          </motion.div>
                          
                          <h1 className="text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
                            한국 정착
                            <br />
                            <span className="text-white">대모험</span>
                          </h1>
                          
                          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                            Bridge Community와 함께하는 게임같은 한국 생활!
                            <br />
                            퀘스트를 완료하고, 레벨업하고, 친구를 만나세요.
                          </p>
                          
                          <div className="flex flex-wrap gap-4 mb-8">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <span>2,483명 온라인</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span>이번 주 152명 레벨업</span>
                            </div>
                          </div>
                          
                          {!isAuthenticated ? (
                            <motion.button
                              onClick={() => navigate('/register')}
                              className="relative group"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-purple-600 rounded-full blur-lg group-hover:blur-xl transition-all" />
                              <div className="relative bg-gradient-to-r from-red-500 to-purple-500 text-white px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3">
                                <span>START GAME</span>
                                <motion.span
                                  animate={{ x: [0, 5, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                  →
                                </motion.span>
                              </div>
                            </motion.button>
                          ) : (
                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-sm text-gray-400 mb-1">YOUR LEVEL</p>
                                <p className="text-2xl font-bold text-white">{userJourney?.level || 'Newcomer'}</p>
                              </div>
                              <div className="h-12 w-px bg-gray-700" />
                              <div>
                                <p className="text-sm text-gray-400 mb-1">TOTAL POINTS</p>
                                <p className="text-2xl font-bold text-purple-400">{userJourney?.points || 0}</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </div>
                      
                      {/* 오른쪽 이미지 */}
                      <div className="relative h-[600px] lg:h-full">
                        <motion.div
                          initial={{ scale: 1.1, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="absolute inset-0"
                        >
                          <img 
                            src="/images/bridge/hero-gamer.jpg" 
                            alt="Bridge Community Gamers"
                            className="w-full h-full object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/50" />
                        </motion.div>
                        
                        {/* 플로팅 UI 요소들 */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                          className="absolute top-10 right-10 bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-purple-500/30"
                        >
                          <p className="text-xs text-purple-300 mb-1">NEXT QUEST</p>
                          <p className="text-sm font-bold text-white">친구 3명과 만나기</p>
                          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{width: '60%'}} />
                          </div>
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 }}
                          className="absolute bottom-10 left-10 bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-red-500/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                              <span className="text-xl">🎮</span>
                            </div>
                            <div>
                              <p className="text-xs text-red-300">NEW ACHIEVEMENT</p>
                              <p className="text-sm font-bold text-white">VR Explorer</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* TOVmate 협업 섹션 */}
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-50 to-blue-50 p-8">
                  <div className="grid lg:grid-cols-2 gap-8 items-center">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        TOVmate와 함께하는 특별한 여정
                      </h2>
                      <p className="text-lg text-gray-700 mb-4">
                        Bridge Community는 <span className="font-semibold text-purple-600">TOVmate</span>와의 
                        특별한 파트너십을 통해 외국인들의 한국 정착을 돕습니다.
                      </p>
                      <p className="text-gray-600 mb-6">
                        비자 서비스부터 커뮤니티 활동까지, TOVmate의 전문적인 지원과 
                        Bridge의 따뜻한 커뮤니티가 만나 여러분의 성공적인 한국 생활을 완성합니다.
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-3">✓</span>
                          <span className="text-gray-700">TOVmate의 전문 비자 상담 서비스 연계</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-3">✓</span>
                          <span className="text-gray-700">Bridge 멤버 전용 특별 혜택 제공</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-purple-600 mr-3">✓</span>
                          <span className="text-gray-700">정착 전 과정을 아우르는 원스톱 솔루션</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <Card3D className="bg-white shadow-xl p-8">
                        <div className="text-center">
                          <div className="text-4xl mb-4">🤝</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            TOVmate X Bridge
                          </h3>
                          <p className="text-gray-600">
                            전문성과 따뜻함이 만나는 곳
                          </p>
                        </div>
                      </Card3D>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* 사랑 기반 커뮤니티 섹션 */}
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    사랑으로 연결되는 공동체
                  </h2>
                  <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                    Bridge Community는 <span className="font-semibold text-red-500">기독교의 사랑</span>을 
                    기반으로 움직이는 특별한 커뮤니티입니다.
                  </p>
                  <p className="text-gray-600 max-w-3xl mx-auto mt-4">
                    "네 이웃을 네 자신과 같이 사랑하라"는 말씀처럼, 
                    우리는 모든 외국인 이웃들을 진심으로 환영하고 섬깁니다.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-red-50 rounded-xl p-6 text-center"
                  >
                    <div className="text-3xl mb-4">❤️</div>
                    <h3 className="font-bold text-gray-900 mb-2">사랑</h3>
                    <p className="text-sm text-gray-600">
                      조건 없는 사랑으로 모든 이를 환영합니다
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-blue-50 rounded-xl p-6 text-center"
                  >
                    <div className="text-3xl mb-4">🙏</div>
                    <h3 className="font-bold text-gray-900 mb-2">섬김</h3>
                    <p className="text-sm text-gray-600">
                      겸손한 마음으로 이웃을 섬기고 돕습니다
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-green-50 rounded-xl p-6 text-center"
                  >
                    <div className="text-3xl mb-4">🌱</div>
                    <h3 className="font-bold text-gray-900 mb-2">성장</h3>
                    <p className="text-sm text-gray-600">
                      함께 성장하며 더 나은 공동체를 만들어갑니다
                    </p>
                  </motion.div>
                </div>
              </motion.section>

              {/* 일일 퀘스트 */}
              {isAuthenticated && (
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-12"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Gift className="w-6 h-6 text-purple-600" />
                      오늘의 퀘스트
                    </h2>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full"
                    >
                      <span className="text-sm text-purple-700">완료 시 보너스</span>
                      <span className="text-sm font-bold text-purple-800">+50 XP</span>
                    </motion.div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {quests.map((quest, index) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        onClick={handleQuestClick}
                        index={index}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* 프로그램 카드 */}
              <motion.section
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Compass className="w-6 h-6 text-purple-600" />
                    모험 프로그램
                  </h2>
                  <p className="text-gray-600">각 프로그램을 완료하고 한국 생활 마스터가 되어보세요!</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.values(BRIDGE_PROGRAMS).map((program, index) => (
                    <ProgramCard
                      key={program.id}
                      program={{
                        ...program,
                        desc: program.title
                      }}
                      onClick={() => navigate(`/community/${program.id.toLowerCase()}`)}
                      index={index}
                    />
                  ))}
                </div>
              </motion.section>
            </div>
          ) : (
            <div className="min-h-screen">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BridgeCommunity;