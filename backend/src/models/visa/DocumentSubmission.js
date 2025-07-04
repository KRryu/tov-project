const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 문서 제출 관리 모델
 * 경로: /backend/src/models/visa/DocumentSubmission.js
 * 
 * 역할: 비자별 제출 문서 추적, 검증 결과 저장, 진행 상황 관리
 */

/**
 * 문서 상태 열거형
 */
const DOCUMENT_STATUS = {
  PENDING: 'PENDING',           // 대기 중
  UPLOADED: 'UPLOADED',         // 업로드됨
  VERIFIED: 'VERIFIED',         // 검증됨
  REJECTED: 'REJECTED',         // 거부됨
  EXPIRED: 'EXPIRED',           // 만료됨
  MISSING: 'MISSING'            // 누락됨
};

/**
 * 문서 검증 결과 스키마
 */
const documentValidationSchema = new Schema({
  isValid: { type: Boolean, default: false },
  isRequired: { type: Boolean, default: false },
  isOptional: { type: Boolean, default: false },
  category: { type: String },   // identity, education, employment, etc.
  
  // 유효기간 검증
  expiryCheck: {
    isValid: { type: Boolean, default: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    daysRemaining: { type: Number },
    status: { 
      type: String, 
      enum: ['valid', 'expiring_soon', 'renewal_recommended', 'expired'],
      default: 'valid'
    }
  },
  
  // 검증 메시지
  validationMessages: [{ type: String }],
  
  // 대체 문서 정보
  alternatives: [{
    type: { type: String },
    name: { type: String },
    acceptanceLevel: { type: String },
    description: { type: String }
  }],
  
  // 검증 타임스탬프
  validatedAt: { type: Date, default: Date.now },
  validatedBy: { type: String, default: 'system' }
}, { _id: false });

/**
 * 개별 문서 스키마
 */
const documentSchema = new Schema({
  // 문서 기본 정보
  documentType: { 
    type: String, 
    required: true,
    enum: [
      'passport', 'photo', 'diploma', 'employment_contract', 'criminal_record',
      'health_certificate', 'company_registration', 'career_certificate',
      'research_paper', 'publications', 'recommendation_letter', 'patent',
      'financial_statement', 'transcript', 'degree_verification'
    ]
  },
  
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  
  // 문서 상태
  status: { 
    type: String, 
    enum: Object.values(DOCUMENT_STATUS),
    default: DOCUMENT_STATUS.UPLOADED
  },
  
  // 메타데이터
  metadata: {
    issueDate: { type: Date },
    issueCountry: { type: String },
    issueOrganization: { type: String },
    documentNumber: { type: String },
    isNotarized: { type: Boolean, default: false },
    isTranslated: { type: Boolean, default: false },
    translationLanguage: { type: String }
  },
  
  // 검증 결과
  validation: documentValidationSchema,
  
  // 제출 정보
  uploadedAt: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
  
  // 검토 기록
  reviewHistory: [{
    action: { 
      type: String, 
      enum: ['uploaded', 'verified', 'rejected', 'replaced', 'expired']
    },
    reviewer: { type: String },
    reviewDate: { type: Date, default: Date.now },
    comments: { type: String },
    _id: false
  }]
}, { _id: true });

/**
 * 문서 제출 세트 스키마
 */
const documentSubmissionSchema = new Schema({
  // 연결 정보
  applicationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'VisaApplication',
    required: true 
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  visaType: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]-?\d+$/.test(v);
      },
      message: props => `${props.value}는 유효한 비자 타입이 아닙니다.`
    }
  },
  
  // 제출된 문서들
  documents: [documentSchema],
  
  // 문서 세트 검증 결과
  setValidation: {
    isComplete: { type: Boolean, default: false },
    completeness: {
      overall: { type: Number, default: 0 },    // 0-100
      required: { type: Number, default: 0 },   // 0-100
      optional: { type: Number, default: 0 }    // 0-100
    },
    
    // 문서 요구사항 상황
    requiredDocuments: {
      total: { type: Number, default: 0 },
      submitted: { type: Number, default: 0 },
      missing: [{ type: String }]
    },
    
    optionalDocuments: {
      total: { type: Number, default: 0 },
      submitted: { type: Number, default: 0 },
      available: [{ type: String }]
    },
    
    // 제안사항
    suggestions: [{
      type: { type: String },
      name: { type: String },
      priority: { type: String, enum: ['high', 'medium', 'low'] },
      alternatives: [{ type: String }],
      urgency: { type: String, enum: ['critical', 'normal'] },
      _id: false
    }],
    
    lastValidated: { type: Date, default: Date.now }
  },
  
  // 진행 상황
  submissionStatus: {
    type: String,
    enum: ['incomplete', 'complete', 'under_review', 'approved', 'rejected'],
    default: 'incomplete'
  },
  
  // 메타데이터
  metadata: {
    totalDocuments: { type: Number, default: 0 },
    verifiedDocuments: { type: Number, default: 0 },
    pendingDocuments: { type: Number, default: 0 },
    rejectedDocuments: { type: Number, default: 0 },
    
    lastDocumentUpload: { type: Date },
    lastValidation: { type: Date },
    completionPercentage: { type: Number, default: 0 },
    
    version: { type: Number, default: 1 },
    source: { type: String, default: 'WEB' }
  }
}, {
  timestamps: true,
  collection: 'documentSubmissions'
});

// === 인덱스 설정 ===

