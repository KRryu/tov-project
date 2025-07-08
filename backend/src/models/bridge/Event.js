const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['buddy', 'koko', 'poppop', 'talktalk', 'special', 'community'],
    required: true
  },
  category: {
    type: String,
    enum: ['meetup', 'class', 'party', 'workshop', 'trip', 'online'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    venue: String,
    address: String,
    online: Boolean,
    link: String
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 30
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    }
  }],
  tags: [String],
  images: [String],
  requirements: {
    level: String,
    programs: [String],
    description: String
  },
  fee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    daysOfWeek: [Number], // 0 = Sunday, 6 = Saturday
    endDate: Date
  }
}, {
  timestamps: true
});

// 인덱스
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ type: 1, category: 1 });
eventSchema.index({ 'participants.user': 1 });

// 가상 필드 - 남은 자리
eventSchema.virtual('availableSeats').get(function() {
  const registered = this.participants.filter(p => p.status === 'registered').length;
  return this.maxParticipants - registered;
});

// 가상 필드 - 참가 가능 여부
eventSchema.virtual('canRegister').get(function() {
  return this.availableSeats > 0 && this.status === 'upcoming' && new Date(this.date) > new Date();
});

// 메서드 - 참가 신청
eventSchema.methods.registerParticipant = function(userId) {
  // 이미 등록되었는지 확인
  const existing = this.participants.find(p => p.user.toString() === userId.toString());
  if (existing) {
    if (existing.status === 'cancelled') {
      existing.status = 'registered';
      existing.registeredAt = new Date();
      return this.save();
    }
    throw new Error('이미 등록된 이벤트입니다.');
  }
  
  // 자리가 있는지 확인
  if (this.availableSeats <= 0) {
    throw new Error('이벤트가 만석입니다.');
  }
  
  // 등록
  this.participants.push({
    user: userId,
    status: 'registered'
  });
  
  return this.save();
};

// 메서드 - 참가 취소
eventSchema.methods.cancelParticipation = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) {
    throw new Error('등록되지 않은 이벤트입니다.');
  }
  
  participant.status = 'cancelled';
  return this.save();
};

// 스태틱 메서드 - 이번 달 이벤트
eventSchema.statics.getMonthlyEvents = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $ne: 'cancelled' }
  })
  .populate('organizer', 'name avatar')
  .populate('participants.user', 'name avatar')
  .sort({ date: 1 });
};

// 스태틱 메서드 - 추천 이벤트
eventSchema.statics.getRecommendedEvents = function(userId, userPrograms = []) {
  return this.find({
    date: { $gte: new Date() },
    status: 'upcoming',
    $or: [
      { 'requirements.programs': { $in: userPrograms } },
      { 'requirements.programs': { $size: 0 } }
    ]
  })
  .limit(5)
  .populate('organizer', 'name avatar')
  .sort({ date: 1 });
};

module.exports = mongoose.model('BridgeEvent', eventSchema);