const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
// 임시 매칭 서비스 클래스 (후에 새 모듈로 교체)
class LegalRepresentativeMatchingService {
  async findMatchingLawyers() { return { lawyers: [], total: 0 }; }
  async getLawyerDetails() { return { lawyer: null }; }
  async createMatchRequest() { return { success: true, requestId: 'temp-request' }; }
  async getMatchStatus() { return { status: 'pending' }; }
}
// const LegalRepresentativeMatchingService = require('../../../modules/visaEvaluation/core/services/LegalRepresentativeMatchingService');
const LegalRepresentativeMatch = require('../../../models/visa/LegalRepresentativeMatch');
const asyncHandler = require('../../../utils/asyncHandler');
const logger = require('../../../utils/logger');

/**
 * 행정사 매칭 API 라우터 V2
 * 경로: /backend/src/routes/v2/visa/matchingRoutes.js
 * 
 * 역할: 비자 평가 후 행정사 매칭 시스템
 */

const matchingService = new LegalRepresentativeMatchingService();

/**
 * @route   POST /api/v2/visa/matching/find
 * @desc    평가 결과 기반 행정사 매칭
 * @access  Public
 */
router.post('/find', asyncHandler(async (req, res) => {
  const { evaluationResult, clientPreferences = {} } = req.body;
  const userId = req.user?.id;
  
  logger.info('행정사 매칭 요청', { 
    userId,
    visaType: evaluationResult?.visaType,
    hasPreferences: Object.keys(clientPreferences).length > 0
  });

  if (!evaluationResult) {
    return res.status(400).json({
      success: false,
      message: '평가 결과가 필요합니다.'
    });
  }

  try {
    // 행정사 매칭 수행
    const matchingResult = await matchingService.matchLegalRepresentative(
      evaluationResult,
      clientPreferences
    );

    // 매칭 결과를 DB에 저장 (로그인한 경우)
    if (userId && matchingResult.recommendations?.length > 0) {
      const topRecommendation = matchingResult.recommendations[0];
      
      const matchRecord = new LegalRepresentativeMatch({
        userId,
        visaType: evaluationResult.visaType || 'UNKNOWN',
        legalRepresentative: {
          name: topRecommendation.representative.name,
          licenseNumber: `LIC_${topRecommendation.representative.id}`,
          specializations: topRecommendation.representative.specialties,
          rating: topRecommendation.representative.rating,
          experience: {
            years: topRecommendation.representative.experience,
            successfulCases: topRecommendation.representative.reviewCount,
            visaTypes: [evaluationResult.visaType]
          },
          languages: topRecommendation.representative.languages || ['KO'],
          contact: {
            email: `${topRecommendation.representative.id}@example.com`
          }
        },
        matchingScore: topRecommendation.matchingScore,
        fee: {
          serviceFee: topRecommendation.representative.fee.min,
          totalFee: topRecommendation.representative.fee.max
        },
        status: 'PROPOSED'
      });

      await matchRecord.save();
      
      // 매칭 ID 추가
      matchingResult.matchId = matchRecord._id;
    }

    res.json({
      success: true,
      data: {
        ...matchingResult,
        matchedAt: new Date().toISOString(),
        userId
      }
    });

  } catch (error) {
    logger.error('행정사 매칭 오류:', error);
    res.status(500).json({
      success: false,
      message: '행정사 매칭 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/matching/history
 * @desc    사용자의 행정사 매칭 이력 조회
 * @access  Private
 */
router.get('/history', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  logger.info('매칭 이력 조회', { userId: req.user.id, page, limit, status });

  try {
    const query = { userId: req.user.id };
    if (status) query.status = status;

    const matches = await LegalRepresentativeMatch.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await LegalRepresentativeMatch.countDocuments(query);

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('매칭 이력 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 이력 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/matching/:matchId/accept
 * @desc    행정사 매칭 수락
 * @access  Private
 */
router.post('/:matchId/accept', protect, asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  
  logger.info('매칭 수락', { matchId, userId: req.user.id });

  try {
    const match = await LegalRepresentativeMatch.findOne({
      _id: matchId,
      userId: req.user.id
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '매칭 정보를 찾을 수 없습니다.'
      });
    }

    if (match.status !== 'PROPOSED') {
      return res.status(400).json({
        success: false,
        message: '수락할 수 없는 상태입니다.'
      });
    }

    await match.acceptMatch();

    res.json({
      success: true,
      data: {
        match,
        nextStep: '결제 진행',
        message: '행정사 매칭이 수락되었습니다.'
      }
    });

  } catch (error) {
    logger.error('매칭 수락 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 수락 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/matching/:matchId/reject
 * @desc    행정사 매칭 거절
 * @access  Private
 */
router.post('/:matchId/reject', protect, asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { reason } = req.body;
  
  logger.info('매칭 거절', { matchId, userId: req.user.id, reason });

  try {
    const match = await LegalRepresentativeMatch.findOne({
      _id: matchId,
      userId: req.user.id
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '매칭 정보를 찾을 수 없습니다.'
      });
    }

    match.status = 'REJECTED';
    match.metadata.notes.push(`거절 사유: ${reason || '사유 없음'}`);
    await match.save();

    res.json({
      success: true,
      data: {
        match,
        message: '행정사 매칭이 거절되었습니다.'
      }
    });

  } catch (error) {
    logger.error('매칭 거절 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 거절 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/matching/:matchId
 * @desc    매칭 상세 정보 조회
 * @access  Private
 */
router.get('/:matchId', protect, asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  
  logger.info('매칭 상세 조회', { matchId, userId: req.user.id });

  try {
    const match = await LegalRepresentativeMatch.findOne({
      _id: matchId,
      userId: req.user.id
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '매칭 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: match
    });

  } catch (error) {
    logger.error('매칭 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 상세 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/matching/:matchId/feedback
 * @desc    행정사 서비스 피드백 제출
 * @access  Private
 */
router.post('/:matchId/feedback', protect, asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { rating, review, satisfaction, wouldRecommend } = req.body;
  
  logger.info('매칭 피드백 제출', { matchId, userId: req.user.id, rating });

  try {
    const match = await LegalRepresentativeMatch.findOne({
      _id: matchId,
      userId: req.user.id
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: '매칭 정보를 찾을 수 없습니다.'
      });
    }

    if (match.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: '완료된 서비스만 피드백을 남길 수 있습니다.'
      });
    }

    // 피드백 저장
    match.clientFeedback = {
      rating: parseInt(rating),
      review,
      satisfaction: {
        communication: satisfaction?.communication || rating,
        expertise: satisfaction?.expertise || rating,
        timeliness: satisfaction?.timeliness || rating,
        overall: rating
      },
      wouldRecommend: Boolean(wouldRecommend),
      reviewedAt: new Date()
    };

    await match.save();

    res.json({
      success: true,
      data: {
        message: '피드백이 제출되었습니다.',
        feedback: match.clientFeedback
      }
    });

  } catch (error) {
    logger.error('피드백 제출 오류:', error);
    res.status(500).json({
      success: false,
      message: '피드백 제출 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

module.exports = router; 