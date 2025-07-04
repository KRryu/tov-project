const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * 평가 이력 추적 모델
 * 경로: /backend/src/models/visa/EvaluationHistory.js
 * 
 * 역할: 비자 평가 이력 추적, 변경사항 감지, 성능 분석
 */

/**
 * 평가 상태 열거형
 */
const EVALUATION_STATUS = {
  PENDING: 'PENDING',           // 평가 대기
  IN_PROGRESS: 'IN_PROGRESS',   // 평가 진행 중
  COMPLETED: 'COMPLETED',       // 평가 완료
  FAILED: 'FAILED',             // 평가 실패
  EXPIRED: 'EXPIRED'            // 평가 만료
};

/**
 * 평가 타입 열거형
 */
const EVALUATION_TYPE = {
  INITIAL: 'INITIAL',           // 최초 평가
  UPDATE: 'UPDATE',             // 업데이트 평가
  RECHECK: 'RECHECK',           // 재평가
  COMPARISON: 'COMPARISON'      // 비교 평가
};

/**
 * 평가 결과 스키마
 */
const evaluationResultSchema = new Schema({
  // 기본 결과
  status: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 100 },
  score: { type: Number, min: 0, max: 100 },
  
  // 상세 점수
  scores: {
    eligibility: { type: Number, min: 0, max: 100 },
    documents: { type: Number, min: 0, max: 100 },
    qualifications: { type: Number, min: 0, max: 100 },
    experience: { type: Number, min: 0, max: 100 },
    education: { type: Number, min: 0, max: 100 },
    language: { type: Number, min: 0, max: 100 }
  },
  
  // 추천사항
  recommendations: [{
    type: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'] },
    message: { type: String, required: true },
    category: { type: String },
    _id: false
  }],
  
  // 강점/약점
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  
  // 비자 추천
  suggestedVisas: [{
    visaType: { type: String, required: true },
    suitabilityScore: { type: Number, min: 0, max: 100 },
    reason: { type: String },
    _id: false
  }],
  
  // 메타데이터
  metadata: {
    version: { type: String, default: '2.0' },
    algorithm: { type: String, default: 'BaseEvaluator' },
    dataQuality: { type: Number, min: 0, max: 100 },
    processingTime: { type: Number }, // ms
    errorMessages: [{ type: String }]
  }
}, { _id: false });

/**
 * 변경사항 스키마
 */
const changelogSchema = new Schema({
  field: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  changeType: { 
    type: String, 
    enum: ['added', 'modified', 'removed'],
    required: true 
  },
  impact: {
    scoreChange: { type: Number },
    confidenceChange: { type: Number },
    statusChange: { type: String }
  }
}, { _id: false });

/**
 * 평가 이력 스키마
 */
const evaluationHistorySchema = new Schema({
  // 연결 정보
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  applicationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'VisaApplication'
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
  
  // 평가 기본 정보
  evaluationType: {
    type: String,
    enum: Object.values(EVALUATION_TYPE),
    default: EVALUATION_TYPE.INITIAL
  },
  
  evaluationStatus: {
    type: String,
    enum: Object.values(EVALUATION_STATUS),
    default: EVALUATION_STATUS.PENDING
  },
  
  // 평가 결과
  result: evaluationResultSchema,
  
  // 입력 데이터 스냅샷
  inputData: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // 변경사항 (업데이트 평가일 경우)
  changelog: [changelogSchema],
  
  // 비교 정보 (이전 평가와 비교)
  comparison: {
    previousEvaluationId: { type: Schema.Types.ObjectId, ref: 'EvaluationHistory' },
    scoreChange: { type: Number }, // 점수 변화
    confidenceChange: { type: Number }, // 신뢰도 변화
    statusChange: { 
      from: { type: String },
      to: { type: String }
    },
    significantChanges: [{ type: String }]
  },
  
  // 평가 메타데이터
  metadata: {
    // 성능 메트릭
    performance: {
      totalProcessingTime: { type: Number }, // ms
      dataPreprocessingTime: { type: Number }, // ms
      evaluationTime: { type: Number }, // ms
      postprocessingTime: { type: Number } // ms
    },
    
    // 데이터 품질
    dataQuality: {
      completeness: { type: Number, min: 0, max: 100 },
      accuracy: { type: Number, min: 0, max: 100 },
      consistency: { type: Number, min: 0, max: 100 },
      missingFields: [{ type: String }],
      inconsistentFields: [{ type: String }]
    },
    
    // 시스템 정보
    system: {
      nodeVersion: { type: String },
      evaluatorVersion: { type: String, default: '2.0' },
      requestId: { type: String },
      userAgent: { type: String },
      ipAddress: { type: String }
    },
    
    // 평가 컨텍스트
    context: {
      source: { type: String, default: 'WEB' }, // WEB, API, BATCH
      trigger: { type: String }, // USER_REQUEST, SCHEDULED, DATA_CHANGE
      batch: { type: Boolean, default: false },
      testMode: { type: Boolean, default: false }
    }
  },
  
  // 외부 참조
  references: {
    sessionId: { type: String },
    correlationId: { type: String },
    parentEvaluationId: { type: Schema.Types.ObjectId, ref: 'EvaluationHistory' }
  }
}, {
  timestamps: true,
  collection: 'evaluationHistories'
});

