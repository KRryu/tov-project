import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'react-toastify';
import { Calendar, MapPin, Users, Heart, Star, Globe } from 'lucide-react';

const BuddyProgram = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [buddyMatches, setBuddyMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [, setLoading] = useState(true);

  // 탭 정보
  const tabs = [
    { id: 'about', label: '프로그램 소개' },
    { id: 'matching', label: '버디 매칭' },
    { id: 'activities', label: '활동 & 이벤트' },
    { id: 'stories', label: '버디 스토리' }
  ];

  useEffect(() => {
    loadProgramData();
  }, []);

  const loadProgramData = async () => {
    try {
      // TODO: 실제 API 호출로 변경
      setBuddyMatches([
        {
          id: 1,
          name: '김민수',
          age: 28,
          occupation: '소프트웨어 개발자',
          interests: ['영화', '카페', '하이킹'],
          languages: ['한국어', '영어'],
          matchRate: 92,
          bio: '외국인 친구와 문화 교류를 하고 싶어요!',
          avatar: '👨‍💻'
        },
        {
          id: 2,
          name: '이지은',
          age: 25,
          occupation: '대학원생',
          interests: ['K-POP', '요리', '여행'],
          languages: ['한국어', '영어', '일본어'],
          matchRate: 88,
          bio: '함께 한국 문화를 탐험해요!',
          avatar: '👩‍🎓'
        }
      ]);

      setEvents([
        {
          id: 1,
          title: '한강 피크닉 모임',
          date: '2024-02-03',
          time: '14:00',
          location: '한강공원',
          participants: 12,
          maxParticipants: 20
        },
        {
          id: 2,
          title: '전통시장 투어',
          date: '2024-02-10',
          time: '10:00',
          location: '광장시장',
          participants: 8,
          maxParticipants: 15
        }
      ]);
    } catch (error) {
      console.error('Failed to load program data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForMatching = () => {
    if (!isAuthenticated) {
      toast.info('버디 매칭을 위해 로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    // TODO: 매칭 신청 처리
    toast.success('버디 매칭 신청이 완료되었습니다!');
  };

  const handleJoinEvent = (eventId) => {
    if (!isAuthenticated) {
      toast.info('이벤트 참여를 위해 로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    // TODO: 이벤트 참여 처리
    toast.success('이벤트 참여 신청이 완료되었습니다!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-400 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <Heart className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4">BUDDY 프로그램</h1>
            <p className="text-xl text-white/90">
              한국인 친구와 1:1 매칭으로 진정한 우정을 만들어보세요
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* About Tab */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* 프로그램 소개 */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                BUDDY 프로그램이란?
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                BUDDY 프로그램은 한국에 거주하는 외국인과 한국인을 1:1로 매칭하여 
                진정한 우정을 만들어가는 문화 교류 프로그램입니다. 
                공통 관심사를 기반으로 최적의 버디를 찾아드리며, 
                다양한 활동을 통해 서로의 문화를 이해하고 언어를 교환할 수 있습니다.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">1:1 매칭</h3>
                  <p className="text-sm text-gray-600">
                    AI 기반 매칭 시스템으로 최적의 버디를 찾아드려요
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-pink-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">정기 모임</h3>
                  <p className="text-sm text-gray-600">
                    매주 다양한 테마의 그룹 활동과 이벤트가 준비되어 있어요
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">문화 교류</h3>
                  <p className="text-sm text-gray-600">
                    서로의 문화를 공유하며 글로벌 네트워크를 만들어요
                  </p>
                </div>
              </div>
            </div>

            {/* 참여 방법 */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                참여 방법
              </h2>
              <div className="space-y-4">
                {[
                  { step: 1, title: '프로필 작성', desc: '관심사와 선호도를 입력해주세요' },
                  { step: 2, title: '버디 매칭', desc: 'AI가 최적의 버디를 추천해드려요' },
                  { step: 3, title: '첫 만남', desc: '온라인 또는 오프라인으로 첫 만남을 가져요' },
                  { step: 4, title: '정기 활동', desc: '함께 다양한 활동을 즐기며 우정을 쌓아가요' }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleApplyForMatching}
                className="mt-6 w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                버디 매칭 신청하기
              </button>
            </div>
          </motion.div>
        )}

        {/* Matching Tab */}
        {activeTab === 'matching' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                추천 버디
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {buddyMatches.map((buddy) => (
                  <div key={buddy.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{buddy.avatar}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{buddy.name}</h3>
                          <p className="text-sm text-gray-600">{buddy.age}세, {buddy.occupation}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-500">{buddy.matchRate}%</div>
                        <p className="text-xs text-gray-500">매칭률</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{buddy.bio}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          관심사: {buddy.interests.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          언어: {buddy.languages.join(', ')}
                        </span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors">
                      매칭 신청
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                예정된 활동
              </h2>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {event.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {event.participants}/{event.maxParticipants}명
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinEvent(event.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        참여하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stories Tab */}
        {activeTab === 'stories' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                버디 스토리
              </h2>
              <div className="space-y-6">
                {[
                  {
                    id: 1,
                    author: 'Sarah (미국)',
                    buddy: '지민',
                    story: '지민이와 만난 지 6개월이 되었어요. 처음엔 언어 장벽이 있었지만, 이제는 서로의 가장 친한 친구가 되었답니다!',
                    rating: 5,
                    date: '2024-01-15'
                  },
                  {
                    id: 2,
                    author: 'Yuki (일본)',
                    buddy: '현우',
                    story: '현우 덕분에 한국 생활이 정말 즐거워졌어요. 매주 새로운 맛집을 탐험하고 있어요!',
                    rating: 5,
                    date: '2024-01-10'
                  }
                ].map((story) => (
                  <div key={story.id} className="border-l-4 border-red-400 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{story.author}</p>
                        <p className="text-sm text-gray-600">버디: {story.buddy}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(story.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{story.story}</p>
                    <p className="text-xs text-gray-500">{story.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BuddyProgram;