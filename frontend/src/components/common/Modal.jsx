import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 재사용 가능한 모달 컴포넌트
 * @param {Object} props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 닫기 버튼 클릭 시 호출될 함수
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {string} props.size - 모달 크기 (sm, md, lg, xl, full)
 * @param {boolean} props.closeOnOverlayClick - 오버레이 클릭 시 닫기 여부
 * @returns {React.ReactElement}
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  size = 'md', 
  closeOnOverlayClick = true
}) => {
  // 모달 크기별 클래스 정의
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-full mx-4'
  };

  // body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // ESC 키 누를 때 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // 오버레이 클릭 처리
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`bg-white rounded-xl shadow-xl ${sizeClasses[size] || sizeClasses.md} w-full m-4 relative overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal; 