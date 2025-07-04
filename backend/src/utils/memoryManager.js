/**
 * 메모리 관리 시스템
 * 순환 버퍼, 자동 정리, 메모리 모니터링 기능 제공
 */

const logger = require('./logger');

/**
 * 순환 버퍼 - 고정 크기 버퍼로 메모리 사용량 제한
 */
class CircularBuffer {
  constructor(maxSize = 1000, name = 'CircularBuffer') {
    this.buffer = [];
    this.maxSize = maxSize;
    this.name = name;
    this.totalAdded = 0;
    this.totalEvicted = 0;
  }

  /**
   * 항목 추가
   */
  add(item) {
    if (this.buffer.length >= this.maxSize) {
      const evicted = this.buffer.shift();
      this.totalEvicted++;
      
      // 이벤트 리스너가 있다면 정리 이벤트 발생
      if (this.onEvict) {
        this.onEvict(evicted);
      }
    }
    
    this.buffer.push({
      ...item,
      addedAt: new Date(),
      id: this.totalAdded
    });
    
    this.totalAdded++;
  }

  /**
   * 조건에 맞는 항목들 제거
   */
  removeWhere(predicate) {
    const initialLength = this.buffer.length;
    this.buffer = this.buffer.filter(item => !predicate(item));
    const removedCount = initialLength - this.buffer.length;
    this.totalEvicted += removedCount;
    return removedCount;
  }

  /**
   * 만료된 항목들 제거
   */
  removeExpired(maxAge = 3600000) { // 기본 1시간
    const cutoffTime = new Date(Date.now() - maxAge);
    return this.removeWhere(item => item.addedAt < cutoffTime);
  }

  /**
   * 버퍼 상태 조회
   */
  getStats() {
    return {
      name: this.name,
      currentSize: this.buffer.length,
      maxSize: this.maxSize,
      totalAdded: this.totalAdded,
      totalEvicted: this.totalEvicted,
      utilizationRate: (this.buffer.length / this.maxSize * 100).toFixed(2) + '%',
      oldestItem: this.buffer.length > 0 ? this.buffer[0].addedAt : null,
      newestItem: this.buffer.length > 0 ? this.buffer[this.buffer.length - 1].addedAt : null
    };
  }

  /**
   * 최근 N개 항목 조회
   */
  getRecent(count = 10) {
    return this.buffer.slice(-count);
  }

  /**
   * 전체 정리
   */
  clear() {
    const clearedCount = this.buffer.length;
    this.buffer = [];
    this.totalEvicted += clearedCount;
    return clearedCount;
  }
}

/**
 * 시간 기반 캐시 - TTL(Time To Live) 지원
 */
class TTLCache {
  constructor(maxSize = 500, defaultTTL = 1800000) { // 기본 30분
    this.cache = new Map();
    this.timers = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * 캐시 설정
   */
  set(key, value, ttl = null) {
    // 크기 제한 확인
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU();
    }

    // 기존 타이머 정리
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // 값 저장
    this.cache.set(key, {
      value,
      createdAt: new Date(),
      accessedAt: new Date(),
      accessCount: 0
    });

    // TTL 타이머 설정
    const expireTime = ttl || this.defaultTTL;
    const timer = setTimeout(() => {
      this.delete(key);
    }, expireTime);
    
    this.timers.set(key, timer);
  }

  /**
   * 캐시 조회
   */
  get(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      item.accessedAt = new Date();
      item.accessCount++;
      this.hits++;
      return item.value;
    }
    
    this.misses++;
    return null;
  }

  /**
   * 캐시 삭제
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      
      return true;
    }
    return false;
  }

  /**
   * LRU 기반 항목 제거
   */
  _evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.accessedAt.getTime() < oldestTime) {
        oldestTime = item.accessedAt.getTime();
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.evictions++;
    }
  }

  /**
   * 만료된 항목들 정리
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, item] of this.cache.entries()) {
      const age = now - item.createdAt.getTime();
      if (age > this.defaultTTL) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  /**
   * 캐시 통계
   */
  getStats() {
    const hitRate = this.hits + this.misses > 0 ? 
      (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%' : '0%';
      
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate,
      utilizationRate: (this.cache.size / this.maxSize * 100).toFixed(2) + '%'
    };
  }

  /**
   * 전체 정리
   */
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    const clearedCount = this.cache.size;
    this.cache.clear();
    this.timers.clear();
    
    return clearedCount;
  }
}

/**
 * 자동 정리 스케줄러
 */
class AutoCleanupScheduler {
  constructor(options = {}) {
    this.cleanupInterval = options.cleanupInterval || 3600000; // 1시간
    this.isRunning = false;
    this.cleanupTasks = new Map();
    this.stats = {
      totalCleanups: 0,
      lastCleanup: null,
      totalItemsCleaned: 0
    };
    
    this.logger = options.logger || logger;
  }

