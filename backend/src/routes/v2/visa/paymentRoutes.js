const express = require('express');
const router = express.Router();
const { protect } = require('../../../middlewares/auth');
const VisaPayment = require('../../../models/visa/VisaPayment');
const VisaServiceOrder = require('../../../models/visa/VisaServiceOrder');
const asyncHandler = require('../../../utils/asyncHandler');
const logger = require('../../../utils/logger');

/**
 * 비자 서비스 결제 API 라우터 V2
 * 경로: /backend/src/routes/v2/visa/paymentRoutes.js
 * 
 * 역할: 복잡한 비자 서비스 결제 처리
 */

/**
 * @route   POST /api/v2/visa/payment/initiate
 * @desc    결제 초기화 및 견적 생성
 * @access  Private
 */
router.post('/initiate', protect, asyncHandler(async (req, res) => {
  const { orderId, selectedServices = [] } = req.body;
  const userId = req.user.id;
  
  logger.info('결제 초기화', { orderId, userId, serviceCount: selectedServices.length });

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: '주문 ID가 필요합니다.'
    });
  }

  try {
    // 주문 확인
    const order = await VisaServiceOrder.findOne({
      _id: orderId,
      userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    // 기존 결제 기록 확인
    const existingPayment = await VisaPayment.findByOrder(orderId);
    if (existingPayment && existingPayment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: '이미 결제가 완료된 주문입니다.'
      });
    }

    // 결제 내역 계산
    const paymentBreakdown = calculatePaymentBreakdown(order, selectedServices);
    
    // 결제 객체 생성
    const payment = new VisaPayment({
      orderId,
      userId,
      visaType: order.visaType,
      paymentBreakdown,
      totalAmount: {
        subtotal: paymentBreakdown.subtotal,
        tax: Math.round(paymentBreakdown.subtotal * 0.1), // 10% VAT
        discount: 0,
        finalAmount: Math.round(paymentBreakdown.subtotal * 1.1)
      },
      status: 'PENDING',
      security: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      metadata: {
        source: 'web',
        version: '2.0'
      }
    });

    payment.calculateTotalAmount();
    await payment.save();

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        orderId,
        breakdown: payment.paymentBreakdown,
        totalAmount: payment.totalAmount,
        availablePaymentMethods: [
          'credit_card',
          'bank_transfer', 
          'virtual_account',
          'mobile_payment'
        ],
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30분 후 만료
      }
    });

  } catch (error) {
    logger.error('결제 초기화 오류:', error);
    res.status(500).json({
      success: false,
      message: '결제 초기화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/payment/:paymentId/process
 * @desc    실제 결제 처리
 * @access  Private
 */
router.post('/:paymentId/process', protect, asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { paymentMethod, paymentData = {} } = req.body;
  const userId = req.user.id;
  
  logger.info('결제 처리', { paymentId, userId, paymentMethod });

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: '결제 방법이 필요합니다.'
    });
  }

  try {
    // 결제 정보 확인
    const payment = await VisaPayment.findOne({
      _id: paymentId,
      userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '결제 정보를 찾을 수 없습니다.'
      });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: '결제할 수 없는 상태입니다.'
      });
    }

    // 결제 방법 업데이트
    payment.paymentMethod = {
      type: paymentMethod,
      provider: paymentData.provider || 'default',
      details: sanitizePaymentDetails(paymentData)
    };

    payment.status = 'PROCESSING';
    await payment.save();

    // 실제 결제 게이트웨이 처리 (모의 처리)
    const gatewayResult = await processPaymentGateway(payment, paymentData);

    if (gatewayResult.success) {
      // 결제 성공
      await payment.markAsCompleted(gatewayResult);
      
      // 주문 상태 업데이트
      const order = await VisaServiceOrder.findById(payment.orderId);
      if (order) {
        order.payment = payment._id;
        order.status = 'PAYMENT_COMPLETED';
        await order.save();
      }

      res.json({
        success: true,
        data: {
          paymentId: payment._id,
          transactionId: gatewayResult.transactionId,
          status: payment.status,
          totalAmount: payment.totalAmount.finalAmount,
          receipt: {
            receiptNumber: payment.receipt.receiptNumber,
            downloadUrl: `/api/v2/visa/payment/${payment._id}/receipt`
          },
          nextStep: 'document_upload'
        }
      });

    } else {
      // 결제 실패
      await payment.markAsFailed(gatewayResult.error);
      
      res.status(400).json({
        success: false,
        message: '결제 처리에 실패했습니다.',
        error: gatewayResult.error,
        retryAllowed: true
      });
    }

  } catch (error) {
    logger.error('결제 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: '결제 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/payment/:paymentId
 * @desc    결제 상세 정보 조회
 * @access  Private
 */
router.get('/:paymentId', protect, asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;
  
  logger.info('결제 정보 조회', { paymentId, userId });

  try {
    const payment = await VisaPayment.findOne({
      _id: paymentId,
      userId
    }).populate('orderId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '결제 정보를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment._id,
          orderId: payment.orderId,
          visaType: payment.visaType,
          status: payment.status,
          breakdown: payment.paymentBreakdown,
          totalAmount: payment.totalAmount,
          paymentMethod: {
            type: payment.paymentMethod?.type,
            provider: payment.paymentMethod?.provider
          },
          timeline: payment.timeline,
          receipt: payment.receipt
        }
      }
    });

  } catch (error) {
    logger.error('결제 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '결제 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/payment/user/history
 * @desc    사용자 결제 이력 조회
 * @access  Private
 */
router.get('/user/history', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.user.id;
  
  logger.info('결제 이력 조회', { userId, page, limit, status });

  try {
    const payments = await VisaPayment.findByUser(userId, status)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('orderId', 'visaType status')
      .sort({ createdAt: -1 });

    const total = await VisaPayment.countDocuments({
      userId,
      ...(status && { status })
    });

    res.json({
      success: true,
      data: {
        payments: payments.map(payment => ({
          id: payment._id,
          orderId: payment.orderId._id,
          visaType: payment.visaType,
          status: payment.status,
          totalAmount: payment.totalAmount.finalAmount,
          paymentMethod: payment.paymentMethod?.type,
          createdAt: payment.createdAt,
          completedAt: payment.timeline.completedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('결제 이력 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '결제 이력 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   POST /api/v2/visa/payment/:paymentId/refund
 * @desc    결제 환불 요청
 * @access  Private
 */
router.post('/:paymentId/refund', protect, asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { reason, amount, partial = false } = req.body;
  const userId = req.user.id;
  
  logger.info('환불 요청', { paymentId, userId, reason, amount, partial });

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: '환불 사유가 필요합니다.'
    });
  }

  try {
    const payment = await VisaPayment.findOne({
      _id: paymentId,
      userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '결제 정보를 찾을 수 없습니다.'
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: '환불할 수 없는 결제 상태입니다.'
      });
    }

    // 환불 처리
    await payment.processRefund({
      amount: partial ? amount : payment.totalAmount.finalAmount,
      reason,
      requestedBy: userId,
      partial
    });

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        refundAmount: payment.refund.amount,
        status: payment.status,
        estimatedProcessingDays: 3-7,
        message: '환불 요청이 접수되었습니다.'
      }
    });

  } catch (error) {
    logger.error('환불 요청 오류:', error);
    res.status(500).json({
      success: false,
      message: '환불 요청 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

/**
 * @route   GET /api/v2/visa/payment/:paymentId/receipt
 * @desc    영수증 다운로드
 * @access  Private
 */
router.get('/:paymentId/receipt', protect, asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const userId = req.user.id;
  
  logger.info('영수증 다운로드', { paymentId, userId });

  try {
    const payment = await VisaPayment.findOne({
      _id: paymentId,
      userId
    }).populate('orderId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: '결제 정보를 찾을 수 없습니다.'
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: '완료된 결제만 영수증을 발급할 수 있습니다.'
      });
    }

    // 영수증 데이터 생성
    const receiptData = generateReceiptData(payment);

    res.json({
      success: true,
      data: {
        receipt: receiptData,
        downloadUrl: `/api/v2/visa/payment/${paymentId}/receipt/pdf`,
        receiptNumber: payment.receipt.receiptNumber
      }
    });

  } catch (error) {
    logger.error('영수증 다운로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '영수증 다운로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}));

// === 헬퍼 함수들 ===

/**
 * 결제 내역 계산
 */
function calculatePaymentBreakdown(order, selectedServices) {
  const breakdown = {
    baseServiceFee: {
      amount: 200000, // 기본 서비스 비용
      description: '비자 평가 및 기본 서비스'
    },
    subtotal: 200000
  };

  // 행정사 수수료 추가
  if (order.legalRepresentativeMatch) {
    breakdown.legalRepresentativeFee = {
      amount: order.pricing?.legalFee || 800000,
      description: '행정사 서비스 수수료'
    };
    breakdown.subtotal += breakdown.legalRepresentativeFee.amount;
  }

  // 정부 수수료
  breakdown.governmentFee = {
    amount: getGovernmentFee(order.visaType),
    description: '정부 수수료 (출입국사무소)'
  };
  breakdown.subtotal += breakdown.governmentFee.amount;

  // 추가 서비스
  selectedServices.forEach(service => {
    if (service === 'urgent') {
      breakdown.urgentProcessingFee = {
        amount: 300000,
        description: '긴급 처리 서비스'
      };
      breakdown.subtotal += 300000;
    }
    if (service === 'consultation') {
      breakdown.consultationFee = {
        amount: 150000,
        description: '전문가 상담 서비스'
      };
      breakdown.subtotal += 150000;
    }
    if (service === 'translation') {
      breakdown.translationFee = {
        amount: 200000,
        description: '번역 및 공증 서비스'
      };
      breakdown.subtotal += 200000;
    }
  });

  return breakdown;
}

/**
 * 정부 수수료 계산
 */
function getGovernmentFee(visaType) {
  const fees = {
    'E-1': 200000,
    'E-2': 200000,
    'E-3': 200000,
    'E-4': 200000,
    'E-5': 200000,
    'F-2': 130000,
    'F-6': 130000,
    'D-2': 60000
  };
  return fees[visaType] || 200000;
}

/**
 * 결제 데이터 민감정보 제거
 */
function sanitizePaymentDetails(paymentData) {
  const sanitized = { ...paymentData };
  
  // 카드 번호 마스킹
  if (sanitized.cardNumber) {
    sanitized.cardNumber = maskCardNumber(sanitized.cardNumber);
  }
  
  // 민감 정보 제거
  delete sanitized.cvv;
  delete sanitized.password;
  delete sanitized.pin;
  
  return sanitized;
}

/**
 * 카드 번호 마스킹
 */
function maskCardNumber(cardNumber) {
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-****-****-$4');
}

/**
 * 결제 게이트웨이 처리 (모의)
 */
async function processPaymentGateway(payment, paymentData) {
  // 실제 환경에서는 토스페이, 카카오페이 등의 API 호출
  return new Promise((resolve) => {
    setTimeout(() => {
      // 90% 성공률로 모의 처리
      const success = Math.random() > 0.1;
      
      if (success) {
        resolve({
          success: true,
          transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          approvalNumber: `APP_${Date.now()}`,
          gateway: 'MOCK_GATEWAY'
        });
      } else {
        resolve({
          success: false,
          error: '카드 승인이 거절되었습니다.'
        });
      }
    }, 2000); // 2초 지연으로 실제 처리 시뮬레이션
  });
}

/**
 * 영수증 데이터 생성
 */
function generateReceiptData(payment) {
  return {
    receiptNumber: payment.receipt.receiptNumber,
    issueDate: payment.receipt.issuedAt,
    paymentInfo: {
      totalAmount: payment.totalAmount.finalAmount,
      paymentMethod: payment.paymentMethod.type,
      transactionId: payment.gateway.transactionId
    },
    breakdown: payment.paymentBreakdown,
    customerInfo: {
      userId: payment.userId,
      visaType: payment.visaType
    },
    companyInfo: {
      name: 'TOV (Turning Opportunity into Value)',
      address: '서울특별시 강남구 테헤란로',
      businessNumber: '123-45-67890'
    }
  };
}

module.exports = router; 