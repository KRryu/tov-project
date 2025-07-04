// Event 모델 (backend/src/models/community/Event.js)
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '제목은 필수입니다.'],
    trim: true,
    maxlength: [100, '제목은 100자를 넘을 수 없습니다.']
  },
  description: {
    type: String,
    required: [true, '설명은 필수입니다.'],
    trim: true
  },
  location: {
    type: String,
    required: [true, '장소는 필수입니다.'],
    trim: true
  },
  eventType: {
    type: String,
    required: [true, '이벤트 유형은 필수입니다.'],
    enum: ['offline', 'online', 'hybrid']
  },
  category: {
    type: String,
    required: [true, '카테고리는 필수입니다.'],
    enum: ['networking', 'workshop', 'seminar', 'cultural', 'sports', 'other']
  },
  startDate: {
    type: Date,
    required: [true, '시작 날짜는 필수입니다.']
  },
  endDate: {
    type: Date,
    required: [true, '종료 날짜는 필수입니다.']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventComment'
  }],
  image: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('EventModel', eventSchema);