import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EventsList from './components/EventsList';
import EventsFilter from './components/EventsFilter';
import CreateEventButton from './components/CreateEventButton';

const EventsPage = () => {
  const [filters, setFilters] = useState({
    category: '',
    eventType: '',
    upcoming: 'true',
    page: 1
  });

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">이벤트 & 밋업</h1>
        <p className="text-gray-600">
          다양한 오프라인/온라인 이벤트와 밋업에 참여하고 새로운 인연을 만들어보세요.
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 필터 섹션 */}
        <div className="w-full lg:w-1/4">
          <EventsFilter 
            filters={filters} 
            onFilterChange={handleFilterChange} 
          />
        </div>

        {/* 이벤트 목록 섹션 */}
        <div className="w-full lg:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              이벤트 목록
            </h2>
            <CreateEventButton />
          </div>
          
          <EventsList filters={filters} />
        </div>
      </div>
    </div>
  );
};

export default EventsPage; 