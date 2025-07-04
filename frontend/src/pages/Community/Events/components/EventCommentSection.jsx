import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { 
  useGetEventCommentsQuery,
  useCreateEventCommentMutation,
  useUpdateEventCommentMutation,
  useDeleteEventCommentMutation
} from '../../../../api/services/communityService';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const EventCommentSection = ({ eventId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: commentsData, isLoading } = useGetEventCommentsQuery(eventId);
  const [createComment, { isLoading: isCreating }] = useCreateEventCommentMutation();
  const [updateComment, { isLoading: isUpdating }] = useUpdateEventCommentMutation();
  const [deleteComment] = useDeleteEventCommentMutation();
  const comments = commentsData || [];
  
  const [content, setContent] = useState('');
  const [editMode, setEditMode] = useState(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('댓글을 작성하려면 로그인이 필요합니다.');
      navigate('/login', { 
        state: { from: location.pathname }
      });
      return;
    }
    
    if (!content.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }
    
    try {
      await createComment({ eventId, content }).unwrap();
      setContent('');
      toast.success('댓글을 작성했습니다.');
    } catch (error) {
      toast.error(error.data?.message || '댓글 작성에 실패했습니다.');
    }
  };
  
  const handleEdit = async (commentId) => {
    if (!editContent.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }
    
    try {
      await updateComment({ 
        eventId, 
        commentId, 
        content: editContent 
      }).unwrap();
      setEditMode(null);
      toast.success('댓글을 수정했습니다.');
    } catch (error) {
      toast.error(error.data?.message || '댓글 수정에 실패했습니다.');
    }
  };
  
  const handleDelete = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await deleteComment({ eventId, commentId }).unwrap();
      toast.success('댓글을 삭제했습니다.');
    } catch (error) {
      toast.error(error.data?.message || '댓글 삭제에 실패했습니다.');
    }
  };
  
  const startEdit = (comment) => {
    setEditMode(comment._id);
    setEditContent(comment.content);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">댓글</h3>
      
      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <img 
            src={user?.avatar || '/default-avatar.png'}
            alt="프로필 이미지"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAuthenticated ? "댓글을 작성해보세요..." : "댓글을 작성하려면 로그인하세요"}
              disabled={!isAuthenticated || isCreating}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              rows="3"
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!isAuthenticated || isCreating || !content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isCreating ? '게시 중...' : '댓글 작성'}
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {/* 댓글 목록 */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">댓글을 불러오는 중...</p>
          </div>
        ) : comments?.length > 0 ? (
          <AnimatePresence>
            {comments.map(comment => (
              <motion.div 
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <img 
                      src={comment.author?.avatar || '/default-avatar.png'}
                      alt={comment.author?.name || '사용자'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium text-gray-800">
                        {comment.author?.name || '익명'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { 
                          addSuffix: true, 
                          locale: ko 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {user && comment.author && user._id === comment.author._id && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(comment)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDelete(comment._id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                
                {editMode === comment._id ? (
                  <div className="mt-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                      rows="3"
                    ></textarea>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEditMode(null)}
                        className="px-3 py-1.5 text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleEdit(comment._id)}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {isUpdating ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <p className="text-gray-500">아직 댓글이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">첫 댓글을 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCommentSection; 