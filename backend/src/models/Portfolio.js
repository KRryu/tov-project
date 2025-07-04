const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'  // 과제(챌린지) 모델과 연계
    }
  ],
  education: [
    {
      courseName: String,
      institution: String,
      completedAt: Date,
      certificateUrl: String
    }
  ],
  meetups: [
    {
      meetupName: String,
      eventDate: Date,
      description: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
