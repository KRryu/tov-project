import React from 'react';
import { motion } from 'framer-motion';
import { useField } from 'formik';

/**
 * 카테고리 선택 컴포넌트 - 카드 형태로 클릭하여 선택
 */
export const CategorySelector = ({ name, label, options, columns = 2, required = false }) => {
  const [field, meta, helpers] = useField(name);
  const { value } = field;
  const { setValue } = helpers;

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className={`grid ${gridCols[columns] || 'grid-cols-2'} gap-3`}>
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setValue(option.value)}
            className={`
              relative p-4 rounded-lg border-2 transition-all cursor-pointer
              ${value === option.value 
                ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            {option.icon && (
              <div className={`text-2xl mb-2 ${value === option.value ? 'text-indigo-600' : 'text-gray-400'}`}>
                {option.icon}
              </div>
            )}
            <div className={`font-medium ${value === option.value ? 'text-indigo-900' : 'text-gray-900'}`}>
              {option.label}
            </div>
            {option.description && (
              <div className={`text-xs mt-1 ${value === option.value ? 'text-indigo-600' : 'text-gray-500'}`}>
                {option.description}
              </div>
            )}
            {value === option.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
      
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm mt-1">{meta.error}</div>
      )}
    </div>
  );
};

/**
 * 스킬 레벨 선택 컴포넌트 - 시각적 레벨 표시
 */
export const SkillLevelSelector = ({ name, label, levels = 5, labels = [], required = false }) => {
  const [field, meta, helpers] = useField(name);
  const { value } = field;
  const { setValue } = helpers;

  const defaultLabels = ['없음', '초급', '중급', '고급', '전문가'];
  const levelLabels = labels.length > 0 ? labels : defaultLabels.slice(0, levels);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex space-x-2">
        {[...Array(levels)].map((_, index) => (
          <motion.button
            key={index}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setValue(index)}
            className={`
              flex-1 py-3 px-2 rounded-lg border-2 transition-all
              ${index <= value 
                ? 'bg-indigo-500 border-indigo-500' 
                : 'bg-gray-100 border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className={`text-xs font-medium ${index <= value ? 'text-white' : 'text-gray-500'}`}>
              {levelLabels[index]}
            </div>
          </motion.button>
        ))}
      </div>
      
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm mt-1">{meta.error}</div>
      )}
    </div>
  );
};

/**
 * 태그 선택 컴포넌트 - 다중 선택 가능
 */
export const TagSelector = ({ name, label, options, required = false }) => {
  const [field, meta, helpers] = useField(name);
  const { value = [] } = field;
  const { setValue } = helpers;

  const toggleTag = (tagValue) => {
    if (value.includes(tagValue)) {
      setValue(value.filter(v => v !== tagValue));
    } else {
      setValue([...value, tagValue]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <motion.button
            key={option.value}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleTag(option.value)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all
              ${value.includes(option.value)
                ? 'bg-indigo-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
      
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm mt-1">{meta.error}</div>
      )}
    </div>
  );
};

/**
 * 범위 슬라이더 컴포넌트
 */
export const RangeSlider = ({ name, label, min = 0, max = 100, step = 1, unit = '', required = false }) => {
  const [field, meta, helpers] = useField(name);
  const { value = min } = field;
  const { setValue } = helpers;

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-lg font-semibold text-indigo-600">
          {value}{unit}
        </span>
      </div>
      
      <div className="relative pt-1">
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
      
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm mt-1">{meta.error}</div>
      )}
    </div>
  );
};

/**
 * 증감 버튼 컴포넌트
 */
export const IncrementSelector = ({ name, label, min = 0, max = 100, step = 1, unit = '', required = false }) => {
  const [field, meta, helpers] = useField(name);
  const { value = min } = field;
  const { setValue } = helpers;

  const increment = () => {
    if (value < max) setValue(value + step);
  };

  const decrement = () => {
    if (value > min) setValue(value - step);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex items-center space-x-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={decrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </motion.button>
        
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-lg text-gray-500 ml-1">{unit}</span>
        </div>
        
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={increment}
          disabled={value >= max}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </div>
      
      {meta.touched && meta.error && (
        <div className="text-red-500 text-sm mt-1">{meta.error}</div>
      )}
    </div>
  );
};

// CSS for range slider (add to your global styles)
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    background: #6366f1;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #6366f1;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: none;
  }
`;