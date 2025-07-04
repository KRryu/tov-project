import React from 'react';

const HeroSection = () => {
  return (
    <div className="relative bg-gray-900">
      {/* 배경 이미지 */}
      <div className="absolute inset-0">
        <img
          className="w-full h-full object-cover"
          src="/assets/images/tovspark/hero_TOVspark.jpg"
          alt="TOVspark Hero Background"
        />
        <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
      </div>

      {/* 컨텐츠 */}
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          당신의 역량, TOVspark에서 증명하세요!
        </h1>
        <p className="mt-6 text-xl text-gray-300 max-w-3xl">
          기업이 등록한 다양한 과제를 통해 실력을 입증하고, 채용 기회를 잡으세요.
        </p>
      </div>
    </div>
  );
};

export default HeroSection; 