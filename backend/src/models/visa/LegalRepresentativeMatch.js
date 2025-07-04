/**
 * 행정사 매칭 모델
 * 비자 서비스와 행정사 간의 매칭 정보 관리
 */

const mongoose = require('mongoose');

const legalRepresentativeMatchSchema = new mongoose.Schema({
  // 기본 매칭 정보
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisaServiceOrder',
    required: true
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  visaType: {
    type: String,
    required: true
  },
  
  // 행정사 정보
  legalRepresentative: {
    name: {
      type: String,
      required: true
    },
    licenseNumber: {
      type: String,
      required: true
    },
    specializations: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    experience: {
      years: Number,
      successfulCases: Number,
      visaTypes: [String]
    },
    languages: [String],
    location: {
      city: String,
      district: String,
      address: String
    },
    contact: {
      phone: String,
      email: String,
      website: String
    }
  },
  
  // 매칭 결과
  matchingScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  
  matchingCriteria: {
    visaTypeExpertise: Number,
    locationProximity: Number,
    languageCompatibility: Number,
    priceRange: Number,
    availability: Number,
    clientPreferences: Number
  },
  
  // 비용 정보
  fee: {
    consultationFee: {
      type: Number,
      default: 0
    },
    serviceFee: {
      type: Number,
      required: true
    },
    governmentFee: {
      type: Number,
      default: 0
    },
    totalFee: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'KRW'
    },
    paymentTerms: String
  },
  
  // 서비스 범위
  serviceScope: {
    documentPreparation: {
      type: Boolean,
      default: true
    },
    applicationSubmission: {
      type: Boolean,
      default: true
    },
    followUpService: {
      type: Boolean,
      default: true
    },
    consultationIncluded: {
      type: Boolean,
      default: false
    },
    translationService: {
      type: Boolean,
      default: false
    }
  },
  
  // 매칭 상태
  status: {
    type: String,
    enum: [
      'PROPOSED',     // 매칭 제안
      'ACCEPTED',     // 고객 수락
      'REJECTED',     // 고객 거절
      'CONTRACTED',   // 계약 체결
      'IN_PROGRESS',  // 서비스 진행 중
      'COMPLETED',    // 서비스 완료
      'CANCELLED'     // 취소
    ],
    default: 'PROPOSED'
  },
  
  // 타임라인
  timeline: {
    proposedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: Date,
    contractedAt: Date,
    completedAt: Date
  },
  
  // 고객 피드백
  clientFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    satisfaction: {
      communication: Number,
      expertise: Number,
      timeliness: Number,
      overall: Number
    },
    wouldRecommend: Boolean,
    reviewedAt: Date
  },
  
  // 메타데이터
  metadata: {
    matchingAlgorithm: {
      type: String,
      default: 'v1.0'
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    },
    notes: [String],
    internalMemos: [String]
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드들
legalRepresentativeMatchSchema.virtual('isActive').get(function() {
  return ['ACCEPTED', 'CONTRACTED', 'IN_PROGRESS'].includes(this.status);
});

legalRepresentativeMatchSchema.virtual('daysInProgress').get(function() {
  if (!this.timeline.acceptedAt) return 0;
  return Math.floor((Date.now() - this.timeline.acceptedAt.getTime()) / (1000 * 60 * 60 * 24));
});

// 인덱스
legalRepresentativeMatchSchema.index({ orderId: 1 });
legalRepresentativeMatchSchema.index({ userId: 1, status: 1 });
legalRepresentativeMatchSchema.index({ visaType: 1, status: 1 });
legalRepresentativeMatchSchema.index({ 'legalRepresentative.licenseNumber': 1 });
legalRepresentativeMatchSchema.index({ matchingScore: -1 });

// 정적 메서드들
legalRepresentativeMatchSchema.statics.findActiveMatches = function(userId) {
  return this.find({
    userId,
    status: { $in: ['PROPOSED', 'ACCEPTED', 'CONTRACTED', 'IN_PROGRESS'] }
  }).sort({ matchingScore: -1 });
};

legalRepresentativeMatchSchema.statics.findByVisaType = function(visaType, limit = 10) {
  return this.find({ 
    visaType,
    status: { $ne: 'CANCELLED' }
  })
  .sort({ matchingScore: -1 })
  .limit(limit);
};

// 인스턴스 메서드들
legalRepresentativeMatchSchema.methods.acceptMatch = function() {
  this.status = 'ACCEPTED';
  this.timeline.acceptedAt = new Date();
  return this.save();
};

legalRepresentativeMatchSchema.methods.contractMatch = function() {
  if (this.status !== 'ACCEPTED') {
    throw new Error('매칭이 수락된 상태가 아닙니다.');
  }
  this.status = 'CONTRACTED';
  this.timeline.contractedAt = new Date();
  return this.save();
};

legalRepresentativeMatchSchema.methods.completeMatch = function(clientFeedback = {}) {
  this.status = 'COMPLETED';
  this.timeline.completedAt = new Date();
  
  if (Object.keys(clientFeedback).length > 0) {
    this.clientFeedback = {
      ...this.clientFeedback,
      ...clientFeedback,
      reviewedAt: new Date()
    };
  }
  
  return this.save();
};

module.exports = mongoose.model('LegalRepresentativeMatch', legalRepresentativeMatchSchema); 