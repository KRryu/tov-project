import React from 'react';
import { motion } from 'framer-motion';

/**
 * 프로그램 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.program - 프로그램 정보
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 * @param {number} props.index - 애니메이션 지연을 위한 인덱스
 * @param {boolean} props.isCompleted - 완료 여부
 * @param {boolean} props.isInProgress - 진행 중 여부
 */
const ProgramCard = ({ 
  program, 
  onClick, 
  index = 0,
  isCompleted = false,
  isInProgress = false
}) => {
  const Icon = program.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * (index + 1) }}
      whileHover={{ scale: 1.05 }}
      className="relative"
    >
      <div
        onClick={() => onClick?.(program)}
        className={`${program.color} rounded-2xl p-6 text-white cursor-pointer h-full transform transition-all duration-300 hover:shadow-2xl`}
      >
        {/* 완료/진행 중 표시 */}
        {isCompleted && (
          <div className="absolute top-4 right-4 bg-white/90 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
            ✓ 완료
          </div>
        )}
        {isInProgress && (
          <div className="absolute top-4 right-4 bg-white/90 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
            진행 중
          </div>
        )}

        <div className="w-20 h-20 mb-4 mx-auto">
          {typeof Icon === 'function' ? <Icon /> : Icon}
        </div>
        
        <h3 className="text-2xl font-bold mb-1">{program.name}</h3>
        <p className="text-white/90 text-sm mb-3">{program.subtitle}</p>
        <p className="text-white/80 text-sm mb-4">{program.description}</p>
        
        {program.features && (
          <ul className="space-y-2">
            {program.features.map((feature, idx) => (
              <li key={idx} className="flex items-start text-sm">
                <span className="mr-2">•</span>
                <span className="text-white/90">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-center">
          <span className="text-white/90 hover:text-white transition-colors">
            자세히 보기 →
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProgramCard;