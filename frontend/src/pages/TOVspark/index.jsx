import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from './sections/HeroSection';
import Sidebar from './components/Sidebar';
import ChallengeList from './components/ChallengeList';

function TOVspark() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 사이드바 */}
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">과제 목록</h2>
              <Link
                to="/tovspark/create-challenge"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                과제 생성하기
                <svg 
                  className="ml-2 -mr-1 h-5 w-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
            <ChallengeList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TOVspark; 