const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const { protect } = require('../middlewares/auth'); // 인증 미들웨어 추가

// 예시 라우터: 회원가입 및 로그인
router.post('/register', userController.register);
router.post('/login', userController.login);

// 프로필 관련 라우트 - 인증 필요
router.get('/profile', protect, userController.getUserProfile);
router.put('/profile', protect, userController.updateUserProfile);

// 비자 신청 관련 사용자 정보
router.get('/visa-info', protect, userController.getVisaUserInfo);

module.exports = router;
