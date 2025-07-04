import React, { useState } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation
} from '../../../../api/services/communityService';
import { useNavigate, useLocation } from 'react-router-dom';

const CommentSection = ({ postId }) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { data: comments = [], isLoading } = useGetCommentsQuery(postId);
  const [createComment] = useCreateCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('댓글을 작성하려면 로그인이 필요합니다.');
      navigate('/login', { 
        state: { from: location.pathname }
      });
      return;
    }

    if (!content.trim()) return;

    try {
      await createComment({ postId, content }).unwrap();
      setContent('');
      toast.success('댓글이 작성되었습니다.');
    } catch (error) {
      toast.error(error.data?.message || '댓글 작성에 실패했습니다.');
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await updateComment({
        postId,
        commentId,
        content: editContent
      }).unwrap();
      setEditingId(null);
      toast.success('댓글이 수정되었습니다.');
    } catch (error) {
      toast.error('댓글 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment({ postId, commentId }).unwrap();
      toast.success('댓글이 삭제되었습니다.');
    } catch (error) {
      toast.error('댓글 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <motion.h3 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2"
      >
        <span>댓글</span>
        <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full text-sm">
          {comments.length}
        </span>
      </motion.h3>
      
      {/* 댓글 작성 폼 - 로그인 여부와 관계없이 항상 표시 */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit} 
        className="mb-8"
      >
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isAuthenticated ? "댓글을 입력하세요..." : "댓글을 작성하려면 로그인이 필요합니다."}
            className="w-full bg-white rounded-xl p-4 min-h-[100px] border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={!isAuthenticated}
          />
          <div className="flex justify-end mt-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`px-6 py-2.5 rounded-xl transition-all duration-200
                ${isAuthenticated 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              disabled={!isAuthenticated || !content.trim()}
            >
              {isAuthenticated ? '댓글 작성' : '로그인 필요'}
            </motion.button>
          </div>
        </div>
      </motion.form>

      {/* 댓글 목록 */}
      <div className="space-y-6">
        <AnimatePresence>
          {Array.isArray(comments) && comments.length > 0 ? (
            comments.map((comment, index) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                {editingId === comment._id ? (
                  <div className="space-y-4">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full rounded-xl p-4 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <div className="flex justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpdate(comment._id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        수정
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        취소
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={comment.author?.avatar || '/default-avatar.png'}
                            alt={comment.author?.name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{comment.author?.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: ko
                            })}
                          </div>
                        </div>
                      </div>
                      {user && (user._id === comment.author._id || user.role === 'admin') && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingId(comment._id);
                              setEditContent(comment.content);
                            }}
                            className="text-sm text-blue-500 hover:text-blue-600"
                          >
                            수정
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(comment._id)}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            삭제
                          </motion.button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                  </>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl"
            >
              첫 댓글을 작성해보세요!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentSection; 