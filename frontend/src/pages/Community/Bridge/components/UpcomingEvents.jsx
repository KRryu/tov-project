import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react';

const UpcomingEvents = () => {
  const upcomingEvents = [
    {
      id: 1,
      title: 'Language Exchange Night',
      date: '2025-01-15',
      time: '19:00',
      location: '강남 스터디카페',
      attendees: 25,
      maxAttendees: 30,
      type: 'language',
      daysUntil: 2
    },
    {
      id: 2,
      title: 'Korean Culture Workshop',
      date: '2025-01-18',
      time: '14:00',
      location: '온라인 (Zoom)',
      attendees: 45,
      maxAttendees: 50,
      type: 'culture',
      daysUntil: 5
    },
    {
      id: 3,
      title: 'Tech Talk: AI in Korea',
      date: '2025-01-22',
      time: '19:00',
      location: '판교 테크노밸리',
      attendees: 15,
      maxAttendees: 25,
      type: 'tech',
      daysUntil: 9
    }
  ];

  const eventTypeColors = {
    language: 'bg-blue-100 text-blue-700',
    culture: 'bg-purple-100 text-purple-700',
    networking: 'bg-green-100 text-green-700',
    tech: 'bg-orange-100 text-orange-700'
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm border border-gray-100"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">다가오는 이벤트</h3>
          <Calendar className="w-5 h-5 text-purple-600" />
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {upcomingEvents.map((event, index) => (
          <motion.div
            key={event.id}
            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            {/* 이벤트 헤더 */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${eventTypeColors[event.type]}`}>
                  {event.type === 'language' ? '언어교환' : 
                   event.type === 'culture' ? '문화체험' :
                   event.type === 'tech' ? '테크토크' : '네트워킹'}
                </span>
              </div>
              <span className="text-xs text-purple-600 font-medium">
                D-{event.daysUntil}
              </span>
            </div>

            {/* 이벤트 정보 */}
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>{event.attendees}/{event.maxAttendees}명</span>
              </div>
            </div>

            {/* 참가 진행률 */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all ${
                    event.attendees >= event.maxAttendees ? 'bg-gray-400' : 'bg-purple-600'
                  }`}
                  style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }}
                />
              </div>
            </div>

            {/* 참가 버튼 */}
            <button className="w-full mt-3 flex items-center justify-between px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
              <span>{event.attendees >= event.maxAttendees ? '대기 신청' : '참가 신청'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
          <span>모든 이벤트 보기</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default UpcomingEvents;