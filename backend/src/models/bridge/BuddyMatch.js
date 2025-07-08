const mongoose = require('mongoose');

const buddyMatchSchema = new mongoose.Schema({
  // 매칭된 사용자들
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buddy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 매칭 정보
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  
  matchFactors: {
    interests: { type: Number, default: 0 },
    languages: { type: Number, default: 0 },
    availability: { type: Number, default: 0 },
    location: { type: Number, default: 0 },
    ageGroup: { type: Number, default: 0 }
  },
  
  status: {
    type: String,
    enum: ['pending', 'accepted', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // 활동 기록
  activities: [{
    type: {
      type: String,
      enum: ['meeting', 'event', 'online_chat', 'cultural_exchange']
    },
    title: String,
    date: Date,
    location: String,
    notes: String,
    photos: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  
  // 커뮤니케이션 선호도
  communicationPreferences: {
    preferredLanguage: String,
    meetingFrequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'flexible']
    },
    preferredActivities: [String],
    preferredLocations: [String]
  },
  
  // 리뷰 및 피드백
  reviews: [{
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    communication: { type: Number, min: 1, max: 5 },
    reliability: { type: Number, min: 1, max: 5 },
    friendship: { type: Number, min: 1, max: 5 },
    culturalExchange: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 매칭 날짜 및 기간
  matchedAt: {
    type: Date,
    default: Date.now
  },
  
  acceptedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  
  // 다음 미팅 일정
  nextMeeting: {
    date: Date,
    location: String,
    activity: String,
    confirmed: { type: Boolean, default: false }
  },
  
  // 통계
  stats: {
    totalMeetings: { type: Number, default: 0 },
    totalActivities: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActivityDate: Date
  }
}, {
  timestamps: true
});

// 인덱스
buddyMatchSchema.index({ requester: 1, buddy: 1 });
buddyMatchSchema.index({ status: 1 });
buddyMatchSchema.index({ matchedAt: -1 });

// 활동 추가 메서드
buddyMatchSchema.methods.addActivity = function(activity) {
  this.activities.push(activity);
  this.stats.totalActivities += 1;
  this.stats.lastActivityDate = new Date();
  
  // 연속 활동 일수 계산
  if (this.stats.lastActivityDate) {
    const daysSinceLastActivity = Math.floor((new Date() - this.stats.lastActivityDate) / (1000 * 60 * 60 * 24));
    if (daysSinceLastActivity <= 7) {
      this.stats.streakDays += daysSinceLastActivity;
    } else {
      this.stats.streakDays = 1;
    }
  }
};

// 매칭 수락
buddyMatchSchema.methods.accept = function() {
  this.status = 'accepted';
  this.acceptedAt = new Date();
};

// 매칭 완료
buddyMatchSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
};

// 매칭 취소
buddyMatchSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
};

module.exports = mongoose.model('BuddyMatch', buddyMatchSchema);