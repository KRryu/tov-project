const express = require('express');
const router = express.Router();

/**
 * 비자 관련 라우트 V2
 * 경로: /backend/src/routes/v2/visa/index.js
 * 
 * 역할: V2 버전 비자 관련 모든 라우트 통합 관리
 */

// 기존 라우트들을 import
const visaApplicationRoutes = require('./applicationRoutes');
const visaEvaluationRoutes = require('./evaluationRoutes');
const visaDocumentRoutes = require('./documentRoutes');
const visaAdvancedRoutes = require('./advancedRoutes');
// 새로 추가된 라우트들
const visaMatchingRoutes = require('./matchingRoutes');
const visaWorkflowRoutes = require('./workflowRoutes');
const visaPaymentRoutes = require('./paymentRoutes');

// 로깅을 위한 미들웨어
const logger = require('../../../utils/logger');

// API 버전 정보 미들웨어
router.use((req, res, next) => {
  req.apiVersion = 'v2';
  logger.debug(`비자 API V2 요청: ${req.method} ${req.originalUrl}`);
  next();
});

// 라우트 등록
router.use('/applications', visaApplicationRoutes);
router.use('/evaluation', visaEvaluationRoutes);
router.use('/documents', visaDocumentRoutes);
router.use('/advanced', visaAdvancedRoutes);
// 새로 추가된 라우트들
router.use('/matching', visaMatchingRoutes);
router.use('/workflow', visaWorkflowRoutes);
router.use('/payment', visaPaymentRoutes);

// V2 API 정보 엔드포인트
router.get('/info', (req, res) => {
  res.json({
    version: '2.0',
    description: 'TOV 비자 서비스 API V2',
    features: [
      '고급 비자 평가 시스템',
      '문서 검증 서비스',
      '평가 이력 추적',
      '추천 시스템',
      '행정사 매칭 서비스',
      '통합 워크플로우 관리',
      '고도화된 결제 시스템'
    ],
    endpoints: {
      applications: '/api/v2/visa/applications',
      evaluation: '/api/v2/visa/evaluation',
      documents: '/api/v2/visa/documents',
      advanced: '/api/v2/visa/advanced',
      matching: '/api/v2/visa/matching',
      workflow: '/api/v2/visa/workflow',
      payment: '/api/v2/visa/payment'
    },
    documentation: '/api/v2/docs',
    support: 'support@tov.com'
  });
});

// 헬스체크
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router; 