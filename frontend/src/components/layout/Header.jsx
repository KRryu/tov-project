import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// 로그아웃 버튼 컴포넌트
const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.group('🚪 로그아웃 시도');
    console.log('로그아웃 전 localStorage 토큰:', Boolean(localStorage.getItem('token')));
    
    try {
      await logout();
      console.log('✅ 로그아웃 성공');
      console.log('로그아웃 후 localStorage 토큰:', Boolean(localStorage.getItem('token')));
      navigate('/login');
    } catch (error) {
      console.error('❌ 로그아웃 중 오류 발생:', error);
    }
    
    console.groupEnd();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-white hover:bg-gray-700 px-3 py-2 rounded text-sm font-medium"
    >
      로그아웃
    </button>
  );
};

export default LogoutButton; 