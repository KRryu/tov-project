// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
// 나중에 auth 관련 상태 관리를 위해 필요할 것입니다
// import { useSelector } from 'react-redux';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 사용자 역할에 따른 대시보드 경로
  const getDashboardPath = (role) => {
    switch (role) {
      case 'challenger':
        return '/challenger-dashboard';
      case 'company':
        return '/company-dashboard';
      case 'pro':
        return '/pro-dashboard';
      default:
        return '/dashboard';
    }
  };

  // 사용자 역할에 따른 대시보드 텍스트
  const getDashboardText = (role) => {
    switch (role) {
      case 'challenger':
        return 'Challenger Dashboard';
      case 'company':
        return 'Company Dashboard';
      case 'pro':
        return 'Pro Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">TOVmate</span>
          </Link>

          {/* 메인 네비게이션 */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-blue-600">
              Services
            </Link>
            <Link to="/tovspark" className="text-gray-700 hover:text-blue-600">
              TOVspark
            </Link>
            <Link to="/tovplay" className="text-gray-700 hover:text-blue-600">
              TOVplay
            </Link>
            <Link to="/community" className="text-gray-700 hover:text-blue-600">
              Bridge Community
            </Link>
            {/* 로그인 상태일 때만 대시보드 표시 */}
            {isAuthenticated && (
              <Link 
                to={getDashboardPath(user?.role)} 
                className="text-gray-700 hover:text-blue-600"
              >
                {getDashboardText(user?.role)}
              </Link>
            )}
          </nav>

          {/* 우측 네비게이션 */}
          <div className="flex items-center space-x-4">
            {/* 검색 아이콘 */}
            <button className="text-gray-700 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* 로그인 상태에 따라 다른 버튼 표시 */}
            {!isAuthenticated ? (
              // 비로그인 상태: 로그인/회원가입 버튼
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  회원가입
                </Link>
              </>
            ) : (
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="text-gray-700">{user?.name || '사용자'}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* 드롭다운 메뉴 */}
                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 w-48 mt-2 py-1 bg-white rounded-md shadow-lg z-50"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      프로필
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
