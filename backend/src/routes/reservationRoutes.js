const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// 예약 생성
router.post('/', reservationController.createReservation);

// 사용자 예약 조회 (userId 기준)
router.get('/:userId', reservationController.getUserReservations);

module.exports = router;
