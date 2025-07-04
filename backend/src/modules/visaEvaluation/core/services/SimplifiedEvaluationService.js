/**
 * 단순화된 비자 평가 서비스 (v5.0)
 * 팩토리 패턴과 중앙화된 설정을 사용한 간소화된 버전
 * 경로: /backend/src/modules/visaEvaluation/core/services/SimplifiedEvaluationService.js
 */

const { getEvaluatorFactory } = require('../evaluators/EvaluatorFactory');
const { isValidVisaType, getVisaTypeInfo } = require('../../config/centralVisaConfig');
const { normalizeVisaCode, formatVisaTypeForDisplay } = require('../../../../utils/visaType');
const logger = require('../../../../utils/logger');
const cacheManager = require('../../../../utils/cacheManager');

/**
 * 단순화된 평가 서비스 클래스
 * 기존의 복잡한 로직을 팩토리 패턴으로 단순화
 */
class SimplifiedEvaluationService {
  constructor(options = {}) {
    this.evaluatorFactory = getEvaluatorFactory({
      logger: options.logger || logger,
      enableCaching: options.enableCaching !== false
    });
    
    this.useCache = options.useCache !== false;
    this.logger = options.logger || logger;
    
    // 간단한 통계
    this.stats = {
      totalEvaluations: 0,
      cacheHits: 0,
      errors: 0
    };

    this.logger.info('단순화된 평가 서비스 초기화 완료');
  }

