import React from 'react';

function ErrorAlert({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">오류 발생!</strong>
      <span className="block sm:inline"> {message || '문제가 발생했습니다. 다시 시도해주세요.'}</span>
    </div>
  );
}

export default ErrorAlert; 