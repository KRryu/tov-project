import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Users, Clock, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

const EventCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // 더미 이벤트 데이터
  const events = {
    '2025-01-15': [
      {
        id: 1,
        title: 'Language Exchange Meetup',
        time: '19:00 - 21:00',
        location: '강남 스터디카페',
        attendees: 25,
        maxAttendees: 30,
        type: 'language'
      }
    ],
    '2025-01-18': [
      {
        id: 2,
        title: 'Korean Culture Workshop',
        time: '14:00 - 16:00',
        location: '온라인 (Zoom)',
        attendees: 45,
        maxAttendees: 50,
        type: 'culture'
      },
      {
        id: 3,
        title: 'Networking Party',
        time: '19:00 - 22:00',
        location: '이태원 Bar',
        attendees: 38,
        maxAttendees: 40,
        type: 'networking'
      }
    ],
    '2025-01-22': [
      {
        id: 4,
        title: 'Tech Talk: AI in Korea',
        time: '19:00 - 20:30',
        location: '판교 테크노밸리',
        attendees: 15,
        maxAttendees: 25,
        type: 'tech'
      }
    ]
  };

  const eventTypeColors = {
    language: 'bg-blue-100 text-blue-700 border-blue-200',
    culture: 'bg-purple-100 text-purple-700 border-purple-200',
    networking: 'bg-green-100 text-green-700 border-green-200',
    tech: 'bg-orange-100 text-orange-700 border-orange-200'
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // 이전 달 날짜들
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // 현재 달 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // 다음 달 날짜들
    const remainingDays = 42 - days.length; // 6주 * 7일
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleEventRegister = (event) => {
    if (event.attendees >= event.maxAttendees) {
      toast.warning('이 이벤트는 정원이 마감되었습니다.');
      return;
    }
    toast.success(`'${event.title}' 참가 신청이 완료되었습니다!`);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">이벤트 캘린더</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-medium min-w-[120px] text-center">
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            이벤트 추가
          </button>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="p-6">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day, index) => (
            <div key={day} className={`text-center text-sm font-medium py-2 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dateKey = formatDateKey(day.date);
            const dayEvents = events[dateKey] || [];
            const isToday = day.date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
            
            return (
              <motion.div
                key={index}
                className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all ${
                  !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isToday ? 'border-purple-400' : 'border-gray-200'} ${
                  isSelected ? 'ring-2 ring-purple-600' : ''
                } hover:border-gray-300`}
                onClick={() => handleDateClick(day.date)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-purple-600' : ''
                  }`}>
                    {day.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                
                {/* 이벤트 미리보기 */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1 rounded border ${eventTypeColors[event.type]}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventRegister(event);
                      }}
                    >
                      <p className="truncate font-medium">{event.title}</p>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-xs text-gray-500">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜의 이벤트 상세 */}
      {selectedDate && events[formatDateKey(selectedDate)] && (
        <div className="border-t border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 이벤트
          </h3>
          <div className="space-y-4">
            {events[formatDateKey(selectedDate)].map((event) => (
              <motion.div
                key={event.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.attendees}/{event.maxAttendees}명
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEventRegister(event)}
                    disabled={event.attendees >= event.maxAttendees}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      event.attendees >= event.maxAttendees
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {event.attendees >= event.maxAttendees ? '마감' : '참가 신청'}
                  </button>
                </div>
                
                {/* 참가자 진행률 */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>참가 신청 현황</span>
                    <span>{Math.round((event.attendees / event.maxAttendees) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Language Exchange</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
            <span>Culture Workshop</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Networking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
            <span>Tech Talk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;