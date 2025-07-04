const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');

// 전체 과제 목록 조회
router.get('/', challengeController.getChallenges);

// 과제 생성
router.post('/', challengeController.createChallenge);

// 특정 과제 상세 조회
router.get('/:challengeId', challengeController.getChallengeDetail);

// 과제 삭제 라우트 추가
router.delete('/:challengeId', challengeController.deleteChallenge);

module.exports = router;
