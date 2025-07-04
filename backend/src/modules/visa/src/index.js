/**
 * 비자 평가 모듈 V4 - 메인 진입점
 * 37개 비자의 신규/연장/변경 신청 통합 처리
 */

const logger = require('../../../utils/logger');
const ConfigManager = require('./config/ConfigManager');
const EvaluationEngine = require('./core/engine/EvaluationEngine');
const VisaService = require('./services/VisaService');

class VisaModule {
  constructor() {
    this.initialized = false;
    this.configManager = null;
    this.evaluationEngine = null;
    this.visaService = null;
  }

  /**
   * 모듈 초기화
   */
  async initialize() {
    if (this.initialized) {
      return this;
    }

    try {
      logger.info('🚀 비자 평가 모듈 V4 초기화 시작...');

      // 1. 설정 관리자 초기화
      this.configManager = new ConfigManager();
      await this.configManager.loadConfigurations();
      logger.info('✅ 설정 로드 완료');

      // 2. 평가 엔진 초기화
      this.evaluationEngine = new EvaluationEngine(this.configManager);
      await this.evaluationEngine.initialize();
      logger.info('✅ 평가 엔진 초기화 완료');

      // 3. 비자 서비스 초기화
      this.visaService = new VisaService(this.evaluationEngine);
      logger.info('✅ 비자 서비스 초기화 완료');

      this.initialized = true;
      logger.info('🎉 비자 평가 모듈 V4 초기화 완료!');

      return this;
    } catch (error) {
      logger.error('❌ 비자 모듈 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 비자 평가 실행
   */
  async evaluate(params) {
    if (!this.initialized) {
      throw new Error('모듈이 초기화되지 않았습니다. initialize()를 먼저 호출하세요.');
    }

    return this.visaService.evaluate(params);
  }

  /**
   * 지원 비자 타입 조회
   */
  getSupportedVisaTypes() {
    if (!this.initialized) {
      throw new Error('모듈이 초기화되지 않았습니다.');
    }

    return this.configManager.getSupportedVisaTypes();
  }

  /**
   * 모듈 상태 확인
   */
  getStatus() {
    return {
      initialized: this.initialized,
      version: '4.0.0',
      supportedVisas: this.initialized ? this.configManager.getVisaCount() : 0,
      features: [
        'multi-visa-support',
        'application-type-handling',
        'real-time-validation',
        'workflow-management'
      ]
    };
  }
}

// 싱글톤 인스턴스
const visaModule = new VisaModule();

// 레거시 호환성을 위한 내보내기
module.exports = visaModule;

// 메서드 추가
module.exports.getSupportedVisaTypes = () => {
  if (!visaModule.initialized) {
    throw new Error('VisaModule not initialized. Call initialize() first.');
  }
  return visaModule.configManager.getSupportedVisaTypes();
};

module.exports.getVisaConfig = (visaType) => {
  if (!visaModule.initialized) {
    throw new Error('VisaModule not initialized. Call initialize() first.');
  }
  return visaModule.configManager.getVisaConfig(visaType);
};

// 개별 컴포넌트 내보내기
module.exports.VisaModule = VisaModule;
module.exports.ConfigManager = ConfigManager;
module.exports.EvaluationEngine = EvaluationEngine;
module.exports.VisaService = VisaService;