// 복합 인덱스
documentSubmissionSchema.index({ userId: 1, visaType: 1 });
documentSubmissionSchema.index({ applicationId: 1 });
documentSubmissionSchema.index({ 'documents.documentType': 1, visaType: 1 });
documentSubmissionSchema.index({ submissionStatus: 1, createdAt: -1 });

// === 인스턴스 메서드 ===

/**
 * 문서 추가
 */
documentSubmissionSchema.methods.addDocument = function(documentData) {
  this.documents.push(documentData);
  this.metadata.totalDocuments = this.documents.length;
  this.metadata.lastDocumentUpload = new Date();
  this.metadata.version += 1;
  
  return this.save();
};

/**
 * 문서 상태 업데이트
 */
documentSubmissionSchema.methods.updateDocumentStatus = function(documentId, newStatus, reviewer = 'system', comments = '') {
  const document = this.documents.id(documentId);
  if (!document) {
    throw new Error('문서를 찾을 수 없습니다.');
  }
  
  const oldStatus = document.status;
  document.status = newStatus;
  document.lastModified = new Date();
  
  // 검토 기록 추가
  document.reviewHistory.push({
    action: newStatus.toLowerCase(),
    reviewer,
    comments
  });
  
  // 메타데이터 업데이트
  this._updateDocumentCounts();
  this.metadata.version += 1;
  
  return this.save();
};

/**
 * 문서 세트 검증 실행
 */
documentSubmissionSchema.methods.validateDocumentSet = async function() {
  const DocumentValidationService = require('../../services/visa/documentValidationService');
  const { getDocumentValidationService } = DocumentValidationService;
  
  const validator = getDocumentValidationService();
  const result = validator.validateDocumentSet(this.documents, this.visaType);
  
  // 검증 결과 저장
  this.setValidation = {
    ...result,
    lastValidated: new Date()
  };
  
  // 제출 상태 업데이트
  if (result.isComplete) {
    this.submissionStatus = 'complete';
  } else {
    this.submissionStatus = 'incomplete';
  }
  
  this.metadata.completionPercentage = result.completeness.overall;
  this.metadata.version += 1;
  
  return this.save();
};

/**
 * 누락된 문서 목록 반환
 */
documentSubmissionSchema.methods.getMissingDocuments = function() {
  return this.setValidation.requiredDocuments.missing || [];
};

/**
 * 만료 예정 문서 확인
 */
documentSubmissionSchema.methods.getExpiringDocuments = function(daysThreshold = 30) {
  return this.documents.filter(doc => {
    const validation = doc.validation?.expiryCheck;
    return validation && validation.daysRemaining <= daysThreshold && validation.daysRemaining > 0;
  });
};

// === 스태틱 메서드 ===

/**
 * 사용자별 문서 제출 조회
 */
documentSubmissionSchema.statics.findByUser = function(userId, visaType = null) {
  const query = { userId };
  if (visaType) {
    query.visaType = visaType;
  }
  
  return this.find(query)
    .populate('applicationId', 'status submittedAt')
    .sort({ createdAt: -1 });
};

/**
 * 신청서별 문서 제출 조회
 */
documentSubmissionSchema.statics.findByApplication = function(applicationId) {
  return this.findOne({ applicationId })
    .populate('userId', 'name email');
};

/**
 * 문서 타입별 통계
 */
documentSubmissionSchema.statics.getDocumentStatistics = function(visaType = null) {
  const matchStage = visaType ? { visaType } : {};
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$documents' },
    {
      $group: {
        _id: '$documents.documentType',
        total: { $sum: 1 },
        verified: {
          $sum: {
            $cond: [{ $eq: ['$documents.status', 'VERIFIED'] }, 1, 0]
          }
        },
        rejected: {
          $sum: {
            $cond: [{ $eq: ['$documents.status', 'REJECTED'] }, 1, 0]
          }
        }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// === 미들웨어 ===

/**
 * 저장 전 처리
 */
documentSubmissionSchema.pre('save', function(next) {
  // 문서 개수 업데이트
  this._updateDocumentCounts();
  
  // 완성도 계산
  if (this.setValidation.completeness) {
    this.metadata.completionPercentage = this.setValidation.completeness.overall;
  }
  
  next();
});

/**
 * 문서 개수 업데이트 헬퍼
 */
documentSubmissionSchema.methods._updateDocumentCounts = function() {
  this.metadata.totalDocuments = this.documents.length;
  this.metadata.verifiedDocuments = this.documents.filter(doc => doc.status === DOCUMENT_STATUS.VERIFIED).length;
  this.metadata.pendingDocuments = this.documents.filter(doc => doc.status === DOCUMENT_STATUS.PENDING || doc.status === DOCUMENT_STATUS.UPLOADED).length;
  this.metadata.rejectedDocuments = this.documents.filter(doc => doc.status === DOCUMENT_STATUS.REJECTED).length;
};

// === 가상 필드 ===

/**
 * 제출 완성도 퍼센트
 */
documentSubmissionSchema.virtual('completionRate').get(function() {
  return this.metadata.completionPercentage || 0;
});

/**
 * 모든 필수 문서 제출 여부
 */
documentSubmissionSchema.virtual('isCompleteSubmission').get(function() {
  return this.setValidation.isComplete && this.submissionStatus === 'complete';
});

// 가상 필드를 JSON에 포함
documentSubmissionSchema.set('toJSON', { virtuals: true });
documentSubmissionSchema.set('toObject', { virtuals: true });

// 모델 생성
const DocumentSubmission = mongoose.model('DocumentSubmission', documentSubmissionSchema);

// 상수 export
DocumentSubmission.DOCUMENT_STATUS = DOCUMENT_STATUS;

module.exports = DocumentSubmission; 