// === 인덱스 설정 ===

// 기본 검색 인덱스
evaluationHistorySchema.index({ userId: 1, createdAt: -1 });
evaluationHistorySchema.index({ applicationId: 1 });
evaluationHistorySchema.index({ visaType: 1, createdAt: -1 });
evaluationHistorySchema.index({ evaluationStatus: 1, createdAt: -1 });

// 성능 분석용 인덱스
evaluationHistorySchema.index({ 'metadata.performance.totalProcessingTime': 1 });
evaluationHistorySchema.index({ 'result.confidence': 1, 'result.score': 1 });

// 복합 인덱스
evaluationHistorySchema.index({ 
  userId: 1, 
  visaType: 1, 
  evaluationType: 1,
  createdAt: -1 
});

// === 인스턴스 메서드 ===

/**
 * 평가 상태 업데이트
 */
evaluationHistorySchema.methods.updateStatus = function(newStatus, metadata = {}) {
  this.evaluationStatus = newStatus;
  
  if (newStatus === EVALUATION_STATUS.COMPLETED) {
    this.metadata.performance.totalProcessingTime = 
      Date.now() - this.createdAt.getTime();
  }
  
  // 추가 메타데이터 병합
  Object.assign(this.metadata, metadata);
  
  return this.save();
};

/**
 * 이전 평가와 비교
 */
evaluationHistorySchema.methods.compareWithPrevious = async function() {
  const previousEvaluation = await this.constructor.findPreviousEvaluation(
    this.userId, 
    this.visaType, 
    this._id
  );
  
  if (!previousEvaluation) {
    return null;
  }
  
  const scoreChange = this.result.score - previousEvaluation.result.score;
  const confidenceChange = this.result.confidence - previousEvaluation.result.confidence;
  
  const comparison = {
    previousEvaluationId: previousEvaluation._id,
    scoreChange,
    confidenceChange,
    statusChange: {
      from: previousEvaluation.result.status,
      to: this.result.status
    },
    significantChanges: this._getSignificantChanges(previousEvaluation)
  };
  
  this.comparison = comparison;
  return this.save();
};

/**
 * 변경사항 로깅
 */
evaluationHistorySchema.methods.logChanges = function(oldData, newData) {
  const changes = this._detectChanges(oldData, newData);
  this.changelog = changes;
  
  if (changes.length > 0) {
    this.evaluationType = EVALUATION_TYPE.UPDATE;
  }
  
  return this;
};

/**
 * 평가 요약 생성
 */
evaluationHistorySchema.methods.generateSummary = function() {
  return {
    evaluationId: this._id,
    visaType: this.visaType,
    status: this.result.status,
    score: this.result.score,
    confidence: this.result.confidence,
    evaluatedAt: this.createdAt,
    processingTime: this.metadata.performance?.totalProcessingTime,
    recommendations: this.result.recommendations.length,
    hasComparison: !!this.comparison.previousEvaluationId
  };
};

// === 스태틱 메서드 ===

/**
 * 사용자별 평가 이력 조회
 */
evaluationHistorySchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.visaType) {
    query.visaType = options.visaType;
  }
  
  if (options.status) {
    query.evaluationStatus = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

/**
 * 이전 평가 찾기
 */
evaluationHistorySchema.statics.findPreviousEvaluation = function(userId, visaType, currentId) {
  return this.findOne({
    userId,
    visaType,
    _id: { $ne: currentId },
    evaluationStatus: EVALUATION_STATUS.COMPLETED
  })
  .sort({ createdAt: -1 });
};

/**
 * 평가 통계 생성
 */
evaluationHistorySchema.statics.getStatistics = function(timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          visaType: '$visaType',
          status: '$result.status'
        },
        count: { $sum: 1 },
        avgScore: { $avg: '$result.score' },
        avgConfidence: { $avg: '$result.confidence' },
        avgProcessingTime: { $avg: '$metadata.performance.totalProcessingTime' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * 성능 분석
 */
evaluationHistorySchema.statics.getPerformanceAnalysis = function(visaType = null) {
  const matchStage = visaType ? { visaType } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$visaType',
        totalEvaluations: { $sum: 1 },
        avgProcessingTime: { $avg: '$metadata.performance.totalProcessingTime' },
        maxProcessingTime: { $max: '$metadata.performance.totalProcessingTime' },
        minProcessingTime: { $min: '$metadata.performance.totalProcessingTime' },
        avgScore: { $avg: '$result.score' },
        avgConfidence: { $avg: '$result.confidence' },
        errorRate: {
          $avg: {
            $cond: [
              { $eq: ['$evaluationStatus', EVALUATION_STATUS.FAILED] },
              1,
              0
            ]
          }
        }
      }
    },
    { $sort: { totalEvaluations: -1 } }
  ]);
};

