/**
 * 캐시 매니저
 * 경로: /backend/src/utils/cacheManager.js
 */

const NodeCache = require('node-cache');
const logger = require('./logger');

/**
 * 캐시 매니저 클래스
 * 비자 평가 결과, 문서 검증 결과 등을 효율적으로 캐싱
 */
class CacheManager {
  constructor() {
    // 기본 캐시 (10분 TTL)
    this.mainCache = new NodeCache({ 
      stdTTL: 600,
      checkperiod: 120,
      useClones: false
    });
    
    // 평가 결과 캐시 (30분 TTL)
    this.evaluationCache = new NodeCache({
      stdTTL: 1800,
      checkperiod: 300,
      useClones: false
    });
    
    // 문서 검증 캐시 (1시간 TTL)
    this.documentCache = new NodeCache({
      stdTTL: 3600,
      checkperiod: 600,
      useClones: false
    });
    
    // 사용자 세션 캐시 (2시간 TTL)
    this.sessionCache = new NodeCache({
      stdTTL: 7200,
      checkperiod: 900,
      useClones: false
    });
    
    // 규칙 엔진 캐시 (무제한, 수동 관리)
    this.rulesCache = new NodeCache({
      stdTTL: 0,
      checkperiod: 0,
      useClones: false
    });
    
    // 캐시 히트/미스 통계
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    this._setupEventListeners();
    
    logger.info('CacheManager 초기화 완료');
  }
  
