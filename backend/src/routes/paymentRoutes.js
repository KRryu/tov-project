const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 결제 처리
router.post('/', paymentController.processPayment);

// 사용자 결제 내역 조회 (userId 기준)
router.get('/:userId', paymentController.getUserPayments);

module.exports = router;
