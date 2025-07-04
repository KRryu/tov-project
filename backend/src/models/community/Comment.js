const mongoose = require('mongoose');

const communityCommentSchema = new mongoose.Schema({
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
    ref: 'CommunityPost',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CommunityComment', communityCommentSchema); 