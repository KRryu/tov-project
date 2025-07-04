import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, ChevronRight } from 'lucide-react';
import EventCalendar from './components/EventCalendar';
import MeetupManager from './components/MeetupManager';
import TeamSection from './components/TeamSection';
import UpcomingEvents from './components/UpcomingEvents';

const BridgeClub = () => {
  const [activeTab, setActiveTab] = useState('calendar');

  const tabs = [
    { id: 'calendar', label: '이벤트 캘린더', icon: Calendar },
    { id: 'meetups', label: 'Meetup 관리', icon: Users },
    { id: 'team', label: '운영진 소개', icon: Users }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <motion.div 
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl">🌉</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bridge Club</h1>
            <p className="text-purple-100">한국과 세계를 잇는 글로벌 커뮤니티</p>
          </div>
        </div>
        
        <p className="text-white/90 leading-relaxed mb-6">
          Bridge Club은 다양한 문화적 배경을 가진 사람들이 만나 교류하고, 
          함께 성장하는 글로벌 커뮤니티입니다. 정기적인 모임과 특별 이벤트를 통해 
          네트워킹과 문화 교류의 장을 제공합니다.
        </p>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            <Users className="w-4 h-4" />
            <span>500+ 활성 멤버</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            <Calendar className="w-4 h-4" />
            <span>매주 2회 정기 모임</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
            <MapPin className="w-4 h-4" />
            <span>서울 & 온라인</span>
          </div>
        </div>
      </motion.div>

      {/* 빠른 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm text-gray-600 mb-2">이번 달 이벤트</h3>
          <p className="text-2xl font-bold text-gray-900">12개</p>
          <p className="text-xs text-green-600 mt-1">+3 from last month</p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm text-gray-600 mb-2">총 참가 신청</h3>
          <p className="text-2xl font-bold text-gray-900">248명</p>
          <p className="text-xs text-blue-600 mt-1">평균 20명/이벤트</p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm text-gray-600 mb-2">활성 Meetup</h3>
          <p className="text-2xl font-bold text-gray-900">8개</p>
          <p className="text-xs text-purple-600 mt-1">3개 모집중</p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm text-gray-600 mb-2">운영진</h3>
          <p className="text-2xl font-bold text-gray-900">15명</p>
          <p className="text-xs text-orange-600 mt-1">5개 팀</p>
        </motion.div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'calendar' && <EventCalendar />}
          {activeTab === 'meetups' && <MeetupManager />}
          {activeTab === 'team' && <TeamSection />}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 다가오는 이벤트 */}
          <UpcomingEvents />

          {/* Bridge Club 안내 */}
          <motion.div 
            className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-semibold text-gray-900 mb-3">Bridge Club 가입 안내</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>매월 첫째, 셋째 주 토요일 정기 모임</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>Language Exchange, Culture Workshop 등 다양한 프로그램</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600">•</span>
                <span>온/오프라인 하이브리드 운영</span>
              </li>
            </ul>
            <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
              Bridge Club 가입하기
            </button>
          </motion.div>

          {/* 문의하기 */}
          <motion.div 
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-semibold text-gray-900 mb-3">문의하기</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bridge Club 활동에 대해 궁금한 점이 있으신가요?
            </p>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium">이메일 문의</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-sm font-medium">카카오톡 채널</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BridgeClub;