/**
 * 비자 타입 등록 및 관리 시스템
 * 비자 타입별 설정을 통합 관리하고 자동 등록 기능 제공
 * 경로: /backend/src/modules/visaEvaluation/core/registry/VisaTypeRegistry.js
 */

const path = require('path');
const fs = require('fs').promises;
const { ConfigurationError, ValidationError } = require('../../../../utils/errors');
const logger = require('../../../../utils/logger');

/**
 * 비자 타입 설정 스키마
 */
const VISA_TYPE_SCHEMA = {
  code: { type: 'string', required: true },
  name: { type: 'string', required: true },
  category: { type: 'string', required: true }, // 'WORK', 'STUDY', 'FAMILY', etc.
  weights: { type: 'object', required: true },
  thresholds: { type: 'object', required: true },
  documents: { type: 'object', required: false },
  rules: { type: 'object', required: false },
  evaluator: { type: 'function', required: false },
  eligibilityRules: { type: 'object', required: false },
  changeabilityRules: { type: 'object', required: false }
};

/**
 * 비자 타입 등록 관리자
 */
class VisaTypeRegistry {
  constructor(options = {}) {
    this.types = new Map();
    this.categories = new Map();
    this.baseConfigPath = options.baseConfigPath || path.join(__dirname, '../../config/visaTypes');
    this.autoLoad = options.autoLoad !== false;
    this.logger = options.logger || logger;
    
    // 기본 설정 로드
    if (this.autoLoad) {
      this.loadAllConfigurations();
    }
  }

  /**
   * 비자 타입 등록
   * @param {string} visaType - 비자 코드 (e.g., 'E-1')
   * @param {Object} config - 비자 타입 설정
   */
  register(visaType, config) {
    try {
      // 설정 검증
      this._validateConfig(visaType, config);
      
      // 정규화된 코드 생성
      const normalizedCode = this._normalizeVisaCode(visaType);
      
      // 등록
      this.types.set(normalizedCode, {
        ...config,
        code: normalizedCode,
        registeredAt: new Date(),
        version: config.version || '1.0'
      });

      // 카테고리별 분류
      this._categorizeVisa(normalizedCode, config.category);
      
      this.logger.info(`비자 타입 등록 완료: ${normalizedCode}`, {
        category: config.category,
        name: config.name
      });

    } catch (error) {
      throw new ConfigurationError(
        `비자 타입 등록 실패: ${visaType}`,
        'VISA_REGISTRATION',
        { originalError: error.message }
      );
    }
  }

