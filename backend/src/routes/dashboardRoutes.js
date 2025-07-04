const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// 사용자 대시보드 데이터 조회 (GET /api/v1/dashboard/:userId)
router.get('/:userId', dashboardController.getDashboardData);

module.exports = router;
