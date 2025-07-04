import React from 'react';
import { motion } from 'framer-motion';

const ForumLeftContent = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', name: '전체 게시글' },
    { id: '생활 및 일상 팁', name: '생활 및 일상 팁' },
    { id: '여행 & 지역 탐방', name: '여행 & 지역 탐방' },
    { id: '취미 & 여가 활동', name: '취미 & 여가 활동' },
    { id: '건강 & 웰빙', name: '건강 & 웰빙' },
    { id: '자유 & 소통', name: '자유 & 소통' }
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="w-full lg:w-64 xl:w-72">
      <div className="py-4 md:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2 max-w-[240px] mx-auto md:mx-0"
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategoryChange(category.id)}
              className={`w-full text-left px-3 py-2 rounded-lg
                       transition-all duration-300 shadow-sm hover:shadow 
                       border border-gray-100 text-sm
                       ${selectedCategory === category.id 
                         ? 'bg-blue-50 text-blue-600 font-medium border-blue-200' 
                         : 'bg-white hover:bg-gray-50 text-gray-600'}`}
            >
              {category.name}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ForumLeftContent; 