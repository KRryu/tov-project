import React from 'react';
import { Link } from 'react-router-dom';
import { SERVICE_TRACKS } from '../constants/services';

function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative min-h-screen">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/assets/images/home/hero-image.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Main content - pushed down with pt-[20vh] */}
          <div className="container mx-auto px-4 pt-[20vh]">
            <div className="max-w-2xl lg:pl-[10%] mb-24">
              <h1 className="text-5xl font-bold text-white mb-6">
                한국에서의 여정<br />
                <span className="text-blue-400">TOVmate와 함께</span>
              </h1>
              <p className="text-xl text-gray-200 mb-12 leading-relaxed">
                새로운 환경에서의 도전은 쉽지 않습니다.<br />
                하지만 걱정하지 마세요.<br />
                당신의 한국에서의 모든 여정을<br />
                TOVmate가 함께 걸어가겠습니다.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-12">
                {SERVICE_TRACKS.map((track) => (
                  <Link 
                    key={track.id} 
                    to={track.link}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-4 text-white hover:bg-white/20 transition-all duration-300 flex items-center justify-between group"
                  >
                    <span className="font-medium">{track.title}</span>
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
              <div className="flex gap-4">
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  시작하기
                </Link>
                <Link
                  to="/login"
                  className="bg-white bg-opacity-20 text-white border border-white border-opacity-40 px-8 py-4 rounded-lg hover:bg-opacity-30 transition font-semibold backdrop-blur-sm"
                >
                  로그인
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 