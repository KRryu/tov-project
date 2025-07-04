import React from 'react';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">로딩 중...</span>
    </div>
  );
}

export default LoadingSpinner; 