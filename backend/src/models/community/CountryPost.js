const mongoose = require('mongoose');

const countryPostSchema = new mongoose.Schema({
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
  country: {
    type: String,
    required: [true, '국가는 필수입니다.'],
    enum: [
      'KR', 'CN-KR', 'CN', 'VN', 'TH', 'US', 'UZ', 
      'NP', 'ID', 'PH', 'KH', 'MN', 'MM', 'TW', 
      'KZ', 'JP', 'LK', 'RU-KR', 'RU', 'BD', 'CA'
    ]
  },
  type: {
    type: String,
    required: [true, '게시글 유형은 필수입니다.'],
    enum: ['discussion', 'question', 'meetup']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
    ref: 'CountryComment'
  }]
});

countryPostSchema.pre('save', function(next) {
  const validCountries = [
    'KR', 'CN-KR', 'CN', 'VN', 'TH', 'US', 'UZ', 
    'NP', 'ID', 'PH', 'KH', 'MN', 'MM', 'TW', 
    'KZ', 'JP', 'LK', 'RU-KR', 'RU', 'BD', 'CA'
  ];

  if (!validCountries.includes(this.country)) {
    next(new Error('유효하지 않은 국가 코드입니다.'));
  }
  next();
});

module.exports = mongoose.model('CountryPost', countryPostSchema); 