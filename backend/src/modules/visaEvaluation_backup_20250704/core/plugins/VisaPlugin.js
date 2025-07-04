/**
 * 비자 플러그인 기본 인터페이스
 * 모든 비자 플러그인이 구현해야 하는 표준 인터페이스
 */

class VisaPlugin {
  constructor(visaType) {
    this.visaType = visaType;
    this.version = '1.0.0';
  }

  /**
   * 🎯 비자 평가 수행 (필수 구현)
   * @param {Object} applicantData - 신청자 데이터
   * @param {Object} options - 평가 옵션
   * @returns {Promise<Object>} 평가 결과
   */
  async evaluate(applicantData, options = {}) {
    throw new Error(`${this.visaType} 플러그인에서 evaluate 메서드를 구현해야 합니다.`);
  }

  /**
   * 📋 요구사항 조회 (필수 구현)
   * @returns {Object} 비자별 요구사항
   */
  getRequirements() {
    throw new Error(`${this.visaType} 플러그인에서 getRequirements 메서드를 구현해야 합니다.`);
  }

  /**
   * 📄 서류 검증 (선택 구현)
   * @param {Array} documents - 제출된 서류 목록
   * @returns {Promise<Object>} 검증 결과
   */
  async validateDocuments(documents) {
    // 기본 구현 - 플러그인에서 오버라이드 가능
    return {
      success: true,
      message: '기본 서류 검증 완료',
      documents: documents.length
    };
  }

  /**
   * 🔧 특수 기능 조회 (선택 구현)
   * @returns {Object} 플러그인별 특수 기능
   */
  getSpecialFeatures() {
    return {
      hasAdvancedEvaluation: false,
      hasDocumentValidation: false,
      hasCustomRequirements: false,
      hasWorkflowIntegration: false
    };
  }

  /**
   * 📊 플러그인 정보
   * @returns {Object} 플러그인 메타데이터
   */
  getInfo() {
    return {
      visaType: this.visaType,
      version: this.version,
      name: `${this.visaType} Visa Plugin`,
      description: `${this.visaType} 비자 전용 평가 플러그인`
    };
  }

  /**
   * 🏥 헬스 체크 (선택 구현)
   * @returns {Object} 플러그인 상태
   */
  healthCheck() {
    return {
      status: 'HEALTHY',
      visaType: this.visaType,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = VisaPlugin; 