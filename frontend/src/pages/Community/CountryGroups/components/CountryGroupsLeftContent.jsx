import React from 'react';
import { motion } from 'framer-motion';

const CountryGroupsLeftContent = ({ selectedCountry, onCountryChange }) => {
  const countries = [
    { id: 'all', name: '전체 국가', flag: '🌏', nativeName: '모든 국가' },
    { id: 'KR', name: '대한민국', flag: '🇰🇷', nativeName: '대한민국' },
    { id: 'CN-KR', name: '한국계 중국인', flag: '🇨🇳', nativeName: '韓國系 中國人' },
    { id: 'CN', name: '중국', flag: '🇨🇳', nativeName: '中国' },
    { id: 'VN', name: '베트남', flag: '🇻🇳', nativeName: 'Việt Nam' },
    { id: 'TH', name: '태국', flag: '🇹🇭', nativeName: 'ประเทศไทย' },
    { id: 'US', name: '미국', flag: '🇺🇸', nativeName: 'United States' },
    { id: 'UZ', name: '우즈베키스탄', flag: '🇺🇿', nativeName: "O'zbekiston" },
    { id: 'NP', name: '네팔', flag: '🇳🇵', nativeName: 'नेपाल' },
    { id: 'ID', name: '인도네시아', flag: '🇮🇩', nativeName: 'Indonesia' },
    { id: 'PH', name: '필리핀', flag: '🇵🇭', nativeName: 'Pilipinas' },
    { id: 'KH', name: '캄보디아', flag: '🇰🇭', nativeName: 'កម្ពុជា' },
    { id: 'MN', name: '몽골', flag: '🇲🇳', nativeName: 'Монгол' },
    { id: 'MM', name: '미얀마', flag: '🇲🇲', nativeName: 'မြန်မာ' },
    { id: 'TW', name: '대만', flag: '🇹🇼', nativeName: '臺灣' },
    { id: 'KZ', name: '카자흐스탄', flag: '🇰🇿', nativeName: 'Қазақстан' },
    { id: 'JP', name: '일본', flag: '🇯🇵', nativeName: '日本' },
    { id: 'LK', name: '스리랑카', flag: '🇱🇰', nativeName: 'ශ්‍රී ලංකා' },
    { id: 'RU-KR', name: '한국계 러시아인', flag: '🇷🇺', nativeName: 'Корё-сарам' },
    { id: 'RU', name: '러시아', flag: '🇷🇺', nativeName: 'Россия' },
    { id: 'BD', name: '방글라데시', flag: '🇧🇩', nativeName: 'বাংলাদেশ' },
    { id: 'CA', name: '캐나다', flag: '🇨🇦', nativeName: 'Canada' }
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
          {countries.map((country) => (
            <motion.button
              key={country.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCountryChange(country.id)}
              className={`w-full text-left px-4 py-3 rounded-lg
                       flex items-center gap-3
                       ${selectedCountry === country.id 
                         ? 'bg-blue-50 text-blue-600 font-medium border-blue-200' 
                         : 'bg-white hover:bg-gray-50 text-gray-600'}`}
            >
              <span className="text-xl">{country.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm">{country.name}</span>
                <span className="text-xs text-gray-500">{country.nativeName}</span>
              </div>
              {selectedCountry === country.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CountryGroupsLeftContent; 