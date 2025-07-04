import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPostsQuery } from '../../../../api/services/communityService';

const ForumEntries = ({ category = 'all', sortBy = 'newest' }) => {
  const { data: response, isLoading, isError } = useGetPostsQuery({ 
    category, 
    sortBy,
    page: 1,
    limit: 10
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-600">
        게시글을 불러오는데 실패했습니다.
      </div>
    );
  }

  // 백엔드 응답 구조에 맞게 수정
  const posts = response?.data?.posts;
  const pagination = response?.data?.pagination;

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">이 카테고리에는 아직 게시글이 없습니다.</p>
        <p className="text-gray-400 text-sm mt-2">첫 게시글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 md:px-0">
      {posts.map((post) => (
        <Link 
          key={post._id} 
          to={`/community/forum/post/${post._id}`}
          className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {post.category}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2 hover:text-blue-600">
                {post.title}
              </h3>
              <p className="text-gray-600 mt-1 line-clamp-2">
                {post.content}
              </p>
            </div>
          </div>
          <div className="flex items-center mt-4 space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <span className="mr-1">👤</span> {post.author?.name || '익명'}
            </span>
            <span className="flex items-center">
              <span className="mr-1">💬</span> {post.commentsCount || 0}
            </span>
            <span className="flex items-center">
              <span className="mr-1">👍</span> {post.likesCount || 0}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ForumEntries; 