import React from 'react';
import { motion } from 'framer-motion';

/**
 * 사용자 진행도 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.userJourney - 사용자 여정 정보
 * @param {Array} props.journeySteps - 여정 단계 정보
 */
const UserProgressCard = ({ userJourney, journeySteps }) => {
  if (!userJourney || !journeySteps) return null;

  const calculateProgress = () => {
    return (userJourney.currentStep / journeySteps.length) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto mt-8"
    >
      <h3 className="text-lg font-semibold mb-4">나의 정착 여정</h3>
      <div className="relative">
        <div className="flex justify-between mb-2">
          {journeySteps.map((step, index) => (
            <div
              key={step.id}
              className={`text-center flex-1 ${
                index + 1 <= userJourney.currentStep
                  ? 'text-white'
                  : 'text-white/50'
              }`}
            >
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  index + 1 <= userJourney.currentStep
                    ? 'bg-white text-blue-600'
                    : 'bg-white/30'
                }`}
              >
                {index + 1}
              </div>
              <p className="text-sm font-medium">{step.name}</p>
            </div>
          ))}
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-white"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-center items-center gap-6 text-sm">
        <div>
          <span className="font-semibold">{userJourney.points}</span> 포인트
        </div>
        <div>
          레벨: <span className="font-semibold">{userJourney.level}</span>
        </div>
        <div>
          진행률: <span className="font-semibold">{calculateProgress().toFixed(0)}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProgressCard;