/**
 * 비자 서비스 워크플로우 관리자
 * 평가 → 매칭 → 결제 → 서류업로드 → 처리 완료까지의 전체 플로우 관리
 */

const VisaServiceOrder = require('../../../../models/visa/VisaServiceOrder');
const { getUniversalVisaService } = require('./UniversalVisaService');
const logger = require('../../../../utils/logger');
const LegalRepresentativeMatch = require('../../../../models/visa/LegalRepresentativeMatch');

class VisaServiceWorkflow {
  constructor() {
    this.universalService = getUniversalVisaService();
    this.logger = logger;
  }

  /**
   * 🚀 비자 서비스 시작 - 평가 단계
   */
  async startEvaluation(userId, visaType, applicantData, options = {}) {
    try {
      this.logger.info('🚀 비자 서비스 워크플로우 시작:', { userId, visaType });

      // 1. 서비스 주문 생성
      const order = new VisaServiceOrder({
        userId,
        visaType,
        applicationType: options.applicationType || 'NEW',
        serviceOptions: {
          includeLegalMatching: options.includeLegalMatching !== false,
          includeDocumentReview: options.includeDocumentReview !== false,
          urgentProcessing: options.urgentProcessing === true,
          consultationIncluded: options.consultationIncluded === true
        },
        clientPreferences: options.clientPreferences || {},
        timeline: {
          evaluationStarted: new Date()
        },
        metadata: {
          source: options.source || 'web'
        }
      });

      // 2. 평가 수행
      const evaluationResult = await this.universalService.evaluate(
        visaType, 
        applicantData, 
        {
          ...options,
          orderId: order._id
        }
      );

      if (evaluationResult.success === false) {
        order.status = 'FAILED';
        order.evaluationResult = {
          status: 'FAILED',
          recommendations: [evaluationResult.error || 'Evaluation failed.'],
          evaluatedAt: new Date()
        };
        await order.save();
        throw new Error(evaluationResult.error || 'Evaluation service failed.');
      }

      // 3. 평가 결과 저장
      order.evaluationResult = {
        totalScore: evaluationResult.totalScore || evaluationResult.overallScore,
        successProbability: evaluationResult.successProbability || evaluationResult.likelihood,
        status: evaluationResult.status,
        strengths: evaluationResult.strengths || [],
        weaknesses: evaluationResult.weaknesses || evaluationResult.missingRequirements || [],
        recommendations: evaluationResult.recommendations || [],
        evaluatedAt: new Date(),
        evaluationId: evaluationResult.evaluationId
      };

      // 4. 기본 가격 설정
      this._calculatePricing(order);

      // 5. 주문 저장
      await order.save();

      // 6. 다음 단계로 진행 (자동)
      if (evaluationResult.success && order.serviceOptions.includeLegalMatching) {
        await this._autoAdvanceToMatching(order);
      }

      this.logger.info('✅ 평가 단계 완료:', { orderId: order._id, score: evaluationResult.totalScore });

      return {
        success: true,
        orderId: order._id,
        evaluationResult,
        nextStep: order.status,
        estimatedCost: order.pricing.totalAmount
      };

    } catch (error) {
      this.logger.error('❌ 평가 시작 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🤝 행정사 매칭 단계
   */
  async matchLegalRepresentative(orderId, preferences = {}) {
    try {
      this.logger.info('🤝 행정사 매칭 시작:', { orderId });

      const order = await VisaServiceOrder.findById(orderId);
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      if (order.status !== 'MATCHING') {
        throw new Error('매칭 단계가 아닙니다.');
      }

      // 행정사 매칭 로직 (간단한 버전)
      const matchResult = await this._performLegalMatching(order, preferences);

      // 매칭 결과 저장
      order.legalRepresentativeMatch = matchResult.matchId;
      order.pricing.legalFee = matchResult.estimatedFee;
      order.calculateTotalCost();

      // 결제 단계로 진행
      await order.advanceStatus(); // PAYMENT_PENDING

      await order.save();

      this.logger.info('✅ 행정사 매칭 완료:', { orderId, matchId: matchResult.matchId });

      return {
        success: true,
        orderId: order._id,
        match: matchResult,
        totalCost: order.pricing.totalAmount,
        nextStep: order.status
      };

    } catch (error) {
      this.logger.error('❌ 행정사 매칭 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 💳 결제 처리 단계
   */
  async processPayment(orderId, paymentMethod, paymentData = {}) {
    try {
      this.logger.info('💳 결제 처리 시작:', { orderId, paymentMethod });

      const order = await VisaServiceOrder.findById(orderId);
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      if (order.status !== 'PAYMENT_PENDING') {
        throw new Error('결제 대기 상태가 아닙니다.');
      }

      // 결제 처리 (실제 결제 게이트웨이 연동 필요)
      const paymentResult = await this._processActualPayment(order, paymentMethod, paymentData);

      if (paymentResult.success) {
        // 결제 완료 후 서류 단계로 진행
        await order.advanceStatus(); // PAYMENT_COMPLETED
        await order.advanceStatus(); // DOCUMENTS_PENDING

        order.payment = paymentResult.paymentId;
        await order.save();

        this.logger.info('✅ 결제 완료:', { orderId, paymentId: paymentResult.paymentId });

        return {
          success: true,
          orderId: order._id,
          paymentId: paymentResult.paymentId,
          nextStep: order.status,
          documentsRequired: await this._getRequiredDocuments(order)
        };
      } else {
        throw new Error(paymentResult.error || '결제 처리 실패');
      }

    } catch (error) {
      this.logger.error('❌ 결제 처리 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 📄 서류 제출 단계
   */
  async submitDocuments(orderId, documents) {
    try {
      this.logger.info('📄 서류 제출 시작:', { orderId, documentCount: documents.length });

      const order = await VisaServiceOrder.findById(orderId);
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      if (order.status !== 'DOCUMENTS_PENDING') {
        throw new Error('서류 대기 상태가 아닙니다.');
      }

      // 서류 검증
      const validationResult = await this.universalService.validateDocuments(order.visaType, documents);

      if (validationResult.success) {
        // 서류 검증 통과 - 처리 단계로 진행
        await order.advanceStatus(); // DOCUMENTS_SUBMITTED
        await order.advanceStatus(); // PROCESSING

        // 예상 완료일 설정
        const estimatedDays = this._calculateProcessingTime(order);
        order.timeline.estimatedCompletion = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);

        await order.save();

        this.logger.info('✅ 서류 제출 완료:', { orderId });

        return {
          success: true,
          orderId: order._id,
          validationResult,
          nextStep: order.status,
          estimatedCompletion: order.timeline.estimatedCompletion
        };
      } else {
        return {
          success: false,
          error: '서류 검증 실패',
          validationResult,
          requiredActions: validationResult.recommendations
        };
      }

    } catch (error) {
      this.logger.error('❌ 서류 제출 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 📊 진행상황 추적
   */
  async trackProgress(orderId) {
    try {
      const order = await VisaServiceOrder.findById(orderId)
        .populate('legalRepresentativeMatch')
        .populate('payment')
        .populate('documentSubmission');

      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      return {
        success: true,
        order: {
          id: order._id,
          status: order.status,
          progressPercentage: order.progressPercentage,
          daysInProgress: order.daysInProgress,
          timeline: order.timeline,
          evaluationResult: order.evaluationResult,
          pricing: order.pricing
        },
        nextActions: this._getNextActions(order)
      };

    } catch (error) {
      this.logger.error('❌ 진행상황 추적 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // === 헬퍼 메서드들 ===

  async _autoAdvanceToMatching(order) {
    if (order.serviceOptions.includeLegalMatching) {
      await order.advanceStatus(); // MATCHING
    }
  }

  _calculatePricing(order) {
    // 기본 가격 설정 (비자 타입별)
    const basePrices = {
      'E-1': 300000,
      'E-2': 250000,
      'E-7': 200000,
      'F-2': 350000,
      'F-6': 400000,
      'D-2': 150000
    };

    order.pricing.basePrice = basePrices[order.visaType] || 200000;

    // 추가 서비스 비용
    if (order.serviceOptions.urgentProcessing) {
      order.pricing.urgentFee = order.pricing.basePrice * 0.5;
    }

    if (order.serviceOptions.consultationIncluded) {
      order.pricing.consultationFee = 100000;
    }

    order.calculateTotalCost();
  }

  async _performLegalMatching(order, preferences) {
    // 간단한 매칭 로직 (실제로는 더 복잡함)
    const estimatedFees = {
      'E-1': 800000,
      'E-2': 600000,
      'E-7': 500000,
      'F-2': 900000,
      'F-6': 1200000,
      'D-2': 400000
    };

    // 매칭 후보(예시) 생성
    const matchPayload = {
      orderId: order._id,
      userId: order.userId,
      visaType: order.visaType,
      legalRepresentative: {
        name: '김행정사',
        licenseNumber: `LR-${Date.now()}`,
        specializations: [order.visaType, '교육분야'],
        rating: 4.8,
        experience: {
          years: 15,
          successfulCases: 320,
          visaTypes: [order.visaType]
        },
        languages: ['한국어', '영어']
      },
      matchingScore: 85,
      fee: {
        serviceFee: estimatedFees[order.visaType] || 600000,
        totalFee: estimatedFees[order.visaType] || 600000
      }
    };

    // DB에 저장
    const matchDoc = await LegalRepresentativeMatch.create(matchPayload);

    return {
      matchId: matchDoc._id,
      legalRepresentativeName: matchDoc.legalRepresentative.name,
      specialization: matchDoc.legalRepresentative.specializations,
      estimatedFee: matchDoc.fee.serviceFee,
      rating: matchDoc.legalRepresentative.rating,
      experience: `${matchDoc.legalRepresentative.experience.years}년`,
      languages: matchDoc.legalRepresentative.languages
    };
  }

  async _processActualPayment(order, paymentMethod, paymentData) {
    // 실제 결제 게이트웨이 연동 필요
    // 여기서는 모의 결제 처리
    return {
      success: true,
      paymentId: `payment_${Date.now()}`,
      transactionId: `tx_${Date.now()}`,
      amount: order.pricing.totalAmount,
      method: paymentMethod
    };
  }

  async _getRequiredDocuments(order) {
    return this.universalService.getRequirements(order.visaType).documents;
  }

  _calculateProcessingTime(order) {
    const baseDays = {
      'E-1': 14,
      'E-2': 10,
      'E-7': 7,
      'F-2': 21,
      'F-6': 30,
      'D-2': 7
    };

    let days = baseDays[order.visaType] || 14;

    if (order.serviceOptions.urgentProcessing) {
      days = Math.ceil(days * 0.5);
    }

    return days;
  }

  _getNextActions(order) {
    switch (order.status) {
      case 'EVALUATION':
        return ['평가 완료 대기'];
      case 'MATCHING':
        return ['행정사 매칭 진행중'];
      case 'PAYMENT_PENDING':
        return ['결제 진행', '결제 방법 선택'];
      case 'PAYMENT_COMPLETED':
        return ['서류 준비', '필수 서류 확인'];
      case 'DOCUMENTS_PENDING':
        return ['서류 업로드', '서류 검증'];
      case 'DOCUMENTS_SUBMITTED':
        return ['서류 검토중'];
      case 'PROCESSING':
        return ['출입국사무소 처리중', '결과 대기'];
      case 'COMPLETED':
        return ['서비스 완료'];
      default:
        return [];
    }
  }
}

// 싱글톤 인스턴스
let workflowService = null;

const getVisaServiceWorkflow = () => {
  if (!workflowService) {
    workflowService = new VisaServiceWorkflow();
  }
  return workflowService;
};

module.exports = {
  VisaServiceWorkflow,
  getVisaServiceWorkflow
}; 