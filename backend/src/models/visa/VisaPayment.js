/**
 * 비자 서비스 전용 결제 모델
 * 복잡한 비자 서비스 결제 처리를 위한 확장된 모델
 */

const mongoose = require('mongoose');

const visaPaymentSchema = new mongoose.Schema({
  // 기본 정보
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
  
  // 결제 상세 내역
  paymentBreakdown: {
    baseServiceFee: {
      amount: Number,
      description: String
    },
    legalRepresentativeFee: {
      amount: Number,
      description: String,
      legalRepresentativeId: mongoose.Schema.Types.ObjectId
    },
    governmentFee: {
      amount: Number,
      description: String
    },
    urgentProcessingFee: {
      amount: Number,
      description: String
    },
    consultationFee: {
      amount: Number,
      description: String
    },
    documentReviewFee: {
      amount: Number,
      description: String
    },
    translationFee: {
      amount: Number,
      description: String
    },
    additionalServices: [{
      name: String,
      amount: Number,
      description: String
    }]
  },
  
  // 총 금액 정보
  totalAmount: {
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'KRW'
    }
  },
  
  // 결제 방법
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'virtual_account', 'mobile_payment', 'paypal'],
      required: true
    },
    provider: String, // 결제 대행사 (토스, 카카오페이 등)
    details: {
      cardNumber: String,    // 마스킹된 카드번호
      cardType: String,      // VISA, MASTER 등
      bankName: String,      // 은행명
      accountNumber: String, // 마스킹된 계좌번호
      virtualAccount: String // 가상계좌번호
    }
  },
  
  // 결제 상태
  status: {
    type: String,
    enum: [
      'PENDING',        // 결제 대기
      'PROCESSING',     // 결제 처리 중
      'COMPLETED',      // 결제 완료
      'FAILED',         // 결제 실패
      'CANCELLED',      // 결제 취소
      'REFUNDED',       // 환불 완료
      'PARTIAL_REFUND'  // 부분 환불
    ],
    default: 'PENDING'
  },
  
  // 결제 게이트웨이 정보
  gateway: {
    provider: String,       // 결제 게이트웨이 이름
    transactionId: String,  // 거래 ID
    approvalNumber: String, // 승인번호
    merchantId: String,     // 가맹점 ID
    response: {            // 게이트웨이 응답
      code: String,
      message: String,
      rawData: mongoose.Schema.Types.Mixed
    }
  },
  
  // 타임라인
  timeline: {
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    refundRequestedAt: Date,
    refundedAt: Date
  },
  
  // 환불 정보
  refund: {
    reason: String,
    amount: Number,
    requestedBy: mongoose.Schema.Types.ObjectId,
    approvedBy: mongoose.Schema.Types.ObjectId,
    refundMethod: String,
    refundTransactionId: String,
    refundedAt: Date,
    partial: {
      isPartial: Boolean,
      originalAmount: Number,
      refundedAmount: Number,
      remainingAmount: Number
    }
  },
  
  // 할부/분할 결제 정보
  installment: {
    isInstallment: {
      type: Boolean,
      default: false
    },
    totalMonths: Number,
    currentPayment: Number,
    remainingPayments: Number,
    monthlyAmount: Number,
    nextPaymentDate: Date,
    schedule: [{
      paymentNumber: Number,
      amount: Number,
      dueDate: Date,
      status: String,
      paidAt: Date
    }]
  },
  
  // 영수증 정보
  receipt: {
    receiptNumber: String,
    issuedAt: Date,
    downloadUrl: String,
    taxInvoice: {
      required: Boolean,
      issued: Boolean,
      businessNumber: String,
      companyName: String,
      issuedAt: Date,
      downloadUrl: String
    }
  },
  
  // 보안 정보
  security: {
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    riskScore: Number,
    fraudCheck: {
      passed: Boolean,
      checkedAt: Date,
      details: String
    }
  },
  
  // 메타데이터
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api'],
      default: 'web'
    },
    version: String,
    notes: [String],
    internalMemos: [String]
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드들
visaPaymentSchema.virtual('isCompleted').get(function() {
  return this.status === 'COMPLETED';
});

visaPaymentSchema.virtual('canRefund').get(function() {
  return this.status === 'COMPLETED' && !this.refund?.refundedAt;
});

