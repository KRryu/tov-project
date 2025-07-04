const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  console.log('🔍 auth 미들웨어 시작 - 요청 경로:', req.originalUrl);
  
  let token;
  
  // 헤더에서 토큰 추출
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 토큰 추출
      token = req.headers.authorization.split(' ')[1];
      console.log('📋 추출된 토큰 (일부):', token ? token.substring(0, 10) + '...' : 'null');
      
      if (!token) {
        console.log('❌ 토큰 없음 - 권한 거부');
        res.status(401);
        throw new Error('Not authorized, no token');
      }
      
      // 토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ 토큰 검증 성공, 디코딩된 정보:', {
        id: decoded.id,
        exp: new Date(decoded.exp * 1000).toISOString(),
        iat: new Date(decoded.iat * 1000).toISOString()
      });
      
      // 사용자 정보 검색
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log('❌ 사용자를 찾을 수 없음, ID:', decoded.id);
        res.status(401);
        throw new Error('User not found with this token');
      }
      
      console.log('👤 인증된 사용자:', {
        id: req.user._id.toString(),
        email: req.user.email,
        role: req.user.role
      });
      
      next();
    } catch (error) {
      console.error('🔴 인증 오류:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Token expired');
      } else {
        res.status(401);
        throw new Error('Not authorized');
      }
    }
  } else {
    console.log('❌ Authorization 헤더 없음 - 권한 거부');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    console.log('👑 관리자 권한 확인됨:', req.user.email);
    next();
  } else {
    console.log('⛔ 관리자 권한 거부:', req.user ? req.user.email : '알 수 없음');
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin }; 