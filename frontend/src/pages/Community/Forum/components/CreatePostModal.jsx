// CreatePostModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCreatePostMutation } from '../../../../api/services/communityService';
import { useAuth } from '../../../../hooks/useAuth';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { setReturnPath } from '../../../../redux/slices/authSlice';

const CreatePostModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '자유 & 소통'
  });

  const categories = [
    '생활 및 일상 팁',
    '여행 & 지역 탐방',
    '취미 & 여가 활동',
    '건강 & 웰빙',
    '자유 & 소통'
  ];

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      toast.error('로그인이 필요한 서비스입니다.');
      onClose();
      navigate('/login', { 
        state: { from: location.pathname }
      });
    }
  }, [isOpen, isAuthenticated, navigate, location.pathname, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      onClose();
      navigate('/login', { 
        state: { from: location.pathname }
      });
      return;
    }

    try {
      const result = await createPost(formData).unwrap();
      toast.success('게시글이 성공적으로 작성되었습니다!');
      onClose();
      navigate(`/community/forum/post/${result.data._id}`);
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      toast.error(error.data?.message || '게시글 작성에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">새 게시글 작성</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">카테고리</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded-lg p-2"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">내용</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border rounded-lg p-2 h-32"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
