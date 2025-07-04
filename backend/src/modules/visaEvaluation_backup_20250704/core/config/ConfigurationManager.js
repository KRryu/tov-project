/**
 * 설정 중앙화 관리자
 * 모든 비자 타입 설정을 통합 관리하고 동적 로딩 지원
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const { ValidationError, ConfigurationError } = require('../../../../utils/errors');
const { globalMemoryManager } = require('../../../../utils/memoryManager');
const logger = require('../../../../utils/logger');

/**
 * 설정 스키마 정의
 */
const CONFIG_SCHEMA = {
  basic: {
    code: { type: 'string', required: true },
    name: { type: 'string', required: true },
    category: { type: 'string', required: true },
    version: { type: 'string', required: false }
  },
  weights: { type: 'object', required: true },
  thresholds: { type: 'object', required: true },
  documents: { type: 'object', required: false },
  eligibilityRules: { type: 'object', required: false },
  changeabilityRules: { type: 'object', required: false }
};

/**
 * 동적 모듈 로더
 */
class DynamicModuleLoader {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(__dirname, '../../');
    this.cache = globalMemoryManager.registerCache('moduleLoader', 100, 3600000);
    this.logger = options.logger || logger;
    this.loadStats = {
      totalLoads: 0,
      cacheHits: 0,
      loadErrors: 0
    };
  }

  /**
   * 모듈 동적 로딩
   */
  async loadModule(modulePath, options = {}) {
    try {
      // 캐시 확인
      if (!options.forceReload) {
        const cached = this.cache.get(modulePath);
        if (cached) {
          this.loadStats.cacheHits++;
          return cached;
        }
      }

      const fullPath = path.resolve(this.baseDir, modulePath);
      
      // 파일 존재 확인
      try {
        await fs.access(fullPath);
      } catch (error) {
        throw new ConfigurationError(
          `모듈 파일을 찾을 수 없습니다: ${fullPath}`,
          'MODULE_NOT_FOUND'
        );
      }

      // 모듈 로딩
      const module = require(fullPath);
      const loadedModule = typeof module === 'function' ? module() : module;

      // 캐시에 저장
      this.cache.set(modulePath, loadedModule);
      this.loadStats.totalLoads++;

      this.logger.debug(`모듈 로딩 완료: ${modulePath}`);
      return loadedModule;

    } catch (error) {
      this.loadStats.loadErrors++;
      if (error instanceof ConfigurationError) {
        throw error;
      }
      
      throw new ConfigurationError(
        `모듈 로딩 중 오류: ${error.message}`,
        'MODULE_LOAD_ERROR'
      );
    }
  }

  /**
   * 비자 평가 함수 로딩
   */
  async loadVisaEvaluator(visaType) {
    const evaluatorPath = `types/${visaType.toLowerCase()}Visa.js`;
    
    try {
      const module = await this.loadModule(evaluatorPath);
      const functionName = `evaluate${visaType.replace('-', '')}Visa`;
      
      if (module[functionName] && typeof module[functionName] === 'function') {
        return module[functionName];
      }
      
      return null;
      
    } catch (error) {
      if (error.details?.code === 'MODULE_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  getStats() {
    return {
      ...this.loadStats,
      cacheStats: this.cache.getStats()
    };
  }
}

/**
 * 설정 중앙화 관리자
 */
class ConfigurationManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.moduleLoader = new DynamicModuleLoader(options);
    this.logger = options.logger || logger;
    
    // 설정 캐시
    this.configCache = globalMemoryManager.registerCache('configurations', 200, 7200000); // 2시간
    
    // 설정 디렉터리
    this.configDirs = {
      visaTypes: options.visaTypesDir || path.join(__dirname, '../visaTypes'),
      rules: options.rulesDir || path.join(__dirname, '../rules')
    };
    
    // 통계
    this.stats = {
      configsLoaded: 0,
      cacheHits: 0,
      validationErrors: 0,
      lastUpdate: null
    };

    this.logger.info('ConfigurationManager 초기화 완료', {
      environment: this.environment
    });
  }

  /**
   * 비자 타입 설정 조회
   */
  async getConfig(visaType, section = null, options = {}) {
    const cacheKey = `${visaType}_${section || 'all'}`;
    
    try {
      // 캐시 확인
      if (!options.forceReload) {
        const cached = this.configCache.get(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          return section ? cached[section] : cached;
        }
      }

      // 설정 파일 로드
      const configPath = `config/visaTypes/${visaType}.js`;
      let config;
      
      try {
        config = await this.moduleLoader.loadModule(configPath, { forceReload: options.forceReload });
      } catch (error) {
        if (error.details?.code === 'MODULE_NOT_FOUND') {
          // 기본 설정 생성
          config = this._getDefaultConfig(visaType);
          this.logger.warn(`설정 파일 없음, 기본 설정 사용: ${visaType}`);
        } else {
          throw error;
        }
      }

      // 설정 검증
      this._validateConfiguration(config, visaType);

      // 환경별 설정 적용
      const processedConfig = this._processEnvironmentConfig(config);

      // 캐시에 저장
      this.configCache.set(cacheKey, processedConfig);
      this.stats.configsLoaded++;
      this.stats.lastUpdate = new Date();

      this.logger.debug(`설정 로드 완료: ${visaType}`, { section, cached: false });

      return section ? processedConfig[section] : processedConfig;

    } catch (error) {
      this.logger.error(`설정 로드 실패: ${visaType}`, error);
      
      if (error instanceof ValidationError || error instanceof ConfigurationError) {
        this.stats.validationErrors++;
        throw error;
      }
      
      throw new ConfigurationError(
        `설정 로드 중 오류: ${error.message}`,
        'CONFIG_LOAD_ERROR',
        { visaType, section }
      );
    }
  }

  /**
   * 다중 비자 타입 설정 조회
   */
  async getMultipleConfigs(visaTypes, section = null) {
    const results = {};
    
    const loadPromises = visaTypes.map(async (visaType) => {
      try {
        const config = await this.getConfig(visaType, section);
        results[visaType] = config;
      } catch (error) {
        this.logger.warn(`설정 로드 실패: ${visaType}`, error);
        results[visaType] = null;
      }
    });

    await Promise.all(loadPromises);
    return results;
  }

  /**
   * 평가 함수 조회
   */
  async getEvaluator(visaType) {
    const cacheKey = `evaluator_${visaType}`;
    
    // 캐시 확인
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 평가 함수 로드
    const evaluator = await this.moduleLoader.loadVisaEvaluator(visaType);
    
    // 캐시에 저장
    this.configCache.set(cacheKey, evaluator);
    
    return evaluator;
  }

  /**
   * 가중치 조회
   */
  async getWeights(visaType) {
    const config = await this.getConfig(visaType, 'weights');
    return config;
  }

  /**
   * 임계값 조회
   */
  async getThresholds(visaType) {
    const config = await this.getConfig(visaType, 'thresholds');
    return config;
  }

  /**
   * 문서 요구사항 조회
   */
  async getDocumentRequirements(visaType) {
    const config = await this.getConfig(visaType, 'documents');
    return config;
  }

  /**
   * 비자 변경 가능성 확인
   */
  async checkChangeability(fromVisa, toVisa) {
    const toConfig = await this.getConfig(toVisa, 'changeabilityRules');
    
    if (!toConfig) {
      return { possible: false, reason: '변경 규칙이 정의되지 않았습니다.' };
    }

    const allowedFrom = toConfig.allowedFrom || [];
    const restrictedFrom = toConfig.restrictedFrom || [];
    
    if (restrictedFrom.includes(fromVisa)) {
      return { possible: false, reason: '제한된 비자 변경 경로입니다.' };
    }
    
    if (allowedFrom.length > 0 && !allowedFrom.includes(fromVisa)) {
      return { possible: false, reason: '허용되지 않은 비자 변경 경로입니다.' };
    }
    
    return {
      possible: true,
      requirements: toConfig.requirements?.[fromVisa] || [],
      processingTime: toConfig.processingTime?.standard || '15-30 영업일'
    };
  }

  /**
   * 사용 가능한 비자 타입 목록 조회
   */
  async getAvailableVisaTypes() {
    try {
      const files = await fs.readdir(this.configDirs.visaTypes);
      const visaTypes = files
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''));

      return visaTypes;
    } catch (error) {
      this.logger.warn('비자 타입 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 기본 설정 생성
   */
  _getDefaultConfig(visaType) {
    return {
      code: visaType,
      name: `${visaType} 비자`,
      category: 'WORK',
      version: '1.0',
      
      weights: {
        education: 0.25,
        experience: 0.20,
        language: 0.15,
        research: 0.20,
        recommendation: 0.10,
        institution: 0.10
      },
      
      thresholds: {
        pass: 70,
        borderline: 60,
        low: 40,
        excellent: 85
      },
      
      documents: {
        common: ['passport', 'passport_photo', 'application_form'],
        NEW: { required: [], optional: [] },
        EXTENSION: { required: [], optional: [] },
        CHANGE: { required: [], optional: [] }
      },
      
      eligibilityRules: {
        basic: { minimumAge: 18, nationality: 'ANY' },
        special: {},
        exclusions: []
      },
      
      changeabilityRules: {
        allowedFrom: [],
        restrictedFrom: [],
        requirements: {},
        processingTime: { standard: '15-30 영업일' }
      },
      
      metadata: {
        createdAt: new Date(),
        author: 'ConfigurationManager',
        description: `${visaType} 비자 기본 설정`,
        isDefault: true
      }
    };
  }

  /**
   * 설정 검증
   */
  _validateConfiguration(config, visaType) {
    const errors = [];

    // 필수 필드 검증
    if (!config.code) errors.push('비자 코드 누락');
    if (!config.name) errors.push('비자 이름 누락');
    if (!config.weights || typeof config.weights !== 'object') {
      errors.push('가중치 설정 누락 또는 잘못된 형식');
    }
    if (!config.thresholds || typeof config.thresholds !== 'object') {
      errors.push('임계값 설정 누락 또는 잘못된 형식');
    }

    // 가중치 합계 검증
    if (config.weights) {
      const totalWeight = Object.values(config.weights)
        .reduce((sum, weight) => sum + (weight || 0), 0);
      
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errors.push(`가중치 합계가 1.0이 아닙니다: ${totalWeight}`);
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(
        `설정 검증 실패: ${visaType}`,
        { errors, visaType }
      );
    }
  }

  /**
   * 환경별 설정 처리
   */
  _processEnvironmentConfig(config) {
    const processed = { ...config };
    
    // 개발 환경에서 더 관대한 임계값 적용
    if (this.environment === 'development') {
      if (processed.thresholds) {
        processed.thresholds = {
          ...processed.thresholds,
          pass: Math.max(60, processed.thresholds.pass - 10),
          borderline: Math.max(50, processed.thresholds.borderline - 10)
        };
      }
    }
    
    return processed;
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(visaType = null) {
    if (visaType) {
      // 특정 비자 타입 캐시만 무효화
      const keysToDelete = [];
      for (const [key] of this.configCache.cache.entries()) {
        if (key.startsWith(`${visaType}_`) || key === `evaluator_${visaType}`) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.configCache.delete(key));
      this.logger.debug(`캐시 무효화: ${visaType}`, { deletedKeys: keysToDelete.length });
    } else {
      // 전체 캐시 무효화
      this.configCache.clear();
      this.logger.debug('전체 캐시 무효화');
    }
  }

  /**
   * 통계 조회
   */
  getStats() {
    return {
      manager: this.stats,
      moduleLoader: this.moduleLoader.getStats(),
      cache: this.configCache.getStats(),
      environment: this.environment
    };
  }

  /**
   * 종료 시 정리
   */
  async shutdown() {
    this.removeAllListeners();
    this.configCache.clear();
    this.logger.info('ConfigurationManager 종료');
  }
}

// 싱글톤 인스턴스
let globalConfigManager = null;

/**
 * 글로벌 설정 관리자 조회
 */
function getGlobalConfigManager(options = {}) {
  if (!globalConfigManager) {
    globalConfigManager = new ConfigurationManager(options);
  }
  return globalConfigManager;
}

/**
 * 설정 관리자 초기화
 */
function initializeConfigManager(options = {}) {
  if (globalConfigManager) {
    globalConfigManager.shutdown();
  }
  globalConfigManager = new ConfigurationManager(options);
  return globalConfigManager;
}

module.exports = {
  ConfigurationManager,
  DynamicModuleLoader,
  getGlobalConfigManager,
  initializeConfigManager,
  CONFIG_SCHEMA
}; 