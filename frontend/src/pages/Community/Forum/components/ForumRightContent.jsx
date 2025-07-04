import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPopularPostsQuery } from '../../../../api/services/communityService';
import { motion } from 'framer-motion';

const ForumRightContent = () => {
  const navigate = useNavigate();
  const { data: popularPosts = [], isLoading, error } = useGetPopularPostsQuery();

  const handlePostClick = (postId) => {
    if (postId) {
      navigate(`/community/forum/post/${postId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full xl:w-72 2xl:w-80">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full xl:w-72 2xl:w-80">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-center text-gray-500 py-4">
            인기 토픽을 불러오는데 실패했습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full xl:w-72 2xl:w-80">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">인기 토픽</h2>
        {popularPosts.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            아직 인기 토픽이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {popularPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handlePostClick(post._id)}
                className="cursor-pointer group"
              >
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span role="img" aria-label="likes">👍</span>
                        {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <span role="img" aria-label="comments">💬</span>
                        {post.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumRightContent; 