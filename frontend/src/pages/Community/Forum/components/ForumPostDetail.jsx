import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  useGetPostQuery, 
  useDeletePostMutation,
  useLikePostMutation,
  useUnlikePostMutation 
} from '../../../../api/services/communityService';
import { useAuth } from '../../../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import CommentSection from './CommentSection';

const ForumPostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: post, isLoading, error } = useGetPostQuery(postId);
  const [deletePost] = useDeletePostMutation();
  const [likePost] = useLikePostMutation();
  const [unlikePost] = useUnlikePostMutation();

  const canDelete = user && post?.author && (
    user._id === post.author._id || 
    user.role === 'admin'
  );

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deletePost(postId).unwrap();
      toast.success('게시글이 삭제되었습니다.');
      navigate('/community/forum');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      toast.error(error.data?.message || '게시글 삭제에 실패했습니다.');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('좋아요를 누르려면 로그인이 필요합니다.');
      navigate('/login', { 
        state: { from: location.pathname }
      });
      return;
    }

    try {
      const isLiked = post?.likes?.includes(user?._id);
      if (isLiked) {
        await unlikePost(postId).unwrap();
        toast.success('좋아요를 취소했습니다.');
      } else {
        await likePost(postId).unwrap();
        toast.success('좋아요를 눌렀습니다.');
      }
    } catch (error) {
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-8 text-red-600">
        게시글을 불러오는데 실패했습니다.
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6"
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* 상단 네비게이션 바 */}
        <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/community/forum')}
            className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <span>←</span> 목록으로
          </motion.button>
          {canDelete && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              삭제
            </motion.button>
          )}
        </div>

        <div className="p-8">
          {/* 메타 정보 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                {post.category}
              </span>
              <span className="text-gray-500 text-sm">
                {formatDistanceToNow(new Date(post.createdAt), { 
                  addSuffix: true, 
                  locale: ko 
                })}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">{post.title}</h1>
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="relative">
                <img
                  src={post.author?.avatar || '/default-avatar.png'}
                  alt={post.author?.name}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="font-semibold text-gray-800">{post.author?.name || '익명'}</div>
                <div className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 게시글 내용 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="prose max-w-none mb-8 text-gray-700 leading-relaxed min-h-[200px]"
          >
            {post.content}
          </motion.div>

          {/* 좋아요 & 댓글 섹션 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="border-t border-gray-100 pt-6"
          >
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-200
                  ${post?.likes?.includes(user?._id)
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className="text-xl">
                  {post?.likes?.includes(user?._id) ? '❤️' : '🤍'}
                </span>
                <span className="font-medium">{post?.likes?.length || 0}</span>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                <span className="text-xl">💬</span>
                <span className="font-medium">{post?.comments?.length || 0}</span>
              </motion.button>
            </div>
          </motion.div>

          {/* 댓글 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <CommentSection postId={postId} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ForumPostDetail; 