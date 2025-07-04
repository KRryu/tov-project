const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');

// 예약 생성 (POST /api/v1/reservations)
exports.createReservation = async (req, res, next) => {
  try {
    const { user, serviceType, details } = req.body;
    // 예약 생성
    const reservation = await Reservation.create({ user, serviceType, details });
    res.status(201).json({ success: true, reservation });
  } catch (error) {
    next(error);
  }
};

// 예약 조회 (GET /api/v1/reservations/:userId)
exports.getUserReservations = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const reservations = await Reservation.find({ user: userId }).populate('payment');
    res.status(200).json({ success: true, reservations });
  } catch (error) {
    next(error);
  }
};
