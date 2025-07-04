const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '제목은 필수입니다.'],
    trim: true,
    maxlength: [100, '제목은 100자를 넘을 수 없습니다.']
  },
  content: {
    type: String,
    required: [true, '내용은 필수입니다.'],
    trim: true
  },
  category: {
    type: String,
    required: [true, '카테고리는 필수입니다.'],
    enum: [
      '생활 및 일상 팁',
      '여행 & 지역 탐방',
      '취미 & 여가 활동',
      '건강 & 웰빙',
      '자유 & 소통'
    ]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityComment'
  }]
});

module.exports = mongoose.model('CommunityPost', communityPostSchema); 