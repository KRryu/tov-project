import React from 'react';
import { Link } from 'react-router-dom';

const ServiceCard = ({ track }) => {
  const { title, description, imagePath, link } = track;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full transform transition duration-300 hover:scale-105 hover:shadow-xl flex flex-col">
      {/* 이미지 컨테이너 */}
      <div className="relative overflow-hidden">
        <img
          src={imagePath}
          alt={title}
          className="w-full h-48 object-cover transition duration-300 hover:scale-110"
        />
        {/* 이미지 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 transition duration-300 hover:bg-opacity-10" />
      </div>

      {/* 컨텐츠 컨테이너 */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-600 flex-grow space-y-2">
          {description.map((item, index) => (
            <p key={index} className="flex items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              {item}
            </p>
          ))}
        </div>
        
        {/* 버튼 컨테이너 - 하단 고정 */}
        <div className="mt-6">
          <Link
            to={link}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transform transition duration-300 hover:-translate-y-1"
          >
            자세히 보기
            <svg 
              className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard; 