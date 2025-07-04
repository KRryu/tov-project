// EventsList.jsx (frontend/src/pages/Community/Events/components/EventsList.jsx)
import React from 'react';
import { Link } from 'react-router-dom';
import { useGetEventsQuery } from '../../../../api/services/communityService';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const EventsList = ({ filters }) => {
  // filters 객체에 upcoming: 'false' 추가
  const allFilters = { ...filters, upcoming: 'false' };
  
  // 수정된 필터로 쿼리 실행
  const { data, isLoading, isError } = useGetEventsQuery(allFilters);
  
  // data.data.events 구조 또는 data.events 구조에 모두 대응
  const events = data?.data?.events || data?.events || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-600">
        이벤트를 불러오는데 실패했습니다.
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-gray-50 rounded-2xl"
      >
        <p className="text-gray-500 mb-2">등록된 이벤트가 없습니다.</p>
        <p className="text-gray-400 text-sm">
          새로운 이벤트를 등록해보세요!
        </p>
      </motion.div>
    );
  }

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'offline': return '🏢';
      case 'online': return '💻';
      case 'hybrid': return '🔄';
      default: return '📅';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'networking': return '🤝';
      case 'workshop': return '🛠️';
      case 'seminar': return '🎤';
      case 'cultural': return '🎭';
      case 'sports': return '⚽';
      default: return '📌';
    }
  };

  return (
    <div>
      <AnimatePresence>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <Link to={`/community/events/${event._id}`}>
                <div className="relative">
                  <img 
                    src={event.image || '/event-placeholder.jpg'} 
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                    {format(new Date(event.startDate), 'MM월 dd일', { locale: ko })}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      {getEventTypeIcon(event.eventType)} {event.eventType === 'offline' ? '오프라인' : 
                                                         event.eventType === 'online' ? '온라인' : '하이브리드'}
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      {getCategoryIcon(event.category)} {event.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <img 
                        src={event.organizer?.avatar || '/default-avatar.png'} 
                        alt={event.organizer?.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-gray-700">{event.organizer?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>👥</span>
                        {event.participantsCount}/{event.maxParticipants || '∞'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>💬</span>
                        {event.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default EventsList;