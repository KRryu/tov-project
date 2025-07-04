import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/CommunitySidebar';

const Community = () => {
  const location = useLocation();

  // Community 루트 경로일 때 Forum으로 리다이렉트
  if (location.pathname === '/community') {
    return <Navigate to="/community/forum" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
      <div className="flex flex-col lg:flex-row">
        {/* 사이드바 */}
        <div className="lg:w-64 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 hidden lg:block">
              TOVmate Community
            </h1>
            
            {/* 라우트에 따른 컨텐츠 렌더링 */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Community; 