const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['video', 'image'],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  metadata: {
    codec: { type: String },
    resolution: { type: String },
    duration: { type: Number }, // 동영상 길이(초) 등
    // 추가 메타데이터가 필요하면 여기 추가
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ]
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
