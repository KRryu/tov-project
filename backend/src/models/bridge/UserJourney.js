const mongoose = require('mongoose');

const userJourneySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // 여정 진행 상태
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  
  // 프로그램 참여 상태
  completedPrograms: [{
    programId: {
      type: String,
      enum: ['BUDDY', 'KOKO', 'POPPOP', 'TALKTALK']
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  inProgressPrograms: [{
    programId: {
      type: String,
      enum: ['BUDDY', 'KOKO', 'POPPOP', 'TALKTALK']
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  
  // 포인트 및 레벨
  points: {
    type: Number,
    default: 0
  },
  
  level: {
    type: String,
    enum: ['Newcomer', 'Explorer', 'Resident', 'Expert', 'Ambassador'],
    default: 'Newcomer'
  },
  
  // 성취 기록
  achievements: [{
    achievementId: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 활동 기록
  activityHistory: [{
    type: {
      type: String,
      enum: ['program_start', 'program_complete', 'event_join', 'buddy_match', 'achievement_earn']
    },
    programId: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 버디 매칭 정보
  buddyMatches: [{
    buddyUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchedAt: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    },
    matchScore: Number,
    reviews: [{
      rating: Number,
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  
  // 프로그램별 상세 진행 상황
  programDetails: {
    BUDDY: {
      totalMatches: { type: Number, default: 0 },
      activeMatches: { type: Number, default: 0 },
      eventsAttended: { type: Number, default: 0 }
    },
    KOKO: {
      currentLevel: String,
      completedLessons: { type: Number, default: 0 },
      practiceHours: { type: Number, default: 0 }
    },
    POPPOP: {
      dancesLearned: { type: Number, default: 0 },
      concertsAttended: { type: Number, default: 0 },
      favoriteArtists: [String]
    },
    TALKTALK: {
      languageExchanges: { type: Number, default: 0 },
      seminarsAttended: { type: Number, default: 0 },
      mentoringSessions: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// 레벨 계산 메서드
userJourneySchema.methods.calculateLevel = function() {
  const points = this.points;
  if (points >= 1000) return 'Ambassador';
  if (points >= 500) return 'Expert';
  if (points >= 200) return 'Resident';
  if (points >= 50) return 'Explorer';
  return 'Newcomer';
};

// 여정 단계 업데이트
userJourneySchema.methods.updateJourneyStep = function() {
  const completedCount = this.completedPrograms.length;
  const totalPrograms = 4;
  
  if (completedCount === totalPrograms) {
    this.currentStep = 4; // 정착
  } else if (completedCount >= 2) {
    this.currentStep = 3; // 성장
  } else if (completedCount >= 1) {
    this.currentStep = 2; // 적응
  } else {
    this.currentStep = 1; // 도착
  }
};

// 포인트 추가
userJourneySchema.methods.addPoints = function(points, reason) {
  this.points += points;
  this.level = this.calculateLevel();
  
  // 활동 기록 추가
  this.activityHistory.push({
    type: 'achievement_earn',
    details: { points, reason },
    timestamp: new Date()
  });
};

module.exports = mongoose.model('UserJourney', userJourneySchema);