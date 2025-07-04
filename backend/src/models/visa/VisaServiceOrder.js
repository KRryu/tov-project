/**
 * 비자 서비스 주문 모델
 * 비자 평가 → 행정사 매칭 → 결제 → 서류 업로드 → 처리 완료까지의 전체 워크플로우 관리
 */

const mongoose = require('mongoose');

const visaServiceOrderSchema = new mongoose.Schema({
  // 기본 정보
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  visaType: {
    type: String,
    required: true,
    enum: [
      'E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9', 'E-10',
      'F-1', 'F-2', 'F-3', 'F-6',
      'D-1', 'D-2', 'D-3', 'D-4', 'D-5', 'D-6', 'D-7', 'D-8', 'D-9', 'D-10',
      'C-1', 'C-3', 'C-4',
      'A-1', 'A-2', 'A-3',
      'B-1', 'B-2',
      'G-1', 'H-1', 'H-2'
    ]
  },

  applicationType: {
    type: String,
    enum: ['NEW', 'EXTENSION', 'CHANGE'],
    required: true
  },

  // 워크플로우 상태
  status: {
    type: String,
    enum: [
      'EVALUATION',      // 평가 중
      'MATCHING',       // 행정사 매칭 중
      'PAYMENT_PENDING', // 결제 대기
      'PAYMENT_COMPLETED', // 결제 완료
      'DOCUMENTS_PENDING', // 서류 업로드 대기
      'DOCUMENTS_SUBMITTED', // 서류 제출 완료
      'PROCESSING',     // 처리 중
      'COMPLETED',      // 완료
      'CANCELLED',      // 취소
      'FAILED'          // 실패
    ],
    default: 'EVALUATION'
  },

  // 평가 결과
  evaluationResult: {
    totalScore: Number,
    successProbability: String,
    status: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    evaluatedAt: Date,
    evaluationId: String
  },

  // 행정사 매칭 정보
  legalRepresentativeMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalRepresentativeMatch'
  },

  // 결제 정보
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },

  // 서류 제출 정보
  documentSubmission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentSubmission'
  },

  // 서비스 옵션
  serviceOptions: {
    includeLegalMatching: {
      type: Boolean,
      default: true
    },
    includeDocumentReview: {
      type: Boolean,
      default: true
    },
    urgentProcessing: {
      type: Boolean,
      default: false
    },
    consultationIncluded: {
      type: Boolean,
      default: false
    }
  },

  // 고객 선호사항
  clientPreferences: {
    preferredLanguage: {
      type: String,
      enum: ['korean', 'english', 'chinese', 'japanese'],
      default: 'korean'
    },
    communicationMethod: {
      type: String,
      enum: ['email', 'phone', 'kakao', 'messaging'],
      default: 'email'
    },
    meetingPreference: {
      type: String,
      enum: ['online', 'offline', 'either'],
      default: 'either'
    },
    specialRequests: String
  },

  // 타임라인
  timeline: {
    evaluationStarted: Date,
    evaluationCompleted: Date,
    matchingStarted: Date,
    matchingCompleted: Date,
    paymentInitiated: Date,
    paymentCompleted: Date,
    documentsRequested: Date,
    documentsSubmitted: Date,
    processingStarted: Date,
    estimatedCompletion: Date,
    actualCompletion: Date
  },

  // 비용 정보
  pricing: {
    basePrice: {
      type: Number,
      default: 0
    },
    legalFee: {
      type: Number,
      default: 0
    },
    urgentFee: {
      type: Number,
      default: 0
    },
    consultationFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'KRW'
    }
  },

  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'api_v2'],
      default: 'web'
    },
    version: {
      type: String,
      default: '3.0'
    },
    lastModifiedBy: mongoose.Schema.Types.ObjectId,
    notes: [String],
    internalMemos: [String]
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드들
visaServiceOrderSchema.virtual('isActive').get(function() {
  return !['COMPLETED', 'CANCELLED', 'FAILED'].includes(this.status);
});

visaServiceOrderSchema.virtual('progressPercentage').get(function() {
  const statusProgress = {
    'EVALUATION': 10,
    'MATCHING': 25,
    'PAYMENT_PENDING': 40,
    'PAYMENT_COMPLETED': 55,
    'DOCUMENTS_PENDING': 70,
    'DOCUMENTS_SUBMITTED': 85,
    'PROCESSING': 95,
    'COMPLETED': 100,
    'CANCELLED': 0,
    'FAILED': 0
  };
  return statusProgress[this.status] || 0;
});

visaServiceOrderSchema.virtual('daysInProgress').get(function() {
  const start = this.timeline.evaluationStarted || this.createdAt;
  return Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
});

// 인덱스
visaServiceOrderSchema.index({ userId: 1, status: 1 });
visaServiceOrderSchema.index({ visaType: 1, status: 1 });
visaServiceOrderSchema.index({ 'timeline.evaluationStarted': 1 });
visaServiceOrderSchema.index({ createdAt: -1 });

// 정적 메서드들
visaServiceOrderSchema.statics.getStatusFlow = function() {
  return [
    'EVALUATION',
    'MATCHING',
    'PAYMENT_PENDING',
    'PAYMENT_COMPLETED',
    'DOCUMENTS_PENDING',
    'DOCUMENTS_SUBMITTED',
    'PROCESSING',
    'COMPLETED'
  ];
};

visaServiceOrderSchema.statics.findActiveOrders = function(userId) {
  return this.find({
    userId,
    status: { $in: ['EVALUATION', 'MATCHING', 'PAYMENT_PENDING', 'DOCUMENTS_PENDING', 'PROCESSING'] }
  }).sort({ createdAt: -1 });
};

// 인스턴스 메서드들
visaServiceOrderSchema.methods.canAdvanceStatus = function() {
  const flow = this.constructor.getStatusFlow();
  const currentIndex = flow.indexOf(this.status);
  return currentIndex >= 0 && currentIndex < flow.length - 1;
};

visaServiceOrderSchema.methods.advanceStatus = function() {
  if (this.canAdvanceStatus()) {
    const flow = this.constructor.getStatusFlow();
    const currentIndex = flow.indexOf(this.status);
    this.status = flow[currentIndex + 1];
    
    // 타임라인 업데이트
    const now = new Date();
    switch (this.status) {
      case 'MATCHING':
        this.timeline.evaluationCompleted = now;
        this.timeline.matchingStarted = now;
        break;
      case 'PAYMENT_PENDING':
        this.timeline.matchingCompleted = now;
        this.timeline.paymentInitiated = now;
        break;
      case 'PAYMENT_COMPLETED':
        this.timeline.paymentCompleted = now;
        break;
      case 'DOCUMENTS_PENDING':
        this.timeline.documentsRequested = now;
        break;
      case 'DOCUMENTS_SUBMITTED':
        this.timeline.documentsSubmitted = now;
        break;
      case 'PROCESSING':
        this.timeline.processingStarted = now;
        break;
      case 'COMPLETED':
        this.timeline.actualCompletion = now;
        break;
    }
    
    return this.save();
  }
  throw new Error('상태 진행이 불가능합니다.');
};

visaServiceOrderSchema.methods.calculateTotalCost = function() {
  this.pricing.totalAmount = 
    this.pricing.basePrice +
    this.pricing.legalFee +
    this.pricing.urgentFee +
    this.pricing.consultationFee;
  
  return this.pricing.totalAmount;
};

module.exports = mongoose.model('VisaServiceOrder', visaServiceOrderSchema); 