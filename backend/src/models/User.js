const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '이메일은 필수입니다'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다'],
    minlength: 6,
    select: false
  },
  name: {
    type: String,
    required: [true, '이름은 필수입니다']
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    default: function() {
      return this.email.split('@')[0];
    }
  },
  role: {
    type: String,
    enum: ['challenger', 'crew', 'company', 'pro', 'admin'],
    required: [true, '역할은 필수입니다']
  },
  // 공통 필드
  phoneNumber: {
    type: String,
    required: [true, '전화번호는 필수입니다']
  },
  profileImage: {
    type: String,
    default: 'default.jpg'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Challenger 전용 필드
  nationality: {
    type: String,
    required: function() { return this.role === 'challenger'; }
  },
  
  // Company 전용 필드
  companyName: {
    type: String,
    required: function() { return this.role === 'company'; }
  },
  businessNumber: {
    type: String,
    required: function() { return this.role === 'company'; }
  },
  companyAddress: {
    type: String,
    required: function() { return this.role === 'company'; }
  },
  
  // Pro 전용 필드
  expertise: {
    type: String,
    required: function() { return this.role === 'pro'; },
    enum: ['administrative', 'language', 'culture', 'psychology']
  },
  certification: {
    type: [String],
    required: function() { return this.role === 'pro'; }
  },
  experience: {
    type: Number,
    required: function() { return this.role === 'pro'; }
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // 토큰 관련 필드 추가 필요
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  if (!this.username) {
    this.username = this.email.split('@')[0];
  }
  
  next();
});

// 비밀번호 확인 메서드
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
