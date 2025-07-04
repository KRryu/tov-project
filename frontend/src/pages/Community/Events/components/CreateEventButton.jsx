import React, { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CreateEventModal from './CreateEventModal';

const CreateEventButton = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/community/events' } });
      return;
    }
    
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"
      >
        <span>+</span>
        <span>이벤트 생성</span>
      </motion.button>
      
      <CreateEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default CreateEventButton; 