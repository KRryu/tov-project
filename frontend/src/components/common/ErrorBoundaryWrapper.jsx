import React from 'react';
import { ErrorBoundary } from '@sentry/react';
import AccessibleButton from './AccessibleButton';

const FallbackComponent = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            죄송합니다
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            예상치 못한 오류가 발생했습니다
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 mb-4">
            {error.message || '알 수 없는 오류가 발생했습니다'}
          </p>
          <AccessibleButton
            onClick={resetError}
            variant="primary"
            size="large"
            className="w-full"
          >
            다시 시도하기
          </AccessibleButton>
        </div>
        <p className="text-xs text-gray-500">
          문제가 계속되면 고객센터로 문의해주세요
        </p>
      </div>
    </div>
  );
};

const ErrorBoundaryWrapper = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={FallbackComponent}
      onError={(error) => {
        console.error('Application error:', error);
        // 필요한 경우 추가 에러 처리 로직
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper; 