  /**
   * 정리 작업 등록
   */
  register(name, cleanupFunction, interval = null) {
    this.cleanupTasks.set(name, {
      fn: cleanupFunction,
      interval: interval || this.cleanupInterval,
      lastRun: null,
      totalRuns: 0,
      totalCleaned: 0
    });
    
    this.logger.info(`정리 작업 등록: ${name}`);
  }

  /**
   * 스케줄러 시작
   */
  start() {
    if (this.isRunning) {
      this.logger.warn('자동 정리 스케줄러가 이미 실행 중입니다.');
      return;
    }
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this._runCleanup();
    }, this.cleanupInterval);
    
    this.logger.info('자동 정리 스케줄러 시작', {
      interval: `${this.cleanupInterval / 1000}초`,
      registeredTasks: this.cleanupTasks.size
    });
  }

  /**
   * 스케줄러 중지
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    clearInterval(this.intervalId);
    this.isRunning = false;
    
    this.logger.info('자동 정리 스케줄러 중지');
  }

  /**
   * 즉시 정리 실행
   */
  async runNow() {
    this.logger.info('수동 정리 실행');
    return await this._runCleanup();
  }

  /**
   * 정리 작업 실행
   */
  async _runCleanup() {
    const startTime = Date.now();
    const results = {};
    let totalCleaned = 0;
    
    try {
      for (const [name, task] of this.cleanupTasks.entries()) {
        const now = Date.now();
        
        // 작업별 간격 확인
        if (task.lastRun && (now - task.lastRun) < task.interval) {
          continue;
        }
        
        try {
          const cleaned = await task.fn();
          task.lastRun = now;
          task.totalRuns++;
          task.totalCleaned += cleaned || 0;
          
          results[name] = {
            success: true,
            cleaned: cleaned || 0
          };
          
          totalCleaned += cleaned || 0;
          
        } catch (error) {
          this.logger.error(`정리 작업 실패: ${name}`, error);
          results[name] = {
            success: false,
            error: error.message
          };
        }
      }
      
      this.stats.totalCleanups++;
      this.stats.lastCleanup = new Date();
      this.stats.totalItemsCleaned += totalCleaned;
      
      const duration = Date.now() - startTime;
      
      this.logger.info('자동 정리 완료', {
        duration: `${duration}ms`,
        totalCleaned,
        results
      });
      
      return {
        success: true,
        duration,
        totalCleaned,
        results
      };
      
    } catch (error) {
      this.logger.error('자동 정리 중 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 스케줄러 상태 조회
   */
  getStatus() {
    const taskStats = {};
    
    for (const [name, task] of this.cleanupTasks.entries()) {
      taskStats[name] = {
        totalRuns: task.totalRuns,
        totalCleaned: task.totalCleaned,
        lastRun: task.lastRun,
        nextRun: task.lastRun ? new Date(task.lastRun + task.interval) : null
      };
    }
    
    return {
      isRunning: this.isRunning,
      cleanupInterval: this.cleanupInterval,
      registeredTasks: this.cleanupTasks.size,
      stats: this.stats,
      tasks: taskStats
    };
  }
}

/**
 * 메모리 모니터
 */
class MemoryMonitor {
  constructor() {
    this.samples = new CircularBuffer(100, 'MemoryMonitor');
  }

  /**
   * 메모리 사용량 수집
   */
  collectSample() {
    const usage = process.memoryUsage();
    const sample = {
      timestamp: new Date(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      heapUtilization: (usage.heapUsed / usage.heapTotal * 100).toFixed(2)
    };
    
    this.samples.add(sample);
    return sample;
  }

  /**
   * 메모리 트렌드 분석
   */
  getMemoryTrend(minutes = 10) {
    const cutoffTime = new Date(Date.now() - minutes * 60000);
    const recentSamples = this.samples.buffer.filter(
      sample => sample.timestamp >= cutoffTime
    );
    
    if (recentSamples.length < 2) {
      return { trend: 'INSUFFICIENT_DATA', samples: recentSamples.length };
    }
    
    const first = recentSamples[0];
    const last = recentSamples[recentSamples.length - 1];
    
    const heapGrowth = last.heapUsed - first.heapUsed;
    const growthRate = heapGrowth / (minutes * 60000); // bytes per ms
    
    let trend = 'STABLE';
    if (growthRate > 1000) { // 1KB/ms
      trend = 'INCREASING';
    } else if (growthRate < -1000) {
      trend = 'DECREASING';
    }
    
    return {
      trend,
      growthRate: growthRate.toFixed(2),
      heapGrowth,
      samples: recentSamples.length,
      timespan: minutes,
      current: last,
      previous: first
    };
  }

  /**
   * 메모리 경고 확인
   */
  checkMemoryWarnings() {
    const current = this.collectSample();
    const warnings = [];
    
    // 힙 사용률 80% 이상
    if (current.heapUtilization > 80) {
      warnings.push({
        type: 'HIGH_HEAP_USAGE',
        level: 'WARNING',
        message: `힙 사용률이 ${current.heapUtilization}%입니다.`,
        value: current.heapUtilization
      });
    }
    
    // RSS 메모리 500MB 이상
    if (current.rss > 500 * 1024 * 1024) {
      warnings.push({
        type: 'HIGH_RSS_USAGE',
        level: 'WARNING',
        message: `RSS 메모리가 ${(current.rss / 1024 / 1024).toFixed(2)}MB입니다.`,
        value: current.rss
      });
    }
    
    // 메모리 증가 트렌드
    const trend = this.getMemoryTrend(5);
    if (trend.trend === 'INCREASING' && trend.growthRate > 2000) {
      warnings.push({
        type: 'MEMORY_LEAK_SUSPECTED',
        level: 'CRITICAL',
        message: `메모리 증가율이 ${trend.growthRate} bytes/ms입니다.`,
        value: trend.growthRate
      });
    }
    
    return {
      warnings,
      current,
      trend
    };
  }
}

/**
 * 글로벌 메모리 관리자
 */
class GlobalMemoryManager {
  constructor() {
    this.buffers = new Map();
    this.caches = new Map();
    this.scheduler = new AutoCleanupScheduler();
    this.monitor = new MemoryMonitor();
    
    this._setupDefaultCleanupTasks();
    this._startMonitoring();
  }

  /**
   * 순환 버퍼 등록
   */
  registerBuffer(name, maxSize = 1000) {
    const buffer = new CircularBuffer(maxSize, name);
    this.buffers.set(name, buffer);
    
    // 자동 정리 작업 등록
    this.scheduler.register(`buffer_${name}`, () => {
      return buffer.removeExpired();
    });
    
    return buffer;
  }

  /**
   * TTL 캐시 등록
   */
  registerCache(name, maxSize = 500, ttl = 1800000) {
    const cache = new TTLCache(maxSize, ttl);
    this.caches.set(name, cache);
    
    // 자동 정리 작업 등록
    this.scheduler.register(`cache_${name}`, () => {
      return cache.cleanup();
    });
    
    return cache;
  }

  /**
   * 기본 정리 작업 설정
   */
  _setupDefaultCleanupTasks() {
    // 가비지 컬렉션 유도
    this.scheduler.register('garbage_collection', () => {
      if (global.gc) {
        global.gc();
        return 1;
      }
      return 0;
    }, 1800000); // 30분마다
    
    // 메모리 모니터링
    this.scheduler.register('memory_monitoring', () => {
      const warnings = this.monitor.checkMemoryWarnings();
      if (warnings.warnings.length > 0) {
        logger.warn('메모리 경고 감지:', warnings);
      }
      return warnings.warnings.length;
    }, 300000); // 5분마다
  }

  /**
   * 모니터링 시작
   */
  _startMonitoring() {
    // 메모리 샘플링 (1분마다)
    setInterval(() => {
      this.monitor.collectSample();
    }, 60000);
    
    // 스케줄러 시작
    this.scheduler.start();
  }

  /**
   * 전체 통계 조회
   */
  getGlobalStats() {
    const bufferStats = {};
    for (const [name, buffer] of this.buffers.entries()) {
      bufferStats[name] = buffer.getStats();
    }
    
    const cacheStats = {};
    for (const [name, cache] of this.caches.entries()) {
      cacheStats[name] = cache.getStats();
    }
    
    return {
      buffers: bufferStats,
      caches: cacheStats,
      scheduler: this.scheduler.getStatus(),
      memory: this.monitor.checkMemoryWarnings()
    };
  }

  /**
   * 강제 정리 실행
   */
  async forceCleanup() {
    logger.info('강제 메모리 정리 실행');
    
    const results = {
      buffers: {},
      caches: {},
      scheduler: null
    };
    
    // 모든 버퍼 정리
    for (const [name, buffer] of this.buffers.entries()) {
      results.buffers[name] = buffer.removeExpired();
    }
    
    // 모든 캐시 정리
    for (const [name, cache] of this.caches.entries()) {
      results.caches[name] = cache.cleanup();
    }
    
    // 스케줄러 정리 실행
    results.scheduler = await this.scheduler.runNow();
    
    return results;
  }

  /**
   * 종료 시 정리
   */
  shutdown() {
    this.scheduler.stop();
    
    for (const cache of this.caches.values()) {
      cache.clear();
    }
    
    for (const buffer of this.buffers.values()) {
      buffer.clear();
    }
    
    logger.info('글로벌 메모리 관리자 종료');
  }
}

// 싱글톤 인스턴스
const globalMemoryManager = new GlobalMemoryManager();

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  globalMemoryManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  globalMemoryManager.shutdown();
  process.exit(0);
});

module.exports = {
  CircularBuffer,
  TTLCache,
  AutoCleanupScheduler,
  MemoryMonitor,
  GlobalMemoryManager,
  globalMemoryManager
}; 