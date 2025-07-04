const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * 통합 인증 컨트롤러 - 최적화됨
 * 역할별 회원가입, 로그인, 로그아웃, 사용자 정보 조회 통합 관리
 */

// JWT 토큰 생성 함수
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.NODE_ENV === 'development' ? '30d' : '7d'
  });
};

// 역할별 필수 필드 정의
const ROLE_REQUIRED_FIELDS = {
  challenger: ['email', 'password', 'name', 'nationality', 'phoneNumber'],
  company: ['email', 'password', 'name', 'companyName', 'businessNumber', 'companyAddress', 'phoneNumber'],
  pro: ['email', 'password', 'name', 'expertise', 'certification', 'experience', 'phoneNumber'],
  user: ['email', 'password', 'name'] // 기본 사용자
};

/**
 * 회원가입 (역할별 필드 검증 포함)
 */
const register = asyncHandler(async (req, res) => {
  logger.info('회원가입 요청 시작', { email: req.body.email, role: req.body.role });
  
  const { email, password, name, role = 'user' } = req.body;

  // 이메일 중복 체크
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logger.warn('회원가입 실패: 이메일 중복', { email });
    return res.status(400).json({
      success: false,
      message: '이미 등록된 이메일입니다.'
    });
  }

  // 역할별 필수 필드 검증
  const requiredFields = ROLE_REQUIRED_FIELDS[role] || ROLE_REQUIRED_FIELDS.user;
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    logger.warn('회원가입 실패: 필수 필드 누락', { missingFields, role });
    return res.status(400).json({
      success: false,
      message: `다음 필드가 필요합니다: ${missingFields.join(', ')}`
    });
  }

  // 새 사용자 생성
  const user = await User.create(req.body);
  logger.info('회원가입 성공', { email: user.email, role: user.role });

  // JWT 토큰 생성
  const token = generateToken(user._id);

  // 토큰을 사용자 모델에 저장 (세션 관리용)
  user.tokens = user.tokens || [];
  user.tokens.push({ token });
  await user.save();

  // 비밀번호 제외하고 사용자 정보 반환
  const userWithoutPassword = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    nationality: user.nationality,
    phoneNumber: user.phoneNumber,
    companyName: user.companyName,
    expertise: user.expertise,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  res.status(201).json({
    success: true,
    user: userWithoutPassword,
    token
  });
});

/**
 * 로그인
 */
const login = asyncHandler(async (req, res) => {
  logger.info('로그인 요청 시작', { email: req.body.email });
  
  const { email, password } = req.body;

  // 이메일과 비밀번호 확인
  if (!email || !password) {
    logger.warn('로그인 실패: 이메일 또는 비밀번호 누락');
    return res.status(400).json({
      success: false,
      message: '이메일과 비밀번호를 모두 입력해주세요.'
    });
  }

  // 이메일로 사용자 찾기 (비밀번호 필드 포함)
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    logger.warn('로그인 실패: 사용자 없음', { email });
    return res.status(401).json({
      success: false,
      message: '이메일 또는 비밀번호가 올바르지 않습니다.'
    });
  }

  // 비밀번호 확인
  if (!user.password) {
    logger.error('로그인 실패: 사용자에 비밀번호 필드가 없음', { email });
    return res.status(500).json({
      success: false,
      message: '계정에 문제가 있습니다. 고객센터에 문의하세요.'
    });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    logger.warn('로그인 실패: 비밀번호 불일치', { email });
    return res.status(401).json({
      success: false,
      message: '이메일 또는 비밀번호가 올바르지 않습니다.'
    });
  }

  // JWT 토큰 생성
  const token = generateToken(user._id);

  // 토큰을 사용자 모델에 저장
  user.tokens = user.tokens || [];
  user.tokens.push({ token });
  await user.save();

  // 사용자 정보에서 비밀번호 제외
  const userWithoutPassword = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    nationality: user.nationality,
    phoneNumber: user.phoneNumber,
    companyName: user.companyName,
    expertise: user.expertise,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  logger.info('로그인 성공', { email: user.email, role: user.role });

  res.status(200).json({
    success: true,
    user: userWithoutPassword,
    token
  });
});

/**
 * 로그아웃
 */
const logout = asyncHandler(async (req, res) => {
  logger.info('로그아웃 요청 시작', { userId: req.user?.id });
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    logger.warn('로그아웃 실패: 토큰 없음');
    return res.status(400).json({
      success: false,
      message: '토큰이 제공되지 않았습니다.'
    });
  }

  // User 모델의 tokens 배열에서 해당 토큰 제거
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { tokens: { token } }
    });
    logger.info('로그아웃 성공', { userId: req.user.id });
  }

  res.status(200).json({
    success: true,
    message: '로그아웃되었습니다.'
  });
});

/**
 * 현재 로그인된 사용자 정보 가져오기
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  logger.debug('현재 사용자 정보 요청', { userId: req.user?.id });
  
  if (!req.user) {
    logger.warn('현재 사용자 정보 요청 실패: 인증되지 않은 사용자');
    return res.status(401).json({
      success: false,
      message: '인증되지 않은 사용자입니다.'
    });
  }

  // 데이터베이스에서 최신 사용자 정보 가져오기
  const user = await User.findById(req.user._id).select('-password -tokens');
  
  if (!user) {
    logger.warn('현재 사용자 정보 요청 실패: 사용자 없음', { userId: req.user._id });
    return res.status(404).json({
      success: false,
      message: '사용자를 찾을 수 없습니다.'
    });
  }

  logger.debug('현재 사용자 정보 반환 성공', { email: user.email });

  res.status(200).json({
    success: true,
    user,
    data: user // 하위 호환성을 위한 data 필드 추가
  });
});

/**
 * 토큰 유효성 검증 (추가 유틸리티)
 */
const validateToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({
      success: false,
      message: '토큰이 필요합니다.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      user
    });
  } catch (error) {
    logger.warn('토큰 검증 실패', { error: error.message });
    res.status(401).json({
      success: false,
      valid: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
});

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  validateToken
}; 