import React from 'react';
import { Field, ErrorMessage } from 'formik';
import { motion } from 'framer-motion';

// 공통 폼 필드 컴포넌트
export const FormField = ({ 
  name, 
  label, 
  type = 'text', 
  placeholder, 
  required = false,
  icon,
  helperText,
  ...props 
}) => {
  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <Field
          name={name}
          type={type}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 
            ${icon ? 'pl-10' : ''} 
            border border-gray-200 rounded-xl 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            placeholder-gray-400
            hover:border-gray-300
          `}
          {...props}
        />
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      <ErrorMessage name={name}>
        {msg => (
          <motion.p 
            className="mt-1 text-sm text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {msg}
          </motion.p>
        )}
      </ErrorMessage>
    </motion.div>
  );
};

// 텍스트 영역 컴포넌트
export const FormTextarea = ({ 
  name, 
  label, 
  placeholder, 
  required = false,
  rows = 4,
  helperText,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Field
        as="textarea"
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="
          w-full px-4 py-3 
          border border-gray-200 rounded-xl 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          placeholder-gray-400
          hover:border-gray-300
          resize-none
        "
        {...props}
      />
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      <ErrorMessage name={name}>
        {msg => (
          <motion.p 
            className="mt-1 text-sm text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {msg}
          </motion.p>
        )}
      </ErrorMessage>
    </motion.div>
  );
};

// 선택 필드 컴포넌트
export const FormSelect = ({ 
  name, 
  label, 
  options, 
  placeholder = '선택하세요',
  required = false,
  icon,
  helperText,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <Field
          as="select"
          name={name}
          className={`
            w-full px-4 py-3 
            ${icon ? 'pl-10' : ''} 
            border border-gray-200 rounded-xl 
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            hover:border-gray-300
            appearance-none
            bg-white
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Field>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
      <ErrorMessage name={name}>
        {msg => (
          <motion.p 
            className="mt-1 text-sm text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {msg}
          </motion.p>
        )}
      </ErrorMessage>
    </motion.div>
  );
};

// 체크박스 컴포넌트
export const FormCheckbox = ({ name, label, helperText }) => {
  return (
    <motion.div 
      className="flex items-start"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Field
        type="checkbox"
        name={name}
        className="
          h-4 w-4 mt-0.5
          text-blue-600 
          focus:ring-blue-500 
          border-gray-300 
          rounded
          transition-colors duration-200
        "
      />
      <div className="ml-3">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {helperText && (
          <p className="text-xs text-gray-500 mt-0.5">{helperText}</p>
        )}
      </div>
    </motion.div>
  );
};

// 라디오 그룹 컴포넌트
export const FormRadioGroup = ({ name, label, options, required = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          >
            <Field
              type="radio"
              name={name}
              value={option.value}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      <ErrorMessage name={name}>
        {msg => (
          <motion.p 
            className="mt-1 text-sm text-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {msg}
          </motion.p>
        )}
      </ErrorMessage>
    </motion.div>
  );
};