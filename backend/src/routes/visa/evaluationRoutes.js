/**
 * 비자 평가 전용 라우터 - V3.0 최적화
 * 역할: 비자 평가, 결과 저장, 추천 시스템
 * 
 * 🚀 V3.0 개선사항:
 * - 중복 API 제거 및 단순화
 * - 37개 비자 지원 준비
 * - 팩토리 패턴 기반 아키텍처
 * - E1 종합 서비스 통합
 */
const express = require('express');
const router = express.Router();
// 비자 평가 컨트롤러
const visaEvaluationController = require('../../controllers/visa/visaEvaluationController');
const { protect: requireAuth } = require('../../middlewares/auth');
const logger = require('../../utils/logger');
const { uploadVisaDocument } = require('../../middlewares/uploadMiddleware');
const asyncHandler = require('../../utils/asyncHandler');

// 라우터 설정 시작 로그
logger.info('🚀 비자 평가 라우터 V3.0 설정 중...');

// === 🆕 V3 최적화된 핵심 API ===

/**
 * 🎯 메인 비자 평가 (V3 최적화)
 * POST /api/visa/evaluation/evaluate
 */
router.post('/evaluate', requireAuth, asyncHandler(visaEvaluationController.evaluateVisa));

/**
 * ⚡ 빠른 사전 평가 (신규)
 * POST /api/visa/evaluation/quick
 */
router.post('/quick', asyncHandler(visaEvaluationController.quickEvaluation));

/**
 * 🎯 비자 추천 시스템 (신규)
 * POST /api/visa/evaluation/recommend
 */
router.post('/recommend', asyncHandler(visaEvaluationController.recommendVisaTypes));

/**
 * 📚 신청 가이드 조회 (신규)
 * GET /api/visa/evaluation/guide?visaType=E-1&applicationType=NEW
 */
router.get('/guide', asyncHandler(visaEvaluationController.getApplicationGuide));

/**
 * 📊 서비스 상태 조회 (최적화됨)
 * GET /api/visa/evaluation/status
 */
router.get('/status', asyncHandler(visaEvaluationController.getServiceStatus));

/**
 * 📋 지원되는 비자 유형 목록 (최적화됨)
 * GET /api/visa/evaluation/supported-types
 */
router.get('/supported-types', asyncHandler(visaEvaluationController.getSupportedTypes));

/**
 * 🔍 비자 타입 상세 정보 (신규)
 * GET /api/visa/evaluation/visa-types/:visaType
 */
router.get('/visa-types/:visaType', asyncHandler(visaEvaluationController.getVisaTypeInfo));

// === 💾 평가 결과 관리 (인증 필요) ===

// 평가 결과 저장
router.post('/save-result', requireAuth, asyncHandler(visaEvaluationController.saveEvaluationResult));

// 사용자의 비자 신청 기록 조회
router.get('/applications', requireAuth, asyncHandler(visaEvaluationController.getUserApplications));

// 특정 비자 신청서 상세 조회
router.get('/applications/:id', requireAuth, asyncHandler(visaEvaluationController.getApplicationDetail));

// === 📄 평가 관련 문서 업로드 (인증 필요) ===

// 평가용 문서 업로드
router.post('/upload-documents', requireAuth, uploadVisaDocument('documents'), asyncHandler(visaEvaluationController.uploadDocuments));

// === 📝 신청서 제출 (인증 필요) ===

// 평가 완료 후 신청서 제출
router.post('/submit', requireAuth, asyncHandler(visaEvaluationController.submitApplication));



// === 🎯 E1 비자 특화 API ===

/**
 * 🎯 E1 비자 종합 평가 (통합된 서비스)
 * POST /api/visa/evaluation/e1/comprehensive
 */
router.post('/e1/comprehensive', requireAuth, asyncHandler(visaEvaluationController.comprehensiveE1Evaluation));

logger.info('✅ 비자 평가 라우터 V3.0 설정 완료 - 최적화됨');

module.exports = router; 