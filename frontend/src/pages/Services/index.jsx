import React from 'react';
import ServiceTracksSection from './sections/ServiceTracksSection';

const Services = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이지 타이틀 섹션 */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Services</h1>
          <p className="mt-2 text-lg text-gray-600">
            TOVmate가 제공하는 4가지 서비스 트랙을 확인해보세요.
          </p>
        </div>
      </div>

      {/* 서비스 트랙 섹션 */}
      <ServiceTracksSection />
    </div>
  );
};

export default Services; 