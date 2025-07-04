const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['비자변경', '한국어교육', '상담'], // 예약 서비스 종류
    required: true
  },
  details: {
    // 예약에 필요한 추가 정보 (예: 상담 날짜, 시간, 예약 내용 등)
    date: { type: Date, required: true },
    time: { type: String, required: true },
    notes: { type: String }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payment: {
    // 결제 정보와 연계 (참조용 Payment 문서 ID)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);