// === 미들웨어 ===

/**
 * 저장 전 처리
 */
evaluationHistorySchema.pre('save', function(next) {
  // 평가 ID 생성 (없는 경우)
  if (!this.references.correlationId) {
    this.references.correlationId = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 데이터 품질 점수 계산
  if (this.inputData && !this.metadata.dataQuality.completeness) {
    this.metadata.dataQuality = this._calculateDataQuality(this.inputData);
  }
  
  next();
});

/**
 * 평가 후 처리
 */
evaluationHistorySchema.post('save', function(doc) {
  // 비동기로 이전 평가와 비교 (필요한 경우)
  if (doc.evaluationType === EVALUATION_TYPE.UPDATE && !doc.comparison.previousEvaluationId) {
    doc.compareWithPrevious().catch(err => {
      console.error('평가 비교 중 오류:', err);
    });
  }
});

// === 헬퍼 메서드 ===

/**
 * 중요한 변경사항 감지
 */
evaluationHistorySchema.methods._getSignificantChanges = function(previousEvaluation) {
  const changes = [];
  const scoreDiff = Math.abs(this.result.score - previousEvaluation.result.score);
  const confidenceDiff = Math.abs(this.result.confidence - previousEvaluation.result.confidence);
  
  if (scoreDiff >= 10) {
    changes.push(`점수 ${scoreDiff >= 0 ? '증가' : '감소'}: ${scoreDiff}점`);
  }
  
  if (confidenceDiff >= 15) {
    changes.push(`신뢰도 ${confidenceDiff >= 0 ? '증가' : '감소'}: ${confidenceDiff}%`);
  }
  
  if (this.result.status !== previousEvaluation.result.status) {
    changes.push(`상태 변경: ${previousEvaluation.result.status} → ${this.result.status}`);
  }
  
  return changes;
};

/**
 * 데이터 변경사항 감지
 */
evaluationHistorySchema.methods._detectChanges = function(oldData, newData) {
  const changes = [];
  
  // 간단한 변경사항 감지 (실제로는 더 정교한 로직 필요)
  const keys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
  
  for (const key of keys) {
    const oldValue = oldData?.[key];
    const newValue = newData?.[key];
    
    if (oldValue !== newValue) {
      let changeType = 'modified';
      if (oldValue === undefined) changeType = 'added';
      if (newValue === undefined) changeType = 'removed';
      
      changes.push({
        field: key,
        oldValue,
        newValue,
        changeType
      });
    }
  }
  
  return changes;
};

/**
 * 데이터 품질 계산
 */
evaluationHistorySchema.methods._calculateDataQuality = function(inputData) {
  const totalFields = Object.keys(inputData).length;
  const filledFields = Object.values(inputData).filter(value => 
    value !== null && value !== undefined && value !== ''
  ).length;
  
  const completeness = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  
  return {
    completeness: Math.round(completeness),
    accuracy: 95, // 기본값 (실제로는 복잡한 계산 필요)
    consistency: 90, // 기본값
    missingFields: Object.keys(inputData).filter(key => 
      inputData[key] === null || inputData[key] === undefined || inputData[key] === ''
    )
  };
};

// === 가상 필드 ===

/**
 * 평가 기간
 */
evaluationHistorySchema.virtual('evaluationDuration').get(function() {
  return this.metadata.performance?.totalProcessingTime || 0;
});

/**
 * 개선도 점수
 */
evaluationHistorySchema.virtual('improvementScore').get(function() {
  return this.comparison?.scoreChange || 0;
});

// 가상 필드를 JSON에 포함
evaluationHistorySchema.set('toJSON', { virtuals: true });
evaluationHistorySchema.set('toObject', { virtuals: true });

// 모델 생성
const EvaluationHistory = mongoose.model('EvaluationHistory', evaluationHistorySchema);

// 상수 export
EvaluationHistory.EVALUATION_STATUS = EVALUATION_STATUS;
EvaluationHistory.EVALUATION_TYPE = EVALUATION_TYPE;

module.exports = EvaluationHistory; 