  /**
   * 기본 캐시 작업
   */
  get(key) {
    try {
      const value = this.mainCache.get(key);
      if (value !== undefined) {
        this.stats.hits++;
        logger.debug(`캐시 히트: ${key}`);
        return value;
      } else {
        this.stats.misses++;
        logger.debug(`캐시 미스: ${key}`);
        return undefined;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(`캐시 조회 오류 (${key}):`, error);
      return undefined;
    }
  }
  
  set(key, value, ttl) {
    try {
      const success = this.mainCache.set(key, value, ttl);
      if (success) {
        this.stats.sets++;
        logger.debug(`캐시 저장: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
      }
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error(`캐시 저장 오류 (${key}):`, error);
      return false;
    }
  }
  
  del(key) {
    try {
      const deleted = this.mainCache.del(key);
      if (deleted > 0) {
        this.stats.deletes++;
        logger.debug(`캐시 삭제: ${key}`);
      }
      return deleted;
    } catch (error) {
      this.stats.errors++;
      logger.error(`캐시 삭제 오류 (${key}):`, error);
      return 0;
    }
  }
  
  /**
   * 평가 결과 캐시 작업
   */
  getEvaluationResult(evaluationKey) {
    try {
      const result = this.evaluationCache.get(evaluationKey);
      if (result) {
        this.stats.hits++;
        logger.debug(`평가 결과 캐시 히트: ${evaluationKey}`);
        // 캐시된 시간 정보 추가
        result._cached = true;
        result._cachedAt = result._cachedAt || new Date();
        return result;
      } else {
        this.stats.misses++;
        logger.debug(`평가 결과 캐시 미스: ${evaluationKey}`);
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(`평가 결과 캐시 조회 오류 (${evaluationKey}):`, error);
      return null;
    }
  }
  
  setEvaluationResult(evaluationKey, result, ttl = null) {
    try {
      // 캐시 메타데이터 추가
      const cacheData = {
        ...result,
        _cached: true,
        _cachedAt: new Date(),
        _originalScore: result.totalScore
      };
      
      const success = this.evaluationCache.set(evaluationKey, cacheData, ttl);
      if (success) {
        this.stats.sets++;
        logger.debug(`평가 결과 캐시 저장: ${evaluationKey}`);
      }
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error(`평가 결과 캐시 저장 오류 (${evaluationKey}):`, error);
      return false;
    }
  }
  
  /**
   * 문서 검증 캐시 작업
   */
  getDocumentValidation(documentKey) {
    try {
      const result = this.documentCache.get(documentKey);
      if (result) {
        this.stats.hits++;
        logger.debug(`문서 검증 캐시 히트: ${documentKey}`);
        return result;
      } else {
        this.stats.misses++;
        logger.debug(`문서 검증 캐시 미스: ${documentKey}`);
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(`문서 검증 캐시 조회 오류 (${documentKey}):`, error);
      return null;
    }
  }
  
  setDocumentValidation(documentKey, validationResult, ttl = null) {
    try {
      const cacheData = {
        ...validationResult,
        _validatedAt: new Date(),
        _cacheKey: documentKey
      };
      
      const success = this.documentCache.set(documentKey, cacheData, ttl);
      if (success) {
        this.stats.sets++;
        logger.debug(`문서 검증 캐시 저장: ${documentKey}`);
      }
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error(`문서 검증 캐시 저장 오류 (${documentKey}):`, error);
      return false;
    }
  }
  
  /**
   * 사용자 세션 캐시 작업
   */
  getUserSession(userId) {
    try {
      const session = this.sessionCache.get(`user:${userId}`);
      if (session) {
        this.stats.hits++;
        logger.debug(`사용자 세션 캐시 히트: ${userId}`);
        return session;
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(`사용자 세션 캐시 조회 오류 (${userId}):`, error);
      return null;
    }
  }
  
  setUserSession(userId, sessionData, ttl = null) {
    try {
      const cacheData = {
        ...sessionData,
        _lastAccessed: new Date(),
        _userId: userId
      };
      
      const success = this.sessionCache.set(`user:${userId}`, cacheData, ttl);
      if (success) {
        this.stats.sets++;
        logger.debug(`사용자 세션 캐시 저장: ${userId}`);
      }
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error(`사용자 세션 캐시 저장 오류 (${userId}):`, error);
      return false;
    }
  }
  
  /**
   * 규칙 엔진 캐시 작업
   */
  getRules(ruleSetId) {
    try {
      const rules = this.rulesCache.get(`rules:${ruleSetId}`);
      if (rules) {
        this.stats.hits++;
        logger.debug(`규칙 캐시 히트: ${ruleSetId}`);
        return rules;
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(`규칙 캐시 조회 오류 (${ruleSetId}):`, error);
      return null;
    }
  }
  
  setRules(ruleSetId, rules) {
    try {
      const cacheData = {
        rules,
        _rulesCount: rules.size || Object.keys(rules).length,
        _updatedAt: new Date()
      };
      
      const success = this.rulesCache.set(`rules:${ruleSetId}`, cacheData);
      if (success) {
        this.stats.sets++;
        logger.debug(`규칙 캐시 저장: ${ruleSetId} (${cacheData._rulesCount}개 규칙)`);
      }
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error(`규칙 캐시 저장 오류 (${ruleSetId}):`, error);
      return false;
    }
  }
  
  /**
   * 캐시 키 생성 유틸리티
   */
  generateEvaluationKey(visaType, applicantData, options = {}) {
    try {
      // 중요한 데이터만 추출하여 키 생성
      const keyData = {
        visaType,
        nationality: applicantData.evaluation?.nationality,
        educationLevel: applicantData.evaluation?.educationLevel,
        experienceYears: applicantData.evaluation?.experienceYears,
        applicationType: options.applicationType,
        version: options.version || '1.0'
      };
      
      // 해시 생성 (간단한 JSON 기반)
      const keyString = JSON.stringify(keyData);
      const hash = Buffer.from(keyString).toString('base64').substring(0, 32);
      
      return `eval:${visaType}:${hash}`;
    } catch (error) {
      logger.error('평가 키 생성 오류:', error);
      return `eval:${visaType}:${Date.now()}`;
    }
  }
  
  generateDocumentKey(documentType, fileHash, applicantId) {
    try {
      return `doc:${documentType}:${applicantId}:${fileHash}`;
    } catch (error) {
      logger.error('문서 키 생성 오류:', error);
      return `doc:${documentType}:${Date.now()}`;
    }
  }
  
  /**
   * 패턴 기반 삭제
   */
  deleteByPattern(pattern) {
    let deletedCount = 0;
    
    try {
      // 모든 캐시에서 패턴 매칭 키 삭제
      const caches = [
        { cache: this.mainCache, name: 'main' },
        { cache: this.evaluationCache, name: 'evaluation' },
        { cache: this.documentCache, name: 'document' },
        { cache: this.sessionCache, name: 'session' },
        { cache: this.rulesCache, name: 'rules' }
      ];
      
      for (const { cache, name } of caches) {
        const keys = cache.keys();
        const matchingKeys = keys.filter(key => {
          if (typeof pattern === 'string') {
            return key.includes(pattern);
          } else if (pattern instanceof RegExp) {
            return pattern.test(key);
          }
          return false;
        });
        
        for (const key of matchingKeys) {
          cache.del(key);
          deletedCount++;
        }
        
        if (matchingKeys.length > 0) {
          logger.debug(`${name} 캐시에서 ${matchingKeys.length}개 키 삭제 (패턴: ${pattern})`);
        }
      }
      
      this.stats.deletes += deletedCount;
      logger.info(`패턴 기반 캐시 삭제 완료: ${deletedCount}개 키`);
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`패턴 기반 캐시 삭제 오류 (${pattern}):`, error);
    }
    
    return deletedCount;
  }
  
  /**
   * 캐시 통계 조회
   */
  getStatistics() {
    const stats = {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      caches: {
        main: {
          keys: this.mainCache.keys().length,
          size: this.mainCache.getStats()
        },
        evaluation: {
          keys: this.evaluationCache.keys().length,
          size: this.evaluationCache.getStats()
        },
        document: {
          keys: this.documentCache.keys().length,
          size: this.documentCache.getStats()
        },
        session: {
          keys: this.sessionCache.keys().length,
          size: this.sessionCache.getStats()
        },
        rules: {
          keys: this.rulesCache.keys().length,
          size: this.rulesCache.getStats()
        }
      }
    };
    
    return stats;
  }
  
  /**
   * 캐시 플러시
   */
  flush(cacheType = 'all') {
    try {
      let flushedCount = 0;
      
      switch (cacheType) {
        case 'main':
          flushedCount = this.mainCache.keys().length;
          this.mainCache.flushAll();
          break;
        case 'evaluation':
          flushedCount = this.evaluationCache.keys().length;
          this.evaluationCache.flushAll();
          break;
        case 'document':
          flushedCount = this.documentCache.keys().length;
          this.documentCache.flushAll();
          break;
        case 'session':
          flushedCount = this.sessionCache.keys().length;
          this.sessionCache.flushAll();
          break;
        case 'rules':
          flushedCount = this.rulesCache.keys().length;
          this.rulesCache.flushAll();
          break;
        case 'all':
        default:
          flushedCount = this.mainCache.keys().length +
                        this.evaluationCache.keys().length +
                        this.documentCache.keys().length +
                        this.sessionCache.keys().length +
                        this.rulesCache.keys().length;
          
          this.mainCache.flushAll();
          this.evaluationCache.flushAll();
          this.documentCache.flushAll();
          this.sessionCache.flushAll();
          this.rulesCache.flushAll();
          break;
      }
      
      logger.info(`캐시 플러시 완료 (${cacheType}): ${flushedCount}개 키 삭제`);
      return flushedCount;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`캐시 플러시 오류 (${cacheType}):`, error);
      return 0;
    }
  }
  
  /**
   * 이벤트 리스너 설정
   */
  _setupEventListeners() {
    const caches = [
      { cache: this.mainCache, name: 'main' },
      { cache: this.evaluationCache, name: 'evaluation' },
      { cache: this.documentCache, name: 'document' },
      { cache: this.sessionCache, name: 'session' },
      { cache: this.rulesCache, name: 'rules' }
    ];
    
    for (const { cache, name } of caches) {
      cache.on('expired', (key, value) => {
        logger.debug(`${name} 캐시 만료: ${key}`);
      });
      
      cache.on('del', (key, value) => {
        logger.debug(`${name} 캐시 삭제: ${key}`);
      });
      
      cache.on('error', (error) => {
        this.stats.errors++;
        logger.error(`${name} 캐시 오류:`, error);
      });
    }
  }
  
  /**
   * 캐시 상태 체크
   */
  healthCheck() {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        caches: {}
      };
      
      const caches = [
        { cache: this.mainCache, name: 'main' },
        { cache: this.evaluationCache, name: 'evaluation' },
        { cache: this.documentCache, name: 'document' },
        { cache: this.sessionCache, name: 'session' },
        { cache: this.rulesCache, name: 'rules' }
      ];
      
      for (const { cache, name } of caches) {
        const stats = cache.getStats();
        health.caches[name] = {
          keys: stats.keys,
          hits: stats.hits,
          misses: stats.misses,
          ksize: stats.ksize,
          vsize: stats.vsize
        };
      }
      
      return health;
    } catch (error) {
      logger.error('캐시 상태 체크 오류:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const cacheManager = new CacheManager();

module.exports = cacheManager; 