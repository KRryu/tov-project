const express = require('express');
const router = express.Router();
const visaController = require('../../controllers/visa/visaController');
const { protect: requireAuth } = require('../../middlewares/auth');
const { uploadVisaDocument, handleUploadError } = require('../../middlewares/uploadMiddleware');
const evaluationRouter = require('./evaluationRoutes');
const logger = require('../../utils/logger');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * 비자 관련 메인 라우터
 * 역할: 신청서 관리 (CRUD), 문서 업로드, 기본 조회
 */

logger.info('비자 메인 라우터 설정 중...');

// === 📋 비자 신청서 관리 라우트 (인증 필요) ===

// 비자 신청서 생성/업데이트
router.post('/applications', requireAuth, asyncHandler(visaController.createOrUpdateApplication));

// 현재 진행 중인 비자 신청서 조회
router.get('/applications/current', requireAuth, asyncHandler(visaController.getCurrentApplication));

// 비자 신청서 목록 조회
router.get('/applications', requireAuth, asyncHandler(visaController.getUserApplications));

// 특정 비자 신청서 조회
router.get('/applications/:id', requireAuth, asyncHandler(visaController.getApplicationById));

// 비자 신청서 제출
router.post('/applications/:id/submit', requireAuth, asyncHandler(visaController.submitApplication));

// === 📄 문서 업로드 라우트 (인증 필요) ===

// 통합 문서 업로드 (권장)
router.post('/documents', 
  requireAuth, 
  uploadVisaDocument('documents'), 
  handleUploadError,
  asyncHandler(visaController.uploadDocument)
);

// 특정 비자 타입 문서 업로드 (하위 호환성)
router.post('/documents/:visaType', 
  requireAuth, 
  uploadVisaDocument('documents'), 
  handleUploadError,
  asyncHandler(visaController.uploadDocument)
);

// 문서 다운로드
router.get('/documents/:id/download', requireAuth, asyncHandler(visaController.downloadDocument));

// 문서 삭제
router.delete('/documents/:id', requireAuth, asyncHandler(visaController.deleteDocument));

// === 🔄 비자 평가 관련 라우트 (위임) ===

// 평가 관련 모든 라우트를 evaluationRouter로 위임
router.use('/evaluate', evaluationRouter);

// === 📊 개발 환경 유틸리티 (간소화) ===

if (process.env.NODE_ENV === 'development') {
  router.get('/debug/info', (req, res) => {
    return res.json({
      success: true,
      service: 'visa-management',
      routes: {
        applications: 'POST/GET /applications',
        documents: 'POST /documents',
        evaluation: 'All routes under /evaluate'
      },
      timestamp: new Date().toISOString()
    });
  });
}

logger.info('비자 메인 라우터 설정 완료');

module.exports = router; 