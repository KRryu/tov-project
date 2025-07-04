// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

// 환경 변수 로드
dotenv.config();

// 유틸리티 및 설정
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const errorMiddleware = require('./middlewares/errorMiddleware');

/**
 * 최적화된 Express 애플리케이션 설정
 * 역할: 미들웨어 설정, 라우터 등록, 에러 핸들링
 */

const app = express();

logger.info('Express 애플리케이션 초기화 중...');

// === 🔒 보안 및 기본 미들웨어 ===

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// === 📁 정적 파일 서빙 ===

app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// === 🗄️ 데이터베이스 연결 ===

connectDB();

// === 🛣️ 라우터 등록 ===

// 인증 관련
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 사용자 관리
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// === 🔄 API 버전 관리 ===

// V1 API (기존 호환성)
const visaRoutesV1 = require('./routes/visa');
app.use('/api/visa', visaRoutesV1);
app.use('/api/v1/visa', visaRoutesV1); // 명시적 V1 경로

// V2 API (새로운 통합 시스템)
const visaRoutesV2 = require('./routes/v2/visa');
app.use('/api/v2/visa', visaRoutesV2);
logger.info('✅ 비자 API V2 라우트 설정 완료');

// 커뮤니티
const communityRoutes = require('./routes/community/communityRoutes');
app.use('/api/community', communityRoutes);

// 기타 서비스들 (v1 API)
const dashboardRoutes = require('./routes/dashboardRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const contentRoutes = require('./routes/contentRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/challenges', challengeRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/payments', paymentRoutes);

// === 🏥 헬스체크 엔드포인트 ===

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TOV 백엔드 서버가 정상 작동 중입니다',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '2.0.0',
    apis: {
      v1: {
        available: true,
        description: '기존 API (하위 호환성)',
        basePath: '/api/v1'
      },
      v2: {
        available: true,
        description: '향상된 API (새로운 기능)',
        basePath: '/api/v2',
        features: [
          '문서 검증 서비스',
          '평가 이력 추적',
          '지능형 추천 시스템',
          '향상된 분석 도구'
        ]
      }
    }
  });
});

// === 🚫 404 핸들러 ===

app.use('*', (req, res) => {
  logger.warn(`404 - 찾을 수 없는 경로: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `경로 ${req.originalUrl}을(를) 찾을 수 없습니다`,
    error: 'NOT_FOUND'
  });
});

// === ❌ 에러 핸들링 미들웨어 ===

app.use(errorMiddleware);

// === 🚀 서버 시작 ===

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`TOV 백엔드 서버 시작 완료`);
  logger.info(`포트: ${PORT}`);
  logger.info(`환경: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`프론트엔드 URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.info('주요 API 엔드포인트:');
    logger.info('=== 공통 ===');
    logger.info('  - GET  /api/health (헬스체크)');
    logger.info('  - POST /api/auth/login (로그인)');
    logger.info('=== V1 API (기존) ===');
    logger.info('  - POST /api/visa/evaluate/:visaType (비자 평가)');
    logger.info('  - GET  /api/visa/evaluate/supported-types (지원 비자 목록)');
    logger.info('=== V2 API (향상) ===');
    logger.info('  - POST /api/v2/visa/evaluation/:visaType (V2 비자 평가)');
    logger.info('  - POST /api/v2/visa/documents/upload (문서 업로드)');
    logger.info('  - GET  /api/v2/visa/evaluation/history (평가 이력)');
    logger.info('  - GET  /api/v2/visa/info (V2 API 정보)');
  }
});

module.exports = app;
