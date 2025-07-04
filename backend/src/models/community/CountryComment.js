const mongoose = require('mongoose');

const countryCommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, '댓글 내용은 필수입니다.'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CountryPost',
    required: true
  },
  country: {
    type: String,
    required: true,
    enum: [
      'KR', 'CN-KR', 'CN', 'VN', 'TH', 'US', 'UZ', 
      'NP', 'ID', 'PH', 'KH', 'MN', 'MM', 'TW', 
      'KZ', 'JP', 'LK', 'RU-KR', 'RU', 'BD', 'CA'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CountryComment', countryCommentSchema); 