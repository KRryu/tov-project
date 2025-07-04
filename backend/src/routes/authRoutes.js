const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth'); 

// 회원가입 라우트
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('유효한 이메일을 입력해주세요'),
    body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다'),
    body('name').notEmpty().withMessage('이름을 입력해주세요'),
    body('phoneNumber').notEmpty().withMessage('전화번호를 입력해주세요'),
    body('role').isIn(['challenger', 'company', 'pro']).withMessage('유효한 역할을 선택해주세요'),
  ],
  authController.register
);

// 로그인 라우트
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('유효한 이메일을 입력해주세요'),
    body('password').exists().withMessage('비밀번호를 입력해주세요')
  ],
  authController.login
);

// 로그아웃 라우트 - 인증 미들웨어 추가
router.post('/logout', protect, authController.logout);

// 현재 사용자 정보 가져오기
router.get('/me', protect, authController.getCurrentUser);

// 토큰 유효성 검증 (추가)
router.post('/validate-token', authController.validateToken);

module.exports = router; 