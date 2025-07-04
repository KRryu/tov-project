import React from 'react';
import { Link } from 'react-router-dom';

const ServicesSection = () => {
  const sections = [
    {
      id: 'entertainment',
      title: 'Entertainment',
      description: 'K-pop, K-dance, 공연, 전시 등 문화 예술 콘텐츠를 실시간으로 만나보세요.',
      imagePath: '/assets/images/tovplay/entertainment.jpg',
      link: '/tovplay/entertainment'
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle',
      description: '식당, 병원, 패션, 문구 등 실생활에 필요한 모든 정보를 한눈에 확인하세요.',
      imagePath: '/assets/images/tovplay/lifestyle.jpg',
      link: '/tovplay/lifestyle'
    },
    {
      id: 'healing',
      title: 'Healing Therapy',
      description: '플라워 수업, 음악치료, 미술치료 등 마음의 치유와 전문 상담 서비스를 제공합니다.',
      imagePath: '/assets/images/tovplay/healing.jpg',
      link: '/tovplay/healing'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          TOVplay 서비스
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          엔터테인먼트, 라이프스타일, 힐링 테라피까지
          <br />
          TOVplay에서 제공하는 다양한 서비스를 경험해보세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={section.link}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="aspect-w-16 aspect-h-9">
              <img 
                src={section.imagePath} 
                alt={section.title} 
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-gray-600">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ServicesSection; 