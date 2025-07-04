/**
 * 평가기 팩토리 - 팩토리 패턴 적용
 * 비자 타입별 최적 평가기를 동적으로 생성
 * 경로: /backend/src/modules/visaEvaluation/core/evaluators/EvaluatorFactory.js
 */

const { 
  getVisaTypeInfo, 
  isValidVisaType,
  getSpecializedEvaluatorVisaTypes 
} = require('../../config/centralVisaConfig');

/**
 * 평가기 팩토리 클래스
 * 중앙화된 설정을 기반으로 적절한 평가기를 동적 생성
 */
class EvaluatorFactory {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.cache = new Map(); // 평가기 인스턴스 캐시
    this.enableCaching = options.enableCaching !== false;
    
    // 성능 추적
    this.stats = {
      totalCreated: 0,
      cacheHits: 0,
      specialized: 0,
      fallbacks: 0
    };

    this.logger.info('평가기 팩토리 초기화 완료', {
      cachingEnabled: this.enableCaching,
      specializedEvaluators: getSpecializedEvaluatorVisaTypes().length
    });
  }

  /**
   * 메인 팩토리 메서드 - 비자 타입별 평가기 생성
   * @param {string} visaCode - 비자 코드 (E-1, E-2 등)
   * @param {object} options - 생성 옵션
   * @returns {BaseEvaluator|SpecializedEvaluator} 평가기 인스턴스
   */
  create(visaCode, options = {}) {
    try {
      // 1. 입력 검증
      if (!visaCode) {
        throw new Error('비자 코드가 필요합니다.');
      }

      const normalizedCode = this._normalizeVisaCode(visaCode);
      
      if (!isValidVisaType(normalizedCode)) {
        throw new Error(`지원되지 않는 비자 타입: ${visaCode}`);
      }

      // 2. 캐시 확인
      if (this.enableCaching && !options.forceNew) {
        const cacheKey = this._generateCacheKey(normalizedCode, options);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
          this.stats.cacheHits++;
          this.logger.debug(`평가기 캐시 히트: ${normalizedCode}`);
          return cached;
        }
      }

      // 3. 비자 정보 조회
      const visaInfo = getVisaTypeInfo(normalizedCode);
      
      // 4. 평가기 생성
      const evaluator = this._createEvaluator(normalizedCode, visaInfo, options);
      
      // 5. 캐시 저장
      if (this.enableCaching) {
        const cacheKey = this._generateCacheKey(normalizedCode, options);
        this.cache.set(cacheKey, evaluator);
      }

      // 6. 통계 업데이트
      this.stats.totalCreated++;
      if (visaInfo.hasSpecializedEvaluator) {
        this.stats.specialized++;
      } else {
        this.stats.fallbacks++;
      }

      this.logger.info(`평가기 생성 완료: ${normalizedCode}`, {
        evaluatorType: visaInfo.hasSpecializedEvaluator ? 'SPECIALIZED' : 'BASE',
        complexity: visaInfo.complexity
      });

      return evaluator;

    } catch (error) {
      this.logger.error('평가기 생성 실패:', {
        visaCode,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * 내부 평가기 생성 로직
   */
  _createEvaluator(visaCode, visaInfo, options) {
    // 특화된 평가기가 있는 경우
    if (visaInfo.hasSpecializedEvaluator) {
      try {
        return this._createSpecializedEvaluator(visaCode, visaInfo, options);
      } catch (error) {
        this.logger.warn(`특화 평가기 생성 실패, BaseEvaluator로 폴백: ${visaCode}`, {
          error: error.message
        });
        // BaseEvaluator로 폴백
      }
    }

    // BaseEvaluator 생성
    return this._createBaseEvaluator(visaCode, visaInfo, options);
  }

  /**
   * 특화된 평가기 생성
   */
  _createSpecializedEvaluator(visaCode, visaInfo, options) {
    const evaluatorName = visaInfo.evaluator;
    
    // centralVisaConfig에서 설정된 경로를 직접 사용
    const evaluatorPaths = [
      evaluatorName,                                           // config에서 설정된 경로 그대로
      `./${evaluatorName}`,                                    // 현재 디렉토리
      `../../types/${visaCode.toLowerCase()}Visa`,            // types 디렉토리 (올바른 상대경로)
      `../../../types/${visaCode.toLowerCase()}Visa`,         // 다른 상대 경로 시도
      `./specialized/${evaluatorName}`                         // 특화 디렉토리
    ];

    for (const path of evaluatorPaths) {
      try {
        const EvaluatorClass = require(path);
        
        // 클래스인지 함수인지 확인
        if (typeof EvaluatorClass === 'function') {
          return new EvaluatorClass(visaInfo, options);
        } else if (EvaluatorClass.default && typeof EvaluatorClass.default === 'function') {
          return new EvaluatorClass.default(visaInfo, options);
        } else if (typeof EvaluatorClass === 'object' && EvaluatorClass.evaluate) {
          // 함수형 평가기
          return {
            ...EvaluatorClass,
            visaInfo,
            evaluate: (data, evalOptions) => EvaluatorClass.evaluate(data, { ...evalOptions, visaInfo })
          };
        }
      } catch (error) {
        this.logger.debug(`평가기 로드 실패: ${path}`, { error: error.message });
        continue;
      }
    }

    throw new Error(`특화 평가기를 찾을 수 없습니다: ${evaluatorName}`);
  }

  /**
   * BaseEvaluator 생성
   */
  _createBaseEvaluator(visaCode, visaInfo, options) {
    const BaseEvaluator = require('./BaseEvaluator');
    
    return new BaseEvaluator(visaCode, {
      ...visaInfo,
      ...options,
      logger: this.logger
    });
  }

  /**
   * 비자 코드 정규화
   */
  _normalizeVisaCode(visaCode) {
    return visaCode.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  }

  /**
   * 캐시 키 생성
   */
  _generateCacheKey(visaCode, options) {
    const keyParts = [
      visaCode,
      options.applicationType || 'NEW',
      options.evaluationMode || 'STANDARD'
    ];
    return keyParts.join('_');
  }

  /**
   * 배치 생성 - 여러 비자 타입의 평가기를 한번에 생성
   */
  createBatch(visaCodes, options = {}) {
    const results = {};
    const errors = {};

    for (const visaCode of visaCodes) {
      try {
        results[visaCode] = this.create(visaCode, options);
      } catch (error) {
        errors[visaCode] = error.message;
        this.logger.warn(`배치 생성 중 오류: ${visaCode}`, { error: error.message });
      }
    }

    return {
      success: Object.keys(results),
      failed: Object.keys(errors),
      evaluators: results,
      errors
    };
  }

  /**
   * 지원되는 모든 비자의 평가기 생성 (성능 테스트용)
   */
  createAll(options = {}) {
    const { getSupportedVisaTypes } = require('../../config/centralVisaConfig');
    const allVisaCodes = getSupportedVisaTypes();
    
    return this.createBatch(allVisaCodes, options);
  }

  /**
   * 캐시 관리
   */
  clearCache() {
    const cacheSize = this.cache.size;
    this.cache.clear();
    this.logger.info(`평가기 캐시 정리 완료`, { clearedItems: cacheSize });
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: this.stats.totalCreated > 0 
        ? (this.stats.cacheHits / this.stats.totalCreated * 100).toFixed(2) + '%'
        : '0%',
      ...this.stats
    };
  }

  /**
   * 평가기 유효성 검증
   */
  validateEvaluator(evaluator, visaCode) {
    const requiredMethods = ['evaluate'];
    const missingMethods = requiredMethods.filter(method => 
      typeof evaluator[method] !== 'function'
    );

    if (missingMethods.length > 0) {
      throw new Error(`평가기 인터페이스 불일치: ${visaCode}, 누락된 메서드: ${missingMethods.join(', ')}`);
    }

    return true;
  }

  /**
   * 헬스 체크
   */
  healthCheck() {
    const { getSupportedVisaTypes, getSpecializedEvaluatorVisaTypes } = require('../../config/centralVisaConfig');
    
    const health = {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      factory: {
        cacheEnabled: this.enableCaching,
        cacheSize: this.cache.size,
        stats: this.stats
      },
      visaTypes: {
        total: getSupportedVisaTypes().length,
        specialized: getSpecializedEvaluatorVisaTypes().length,
        base: getSupportedVisaTypes().length - getSpecializedEvaluatorVisaTypes().length
      },
      performance: {
        hitRate: this.stats.totalCreated > 0 
          ? (this.stats.cacheHits / this.stats.totalCreated * 100).toFixed(2) + '%'
          : '0%',
        specializedRate: this.stats.totalCreated > 0
          ? (this.stats.specialized / this.stats.totalCreated * 100).toFixed(2) + '%'
          : '0%'
      }
    };

    // E-1 특화 평가기 테스트
    try {
      const e1Evaluator = this.create('E-1', { forceNew: true });
      this.validateEvaluator(e1Evaluator, 'E-1');
      health.e1SpecializedEvaluator = 'WORKING';
    } catch (error) {
      health.e1SpecializedEvaluator = 'FAILED';
      health.status = 'DEGRADED';
      health.issues = health.issues || [];
      health.issues.push(`E-1 특화 평가기 문제: ${error.message}`);
    }

    return health;
  }

  /**
   * 디버그 정보
   */
  getDebugInfo() {
    return {
      cacheContents: Array.from(this.cache.keys()),
      stats: this.stats,
      memoryUsage: process.memoryUsage(),
      factoryConfig: {
        enableCaching: this.enableCaching
      }
    };
  }
}

/**
 * 싱글톤 인스턴스 (선택적)
 */
let _factoryInstance = null;

/**
 * 싱글톤 팩토리 인스턴스 반환
 */
const getEvaluatorFactory = (options = {}) => {
  if (!_factoryInstance || options.forceNew) {
    _factoryInstance = new EvaluatorFactory(options);
  }
  return _factoryInstance;
};

/**
 * 편의 메서드: 비자 평가기 빠른 생성
 */
const createEvaluator = (visaCode, options = {}) => {
  const factory = getEvaluatorFactory();
  return factory.create(visaCode, options);
};

module.exports = {
  EvaluatorFactory,
  getEvaluatorFactory,
  createEvaluator
}; 