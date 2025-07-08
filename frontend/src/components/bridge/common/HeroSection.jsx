import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Card3D from './Card3D';

/**
 * 히어로 섹션 컴포넌트
 * @param {Object} props
 * @param {string} props.title - 메인 타이틀
 * @param {string} props.subtitle - 서브타이틀
 * @param {string} props.badge - 배지 텍스트
 * @param {React.ReactNode} props.children - 추가 컨텐츠
 * @param {Function} props.onAction - CTA 버튼 클릭 핸들러
 * @param {string} props.actionText - CTA 버튼 텍스트
 */
const HeroSection = ({ 
  title, 
  subtitle, 
  badge = "새로운 모험이 기다립니다",
  children,
  onAction,
  actionText = "모험 시작하기"
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <Card3D className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-white">
        <div className="relative z-10">
          {badge && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">{badge}</span>
            </motion.div>
          )}
          
          <h1 className="text-5xl font-bold mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-white/90 mb-8">
              {subtitle}
            </p>
          )}
          
          {onAction && (
            <motion.button
              onClick={onAction}
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {actionText}
            </motion.button>
          )}
          
          {children}
        </div>
        
        {/* 3D 장식 요소 */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />
      </Card3D>
    </motion.section>
  );
};

export default HeroSection;