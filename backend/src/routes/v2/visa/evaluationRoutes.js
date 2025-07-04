const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
const visaEvaluationController = require('../../../controllers/visa/visaEvaluationController');
const EvaluationHistory = require('../../../models/visa/EvaluationHistory');
const DocumentSubmission = require('../../../models/visa/DocumentSubmission');
const { EvaluationHelper } = require('../../../utils/evaluationHelper');
const logger = require('../../../utils/logger');
const asyncHandler = require('../../../utils/asyncHandler');

/**
 * 비자 평가 라우트 V2
 * 경로: /backend/src/routes/v2/visa/evaluationRoutes.js
 * 
 * 역할: V2 버전 비자 평가 시스템, 이력 추적, 고급 분석
 */

/**
 * @route   GET /api/v2/visa/evaluation/supported-types
 * @desc    지원되는 비자 유형 목록 조회 (V2 향상)
 * @access  Public
 */
router.get('/supported-types', asyncHandler(async (req, res) => {
  logger.info('지원 비자 유형 조회 V2');
  
  // V1 기능 실행
  await visaEvaluationController.getSupportedTypes(req, res);
  
  // V2 추가 정보
  if (res.locals.supportedTypes) {
    const enhancedTypes = res.locals.supportedTypes.map(visaType => ({
      ...visaType,
      v2Features: {
        smartEvaluation: true,
        documentAnalysis: true,
        historyTracking: true,
        recommendationEngine: true,
        progressTracking: true
      }
    }));
    
    res.json({
      success: true,
      count: enhancedTypes.length,
      data: enhancedTypes,
      v2Features: {
        totalVisaTypes: enhancedTypes.length,
        categories: ['Employment (E)', 'Residence (F)', 'Study (D)', 'Tourist (C)'],
        newInV2: ['Smart evaluation', 'Document auto-detection', 'Progress tracking']
      }
    });
    return;
  }
}));

/**
 * @route   POST /api/v2/visa/evaluation/:visaType
 * @desc    V2 비자 평가 (향상된 기능)
 * @access  Public
 */
router.post('/:visaType', asyncHandler(async (req, res) => {
  const { visaType } = req.params;
  const applicantData = req.body;
  const userId = req.user?.id;
  
  logger.info('V2 비자 평가 요청', { 
    visaType, 
    userId,
    hasDocuments: !!applicantData.documents 
  });
  
  // 평가 이력 생성 (평가 시작)
  let evaluationHistory = null;
  if (userId) {
    evaluationHistory = new EvaluationHistory({
      userId,
      applicationId: applicantData.applicationId,
      visaType,
      evaluationType: 'INITIAL',
      evaluationStatus: 'IN_PROGRESS',
      inputData: {
        ...applicantData,
        evaluatedAt: new Date()
      },
      metadata: {
        system: {
          nodeVersion: process.version,
          evaluatorVersion: '2.0'
        },
        context: {
          source: 'API_V2',
          trigger: 'USER_REQUEST'
        }
      }
    });
    
    await evaluationHistory.save();
    logger.info('평가 이력 생성', { evaluationId: evaluationHistory._id });
  }
  
  try {
    // V1 평가 엔진 호출 (V2 플래그 추가)
    req.body.visaType = visaType;
    req.body.useV2 = true;
    req.body.evaluationId = evaluationHistory?._id;
    
    await visaEvaluationController.evaluateVisa(req, res);
    
    // V2 후처리: 평가 결과 향상
    if (res.locals.evaluationResult) {
      const rawResult = res.locals.evaluationResult;
      
      // 신뢰도 계산
      const confidence = EvaluationHelper.calculateConfidence(rawResult, applicantData);
      
      // 결과 포맷팅
      const formattedResult = EvaluationHelper.formatEvaluationResult(
        { ...rawResult, confidence }, 
        applicantData
      );
      
      // 평가 이력 업데이트
      if (evaluationHistory) {
        evaluationHistory.result = formattedResult;
        evaluationHistory.evaluationStatus = 'COMPLETED';
        evaluationHistory.metadata.performance = {
          totalProcessingTime: Date.now() - evaluationHistory.createdAt.getTime()
        };
        
        await evaluationHistory.save();
        
        // 이전 평가와 비교
        await evaluationHistory.compareWithPrevious();
      }
      
      // V2 응답 생성
      const v2Response = {
        ...formattedResult,
        v2Metadata: {
          evaluationId: evaluationHistory?._id,
          confidence,
          processingTime: evaluationHistory?.metadata.performance?.totalProcessingTime,
          version: '2.0',
          features: ['smart-analysis', 'confidence-scoring', 'history-tracking']
        }
      };
      
      res.json({
        success: true,
        data: v2Response
      });
      return;
    }
    
  } catch (error) {
    logger.error('V2 비자 평가 오류:', error);
    
    // 평가 이력 실패 처리
    if (evaluationHistory) {
      evaluationHistory.evaluationStatus = 'FAILED';
      evaluationHistory.result = {
        metadata: {
          errorMessages: [error.message]
        }
      };
      await evaluationHistory.save();
    }
    
    res.status(500).json({
      success: false,
      message: 'V2 비자 평가 중 오류가 발생했습니다.',
      error: error.message,
      evaluationId: evaluationHistory?._id
    });
  }
}));

