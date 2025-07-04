import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

const ProgressStepper = ({ steps = [], currentStep = 0, progress = 0 }) => {
  return (
    <div className="max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* 진행률 바 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* 단계별 진행상황 */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <React.Fragment key={step.id || index}>
                <div className="flex flex-col items-center">
                  {/* 단계 아이콘 */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckIcon className="w-6 h-6" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* 단계 제목 */}
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="text-xs text-gray-500 mt-1 max-w-20">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 연결선 (마지막 단계가 아닌 경우) */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className={`h-0.5 transition-all duration-200 ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper; 