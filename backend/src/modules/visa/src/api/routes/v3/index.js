/**
 * V3 API 라우트 통합
 */

const express = require('express');
const router = express.Router();

// 평가 라우트
const evaluationRoutes = require('./evaluation');

// 라우트 등록
router.use('/evaluation', evaluationRoutes);

// V3 API 정보
router.get('/info', (req, res) => {
  res.json({
    version: '3.0',
    description: 'TOV 비자 서비스 API V3 - 37개 비자 통합 지원',
    features: [
      '37개 비자 타입 지원',
      '신규/연장/변경 신청 처리',
      'YAML 기반 설정 시스템',
      '실시간 평가',
      '워크플로우 관리'
    ],
    endpoints: {
      evaluation: '/api/v3/visa/evaluation',
      workflow: '/api/v3/visa/workflow',
      documents: '/api/v3/visa/documents',
      admin: '/api/v3/visa/admin'
    }
  });
});

module.exports = router;