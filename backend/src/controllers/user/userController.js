const User = require('../../models/User');
const Portfolio = require('../../models/Portfolio');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 회원가입 컨트롤러
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    // 비밀번호 해시 처리
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'TOVchallenger' // 기본 역할
    });
    
    // 포트폴리오 자동 생성 (빈 배열 등 기본 값)
    await Portfolio.create({ 
      user: newUser._id, 
      tasks: [], 
      education: [], 
      meetups: [] 
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    next(error);
  }
};

// 로그인 컨트롤러
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({ success: true, token });
  } catch (error) {
    next(error);
  }
};

// 사용자 프로필 조회
exports.getUserProfile = async (req, res, next) => {
  try {
    // req.user는 auth 미들웨어에서 설정됨
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        nationality: user.nationality,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('프로필 조회 중 오류 발생:', error);
    next(error);
  }
};

// 사용자 프로필 업데이트
exports.updateUserProfile = async (req, res, next) => {
  try {
    // 업데이트 가능한 필드 목록
    const allowedUpdates = ['name', 'phoneNumber', 'profileImage'];
    const updateData = {};
    
    // 허용된 필드만 업데이트
    Object.keys(req.body).forEach(field => {
      if (allowedUpdates.includes(field)) {
        updateData[field] = req.body[field];
      }
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        updatedAt: updatedUser.updatedAt
      },
      message: '프로필이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('프로필 업데이트 중 오류 발생:', error);
    next(error);
  }
};

// 비자 신청에 필요한 사용자 정보 조회
exports.getVisaUserInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 비자 신청에 필요한 정보 구성
    const visaUserInfo = {
      personalInfo: {
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        nationality: user.nationality || '미입력',
        // 기타 필요한 개인정보
      }
    };
    
    // Challenger 역할인 경우 추가 정보
    if (user.role === 'challenger') {
      // 추가 정보 포함
    }
    
    res.status(200).json({
      success: true,
      data: visaUserInfo
    });
  } catch (error) {
    console.error('비자 사용자 정보 조회 중 오류 발생:', error);
    next(error);
  }
};
