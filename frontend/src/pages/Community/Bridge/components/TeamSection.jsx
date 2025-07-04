import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, Globe, Award, Users, Calendar, MapPin } from 'lucide-react';

const TeamSection = () => {
  const [selectedRole, setSelectedRole] = useState('all');

  const teamMembers = [
    {
      id: 1,
      name: 'Sarah Kim',
      role: 'Founder & Community Lead',
      category: 'leadership',
      image: '/api/placeholder/120/120',
      bio: 'Bridge Club을 설립하고 5년간 글로벌 커뮤니티를 이끌어온 리더. 다양한 문화적 배경을 가진 사람들이 서로 연결되고 성장할 수 있는 플랫폼을 만들고 있습니다.',
      languages: ['Korean', 'English', 'Japanese'],
      experience: '5 years',
      achievements: [
        '500+ 커뮤니티 멤버 달성',
        '100+ 성공적인 이벤트 주최',
        '2023 Best Community Leader Award'
      ],
      contact: {
        email: 'sarah@bridgeclub.com',
        linkedin: 'sarahkim',
        github: 'sarahkim-bridge'
      }
    },
    {
      id: 2,
      name: 'James Park',
      role: 'Tech Lead & Developer',
      category: 'tech',
      image: '/api/placeholder/120/120',
      bio: 'Bridge Club의 기술 인프라를 담당하며, 커뮤니티 플랫폼 개발과 운영을 책임지고 있습니다. Tech 미팅과 워크샵을 주도합니다.',
      languages: ['Korean', 'English'],
      experience: '3 years',
      achievements: [
        'Bridge Club 플랫폼 v2.0 출시',
        'Tech Talk 시리즈 런칭',
        '50+ 기술 워크샵 진행'
      ],
      contact: {
        email: 'james@bridgeclub.com',
        linkedin: 'jamespark-dev',
        github: 'jamespark-bridge',
        website: 'jamespark.dev'
      }
    },
    {
      id: 3,
      name: 'Emily Chen',
      role: 'Event Coordinator',
      category: 'events',
      image: '/api/placeholder/120/120',
      bio: '창의적이고 의미 있는 이벤트를 기획하여 멤버들에게 특별한 경험을 제공합니다. 문화 교류와 네트워킹 이벤트를 전문으로 합니다.',
      languages: ['Korean', 'English', 'Chinese'],
      experience: '4 years',
      achievements: [
        '200+ 이벤트 기획 및 진행',
        '평균 이벤트 만족도 4.8/5.0',
        'Cultural Exchange Program 런칭'
      ],
      contact: {
        email: 'emily@bridgeclub.com',
        linkedin: 'emilychen-events'
      }
    },
    {
      id: 4,
      name: 'Michael Lee',
      role: 'Language Exchange Lead',
      category: 'language',
      image: '/api/placeholder/120/120',
      bio: '언어교환 프로그램을 운영하며 다양한 언어 학습 기회를 제공합니다. 효과적인 언어 학습 방법론을 연구하고 적용합니다.',
      languages: ['Korean', 'English', 'Spanish', 'French'],
      experience: '3 years',
      achievements: [
        '주간 언어교환 모임 운영',
        '1000+ 언어 학습자 지원',
        'Language Partner Matching System 개발'
      ],
      contact: {
        email: 'michael@bridgeclub.com',
        linkedin: 'michaellee-lang'
      }
    },
    {
      id: 5,
      name: 'Anna Schmidt',
      role: 'Cultural Program Manager',
      category: 'culture',
      image: '/api/placeholder/120/120',
      bio: '다양한 문화 체험 프로그램을 기획하고 운영합니다. 한국 문화를 소개하고 글로벌 문화 교류를 촉진합니다.',
      languages: ['Korean', 'English', 'German'],
      experience: '2 years',
      achievements: [
        'Korean Culture Workshop 시리즈',
        'International Food Festival 주최',
        '30+ 문화 체험 프로그램 운영'
      ],
      contact: {
        email: 'anna@bridgeclub.com',
        linkedin: 'annaschmidt-culture'
      }
    },
    {
      id: 6,
      name: 'David Kim',
      role: 'Partnership Manager',
      category: 'partnership',
      image: '/api/placeholder/120/120',
      bio: '기업 및 기관과의 파트너십을 담당하며, Bridge Club의 성장과 확장을 위해 노력합니다.',
      languages: ['Korean', 'English'],
      experience: '3 years',
      achievements: [
        '20+ 기업 파트너십 체결',
        '스폰서십 프로그램 운영',
        '커뮤니티 확장 전략 수립'
      ],
      contact: {
        email: 'david@bridgeclub.com',
        linkedin: 'davidkim-partner'
      }
    }
  ];

  const roleCategories = {
    all: '전체',
    leadership: '리더십',
    tech: '기술',
    events: '이벤트',
    language: '언어교환',
    culture: '문화',
    partnership: '파트너십'
  };

  const filteredMembers = selectedRole === 'all' 
    ? teamMembers 
    : teamMembers.filter(member => member.category === selectedRole);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bridge Club 운영진</h2>
        <p className="text-gray-600 mb-6">
          Bridge Club을 이끌어가는 열정적인 운영진들을 소개합니다. 
          각자의 전문 분야에서 커뮤니티 발전을 위해 헌신하고 있습니다.
        </p>

        {/* 역할 필터 */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(roleCategories).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedRole(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRole === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 팀 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Users className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{teamMembers.length}</h3>
          <p className="text-sm text-gray-600">운영진</p>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Calendar className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">5+</h3>
          <p className="text-sm text-gray-600">운영 경력 (년)</p>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-xl p-4 border border-green-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Globe className="w-8 h-8 text-green-600 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">8</h3>
          <p className="text-sm text-gray-600">사용 언어</p>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Award className="w-8 h-8 text-orange-600 mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">500+</h3>
          <p className="text-sm text-gray-600">주최 이벤트</p>
        </motion.div>
      </div>

      {/* 팀 멤버 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMembers.map((member, index) => (
          <motion.div
            key={member.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex gap-6">
              {/* 프로필 이미지 */}
              <div className="flex-shrink-0">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-purple-100"
                />
              </div>

              {/* 멤버 정보 */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                <p className="text-purple-600 font-medium mb-2">{member.role}</p>
                <p className="text-sm text-gray-600 mb-3">{member.bio}</p>

                {/* 언어 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {member.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {lang}
                    </span>
                  ))}
                </div>

                {/* 경력 */}
                <p className="text-sm text-gray-500 mb-3">
                  <span className="font-medium">Experience:</span> {member.experience}
                </p>
              </div>
            </div>

            {/* 주요 성과 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-900 mb-2">주요 성과</h4>
              <ul className="space-y-1">
                {member.achievements.map((achievement, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 연락처 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                {member.contact.email && (
                  <a
                    href={`mailto:${member.contact.email}`}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>이메일</span>
                  </a>
                )}
                {member.contact.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${member.contact.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {member.contact.github && (
                  <a
                    href={`https://github.com/${member.contact.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {member.contact.website && (
                  <a
                    href={`https://${member.contact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 팀 참여 안내 */}
      <motion.div 
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-2xl font-bold mb-4">Bridge Club 운영진이 되어주세요!</h3>
        <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
          Bridge Club은 열정적이고 헌신적인 새로운 운영진을 찾고 있습니다. 
          글로벌 커뮤니티를 함께 이끌어갈 분들의 지원을 기다립니다.
        </p>
        <div className="flex justify-center gap-4">
          <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            운영진 지원하기
          </button>
          <button className="px-6 py-3 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors">
            자세히 알아보기
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TeamSection;