import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useBridgeJourney } from '../../../hooks/bridge/useBridgeJourney';
import { BRIDGE_PROGRAMS } from '../../../constants/bridge/programs';
import { 
  Sparkles, 
  Users, 
  Calendar, 
  Award,
  Clock,
  ChevronRight,
  Play,
  CheckCircle,
  Lock,
  Unlock,
  TrendingUp,
  Heart,
  MessageCircle,
  Globe
} from 'lucide-react';
import { Card3D } from '../../../components/bridge';
import { toast } from 'react-toastify';

const ProgramExplore = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { userJourney, startProgram, loading } = useBridgeJourney();
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // 프로그램별 상세 정보
  const programDetails = {
    BUDDY: {
      duration: '3개월',
      difficulty: '쉬움',
      participants: '2,341명',
      completion: '89%',
      schedule: '주 1-2회 만남',
      highlights: [
        { icon: Users, text: '1:1 한국인 친구 매칭' },
        { icon: MessageCircle, text: '언어 교환 및 문화 체험' },
        { icon: Calendar, text: '정기 모임 및 이벤트' },
        { icon: Heart, text: '평생 친구 만들기' }
      ],
      testimonial: {
        text: "BUDDY 프로그램으로 진짜 한국 친구를 만났어요! 이제는 가족같은 사이가 되었습니다.",
        author: "Sarah from USA",
        rating: 5
      }
    },
    KOKO: {
      duration: '6개월',
      difficulty: '보통',
      participants: '1,892명',
      completion: '76%',
      schedule: '주 3회 수업',
      highlights: [
        { icon: Globe, text: '실생활 한국어 마스터' },
        { icon: TrendingUp, text: '레벨별 맞춤 학습' },
        { icon: Award, text: '수료증 발급' },
        { icon: Users, text: '학습 커뮤니티' }
      ],
      testimonial: {
        text: "체계적인 커리큘럼과 재미있는 수업으로 한국어 실력이 정말 많이 늘었어요!",
        author: "Yuki from Japan",
        rating: 5
      }
    },
    POPPOP: {
      duration: '2개월',
      difficulty: '쉬움',
      participants: '3,127명',
      completion: '92%',
      schedule: '주 2회 활동',
      highlights: [
        { icon: Sparkles, text: 'K-POP 댄스 클래스' },
        { icon: Calendar, text: '콘서트 & 팬미팅 정보' },
        { icon: Users, text: 'K-POP 팬 네트워크' },
        { icon: Heart, text: '아티스트 응원 활동' }
      ],
      testimonial: {
        text: "K-POP을 통해 한국 문화를 더 깊이 이해하고 많은 친구들을 만났어요!",
        author: "Maria from Brazil",
        rating: 5
      }
    },
    TALKTALK: {
      duration: '자유',
      difficulty: '쉬움',
      participants: '4,521명',
      completion: '자유참여',
      schedule: '자유로운 일정',
      highlights: [
        { icon: MessageCircle, text: '자유로운 소통 공간' },
        { icon: Globe, text: '언어 교환 파트너' },
        { icon: TrendingUp, text: '자기계발 프로그램' },
        { icon: Award, text: '비자 & 생활 정보' }
      ],
      testimonial: {
        text: "다양한 주제로 대화하면서 한국 생활에 필요한 정보를 많이 얻었어요!",
        author: "Tom from UK",
        rating: 5
      }
    }
  };

  const handleStartProgram = async (programId) => {
    if (!isAuthenticated) {
      toast.info('프로그램 참여를 위해 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    setIsStarting(true);
    try {
      await startProgram(programId);
      toast.success('프로그램을 시작했습니다!');
      navigate(`/community/${programId.toLowerCase()}`);
    } catch (error) {
      toast.error('프로그램 시작에 실패했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  const getProgramStatus = (programId) => {
    if (!userJourney) return 'not_started';
    
    if (userJourney.completedPrograms?.some(p => p.programId === programId)) {
      return 'completed';
    }
    
    if (userJourney.inProgressPrograms?.some(p => p.programId === programId)) {
      return 'in_progress';
    }
    
    return 'not_started';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">프로그램 탐험</h1>
        <p className="text-gray-600">Bridge Community의 4가지 핵심 프로그램을 자세히 알아보세요</p>
      </motion.div>

      {/* 프로그램 요약 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-4 gap-4 mb-8"
      >
        {Object.values(BRIDGE_PROGRAMS).map((program, index) => {
          const status = getProgramStatus(program.id);
          const details = programDetails[program.id];
          
          return (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * (index + 1) }}
              onClick={() => setSelectedProgram(program.id)}
              className="cursor-pointer"
            >
              <div className={`relative bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all ${
                selectedProgram === program.id ? 'ring-2 ring-purple-500' : ''
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{program.icon}</span>
                  {status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {status === 'in_progress' && (
                    <Clock className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                
                <h3 className="font-bold text-lg text-gray-900 mb-1">{program.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{program.title}</p>
                
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{details.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{details.participants}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 선택된 프로그램 상세 정보 */}
      <AnimatePresence mode="wait">
        {selectedProgram && (
          <motion.div
            key={selectedProgram}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <Card3D className={`bg-gradient-to-br ${BRIDGE_PROGRAMS[selectedProgram].color} rounded-2xl overflow-hidden`}>
              <div className="grid lg:grid-cols-2 gap-8 p-8">
                {/* 왼쪽: 프로그램 정보 */}
                <div className="text-white">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-6xl">{BRIDGE_PROGRAMS[selectedProgram].icon}</span>
                      <div>
                        <h2 className="text-3xl font-bold">{BRIDGE_PROGRAMS[selectedProgram].name}</h2>
                        <p className="text-lg opacity-90">{BRIDGE_PROGRAMS[selectedProgram].title}</p>
                      </div>
                    </div>
                    
                    <p className="text-lg mb-6 leading-relaxed opacity-95">
                      {BRIDGE_PROGRAMS[selectedProgram].description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-80 mb-1">기간</p>
                        <p className="text-xl font-bold">{programDetails[selectedProgram].duration}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-80 mb-1">난이도</p>
                        <p className="text-xl font-bold">{programDetails[selectedProgram].difficulty}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-80 mb-1">참여자</p>
                        <p className="text-xl font-bold">{programDetails[selectedProgram].participants}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-sm opacity-80 mb-1">완료율</p>
                        <p className="text-xl font-bold">{programDetails[selectedProgram].completion}</p>
                      </div>
                    </div>
                    
                    {/* 액션 버튼 */}
                    {getProgramStatus(selectedProgram) === 'not_started' && (
                      <motion.button
                        onClick={() => handleStartProgram(selectedProgram)}
                        disabled={isStarting}
                        className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold text-lg hover:shadow-xl transition-all flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isStarting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                            시작 중...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            지금 시작하기
                          </>
                        )}
                      </motion.button>
                    )}
                    
                    {getProgramStatus(selectedProgram) === 'in_progress' && (
                      <motion.button
                        onClick={() => navigate(`/community/${selectedProgram.toLowerCase()}`)}
                        className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold text-lg hover:shadow-xl transition-all flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        계속하기
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    )}
                    
                    {getProgramStatus(selectedProgram) === 'completed' && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 inline-flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">완료됨</span>
                      </div>
                    )}
                  </motion.div>
                </div>
                
                {/* 오른쪽: 특징 및 후기 */}
                <div>
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
                  >
                    <h3 className="text-xl font-bold text-white mb-4">주요 특징</h3>
                    <div className="space-y-3">
                      {programDetails[selectedProgram].highlights.map((highlight, index) => {
                        const Icon = highlight.icon;
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex items-center gap-3 text-white"
                          >
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span>{highlight.text}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl p-6 shadow-xl"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-3">참가자 후기</h3>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">😊</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 mb-2 italic">
                          "{programDetails[selectedProgram].testimonial.text}"
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-600 font-medium">
                            - {programDetails[selectedProgram].testimonial.author}
                          </p>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-yellow-400">★</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Card3D>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 프로그램 비교 테이블 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-6">프로그램 한눈에 비교하기</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">프로그램</th>
                <th className="text-center py-3 px-4">기간</th>
                <th className="text-center py-3 px-4">난이도</th>
                <th className="text-center py-3 px-4">일정</th>
                <th className="text-center py-3 px-4">참여자</th>
                <th className="text-center py-3 px-4">상태</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(BRIDGE_PROGRAMS).map((program) => {
                const details = programDetails[program.id];
                const status = getProgramStatus(program.id);
                
                return (
                  <tr key={program.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{program.icon}</span>
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-sm text-gray-600">{program.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">{details.duration}</td>
                    <td className="text-center py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        details.difficulty === '쉬움' ? 'bg-green-100 text-green-800' :
                        details.difficulty === '보통' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {details.difficulty}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4 text-sm">{details.schedule}</td>
                    <td className="text-center py-4 px-4">{details.participants}</td>
                    <td className="text-center py-4 px-4">
                      {status === 'completed' && (
                        <span className="flex items-center justify-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          완료
                        </span>
                      )}
                      {status === 'in_progress' && (
                        <span className="flex items-center justify-center gap-1 text-blue-600">
                          <Clock className="w-4 h-4" />
                          진행중
                        </span>
                      )}
                      {status === 'not_started' && (
                        <span className="flex items-center justify-center gap-1 text-gray-400">
                          <Lock className="w-4 h-4" />
                          미시작
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 추천 메시지 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-center"
      >
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
          <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            어떤 프로그램부터 시작할지 고민되시나요?
          </h3>
          <p className="text-gray-700 mb-6">
            처음이라면 <strong>BUDDY</strong> 프로그램으로 한국인 친구를 만들어보는 것을 추천합니다!
          </p>
          {!selectedProgram && (
            <button
              onClick={() => setSelectedProgram('BUDDY')}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-medium hover:bg-purple-700 transition-all"
            >
              BUDDY 프로그램 자세히 보기
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProgramExplore;