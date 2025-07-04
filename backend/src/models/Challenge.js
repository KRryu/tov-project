const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxLength: 200
  },
  challengeType: {
    type: String,
    required: true,
    enum: [
      'tech_development',
      'business_strategy',
      'marketing',
      'design',
      'research',
      'planning'
    ]
  },
  industry: {
    type: String,
    required: true,
    enum: [
      'it_software',
      'finance',
      'healthcare',
      'education',
      'retail',
      'manufacturing'
    ]
  },
  requirements: {
    essential: [{
      type: String,
      required: true
    }],
    optional: [{
      type: String
    }]
  },
  reward: {
    type: {
      type: String,
      enum: ['recruitment', 'internship', 'mentoring', 'certification'],
      required: true
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 유효성 검사
challengeSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('종료일은 시작일보다 늦어야 합니다.'));
  }
  next();
});

module.exports = mongoose.model('Challenge', challengeSchema);
