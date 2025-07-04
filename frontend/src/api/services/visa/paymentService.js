/**
 * 비자 서비스 결제 서비스
 * 복잡한 비자 서비스 결제 처리
 */
import { apiClient, extractData } from '../../config/apiClient';

/**
 * 비자 결제 API 서비스
 */
export class VisaPaymentService {
  constructor() {
    this.paymentCache = new Map();
  }

  /**
   * 결제 초기화 및 견적 생성
   * @param {string} orderId - 주문 ID
   * @param {Array} selectedServices - 선택된 추가 서비스
   */
  async initiatePayment(orderId, selectedServices = []) {
    try {
      const response = await apiClient.post('/v2/visa/payment/initiate', {
        orderId,
        selectedServices
      });

      const result = extractData(response);
      
      // 결제 정보 캐시
      if (result.paymentId) {
        this.paymentCache.set(result.paymentId, {
          ...result,
          initiatedAt: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('결제 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 실제 결제 처리
   * @param {string} paymentId - 결제 ID
   * @param {string} paymentMethod - 결제 방법
   * @param {Object} paymentData - 결제 데이터
   */
  async processPayment(paymentId, paymentMethod, paymentData = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/payment/${paymentId}/process`, {
        paymentMethod,
        paymentData
      });

      const result = extractData(response);
      
      // 결제 결과 캐시 업데이트
      if (this.paymentCache.has(paymentId)) {
        const cached = this.paymentCache.get(paymentId);
        this.paymentCache.set(paymentId, {
          ...cached,
          ...result,
          processedAt: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('결제 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 상세 정보 조회
   * @param {string} paymentId - 결제 ID
   */
  async getPaymentDetail(paymentId) {
    try {
      // 캐시 확인
      if (this.paymentCache.has(paymentId)) {
        const cached = this.paymentCache.get(paymentId);
        // 5분 이내 캐시는 그대로 사용
        if (Date.now() - new Date(cached.initiatedAt).getTime() < 5 * 60 * 1000) {
          return cached;
        }
      }

      const response = await apiClient.get(`/v2/visa/payment/${paymentId}`);
      const result = extractData(response);
      
      // 캐시 업데이트
      this.paymentCache.set(paymentId, result);
      
      return result;
    } catch (error) {
      console.error('결제 정보 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 결제 이력 조회
   * @param {Object} params - 조회 파라미터
   */
  async getPaymentHistory(params = {}) {
    try {
      const response = await apiClient.get('/v2/visa/payment/user/history', {
        params: {
          page: 1,
          limit: 10,
          ...params
        }
      });

      return extractData(response);
    } catch (error) {
      console.error('결제 이력 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 환불 요청
   * @param {string} paymentId - 결제 ID
   * @param {string} reason - 환불 사유
   * @param {number} amount - 환불 금액 (부분 환불 시)
   * @param {boolean} partial - 부분 환불 여부
   */
  async requestRefund(paymentId, reason, amount = null, partial = false) {
    try {
      const response = await apiClient.post(`/v2/visa/payment/${paymentId}/refund`, {
        reason,
        ...(partial && amount && { amount, partial: true })
      });

      return extractData(response);
    } catch (error) {
      console.error('환불 요청 실패:', error);
      throw error;
    }
  }

  /**
   * 영수증 조회/다운로드
   * @param {string} paymentId - 결제 ID
   */
  async getReceipt(paymentId) {
    try {
      const response = await apiClient.get(`/v2/visa/payment/${paymentId}/receipt`);
      return extractData(response);
    } catch (error) {
      console.error('영수증 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 결제 상태 실시간 확인
   * @param {string} paymentId - 결제 ID
   * @param {Function} onStatusChange - 상태 변경 콜백
   */
  async watchPaymentStatus(paymentId, onStatusChange) {
    const checkStatus = async () => {
      try {
        const payment = await this.getPaymentDetail(paymentId);
        onStatusChange(payment);
        
        // 결제가 완료되거나 실패하면 감시 중단
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(payment.status)) {
          return;
        }
        
        // 5초 후 다시 확인
        setTimeout(checkStatus, 5000);
      } catch (error) {
        console.error('결제 상태 확인 오류:', error);
      }
    };

    // 초기 확인
    checkStatus();
  }

  /**
   * 결제 방법별 UI 헬퍼
   */
  getPaymentMethodConfig(paymentMethod) {
    const configs = {
      credit_card: {
        name: '신용카드',
        icon: '💳',
        fields: ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'],
        validation: {
          cardNumber: /^\d{4}-?\d{4}-?\d{4}-?\d{4}$/,
          expiryDate: /^(0[1-9]|1[0-2])\/\d{2}$/,
          cvv: /^\d{3,4}$/
        }
      },
      bank_transfer: {
        name: '계좌이체',
        icon: '🏦',
        fields: ['bankCode', 'accountNumber', 'accountHolder'],
        requiresVerification: true
      },
      virtual_account: {
        name: '가상계좌',
        icon: '🏧',
        fields: [],
        autoGenerated: true
      },
      mobile_payment: {
        name: '모바일결제',
        icon: '📱',
        fields: ['phoneNumber'],
        providers: ['kakao_pay', 'naver_pay', 'samsung_pay']
      }
    };

    return configs[paymentMethod] || null;
  }

  /**
   * 결제 금액 포맷팅
   * @param {number} amount - 금액
   * @param {string} currency - 통화
   */
  formatAmount(amount, currency = 'KRW') {
    if (currency === 'KRW') {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * 결제 수수료 계산
   * @param {number} amount - 기본 금액
   * @param {string} paymentMethod - 결제 방법
   */
  calculateFees(amount, paymentMethod) {
    const feeRates = {
      credit_card: 0.025,     // 2.5%
      bank_transfer: 0.005,   // 0.5%
      virtual_account: 0.008, // 0.8%
      mobile_payment: 0.02    // 2.0%
    };

    const feeRate = feeRates[paymentMethod] || 0.025;
    const fee = Math.round(amount * feeRate);
    
    return {
      baseAmount: amount,
      fee,
      totalAmount: amount + fee,
      feeRate: feeRate * 100
    };
  }

  /**
   * 할부 계산기
   * @param {number} amount - 총 금액
   * @param {number} months - 할부 개월
   */
  calculateInstallment(amount, months) {
    if (months <= 1) {
      return {
        months: 1,
        monthlyAmount: amount,
        totalAmount: amount,
        interestRate: 0,
        totalInterest: 0
      };
    }

    // 간단한 무이자 할부 계산 (실제로는 카드사별 이율 적용)
    const monthlyAmount = Math.ceil(amount / months);
    const totalAmount = monthlyAmount * months;
    
    return {
      months,
      monthlyAmount,
      totalAmount,
      interestRate: 0,
      totalInterest: totalAmount - amount
    };
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.paymentCache.clear();
  }

  /**
   * 특정 결제 캐시 삭제
   */
  deleteCacheEntry(paymentId) {
    this.paymentCache.delete(paymentId);
  }
}

// 싱글톤 인스턴스 생성
const visaPaymentService = new VisaPaymentService();

export default visaPaymentService; 