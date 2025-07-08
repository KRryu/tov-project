import React from 'react';
import { motion } from 'framer-motion';

/**
 * 3D 스타일 카드 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.hoverEffect - 호버 효과 설정
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 */
const Card3D = ({ 
  children, 
  className = "",
  hoverEffect = {
    rotateY: 5,
    rotateX: -5,
    scale: 1.02,
    transition: { duration: 0.3 }
  },
  onClick,
  ...props
}) => {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={hoverEffect}
      onClick={onClick}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl" />
      {children}
    </motion.div>
  );
};

export default Card3D;