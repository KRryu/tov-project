import React from 'react';

const HeroSection = () => {
  return (
    <div className="relative h-[60vh] bg-cover bg-center" 
         style={{ backgroundImage: 'url(/assets/images/tovplay/hero_tovplay.jpg)' }}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative h-full flex items-center justify-center text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            TOVplay와 함께하는 특별한 경험
          </h1>
          <p className="text-xl text-gray-200">
            문화, 생활, 마음 치유를 한 곳에서 만나보세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 