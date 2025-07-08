export const BRIDGE_PROGRAMS = {
  BUDDY: {
    id: 'BUDDY',
    name: 'BUDDY',
    title: '친구 만들기',
    description: '한국인 친구와 1:1 매칭으로 진정한 우정을 만들어가세요',
    icon: '👥',
    color: 'from-red-400 to-pink-500',
    features: [
      '관심사 기반 매칭',
      '1:1 문화 교류',
      '정기 모임 지원',
      '활동 포인트 제공'
    ]
  },
  KOKO: {
    id: 'KOKO',
    name: 'KOKO',
    title: '한국어 마스터',
    description: '재미있고 실용적인 한국어 학습으로 언어의 벽을 넘어서세요',
    icon: '🇰🇷',
    color: 'from-purple-400 to-indigo-500',
    features: [
      '레벨별 맞춤 학습',
      '실생활 회화 중심',
      '문화 이해 교육',
      '학습 인증서 발급'
    ]
  },
  POPPOP: {
    id: 'POPPOP',
    name: 'POPPOP',
    title: 'K-POP 여행',
    description: 'K-POP과 한국 대중문화를 직접 체험하고 즐기세요',
    icon: '🎵',
    color: 'from-pink-400 to-red-500',
    features: [
      'K-POP 댄스 클래스',
      '아이돌 투어',
      '콘서트 정보',
      '팬 커뮤니티'
    ]
  },
  TALKTALK: {
    id: 'TALKTALK',
    name: 'TALKTALK',
    title: '소통의 장',
    description: '언어교환, 자기계발, 비자 정보까지 모든 소통이 가능한 공간',
    icon: '💬',
    color: 'from-teal-400 to-green-500',
    features: [
      '언어 교환 매칭',
      '비자 상담 지원',
      '자기계발 프로그램',
      '네트워킹 이벤트'
    ]
  }
};

export const JOURNEY_LEVELS = {
  NEWCOMER: {
    name: 'Newcomer',
    title: '새내기 모험가',
    minPoints: 0,
    maxPoints: 99,
    color: 'text-gray-600',
    badge: '🌱'
  },
  EXPLORER: {
    name: 'Explorer',
    title: '탐험가',
    minPoints: 100,
    maxPoints: 299,
    color: 'text-blue-600',
    badge: '🧭'
  },
  RESIDENT: {
    name: 'Resident',
    title: '정착민',
    minPoints: 300,
    maxPoints: 599,
    color: 'text-purple-600',
    badge: '🏠'
  },
  EXPERT: {
    name: 'Expert',
    title: '전문가',
    minPoints: 600,
    maxPoints: 999,
    color: 'text-orange-600',
    badge: '⭐'
  },
  AMBASSADOR: {
    name: 'Ambassador',
    title: '홍보대사',
    minPoints: 1000,
    maxPoints: null,
    color: 'text-red-600',
    badge: '👑'
  }
};

export const QUEST_TYPES = {
  DAILY: {
    id: 'daily',
    name: '일일 퀘스트',
    resetTime: '매일 자정',
    icon: '☀️'
  },
  WEEKLY: {
    id: 'weekly',
    name: '주간 퀘스트',
    resetTime: '매주 월요일',
    icon: '📅'
  },
  ACHIEVEMENT: {
    id: 'achievement',
    name: '업적',
    resetTime: '영구',
    icon: '🏆'
  }
};

export const ACHIEVEMENTS = {
  // 프로그램 관련 업적
  FIRST_STEP: {
    id: 'first_program',
    name: 'First Step',
    description: '첫 프로그램을 완료했습니다!',
    icon: '🎯',
    points: 20,
    category: 'program'
  },
  JOURNEY_MASTER: {
    id: 'all_programs',
    name: 'Journey Master',
    description: '모든 프로그램을 완료했습니다!',
    icon: '🏆',
    points: 100,
    category: 'program'
  },
  FRIENDSHIP_BUILDER: {
    id: 'buddy_complete',
    name: 'Friendship Builder',
    description: 'BUDDY 프로그램을 완료했습니다!',
    icon: '🤝',
    points: 30,
    category: 'program'
  },
  LANGUAGE_WARRIOR: {
    id: 'koko_complete',
    name: 'Language Warrior',
    description: 'KOKO 프로그램을 완료했습니다!',
    icon: '🗣️',
    points: 30,
    category: 'program'
  },
  CULTURE_EXPLORER: {
    id: 'poppop_complete',
    name: 'Culture Explorer',
    description: 'POPPOP 프로그램을 완료했습니다!',
    icon: '🎵',
    points: 30,
    category: 'program'
  },
  COMMUNICATION_MASTER: {
    id: 'talktalk_complete',
    name: 'Communication Master',
    description: 'TALKTALK 프로그램을 완료했습니다!',
    icon: '💬',
    points: 30,
    category: 'program'
  },
  
  // 활동 관련 업적
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: '7일 연속 로그인했습니다!',
    icon: '🌅',
    points: 15,
    category: 'activity'
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: '10명의 친구를 만들었습니다!',
    icon: '🦋',
    points: 25,
    category: 'social'
  },
  HELPING_HAND: {
    id: 'helping_hand',
    name: 'Helping Hand',
    description: '다른 사용자를 5번 도와주었습니다!',
    icon: '🤲',
    points: 20,
    category: 'social'
  },
  
  // 레벨 관련 업적
  LEVEL_10: {
    id: 'level_10',
    name: 'Rising Star',
    description: 'Explorer 레벨에 도달했습니다!',
    icon: '⭐',
    points: 30,
    category: 'level'
  },
  LEVEL_20: {
    id: 'level_20',
    name: 'Veteran',
    description: 'Resident 레벨에 도달했습니다!',
    icon: '🌟',
    points: 50,
    category: 'level'
  },
  LEVEL_30: {
    id: 'level_30',
    name: 'Master',
    description: 'Expert 레벨에 도달했습니다!',
    icon: '💫',
    points: 70,
    category: 'level'
  },
  
  // 특별 업적
  PERFECT_WEEK: {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: '한 주 동안 모든 일일 퀘스트를 완료했습니다!',
    icon: '🎖️',
    points: 40,
    category: 'special'
  },
  SPEED_RUNNER: {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: '프로그램을 최단 시간 내에 완료했습니다!',
    icon: '⚡',
    points: 35,
    category: 'special'
  },
  BRIDGE_AMBASSADOR: {
    id: 'bridge_ambassador',
    name: 'Bridge Ambassador',
    description: '커뮤니티에 큰 기여를 했습니다!',
    icon: '👑',
    points: 100,
    category: 'special'
  }
};

export const ACHIEVEMENT_CATEGORIES = {
  program: { name: '프로그램', color: 'purple' },
  activity: { name: '활동', color: 'blue' },
  social: { name: '소셜', color: 'green' },
  level: { name: '레벨', color: 'yellow' },
  special: { name: '특별', color: 'red' }
};