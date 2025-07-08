import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Tag,
  Globe,
  Star,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import bridgeService from '../../../api/services/bridgeService';
import { Card3D } from '../../../components/bridge';
import { BRIDGE_PROGRAMS } from '../../../constants/bridge/programs';

const EventCalendar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('calendar'); // calendar, list, my-events
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all'
  });

  // 이벤트 타입과 카테고리
  const eventTypes = [
    { value: 'all', label: '모든 프로그램' },
    { value: 'buddy', label: 'BUDDY', icon: '👥' },
    { value: 'koko', label: 'KOKO', icon: '🇰🇷' },
    { value: 'poppop', label: 'POPPOP', icon: '🎵' },
    { value: 'talktalk', label: 'TALKTALK', icon: '💬' },
    { value: 'special', label: '특별 이벤트', icon: '✨' }
  ];

  const eventCategories = [
    { value: 'all', label: '모든 카테고리' },
    { value: 'meetup', label: '모임' },
    { value: 'class', label: '수업' },
    { value: 'party', label: '파티' },
    { value: 'workshop', label: '워크샵' },
    { value: 'trip', label: '여행' },
    { value: 'online', label: '온라인' }
  ];

  useEffect(() => {
    fetchEvents();
    if (isAuthenticated) {
      fetchMyEvents();
      fetchRecommendedEvents();
    }
  }, [currentDate, filters, isAuthenticated]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      };
      
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.category !== 'all') params.category = filters.category;

      const response = await bridgeService.getEvents(params);
      setEvents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('이벤트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await bridgeService.getMyEvents('upcoming');
      setMyEvents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch my events:', error);
    }
  };

  const fetchRecommendedEvents = async () => {
    try {
      const response = await bridgeService.getRecommendedEvents();
      setRecommendedEvents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch recommended events:', error);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    if (!isAuthenticated) {
      toast.info('이벤트 참가를 위해 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await bridgeService.registerForEvent(eventId);
      toast.success('이벤트에 등록되었습니다!');
      fetchEvents();
      fetchMyEvents();
      setSelectedEvent(null);
    } catch (error) {
      toast.error(error.response?.data?.error || '등록에 실패했습니다.');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    try {
      await bridgeService.cancelRegistration(eventId);
      toast.success('이벤트 참가가 취소되었습니다.');
      fetchEvents();
      fetchMyEvents();
      setSelectedEvent(null);
    } catch (error) {
      toast.error('취소에 실패했습니다.');
    }
  };

  // 캘린더 헬퍼 함수들
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // 이전 달의 날짜들
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false
      });
    }
    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    // 다음 달의 날짜들
    const remainingDays = 42 - days.length; // 6주 * 7일
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatEventDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatEventTime = (startTime, endTime) => {
    return `${startTime} - ${endTime}`;
  };

  const getEventTypeInfo = (type) => {
    const typeInfo = eventTypes.find(t => t.value === type);
    return typeInfo || { label: type, icon: '📅' };
  };

  const isUserRegistered = (event) => {
    return event.participants?.some(p => p.user._id === user?.id && p.status === 'registered');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-8">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">이벤트 캘린더</h1>
            <p className="text-gray-600">Bridge Community의 다양한 이벤트에 참여해보세요</p>
          </div>
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/community/events/create')}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              이벤트 만들기
            </motion.button>
          )}
        </div>

        {/* 뷰 전환 탭 */}
        <div className="flex gap-2">
          {[
            { id: 'calendar', label: '캘린더 보기', icon: CalendarIcon },
            { id: 'list', label: '목록 보기', icon: Tag },
            { id: 'my-events', label: '내 이벤트', icon: Star }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  view === tab.id
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
      </motion.div>

      {/* 필터 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-white rounded-xl shadow-lg p-4"
      >
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {eventCategories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* 추천 이벤트 */}
      {isAuthenticated && recommendedEvents.length > 0 && view === 'calendar' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            추천 이벤트
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {recommendedEvents.slice(0, 3).map((event) => (
              <Card3D key={event._id} className="bg-white rounded-xl shadow-lg p-4 cursor-pointer" onClick={() => setSelectedEvent(event)}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getEventTypeInfo(event.type).icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(event.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        </motion.div>
      )}

      {/* 메인 컨텐츠 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {view === 'calendar' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              {/* 캘린더 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((day, index) => {
                  const dayEvents = getEventsForDate(day.date);
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`min-h-[100px] p-2 rounded-lg border ${
                        day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'ring-2 ring-purple-500' : 'border-gray-200'}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${isToday ? 'text-purple-600' : ''}`}>
                        {day.date.getDate()}
                      </div>
                      
                      {/* 이벤트 표시 */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event._id}
                            onClick={() => setSelectedEvent(event)}
                            className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate"
                            style={{
                              backgroundColor: event.type === 'buddy' ? '#FEE2E2' :
                                             event.type === 'koko' ? '#E9D5FF' :
                                             event.type === 'poppop' ? '#FED7AA' :
                                             event.type === 'talktalk' ? '#BBF7D0' :
                                             '#E5E7EB'
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === 'list' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {events.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">이번 달에는 예정된 이벤트가 없습니다.</p>
                </div>
              ) : (
                events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{getEventTypeInfo(event.type).icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h3>
                            <p className="text-gray-600 mb-3">{event.description}</p>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {formatEventDate(event.date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatEventTime(event.startTime, event.endTime)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location.online ? '온라인' : event.location.venue}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {event.participants.filter(p => p.status === 'registered').length}/{event.maxParticipants}명
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {event.fee > 0 && (
                              <p className="text-lg font-bold text-purple-600 mb-2">
                                ₩{event.fee.toLocaleString()}
                              </p>
                            )}
                            {event.canRegister && (
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                신청 가능
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {view === 'my-events' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {!isAuthenticated ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">로그인 후 내 이벤트를 확인할 수 있습니다.</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors"
                  >
                    로그인하기
                  </button>
                </div>
              ) : myEvents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">참가 신청한 이벤트가 없습니다.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900">참가 예정 이벤트</h3>
                  {myEvents.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              {formatEventDate(event.date)}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {formatEventTime(event.startTime, event.endTime)}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {event.location.online ? '온라인' : event.location.venue}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedEvent(event)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            상세 보기
                          </button>
                          <button
                            onClick={() => handleCancelRegistration(event._id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            취소하기
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* 이벤트 상세 모달 */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 이벤트 헤더 */}
              <div className="relative h-48 bg-gradient-to-r from-purple-600 to-blue-600 p-8">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{getEventTypeInfo(selectedEvent.type).icon}</div>
                  <div className="flex-1 text-white">
                    <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
                    <p className="text-white/80">{selectedEvent.description}</p>
                  </div>
                </div>
              </div>

              {/* 이벤트 정보 */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">날짜</p>
                        <p className="text-gray-600">{formatEventDate(selectedEvent.date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">시간</p>
                        <p className="text-gray-600">{formatEventTime(selectedEvent.startTime, selectedEvent.endTime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">장소</p>
                        <p className="text-gray-600">
                          {selectedEvent.location.online ? (
                            <>
                              <Globe className="inline w-4 h-4 mr-1" />
                              온라인
                            </>
                          ) : (
                            <>
                              {selectedEvent.location.venue}
                              {selectedEvent.location.address && (
                                <span className="block text-sm">{selectedEvent.location.address}</span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">참가자</p>
                        <p className="text-gray-600">
                          {selectedEvent.participants.filter(p => p.status === 'registered').length} / {selectedEvent.maxParticipants}명
                        </p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{
                                width: `${(selectedEvent.participants.filter(p => p.status === 'registered').length / selectedEvent.maxParticipants) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedEvent.fee > 0 && (
                      <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">참가비</p>
                          <p className="text-gray-600">₩{selectedEvent.fee.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedEvent.requirements?.description && (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">참가 조건</p>
                          <p className="text-gray-600">{selectedEvent.requirements.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 주최자 정보 */}
                {selectedEvent.organizer && (
                  <div className="mb-6 p-4 bg-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">주최자</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedEvent.organizer.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex gap-3">
                  {selectedEvent.canRegister ? (
                    isAuthenticated ? (
                      isUserRegistered(selectedEvent) ? (
                        <button
                          onClick={() => handleCancelRegistration(selectedEvent._id)}
                          className="flex-1 bg-red-100 text-red-700 py-3 rounded-xl font-medium hover:bg-red-200 transition-colors"
                        >
                          참가 취소하기
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegisterEvent(selectedEvent._id)}
                          className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
                        >
                          참가 신청하기
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => navigate('/login')}
                        className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                      >
                        로그인 후 신청하기
                      </button>
                    )
                  ) : (
                    <div className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-medium text-center">
                      {selectedEvent.status === 'completed' ? '종료된 이벤트' : '신청 마감'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventCalendar;