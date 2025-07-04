const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

// 사용자 포트폴리오 조회: GET /api/v1/portfolio/:userId
router.get('/:userId', portfolioController.getPortfolio);

// 사용자 포트폴리오 업데이트: PUT /api/v1/portfolio/:userId
router.put('/:userId', portfolioController.updatePortfolio);

module.exports = router;
