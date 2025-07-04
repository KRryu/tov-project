import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetCountryPostsQuery } from '../../../../api/services/communityService';
import { motion, AnimatePresence } from 'framer-motion';

const CountryGroupsEntries = ({ country = 'all', sortBy = 'newest' }) => {
  const navigate = useNavigate();
  const { data: response, isLoading, isError } = useGetCountryPostsQuery({ 
    country, 
    sortBy,
    page: 1,
    limit: 10
  });

  const posts = response?.posts || [];

  const getCountryFlag = (countryId) => {
    const flags = {
      'KR': '🇰🇷',
      'CN-KR': '🇨🇳',
      'CN': '🇨🇳',
      'VN': '🇻🇳',
      'TH': '🇹🇭',
      'US': '🇺🇸',
      'UZ': '🇺🇿',
      'NP': '🇳🇵',
      'ID': '🇮🇩',
      'PH': '🇵🇭',
      'KH': '🇰🇭',
      'MN': '🇲🇳',
      'MM': '🇲🇲',
      'TW': '🇹🇼',
      'KZ': '🇰🇿',
      'JP': '🇯🇵',
      'LK': '🇱🇰',
      'RU-KR': '🇷🇺',
      'RU': '🇷🇺',
      'BD': '🇧🇩',
      'CA': '🇨🇦',
      'all': '🌏'
    };
    return flags[countryId] || '🌏';
  };

  const getCountryName = (countryId) => {
    const names = {
      'KR': '대한민국',
      'CN-KR': '한국계 중국인',
      'CN': '중국',
      'VN': '베트남',
      'TH': '태국',
      'US': '미국',
      'UZ': '우즈베키스탄',
      'NP': '네팔',
      'ID': '인도네시아',
      'PH': '필리핀',
      'KH': '캄보디아',
      'MN': '몽골',
      'MM': '미얀마',
      'TW': '대만',
      'KZ': '카자흐스탄',
      'JP': '일본',
      'LK': '스리랑카',
      'RU-KR': '한국계 러시아인',
      'RU': '러시아',
      'BD': '방글라데시',
      'CA': '캐나다',
      'all': '전체'
    };
    return names[countryId] || countryId;
  };

  const handlePostClick = (postId) => {
    navigate(`/community/country-groups/post/${postId}`);
  };

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

  if (posts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-gray-50 rounded-2xl"
      >
        <p className="text-gray-500 mb-2">아직 게시글이 없습니다.</p>
        <p className="text-gray-400 text-sm">
          {country === 'all' 
            ? '첫 게시글을 작성해보세요!' 
            : `${getCountryFlag(country)} 국가 그룹의 첫 게시글을 작성해보세요!`}
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handlePostClick(post._id)}
            className="cursor-pointer bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="text-2xl">{getCountryFlag(post.country)}</span>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {getCountryName(post.country)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-blue-600">
                  {post.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 mb-4">
                  {post.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span>👤</span>
                    {post.author?.name || '익명'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>💬</span>
                    {post.commentsCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👍</span>
                    {post.likesCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>👥</span>
                    {post.membersCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default CountryGroupsEntries; 