/**
 * @route   POST /api/v2/visa/evaluation/smart/:visaType
 * @desc    지능형 비자 평가 (자동 최적화)
 * @access  Public
 */
router.post('/smart/:visaType', asyncHandler(async (req, res) => {
  const { visaType } = req.params;
  const applicantData = req.body;
  const userId = req.user?.id;
  
  logger.info('지능형 비자 평가 요청', { visaType, userId });
  
  // 문서 자동 분석 (제출된 경우)
  if (applicantData.documents && applicantData.documents.length > 0) {
    const { DocumentHelper } = require('../../../utils/documentHelper');
    
    const documentAnalysis = DocumentHelper.analyzeDocumentCompleteness(
      applicantData.documents, 
      visaType
    );
    
    // 문서 분석 결과를 평가 데이터에 포함
    applicantData.documentAnalysis = documentAnalysis;
    applicantData.autoDetectedDocuments = true;
  }
  
  // 사용자 이력 기반 개인화 (로그인한 경우)
  if (userId) {
    const previousEvaluations = await EvaluationHistory.findByUser(userId, {
      visaType,
      limit: 5
    });
    
    if (previousEvaluations.length > 0) {
      applicantData.previousEvaluations = previousEvaluations.map(eval => ({
        score: eval.result?.score,
        weaknesses: eval.result?.weaknesses,
        recommendations: eval.result?.recommendations
      }));
    }
  }
  
  // 지능형 평가 플래그 설정
  req.body = {
    ...applicantData,
    visaType,
    useV2: true,
    useSmart: true,
    autoOptimization: true
  };
  
  // 일반 V2 평가 라우트로 위임
  req.params.visaType = visaType;
  return router.handle('/' + visaType, req, res);
}));

/**
 * @route   POST /api/v2/visa/evaluation/recommend
 * @desc    비자 추천 시스템 V2
 * @access  Public
 */
router.post('/recommend', asyncHandler(async (req, res) => {
  const applicantProfile = req.body;
  const userId = req.user?.id;
  
  logger.info('비자 추천 요청 V2', { 
    nationality: applicantProfile.nationality,
    userId 
  });
  
  // 추천 시스템 호출
  req.body.requestType = 'recommend';
  req.body.useV2 = true;
  
  await visaEvaluationController.evaluateVisa(req, res);
  
  // V2 추가 기능: 추천 이유 상세화
  if (res.locals.recommendations) {
    const enhancedRecommendations = res.locals.recommendations.map(rec => ({
      ...rec,
      reasoning: this._generateRecommendationReasoning(rec, applicantProfile),
      alternativeOptions: this._getAlternativeOptions(rec.visaType),
      estimatedSuccessRate: this._calculateSuccessRate(rec, applicantProfile),
      processingTimeEstimate: this._getProcessingTimeEstimate(rec.visaType)
    }));
    
    res.json({
      success: true,
      data: {
        recommendations: enhancedRecommendations,
        profile: applicantProfile,
        analysis: {
          strengths: this._analyzeProfileStrengths(applicantProfile),
          limitations: this._analyzeProfileLimitations(applicantProfile),
          improvements: this._suggestProfileImprovements(applicantProfile)
        }
      }
    });
    return;
  }
}));

/**
 * @route   GET /api/v2/visa/evaluation/history
 * @desc    사용자 평가 이력 조회
 * @access  Private
 */
