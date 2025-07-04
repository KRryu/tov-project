/**
 * 폼 섹션 컴포넌트
 * 폼 내의 각 섹션을 구분하고 스타일링
 */

import React from 'react';

const FormSection = ({ 
  title, 
  description, 
  children, 
  required = false,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default FormSection;