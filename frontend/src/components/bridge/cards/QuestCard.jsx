import React from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import Card3D from '../common/Card3D';

/**
 * 퀘스트 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.quest - 퀘스트 정보
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 * @param {number} props.index - 애니메이션 지연을 위한 인덱스
 */
const QuestCard = ({ quest, onClick, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * (index + 1) }}
      onClick={() => onClick?.(quest)}
      className="cursor-pointer"
    >
      <Card3D className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-gray-900">{quest.title}</h3>
            <span className="text-2xl">{quest.reward.badge}</span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{quest.description}</p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>진행도</span>
              <span className="font-bold">{quest.progress}/{quest.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(quest.progress / quest.total) * 100}%` }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
            <Gift className="w-4 h-4" />
            <span>보상: {quest.reward.points} 포인트</span>
          </div>
        </div>
      </Card3D>
    </motion.div>
  );
};

export default QuestCard;