  /**
   * 디렉터리에서 모든 비자 타입 설정 자동 로드
   */
  async loadAllConfigurations() {
    try {
      const configFiles = await this._findConfigFiles();
      
      for (const configFile of configFiles) {
        await this._loadConfigFile(configFile);
      }
      
      this.logger.info(`비자 타입 설정 로드 완료: ${this.types.size}개`, {
        loadedTypes: Array.from(this.types.keys())
      });

    } catch (error) {
      this.logger.error('비자 타입 설정 로드 중 오류:', error);
      throw new ConfigurationError(
        '비자 타입 설정 로드 실패',
        'CONFIG_LOAD_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * 특정 비자 타입의 평가자 반환
   * @param {string} visaType - 비자 코드
   * @returns {Function|null} 평가 함수
   */
  getEvaluator(visaType) {
    const normalizedCode = this._normalizeVisaCode(visaType);
    const config = this.types.get(normalizedCode);
    
    if (!config) {
      this.logger.warn(`등록되지 않은 비자 타입: ${visaType}`);
      return null;
    }
    
    return config.evaluator || null;
  }

  /**
   * 비자 타입 설정 반환
   * @param {string} visaType - 비자 코드
   * @returns {Object|null} 비자 타입 설정
   */
  getConfig(visaType) {
    const normalizedCode = this._normalizeVisaCode(visaType);
    return this.types.get(normalizedCode) || null;
  }

  /**
   * 가중치 반환
   * @param {string} visaType - 비자 코드
   * @returns {Object|null} 가중치 설정
   */
  getWeights(visaType) {
    const config = this.getConfig(visaType);
    return config?.weights || null;
  }

  /**
   * 임계값 반환
   * @param {string} visaType - 비자 코드
   * @returns {Object|null} 임계값 설정
   */
  getThresholds(visaType) {
    const config = this.getConfig(visaType);
    return config?.thresholds || null;
  }

  /**
   * 문서 요구사항 반환
   * @param {string} visaType - 비자 코드
   * @returns {Object|null} 문서 요구사항
   */
  getDocumentRequirements(visaType) {
    const config = this.getConfig(visaType);
    return config?.documents || null;
  }

  /**
   * 등록된 모든 비자 타입 반환
   * @returns {Array} 비자 타입 목록
   */
  getAllTypes() {
    return Array.from(this.types.keys());
  }

  /**
   * 카테고리별 비자 타입 반환
   * @param {string} category - 카테고리 (WORK, STUDY, FAMILY 등)
   * @returns {Array} 해당 카테고리의 비자 타입 목록
   */
  getTypesByCategory(category) {
    return this.categories.get(category.toUpperCase()) || [];
  }

  /**
   * 비자 변경 가능성 확인
   * @param {string} fromVisa - 현재 비자
   * @param {string} toVisa - 변경할 비자
   * @returns {Object} 변경 가능성 정보
   */
  checkChangeability(fromVisa, toVisa) {
    const fromConfig = this.getConfig(fromVisa);
    const toConfig = this.getConfig(toVisa);
    
    if (!fromConfig || !toConfig) {
      return {
        possible: false,
        reason: '등록되지 않은 비자 타입'
      };
    }

    // 변경 규칙 확인
    const changeRules = toConfig.changeabilityRules || {};
    const allowedFrom = changeRules.allowedFrom || [];
    const restrictedFrom = changeRules.restrictedFrom || [];
    
    // 제한된 비자에서의 변경인지 확인
    if (restrictedFrom.includes(fromVisa)) {
      return {
        possible: false,
        reason: '제한된 비자 변경 경로'
      };
    }
    
    // 허용된 비자에서의 변경인지 확인
    if (allowedFrom.length > 0 && !allowedFrom.includes(fromVisa)) {
      return {
        possible: false,
        reason: '허용되지 않은 비자 변경 경로'
      };
    }
    
    return {
      possible: true,
      requirements: changeRules.requirements || [],
      processingTime: changeRules.processingTime || '표준'
    };
  }

  /**
   * 비자 타입별 통계 반환
   * @returns {Object} 등록 통계
   */
  getStats() {
    const categoryStats = {};
    
    for (const [category, types] of this.categories.entries()) {
      categoryStats[category] = types.length;
    }
    
    return {
      totalTypes: this.types.size,
      categories: categoryStats,
      lastUpdated: new Date()
    };
  }

  // Private methods

  /**
   * 설정 검증
   */
  _validateConfig(visaType, config) {
    const errors = [];
    
    // 스키마 검증
    for (const [field, rules] of Object.entries(VISA_TYPE_SCHEMA)) {
      if (rules.required && !(field in config)) {
        errors.push(`필수 필드 누락: ${field}`);
        continue;
      }
      
      if (field in config) {
        const value = config[field];
        const expectedType = rules.type;
        
        if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
          errors.push(`잘못된 타입: ${field} (예상: ${expectedType})`);
        } else if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`잘못된 타입: ${field} (예상: ${expectedType})`);
        } else if (expectedType === 'function' && typeof value !== 'function') {
          errors.push(`잘못된 타입: ${field} (예상: ${expectedType})`);
        }
      }
    }
    
    // 비즈니스 로직 검증
    if (config.weights) {
      const totalWeight = Object.values(config.weights).reduce((sum, w) => sum + w, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errors.push(`가중치 합계가 1.0이 아닙니다: ${totalWeight}`);
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(
        `비자 타입 설정 검증 실패: ${visaType}`,
        { errors }
      );
    }
  }

  /**
   * 비자 코드 정규화
   */
  _normalizeVisaCode(visaType) {
    return visaType.toUpperCase().trim();
  }

  /**
   * 비자 타입 카테고리 분류
   */
  _categorizeVisa(visaCode, category) {
    const upperCategory = category.toUpperCase();
    
    if (!this.categories.has(upperCategory)) {
      this.categories.set(upperCategory, []);
    }
    
    const categoryList = this.categories.get(upperCategory);
    if (!categoryList.includes(visaCode)) {
      categoryList.push(visaCode);
    }
  }

  /**
   * 설정 파일 찾기
   */
  async _findConfigFiles() {
    try {
      const files = await fs.readdir(this.baseConfigPath);
      return files
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(this.baseConfigPath, file));
    } catch (error) {
      this.logger.warn('설정 디렉터리를 찾을 수 없음:', this.baseConfigPath);
      return [];
    }
  }

  /**
   * 설정 파일 로드
   */
  async _loadConfigFile(filePath) {
    try {
      const config = require(filePath);
      
      // 설정이 함수인 경우 실행
      const visaConfig = typeof config === 'function' ? config() : config;
      
      if (visaConfig && visaConfig.code) {
        this.register(visaConfig.code, visaConfig);
      } else {
        this.logger.warn(`잘못된 설정 파일: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`설정 파일 로드 실패: ${filePath}`, error);
    }
  }
}

/**
 * 글로벌 레지스트리 인스턴스
 */
let globalRegistry = null;

/**
 * 글로벌 레지스트리 반환
 */
function getGlobalRegistry() {
  if (!globalRegistry) {
    globalRegistry = new VisaTypeRegistry();
  }
  return globalRegistry;
}

/**
 * 레지스트리 초기화
 */
function initializeRegistry(options = {}) {
  globalRegistry = new VisaTypeRegistry(options);
  return globalRegistry;
}

module.exports = {
  VisaTypeRegistry,
  getGlobalRegistry,
  initializeRegistry,
  VISA_TYPE_SCHEMA
}; 