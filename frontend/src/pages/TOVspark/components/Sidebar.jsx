import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <nav className="space-y-2">
        <Link 
          to="/tovspark"
          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
        >
          과제 목록
        </Link>
        <Link 
          to="/tovspark/ranking"
          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
        >
          전체 랭킹
        </Link>
        <Link 
          to="/tovspark/companies"
          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
        >
          기업 리스트
        </Link>
        <Link 
          to="/dashboard/tovspark"
          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
        >
          내 과제 결과 확인하기
        </Link>
      </nav>
    </div>
  );
}

export default Sidebar; 