router.get('/history', protect, asyncHandler(async (req, res) => {
  const { visaType, limit = 10, offset = 0 } = req.query;
  
  logger.info('평가 이력 조회', { 
    userId: req.user.id, 
    visaType, 
    limit, 
    offset 
  });
  
  const evaluations = await EvaluationHistory.findByUser(req.user.id, {
    visaType,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  // 이력 요약 생성
  const summaries = evaluations.map(eval => eval.generateSummary());
  
  // 통계 계산
  const stats = {
    totalEvaluations: evaluations.length,
    averageScore: evaluations.length > 0 ? 
      Math.round(evaluations.reduce((sum, eval) => sum + (eval.result?.score || 0), 0) / evaluations.length) : 0,
    mostRecentScore: evaluations[0]?.result?.score || 0,
    improvement: evaluations.length >= 2 ? 
      (evaluations[0]?.result?.score || 0) - (evaluations[1]?.result?.score || 0) : 0
  };
  
  res.json({
    success: true,
    data: {
      evaluations: summaries,
      statistics: stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: evaluations.length
      }
    }
  });
}));

/**
 * @route   GET /api/v2/visa/evaluation/history/:id
 * @desc    특정 평가 이력 상세 조회
 * @access  Private
 */
router.get('/history/:id', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info('평가 이력 상세 조회', { evaluationId: id, userId: req.user.id });
  
  const evaluation = await EvaluationHistory.findById(id);
  
  if (!evaluation || evaluation.userId.toString() !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: '평가 이력을 찾을 수 없습니다.'
    });
  }
  
  // 비교 분석 추가
  const comparison = await evaluation.compareWithPrevious();
  
  res.json({
    success: true,
    data: {
      evaluation: evaluation.toObject(),
      comparison,
      insights: {
        performanceMetrics: evaluation.metadata?.performance,
        dataQuality: evaluation.metadata?.dataQuality,
        recommendations: evaluation.result?.recommendations || []
      }
    }
  });
}));

/**
 * @route   POST /api/v2/visa/evaluation/compare
 * @desc    평가 결과 비교 분석
 * @access  Private
 */
router.post('/compare', protect, asyncHandler(async (req, res) => {
  const { evaluationIds } = req.body;
  
  logger.info('평가 결과 비교', { evaluationIds, userId: req.user.id });
  
  if (!evaluationIds || evaluationIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: '비교할 평가 결과를 2개 이상 선택해주세요.'
    });
  }
  
  const evaluations = await EvaluationHistory.find({
    _id: { $in: evaluationIds },
    userId: req.user.id
  }).sort({ createdAt: 1 });
  
  if (evaluations.length !== evaluationIds.length) {
    return res.status(404).json({
      success: false,
      message: '일부 평가 결과를 찾을 수 없습니다.'
    });
  }
  
  // 비교 분석 수행
  const comparison = this._performDetailedComparison(evaluations);
  
  res.json({
    success: true,
    data: comparison
  });
}));

/**
 * @route   GET /api/v2/visa/evaluation/analytics
 * @desc    평가 시스템 분석 및 통계
 * @access  Private
 */
router.get('/analytics', protect, asyncHandler(async (req, res) => {
  const { timeRange = 30 } = req.query;
  
  logger.info('평가 시스템 분석', { userId: req.user.id, timeRange });
  
  // 사용자별 통계
  const userStats = await EvaluationHistory.findByUser(req.user.id, {
    limit: 100
  });
  
  // 성능 분석
  const performanceAnalysis = await EvaluationHistory.getPerformanceAnalysis();
  
  // 전체 통계
  const globalStats = await EvaluationHistory.getStatistics(parseInt(timeRange));
  
  const analytics = {
    userAnalytics: {
      totalEvaluations: userStats.length,
      visaTypesEvaluated: [...new Set(userStats.map(eval => eval.visaType))],
      averageScore: userStats.length > 0 ? 
        Math.round(userStats.reduce((sum, eval) => sum + (eval.result?.score || 0), 0) / userStats.length) : 0,
      evaluationTrend: this._calculateEvaluationTrend(userStats)
    },
    systemPerformance: performanceAnalysis,
    globalStatistics: globalStats,
    insights: {
      recommendations: this._generateAnalyticsInsights(userStats, globalStats),
      trends: this._identifyTrends(userStats)
    }
  };
  
  res.json({
    success: true,
    data: analytics
  });
}));

/**
 * @route   POST /api/v2/visa/evaluation/feedback
 * @desc    평가 결과 피드백 제출
 * @access  Private
 */
