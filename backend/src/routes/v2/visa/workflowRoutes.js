const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
const { getVisaServiceWorkflow } = require('../../../modules/visaEvaluation/core/services/VisaServiceWorkflow');
const VisaServiceOrder = require('../../../models/visa/VisaServiceOrder');
const asyncHandler = require('../../../utils/asyncHandler');
const logger = require('../../../utils/logger');

/**
 * 비자 서비스 워크플로우 API 라우터 V2
 * 경로: /backend/src/routes/v2/visa/workflowRoutes.js
 * 
 * 역할: 평가 → 매칭 → 결제 → 서류업로드 → 완료까지의 전체 플로우 관리
 */

const workflowService = getVisaServiceWorkflow();

/**
 * @route   POST /api/v2/visa/workflow/start
 * @desc    비자 서비스 워크플로우 시작 (평가 단계)
 * @access  Private
 */
router.post('/start', protect, asyncHandler(async (req, res) => {
  const { visaType, applicantData, options = {} } = req.body;
  const userId = req.user?.id;
  
  logger.info('워크플로우 시작', { 
    userId,
    visaType,
    hasOptions: Object.keys(options).length > 0
  });

  if (!visaType || !applicantData) {
    return res.status(400).json({
      success: false,
      message: '비자 타입과 신청자 데이터가 필요합니다.'
    });
  }

  try {
    // 워크플로우 시작 (평가 단계)
    const result = await workflowService.startEvaluation(
      userId,
      visaType,
      applicantData,
      {
        ...options,
        source: 'api_v2'
      }
    );

    res.json({
      success: true,
      data: {
        ...result,
        workflow: {
          currentStep: 'evaluation',
          totalSteps: 5,
          stepProgress: 1,
          availableActions: ['view_results', 'proceed_to_matching']
        }
      }
    });

  } catch (error) {
    logger.error('워크플로우 시작 오류:', error);
    res.status(500).json({
      success: false,
      message: '워크플로우 시작 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/workflow/:orderId/matching
 * @desc    행정사 매칭 단계 진행
 * @access  Private
 */
router.post('/:orderId/matching', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { preferences = {} } = req.body;
  
  logger.info('매칭 단계 진행', { orderId, userId: req.user.id });

  try {
    // 주문 소유권 확인
    const order = await VisaServiceOrder.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 매칭 단계 실행
    const result = await workflowService.matchLegalRepresentative(orderId, preferences);

    res.json({
      success: true,
      data: {
        ...result,
        workflow: {
          currentStep: 'matching',
          totalSteps: 5,
          stepProgress: 2,
          availableActions: ['accept_match', 'reject_match', 'view_alternatives']
        }
      }
    });

  } catch (error) {
    logger.error('매칭 단계 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 단계 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/workflow/:orderId/payment
 * @desc    결제 처리 단계
 * @access  Private
 */
router.post('/:orderId/payment', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { paymentMethod, paymentData = {} } = req.body;
  
  logger.info('결제 단계 진행', { orderId, userId: req.user.id, paymentMethod });

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: '결제 방법이 필요합니다.'
    });
  }

  try {
    // 주문 소유권 확인
    const order = await VisaServiceOrder.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 결제 처리
    const result = await workflowService.processPayment(orderId, paymentMethod, paymentData);

    res.json({
      success: true,
      data: {
        ...result,
        workflow: {
          currentStep: 'payment',
          totalSteps: 5,
          stepProgress: 3,
          availableActions: ['upload_documents', 'view_requirements']
        }
      }
    });

  } catch (error) {
    logger.error('결제 단계 오류:', error);
    res.status(500).json({
      success: false,
      message: '결제 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/workflow/:orderId/documents
 * @desc    서류 제출 단계
 * @access  Private
 */
router.post('/:orderId/documents', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { documents } = req.body;
  
  logger.info('서류 제출 단계', { orderId, userId: req.user.id, documentCount: documents?.length });

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({
      success: false,
      message: '제출할 서류가 필요합니다.'
    });
  }

  try {
    // 주문 소유권 확인
    const order = await VisaServiceOrder.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 서류 제출 처리
    const result = await workflowService.submitDocuments(orderId, documents);

    res.json({
      success: true,
      data: {
        ...result,
        workflow: {
          currentStep: 'documents',
          totalSteps: 5,
          stepProgress: 4,
          availableActions: ['track_progress', 'view_status']
        }
      }
    });

  } catch (error) {
    logger.error('서류 제출 단계 오류:', error);
    res.status(500).json({
      success: false,
      message: '서류 제출 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/workflow/:orderId/status
 * @desc    워크플로우 진행상황 추적
 * @access  Private
 */
router.get('/:orderId/status', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  logger.info('워크플로우 상태 조회', { orderId, userId: req.user.id });

  try {
    // 주문 소유권 확인
    const order = await VisaServiceOrder.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 진행상황 추적
    const result = await workflowService.trackProgress(orderId);

    res.json({
      success: true,
      data: {
        ...result,
        workflow: {
          currentStep: this._getWorkflowStep(order.status),
          totalSteps: 5,
          stepProgress: this._getStepProgress(order.status),
          availableActions: this._getAvailableActions(order.status)
        }
      }
    });

  } catch (error) {
    logger.error('워크플로우 상태 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '진행상황 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/workflow/orders
 * @desc    사용자의 모든 워크플로우 주문 조회
 * @access  Private
 */
router.get('/orders', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, visaType } = req.query;
  
  logger.info('워크플로우 주문 목록 조회', { 
    userId: req.user.id, 
    page, 
    limit, 
    status, 
    visaType 
  });

  try {
    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (visaType) query.visaType = visaType;

    const orders = await VisaServiceOrder.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('legalRepresentativeMatch')
      .populate('payment');

    const total = await VisaServiceOrder.countDocuments(query);

    // 각 주문에 워크플로우 정보 추가
    const ordersWithWorkflow = orders.map(order => ({
      ...order.toObject(),
      workflow: {
        currentStep: this._getWorkflowStep(order.status),
        totalSteps: 5,
        stepProgress: this._getStepProgress(order.status),
        availableActions: this._getAvailableActions(order.status)
      }
    }));

    res.json({
      success: true,
      data: {
        orders: ordersWithWorkflow,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('주문 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '주문 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/workflow/:orderId/cancel
 * @desc    워크플로우 취소
 * @access  Private
 */
router.post('/:orderId/cancel', protect, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  
  logger.info('워크플로우 취소', { orderId, userId: req.user.id, reason });

  try {
    const order = await VisaServiceOrder.findOne({
      _id: orderId,
      userId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '이미 완료되었거나 취소된 주문입니다.'
      });
    }

    // 취소 처리
    order.status = 'CANCELLED';
    order.metadata.cancellationReason = reason || '사용자 요청';
    order.metadata.cancelledAt = new Date();
    
    await order.save();

    res.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        message: '워크플로우가 취소되었습니다.',
        refundInfo: {
          eligible: order.payment ? true : false,
          estimatedDays: 3-5
        }
      }
    });

  } catch (error) {
    logger.error('워크플로우 취소 오류:', error);
    res.status(500).json({
      success: false,
      message: '워크플로우 취소 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

// === 헬퍼 메서드들 ===

/**
 * 주문 상태를 워크플로우 단계로 변환
 */
router._getWorkflowStep = function(status) {
  const stepMap = {
    'EVALUATION': 'evaluation',
    'MATCHING': 'matching',
    'PAYMENT_PENDING': 'payment',
    'PAYMENT_COMPLETED': 'payment',
    'DOCUMENTS_PENDING': 'documents',
    'DOCUMENTS_SUBMITTED': 'documents',
    'PROCESSING': 'processing',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
  };
  return stepMap[status] || 'unknown';
};

/**
 * 단계별 진행률 계산
 */
router._getStepProgress = function(status) {
  const progressMap = {
    'EVALUATION': 1,
    'MATCHING': 2,
    'PAYMENT_PENDING': 3,
    'PAYMENT_COMPLETED': 3,
    'DOCUMENTS_PENDING': 4,
    'DOCUMENTS_SUBMITTED': 4,
    'PROCESSING': 5,
    'COMPLETED': 5,
    'CANCELLED': 0
  };
  return progressMap[status] || 0;
};

/**
 * 상태별 가능한 액션 목록
 */
router._getAvailableActions = function(status) {
  const actionMap = {
    'EVALUATION': ['view_results', 'proceed_to_matching'],
    'MATCHING': ['accept_match', 'reject_match', 'view_alternatives'],
    'PAYMENT_PENDING': ['proceed_to_payment', 'change_payment_method'],
    'PAYMENT_COMPLETED': ['upload_documents', 'view_requirements'],
    'DOCUMENTS_PENDING': ['upload_documents', 'view_requirements'],
    'DOCUMENTS_SUBMITTED': ['track_progress', 'view_status'],
    'PROCESSING': ['track_progress', 'contact_support'],
    'COMPLETED': ['download_result', 'leave_feedback'],
    'CANCELLED': ['view_refund_status']
  };
  return actionMap[status] || [];
};

module.exports = router; 