  /**
   * 메인 평가 함수 - 대폭 단순화됨
   * @param {string} visaType - 비자 타입
   * @param {Object} applicantData - 신청자 데이터
   * @param {Object} options - 평가 옵션
   * @returns {Object} 평가 결과
   */
  async evaluate(visaType, applicantData, options = {}) {
    const evaluationId = options.evaluationId || `eval_${Date.now()}`;
    const startTime = Date.now();

    try {
      this.logger.info(`평가 시작: ${visaType} (ID: ${evaluationId})`);
      this.stats.totalEvaluations++;

      // 1. 입력 검증
      this._validateInput(visaType, applicantData);

      // 2. 비자 코드 정규화
      const normalizedVisaType = this._normalizeVisaType(visaType);

      // 3. 캐시 확인
      if (this.useCache && !options.forceEvaluation) {
        const cachedResult = this._checkCache(normalizedVisaType, applicantData, options);
        if (cachedResult) {
          this.stats.cacheHits++;
          this.logger.info(`캐시 히트: ${normalizedVisaType}`);
          return {
            ...cachedResult,
            evaluationId,
            _fromCache: true
          };
        }
      }

      // 4. 평가기 생성 (팩토리 패턴)
      const evaluator = this.evaluatorFactory.create(normalizedVisaType, {
        applicationType: options.applicationType || 'NEW',
        evaluationMode: options.evaluationMode || 'STANDARD'
      });

      // 5. 평가 실행
      const result = await evaluator.evaluate(applicantData, {
        ...options,
        evaluationId,
        visaType: normalizedVisaType
      });

      // 6. 결과 후처리
      const finalResult = this._postprocessResult(result, normalizedVisaType, evaluationId, startTime);

      // 7. 캐시 저장
      if (this.useCache && finalResult.success) {
        this._saveToCache(normalizedVisaType, applicantData, options, finalResult);
      }

      this.logger.info(`평가 완료: ${normalizedVisaType}`, {
        evaluationId,
        score: finalResult.totalScore,
        processingTime: `${Date.now() - startTime}ms`
      });

      return finalResult;

    } catch (error) {
      this.stats.errors++;
      this.logger.error('평가 실패:', {
        visaType,
        evaluationId,
        error: error.message
      });

      return {
        success: false,
        evaluationId,
        visaType: normalizedVisaType || visaType,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 배치 평가 - 여러 케이스를 한번에 처리
   */
  async evaluateBatch(requests, options = {}) {
    const batchId = `batch_${Date.now()}`;
    const results = [];
    const maxConcurrency = options.maxConcurrency || 5;

    this.logger.info(`배치 평가 시작: ${requests.length}개 요청 (ID: ${batchId})`);

    // 동시성 제어를 위한 배치 처리
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        const requestId = `${batchId}_${i + index}`;
        
        try {
          return await this.evaluate(request.visaType, request.applicantData, {
            ...request.options,
            evaluationId: requestId,
            batchId
          });
        } catch (error) {
          return {
            success: false,
            evaluationId: requestId,
            batchId,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    this.logger.info(`배치 평가 완료: ${batchId}`);

    return {
      batchId,
      total: requests.length,
      results,
      summary: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        cached: results.filter(r => r._fromCache).length
      }
    };
  }

  /**
   * 입력 검증 - 단순화됨
   */
  _validateInput(visaType, applicantData) {
    if (!visaType) {
      throw new Error('비자 타입이 필요합니다.');
    }

    if (!applicantData || typeof applicantData !== 'object') {
      throw new Error('신청자 데이터가 필요합니다.');
    }

    const normalizedType = this._normalizeVisaType(visaType);
    if (!isValidVisaType(normalizedType)) {
      throw new Error(`지원되지 않는 비자 타입: ${visaType}`);
    }
  }

  /**
   * 비자 타입 정규화
   */
  _normalizeVisaType(visaType) {
    return formatVisaTypeForDisplay(normalizeVisaCode(visaType));
  }

  /**
   * 캐시 확인
   */
  _checkCache(visaType, applicantData, options) {
    if (!this.useCache) return null;

    const cacheKey = cacheManager.generateEvaluationKey(visaType, applicantData, {
      ...options,
      serviceVersion: '5.0'
    });

    return cacheManager.getEvaluationResult(cacheKey);
  }

  /**
   * 캐시 저장
   */
  _saveToCache(visaType, applicantData, options, result) {
    if (!this.useCache) return;

    const cacheKey = cacheManager.generateEvaluationKey(visaType, applicantData, {
      ...options,
      serviceVersion: '5.0'
    });

    cacheManager.setEvaluationResult(cacheKey, result);
  }

  /**
   * 결과 후처리
   */
  _postprocessResult(result, visaType, evaluationId, startTime) {
    const processingTime = Date.now() - startTime;
    const visaInfo = getVisaTypeInfo(visaType);

    return {
      ...result,
      evaluationId,
      visaType,
      visaName: visaInfo?.name || visaType,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      serviceVersion: '5.0',
      
      // 메타데이터
      metadata: {
        ...result.metadata,
        complexity: visaInfo?.complexity || 'UNKNOWN',
        hasSpecializedEvaluator: visaInfo?.hasSpecializedEvaluator || false,
        supportedFeatures: visaInfo?.supportedFeatures || {}
      }
    };
  }

  /**
   * 지원되는 비자 타입 반환
   */
  getSupportedVisaTypes() {
    const { getSupportedVisaTypes } = require('../../config/centralVisaConfig');
    return getSupportedVisaTypes();
  }

  /**
   * 비자 타입 정보 반환
   */
  getVisaTypeInfo(visaType) {
    const normalizedType = this._normalizeVisaType(visaType);
    return getVisaTypeInfo(normalizedType);
  }

  /**
   * 서비스 통계
   */
  getStats() {
    const factoryStats = this.evaluatorFactory.getCacheStats();
    
    return {
      service: {
        ...this.stats,
        hitRate: this.stats.totalEvaluations > 0 
          ? (this.stats.cacheHits / this.stats.totalEvaluations * 100).toFixed(2) + '%'
          : '0%'
      },
      factory: factoryStats,
      cache: {
        enabled: this.useCache
      }
    };
  }

  /**
   * 헬스 체크
   */
  async healthCheck() {
    try {
      // 팩토리 헬스 체크
      const factoryHealth = this.evaluatorFactory.healthCheck();
      
      // E-1 평가 테스트
      const testResult = await this.evaluate('E-1', {
        education: { degree: 'MASTERS', field: 'Computer Science' },
        experience: { years: 5 },
        institution: { type: 'UNIVERSITY', name: 'Test University' }
      }, { 
        evaluationId: 'health_check',
        skipCache: true 
      });

      return {
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        service: {
          stats: this.stats,
          e1TestPassed: testResult.success
        },
        factory: factoryHealth,
        overallHealth: testResult.success && factoryHealth.status === 'HEALTHY' ? 'HEALTHY' : 'DEGRADED'
      };

    } catch (error) {
      return {
        status: 'UNHEALTHY',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 캐시 정리
   */
  clearCache() {
    this.evaluatorFactory.clearCache();
    this.logger.info('서비스 캐시 정리 완료');
  }

  /**
   * 서비스 재시작
   */
  restart(options = {}) {
    this.clearCache();
    this.stats = {
      totalEvaluations: 0,
      cacheHits: 0,
      errors: 0
    };
    
    // 팩토리 재초기화
    this.evaluatorFactory = getEvaluatorFactory({
      ...options,
      forceNew: true
    });

    this.logger.info('단순화된 평가 서비스 재시작 완료');
  }
}

/**
 * 싱글톤 인스턴스
 */
let _serviceInstance = null;

/**
 * 싱글톤 서비스 인스턴스 반환
 */
const getSimplifiedEvaluationService = (options = {}) => {
  if (!_serviceInstance || options.forceNew) {
    _serviceInstance = new SimplifiedEvaluationService(options);
  }
  return _serviceInstance;
};

/**
 * 편의 함수: 빠른 평가
 */
const quickEvaluate = async (visaType, applicantData, options = {}) => {
  const service = getSimplifiedEvaluationService();
  return await service.evaluate(visaType, applicantData, options);
};

module.exports = {
  SimplifiedEvaluationService,
  getSimplifiedEvaluationService,
  quickEvaluate
}; 