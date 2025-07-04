/**
 * 비자 평가 라우트 V3
 * 새로운 통합 평가 시스템 API
 */

const express = require('express');
const router = express.Router();
const EvaluationController = require('../../controllers/EvaluationController');

// 기본 평가 엔드포인트
router.post('/evaluate', EvaluationController.evaluate);

// 빠른 평가
router.post('/quick-evaluate', EvaluationController.quickEvaluate);

// 배치 평가
router.post('/batch-evaluate', EvaluationController.batchEvaluate);

// 정보 조회
router.get('/supported-types', EvaluationController.getSupportedTypes);
router.get('/requirements/:visaType/:applicationType', EvaluationController.getRequirements);
router.get('/change-paths/:currentVisa', EvaluationController.getChangePaths);

// 시스템 상태
router.get('/status', EvaluationController.getStatus);

// 레거시 호환
router.post('/legacy/evaluate', EvaluationController.legacyEvaluate);

module.exports = router;