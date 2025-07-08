import React from 'react';
import { motion } from 'framer-motion';

/**
 * 애니메이션 배경 컴포넌트
 * @param {Object} props
 * @param {number} props.particleCount - 떠다니는 도형 개수 (기본값: 20)
 * @param {string} props.baseColor - 기본 배경 그라데이션 색상
 * @param {Array} props.particleColors - 파티클 색상 배열
 */
const AnimatedBackground = ({ 
  particleCount = 20,
  baseColor = "from-blue-50 via-purple-50 to-pink-50",
  particleColors = ['bg-purple-400/10', 'bg-blue-400/10']
}) => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${baseColor}`} />
      
      {/* 떠다니는 도형들 */}
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        >
          <div className={`
            ${i % 3 === 0 ? 'w-32 h-32' : i % 3 === 1 ? 'w-24 h-24' : 'w-16 h-16'}
            ${particleColors[i % particleColors.length]}
            rounded-full blur-3xl
          `} />
        </motion.div>
      ))}
    </div>
  );
};

export default AnimatedBackground;