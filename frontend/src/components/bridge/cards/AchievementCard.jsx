import React from 'react';
import { motion } from 'framer-motion';

/**
 * 업적 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.achievement - 업적 정보
 * @param {number} props.index - 애니메이션 지연을 위한 인덱스
 */
const AchievementCard = ({ achievement, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 * (index + 1) }}
      whileHover={{ scale: 1.1 }}
      className="bg-white rounded-lg p-4 shadow-md text-center"
    >
      <div className="text-3xl mb-2">{achievement.icon}</div>
      <p className="text-sm font-medium text-gray-900">{achievement.name}</p>
      <p className="text-xs text-gray-500">{achievement.date}</p>
    </motion.div>
  );
};

export default AchievementCard;