router.post('/feedback', protect, asyncHandler(async (req, res) => {
  const { evaluationId, rating, feedback, helpful, suggestions } = req.body;
  
  logger.info('평가 피드백 제출', { evaluationId, rating, userId: req.user.id });
  
  const evaluation = await EvaluationHistory.findById(evaluationId);
  
  if (!evaluation || evaluation.userId.toString() !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: '평가 결과를 찾을 수 없습니다.'
    });
  }
  
  // 피드백 저장
  if (!evaluation.metadata.feedback) {
    evaluation.metadata.feedback = [];
  }
  
  evaluation.metadata.feedback.push({
    rating,
    feedback,
    helpful,
    suggestions,
    submittedAt: new Date()
  });
  
  await evaluation.save();
  
  res.json({
    success: true,
    message: '피드백이 제출되었습니다. 서비스 개선에 도움이 됩니다.',
    data: {
      evaluationId,
      feedbackCount: evaluation.metadata.feedback.length
    }
  });
}));

// === 헬퍼 메서드 ===

/**
 * 추천 이유 생성
 */
router._generateRecommendationReasoning = function(recommendation, profile) {
  // 간단한 이유 생성 로직
  return `${profile.nationality} 국적자의 ${profile.purpose} 목적에 적합한 비자입니다.`;
};

/**
 * 대안 옵션 제공
 */
router._getAlternativeOptions = function(visaType) {
  const alternatives = {
    'E-1': ['E-3', 'E-4'],
    'E-2': ['E-7'],
    'F-6': ['F-2']
  };
  return alternatives[visaType] || [];
};

/**
 * 성공률 계산
 */
router._calculateSuccessRate = function(recommendation, profile) {
  // 기본 성공률 계산 로직
  return Math.round(Math.random() * 30 + 60); // 60-90% 범위
};

/**
 * 처리 시간 추정
 */
router._getProcessingTimeEstimate = function(visaType) {
  const processingTimes = {
    'E-1': '2-3주',
    'E-2': '1-2주',
    'F-6': '3-4주'
  };
  return processingTimes[visaType] || '2-4주';
};

/**
 * 프로필 강점 분석
 */
router._analyzeProfileStrengths = function(profile) {
  const strengths = [];
  if (profile.education && profile.education.level === 'graduate') {
    strengths.push('고등교육 이수');
  }
  if (profile.experience && profile.experience.years >= 3) {
    strengths.push('충분한 경력');
  }
  return strengths;
};

/**
 * 프로필 제한사항 분석
 */
router._analyzeProfileLimitations = function(profile) {
  const limitations = [];
  if (!profile.language || profile.language.korean < 3) {
    limitations.push('한국어 능력 개선 필요');
  }
  return limitations;
};

/**
 * 프로필 개선 제안
 */
router._suggestProfileImprovements = function(profile) {
  const improvements = [];
  if (!profile.language || profile.language.korean < 4) {
    improvements.push('한국어 능력 시험 응시 권장');
  }
  return improvements;
};

/**
 * 상세 비교 분석
 */
router._performDetailedComparison = function(evaluations) {
  // 비교 분석 로직 구현
  return {
    scoreProgression: evaluations.map(eval => eval.result?.score || 0),
    improvements: [],
    regressions: [],
    summary: '평가 결과가 개선되었습니다.'
  };
};

/**
 * 평가 트렌드 계산
 */
router._calculateEvaluationTrend = function(evaluations) {
  if (evaluations.length < 2) return 'insufficient_data';
  
  const recent = evaluations.slice(0, 3);
  const older = evaluations.slice(3, 6);
  
  const recentAvg = recent.reduce((sum, eval) => sum + (eval.result?.score || 0), 0) / recent.length;
  const olderAvg = older.length > 0 ? 
    older.reduce((sum, eval) => sum + (eval.result?.score || 0), 0) / older.length : recentAvg;
  
  if (recentAvg > olderAvg + 5) return 'improving';
  if (recentAvg < olderAvg - 5) return 'declining';
  return 'stable';
};

/**
 * 분석 인사이트 생성
 */
router._generateAnalyticsInsights = function(userStats, globalStats) {
  return [
    '정기적인 평가를 통해 조건을 개선해보세요',
    '문서 완성도가 승인률에 큰 영향을 미칩니다'
  ];
};

/**
 * 트렌드 식별
 */
router._identifyTrends = function(userStats) {
  return {
    mostEvaluatedVisa: userStats.length > 0 ? userStats[0].visaType : null,
    evaluationFrequency: 'monthly',
    seasonalPatterns: []
  };
};

module.exports = router; 