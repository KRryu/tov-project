import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Map, 
  Compass, 
  Users, 
  Trophy, 
  Star, 
  MessageCircle,
  Calendar,
  Home,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * Bridge Community 사이드바 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 사이드바 열림 상태
 * @param {Function} props.onToggle - 사이드바 토글 함수
 * @param {Object} props.user - 사용자 정보
 * @param {Object} props.userJourney - 사용자 여정 정보
 * @param {boolean} props.isAuthenticated - 인증 상태
 */
const Sidebar = ({ 
  isOpen, 
  onToggle, 
  user, 
  userJourney, 
  isAuthenticated,
  menuItems: customMenuItems
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 기본 메뉴 아이템
  const defaultMenuItems = [
    { id: 'home', label: '모험의 시작', icon: Home, path: '/community' },
    { id: 'journey', label: '나의 여정', icon: Map, path: '/community/my-journey' },
    { id: 'programs', label: '프로그램 탐험', icon: Compass, path: '/community/programs' },
    { id: 'buddy', label: 'BUDDY 친구들', icon: Users, path: '/community/buddy' },
    { id: 'achievements', label: '업적 & 보상', icon: Trophy, path: '/community/achievements' },
    { id: 'events', label: '이벤트 캘린더', icon: Calendar, path: '/community/events' },
    { id: 'chat', label: '모험가 라운지', icon: MessageCircle, path: '/community/lounge' },
    { id: 'leaderboard', label: '명예의 전당', icon: Star, path: '/community/leaderboard' }
  ];

  const menuItems = customMenuItems || defaultMenuItems;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-64 bg-white/90 backdrop-blur-lg shadow-2xl z-40"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🌉</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bridge</h2>
                  <p className="text-xs text-gray-600">Community</p>
                </div>
              </div>

              {/* 유저 정보 */}
              {isAuthenticated && userJourney && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-600">{userJourney.level}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">포인트</span>
                      <span className="font-bold text-purple-600">{userJourney.points}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(userJourney.points % 100)}%` }}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 메뉴 */}
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1 h-6 bg-white rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* 설정 버튼 */}
              <div className="absolute bottom-6 left-6 right-6">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-700 transition-all">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">설정</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 사이드바 토글 버튼 */}
      <motion.button
        onClick={onToggle}
        className="fixed left-4 top-4 z-50 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <ChevronLeft /> : <ChevronRight />}
      </motion.button>
    </>
  );
};

export default Sidebar;