visaPaymentSchema.virtual('paymentDuration').get(function() {
  if (!this.timeline.completedAt) return null;
  return this.timeline.completedAt.getTime() - this.timeline.initiatedAt.getTime();
});

// 인덱스
visaPaymentSchema.index({ orderId: 1 });
visaPaymentSchema.index({ userId: 1, status: 1 });
visaPaymentSchema.index({ 'gateway.transactionId': 1 });
visaPaymentSchema.index({ 'receipt.receiptNumber': 1 });
visaPaymentSchema.index({ status: 1, createdAt: -1 });

// 정적 메서드들
visaPaymentSchema.statics.findByUser = function(userId, status = null) {
  const query = { userId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

visaPaymentSchema.statics.findByOrder = function(orderId) {
  return this.findOne({ orderId }).populate('orderId');
};

visaPaymentSchema.statics.getTotalRevenue = function(startDate, endDate) {
  const match = {
    status: 'COMPLETED'
  };
  
  if (startDate || endDate) {
    match['timeline.completedAt'] = {};
    if (startDate) match['timeline.completedAt'].$gte = startDate;
    if (endDate) match['timeline.completedAt'].$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount.finalAmount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$totalAmount.finalAmount' }
      }
    }
  ]);
};

// 인스턴스 메서드들
visaPaymentSchema.methods.markAsCompleted = function(gatewayResponse = {}) {
  this.status = 'COMPLETED';
  this.timeline.completedAt = new Date();
  
  if (gatewayResponse.transactionId) {
    this.gateway.transactionId = gatewayResponse.transactionId;
  }
  
  if (gatewayResponse.approvalNumber) {
    this.gateway.approvalNumber = gatewayResponse.approvalNumber;
  }
  
  // 영수증 번호 생성
  if (!this.receipt.receiptNumber) {
    this.receipt.receiptNumber = `R${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    this.receipt.issuedAt = new Date();
  }
  
  return this.save();
};

visaPaymentSchema.methods.markAsFailed = function(reason = '') {
  this.status = 'FAILED';
  this.timeline.failedAt = new Date();
  
  if (reason) {
    this.gateway.response.message = reason;
  }
  
  return this.save();
};

visaPaymentSchema.methods.processRefund = function(refundData) {
  const { amount, reason, requestedBy, partial = false } = refundData;
  
  this.refund = {
    reason,
    amount: partial ? amount : this.totalAmount.finalAmount,
    requestedBy,
    refundRequestedAt: new Date(),
    refundMethod: this.paymentMethod.type,
    partial: partial ? {
      isPartial: true,
      originalAmount: this.totalAmount.finalAmount,
      refundedAmount: amount,
      remainingAmount: this.totalAmount.finalAmount - amount
    } : undefined
  };
  
  this.status = partial ? 'PARTIAL_REFUND' : 'REFUNDED';
  
  return this.save();
};

visaPaymentSchema.methods.calculateTotalAmount = function() {
  const breakdown = this.paymentBreakdown;
  
  let subtotal = 0;
  
  // 각 항목별 금액 합산
  if (breakdown.baseServiceFee?.amount) subtotal += breakdown.baseServiceFee.amount;
  if (breakdown.legalRepresentativeFee?.amount) subtotal += breakdown.legalRepresentativeFee.amount;
  if (breakdown.governmentFee?.amount) subtotal += breakdown.governmentFee.amount;
  if (breakdown.urgentProcessingFee?.amount) subtotal += breakdown.urgentProcessingFee.amount;
  if (breakdown.consultationFee?.amount) subtotal += breakdown.consultationFee.amount;
  if (breakdown.documentReviewFee?.amount) subtotal += breakdown.documentReviewFee.amount;
  if (breakdown.translationFee?.amount) subtotal += breakdown.translationFee.amount;
  
  // 추가 서비스 금액
  if (breakdown.additionalServices?.length > 0) {
    subtotal += breakdown.additionalServices.reduce((sum, service) => sum + (service.amount || 0), 0);
  }
  
  this.totalAmount.subtotal = subtotal;
  this.totalAmount.finalAmount = subtotal + (this.totalAmount.tax || 0) - (this.totalAmount.discount || 0);
  
  return this.totalAmount.finalAmount;
};

module.exports = mongoose.model('VisaPayment', visaPaymentSchema); 