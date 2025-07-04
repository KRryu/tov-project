const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');

// 결제 처리 (POST /api/v1/payments)
exports.processPayment = async (req, res, next) => {
  try {
    const { reservationId, user, amount, paymentMethod, transactionId } = req.body;
    
    // 결제 문서 생성
    const payment = await Payment.create({
      reservation: reservationId,
      user,
      amount,
      paymentMethod,
      transactionId,
      status: 'completed'  // 실제 결제 로직에 따라 상태 업데이트
    });
    
    // 해당 예약의 결제 정보 및 상태 업데이트
    await Reservation.findByIdAndUpdate(reservationId, {
      payment: payment._id,
      paymentStatus: 'completed'
    });
    
    res.status(201).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// 결제 내역 조회 (GET /api/v1/payments/:userId)
exports.getUserPayments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const payments = await Payment.find({ user: userId });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};
