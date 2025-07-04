import React from 'react';
import { motion } from 'framer-motion';

const EventsFilter = ({ filters, onFilterChange }) => {
  const eventTypes = [
    { id: '', name: '모든 유형' },
    { id: 'offline', name: '오프라인', icon: '🏢' },
    { id: 'online', name: '온라인', icon: '💻' },
    { id: 'hybrid', name: '하이브리드', icon: '🔄' }
  ];

  const categories = [
    { id: '', name: '모든 카테고리' },
    { id: 'networking', name: '네트워킹', icon: '🤝' },
    { id: 'workshop', name: '워크샵', icon: '🛠️' },
    { id: 'seminar', name: '세미나', icon: '🎤' },
    { id: 'cultural', name: '문화 행사', icon: '🎭' },
    { id: 'sports', name: '스포츠', icon: '⚽' },
    { id: 'other', name: '기타', icon: '📌' }
  ];

  const upcomingOptions = [
    { id: 'true', name: '예정된 이벤트' },
    { id: 'false', name: '모든 이벤트' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">필터</h3>

      {/* 이벤트 유형 필터 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">이벤트 유형</h4>
        <div className="space-y-2">
          {eventTypes.map(type => (
            <button
              key={type.id}
              onClick={() => onFilterChange({ eventType: type.id })}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2
                ${filters.eventType === type.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {type.icon && <span>{type.icon}</span>}
              <span>{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">카테고리</h4>
        <div className="space-y-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onFilterChange({ category: category.id })}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2
                ${filters.category === category.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {category.icon && <span>{category.icon}</span>}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 예정된 이벤트 필터 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">이벤트 기간</h4>
        <div className="space-y-2">
          {upcomingOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onFilterChange({ upcoming: option.id })}
              className={`w-full text-left px-3 py-2 rounded-lg
                ${filters.upcoming === option.id 
                  ? 'bg-blue-50 text-blue-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EventsFilter; 