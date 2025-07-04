/**
 * 범용 비자 서비스 - 37개 비자 지원
 * 플러그인 기반으로 확장성 극대화
 */

const logger = require('../../../../utils/logger');
const { getSupportedVisaTypes, getVisaTypeInfo } = require('../../config/centralVisaConfig');
const { getEvaluatorFactory } = require('../evaluators/EvaluatorFactory');

class UniversalVisaService {
  constructor() {
    this.plugins = new Map();
    this.supportedVisas = getSupportedVisaTypes();
    this.evaluatorFactory = getEvaluatorFactory();
    this.logger = logger;
    
    // 플러그인 로딩
    this._loadPlugins();
  }

  /**
   * 🎯 범용 비자 평가 - 37개 비자 지원
   */
  async evaluate(visaType, applicantData, options = {}) {
    try {
      this.logger.info(`🌐 범용 평가 시작: ${visaType}`);

      // 1. 비자 타입 검증
      if (!this.isSupported(visaType)) {
        throw new Error(`지원되지 않는 비자 타입: ${visaType}`);
      }

      // 2. 플러그인 확인
      const plugin = this.getPlugin(visaType);
      
      if (plugin) {
        // 특화 플러그인 사용
        this.logger.info(`🔧 특화 플러그인 사용: ${visaType}`);
        return await plugin.evaluate(applicantData, options);
      } else {
        // 기본 평가기 사용
        this.logger.info(`⚙️ 기본 평가기 사용: ${visaType}`);
        const evaluator = this.evaluatorFactory.getEvaluator(visaType);
        return await evaluator.evaluate(applicantData, options);
      }

    } catch (error) {
      this.logger.error(`❌ 범용 평가 오류 (${visaType}):`, error);
      return {
        success: false,
        error: error.message,
        visaType
      };
    }
  }

  /**
   * 📋 비자별 요구사항 조회
   */
  getRequirements(visaType) {
    const plugin = this.getPlugin(visaType);
    
    if (plugin && plugin.getRequirements) {
      return plugin.getRequirements();
    }

    // 기본 요구사항
    const visaInfo = getVisaTypeInfo(visaType);
    return {
      basic: visaInfo?.requirements || [],
      documents: visaInfo?.documents || [],
      eligibility: visaInfo?.eligibility || []
    };
  }

  /**
   * 📄 서류 검증
   */
  async validateDocuments(visaType, documents) {
    const plugin = this.getPlugin(visaType);
    
    if (plugin && plugin.validateDocuments) {
      return await plugin.validateDocuments(documents);
    }

    // 기본 서류 검증
    return this._basicDocumentValidation(visaType, documents);
  }

  /**
   * 🔧 플러그인 로딩 (동적 스캔)
   */
  _loadPlugins() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const pluginsDir = path.join(__dirname, '../plugins');
      
      // plugins 디렉토리가 존재하는지 확인
      if (!fs.existsSync(pluginsDir)) {
        this.logger.warn('⚠️ 플러그인 디렉토리가 존재하지 않습니다. 기본 평가기만 사용됩니다.');
        return;
      }

      // 실제 존재하는 플러그인 파일들 스캔
      const pluginFiles = fs.readdirSync(pluginsDir)
        .filter(file => file.endsWith('Plugin.js'))
        .map(file => file.replace('.js', ''));

      if (pluginFiles.length === 0) {
        this.logger.info('ℹ️ 사용 가능한 플러그인이 없습니다. 기본 평가기만 사용됩니다.');
        return;
      }

      // 존재하는 플러그인만 로드
      for (const pluginName of pluginFiles) {
        try {
          const PluginClass = require(`../plugins/${pluginName}`);
          const visaType = pluginName.replace('Plugin', '').replace(/(\d)/, '-$1');
          this.plugins.set(visaType, new PluginClass());
          this.logger.info(`✅ 플러그인 로딩 완료: ${visaType}`);
        } catch (error) {
          this.logger.warn(`⚠️ 플러그인 로딩 실패: ${pluginName} - ${error.message}`);
        }
      }

      this.logger.info(`🎯 플러그인 로딩 완료: ${this.plugins.size}개 플러그인 활성화`);
      
    } catch (error) {
      this.logger.error('❌ 플러그인 로딩 중 오류 발생:', error);
      this.logger.info('ℹ️ 기본 평가기만 사용됩니다.');
    }
  }

  /**
   * 플러그인 조회
   */
  getPlugin(visaType) {
    return this.plugins.get(visaType);
  }

  /**
   * 지원 여부 확인
   */
  isSupported(visaType) {
    return this.supportedVisas.includes(visaType);
  }

  /**
   * 지원되는 비자 목록
   */
  getSupportedVisas() {
    return this.supportedVisas;
  }

  /**
   * 서비스 상태
   */
  getStatus() {
    return {
      totalSupported: this.supportedVisas.length,
      pluginsLoaded: this.plugins.size,
      availablePlugins: Array.from(this.plugins.keys()),
      architecture: 'plugin-based'
    };
  }

  /**
   * 기본 서류 검증
   */
  async _basicDocumentValidation(visaType, documents) {
    const requirements = this.getRequirements(visaType);
    const missing = [];
    const valid = [];

    for (const req of requirements.documents) {
      if (documents.some(doc => doc.type === req)) {
        valid.push(req);
      } else {
        missing.push(req);
      }
    }

    return {
      success: missing.length === 0,
      valid,
      missing,
      completeness: (valid.length / requirements.documents.length) * 100
    };
  }
}

// 싱글톤 인스턴스
let universalVisaService = null;

const getUniversalVisaService = () => {
  if (!universalVisaService) {
    universalVisaService = new UniversalVisaService();
  }
  return universalVisaService;
};

module.exports = {
  UniversalVisaService,
  getUniversalVisaService
}; 