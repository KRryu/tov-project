import React from 'react';
import { motion } from 'framer-motion';
import { useGetCountryStatsQuery } from '../../../../api/services/communityService';

const CountryGroupsRightContent = () => {
  const { data, isLoading, error } = useGetCountryStatsQuery();
  
  // 데이터 구조 확인 및 안전한 접근
  const stats = data?.data || {};
  const { countryStats = [], globalStats = {} } = stats;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full xl:w-72 2xl:w-80 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full xl:w-72 2xl:w-80">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-600">통계 정보를 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full xl:w-72 2xl:w-80 space-y-6">
      {/* 인기 국가 그룹 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold mb-4">인기 국가 그룹</h3>
        <div className="space-y-3">
          {countryStats.slice(0, 5).map((country) => (
            <motion.div
              key={country.country}
              variants={itemVariants}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getCountryFlag(country.country)}
                </span>
                <span className="font-medium text-gray-700">
                  {getCountryName(country.country)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>👥</span>
                <span>{country.totalMembers?.toLocaleString() || 0}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 통계 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold mb-4">커뮤니티 통계</h3>
        <div className="space-y-4">
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <span className="text-gray-600">전체 그룹</span>
            <span className="font-medium text-blue-600">
              {globalStats.totalGroups || 0}개
            </span>
          </motion.div>
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <span className="text-gray-600">전체 멤버</span>
            <span className="font-medium text-blue-600">
              {globalStats.totalMembers?.toLocaleString() || 0}명
            </span>
          </motion.div>
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <span className="text-gray-600">오늘 새 글</span>
            <span className="font-medium text-blue-600">
              {globalStats.todayPosts || 0}개
            </span>
          </motion.div>
          <motion.div variants={itemVariants} className="flex justify-between items-center">
            <span className="text-gray-600">이번 주 활성 멤버</span>
            <span className="font-medium text-blue-600">
              {globalStats.weeklyActiveMembers?.toLocaleString() || 0}명
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* 공지사항 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold mb-3 text-blue-800">공지사항</h3>
        <p className="text-sm text-blue-600">
          새로운 국가 그룹이 추가될 예정입니다. 원하시는 국가 그룹이 있다면 제안해주세요!
        </p>
      </motion.div>
    </div>
  );
};

// 국가 코드에 따른 국기 이모지 반환
const getCountryFlag = (countryCode) => {
  const flags = {
    korea: '🇰🇷',
    japan: '🇯🇵',
    usa: '🇺🇸',
    canada: '🇨🇦',
    uk: '🇬🇧',
    australia: '🇦🇺',
    germany: '🇩🇪',
    france: '🇫🇷',
    singapore: '🇸🇬'
  };
  return flags[countryCode] || '🏳️';
};

// 국가 코드에 따른 국가명 반환
const getCountryName = (countryCode) => {
  const names = {
    korea: '대한민국',
    japan: '일본',
    usa: '미국',
    canada: '캐나다',
    uk: '영국',
    australia: '호주',
    germany: '독일',
    france: '프랑스',
    singapore: '싱가포르'
  };
  return names[countryCode] || countryCode;
};

export default CountryGroupsRightContent; 