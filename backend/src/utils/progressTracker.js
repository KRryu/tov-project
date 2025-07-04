/**
 * 진행상황 추적기
 * 경로: /backend/src/utils/progressTracker.js
 */

const EventEmitter = require('events');
const logger = require('./logger');
const cacheManager = require('./cacheManager');

/**
 * 진행상황 추적기 클래스
 * 비자 평가, 문서 처리 등의 진행상황을 실시간으로 추적
 */
class ProgressTracker extends EventEmitter {
  constructor() {
    super();
    this.activeProcesses = new Map();
    this.completedProcesses = new Map();
    this.processSteps = new Map();
    
    // 기본 진행단계 정의
    this._defineDefaultSteps();
    
    logger.info('ProgressTracker 초기화 완료');
  }
  
  /**
   * 새로운 프로세스 시작
   * @param {string} processId - 프로세스 고유 ID
   * @param {string} processType - 프로세스 타입 (evaluation, document, application)
   * @param {Object} metadata - 메타데이터
   * @returns {Object} 프로세스 정보
   */
  startProcess(processId, processType, metadata = {}) {
    const startTime = Date.now();
    const steps = this.processSteps.get(processType) || this.processSteps.get('default');
    
    const process = {
      id: processId,
      type: processType,
      status: 'started',
      currentStep: 0,
      totalSteps: steps.length,
      steps: steps.map((step, index) => ({
        id: index,
        name: step.name,
        description: step.description,
        status: 'pending',
        startTime: null,
        endTime: null,
        duration: null,
        progress: 0,
        metadata: {}
      })),
      startTime,
      endTime: null,
      duration: null,
      progress: 0,
      metadata: {
        ...metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      messages: [],
      errors: []
    };
    
    this.activeProcesses.set(processId, process);
    
    logger.info(`프로세스 시작: ${processId} (${processType})`);
    
    // 첫 번째 단계 시작
    if (steps.length > 0) {
      this.startStep(processId, 0);
    }
    
    // 이벤트 발생
    this.emit('processStarted', {
      processId,
      processType,
      process: this._sanitizeProcess(process)
    });
    
    // 캐시에 저장
    cacheManager.set(`progress:${processId}`, process, 3600); // 1시간 TTL
    
    return this._sanitizeProcess(process);
  }
  
  /**
   * 프로세스 단계 시작
   * @param {string} processId - 프로세스 ID
   * @param {number} stepIndex - 단계 인덱스
   */
  startStep(processId, stepIndex) {
    const process = this.activeProcesses.get(processId);
    if (!process || !process.steps[stepIndex]) {
      logger.warn(`프로세스 또는 단계를 찾을 수 없음: ${processId}, 단계 ${stepIndex}`);
      return false;
    }
    
    const step = process.steps[stepIndex];
    const now = Date.now();
    
    // 이전 단계 완료 처리
    if (stepIndex > 0) {
      const prevStep = process.steps[stepIndex - 1];
      if (prevStep.status === 'running') {
        prevStep.status = 'completed';
        prevStep.endTime = now;
        prevStep.duration = now - prevStep.startTime;
        prevStep.progress = 100;
      }
    }
    
    // 현재 단계 시작
    step.status = 'running';
    step.startTime = now;
    step.progress = 0;
    
    process.currentStep = stepIndex;
    process.status = 'running';
    process.progress = Math.round((stepIndex / process.totalSteps) * 100);
    process.metadata.updatedAt = new Date();
    
    logger.debug(`단계 시작: ${processId} - ${step.name} (${stepIndex + 1}/${process.totalSteps})`);
    
    // 이벤트 발생
    this.emit('stepStarted', {
      processId,
      stepIndex,
      stepName: step.name,
      process: this._sanitizeProcess(process)
    });
    
    // 캐시 업데이트
    cacheManager.set(`progress:${processId}`, process, 3600);
    
    return true;
  }
  
  /**
   * 단계 진행상황 업데이트
   * @param {string} processId - 프로세스 ID
   * @param {number} stepIndex - 단계 인덱스
   * @param {number} progress - 진행률 (0-100)
   * @param {Object} metadata - 추가 메타데이터
   * @param {string} message - 상태 메시지
   */
  updateStepProgress(processId, stepIndex, progress, metadata = {}, message = null) {
    const process = this.activeProcesses.get(processId);
    if (!process || !process.steps[stepIndex]) {
      return false;
    }
    
    const step = process.steps[stepIndex];
    
    // 단계 진행률 업데이트
    step.progress = Math.min(Math.max(progress, 0), 100);
    step.metadata = { ...step.metadata, ...metadata };
    
    // 전체 프로세스 진행률 재계산
    const completedSteps = stepIndex;
    const currentStepProgress = step.progress / 100;
    process.progress = Math.round(((completedSteps + currentStepProgress) / process.totalSteps) * 100);
    
    process.metadata.updatedAt = new Date();
    
    // 메시지 추가
    if (message) {
      process.messages.push({
        timestamp: Date.now(),
        stepIndex,
        stepName: step.name,
        message,
        type: 'info'
      });
    }
    
    logger.debug(`단계 진행률 업데이트: ${processId} - ${step.name} (${step.progress}%)`);
    
    // 이벤트 발생
    this.emit('stepProgress', {
      processId,
      stepIndex,
      stepName: step.name,
      progress: step.progress,
      totalProgress: process.progress,
      message,
      process: this._sanitizeProcess(process)
    });
    
    // 캐시 업데이트
    cacheManager.set(`progress:${processId}`, process, 3600);
    
    return true;
  }
  
  /**
   * 단계 완료
   * @param {string} processId - 프로세스 ID
   * @param {number} stepIndex - 단계 인덱스
   * @param {Object} result - 단계 결과
   */
  completeStep(processId, stepIndex, result = {}) {
    const process = this.activeProcesses.get(processId);
    if (!process || !process.steps[stepIndex]) {
      return false;
    }
    
    const step = process.steps[stepIndex];
    const now = Date.now();
    
    // 단계 완료 처리
    step.status = 'completed';
    step.endTime = now;
    step.duration = now - step.startTime;
    step.progress = 100;
    step.result = result;
    
    process.metadata.updatedAt = new Date();
    
    logger.debug(`단계 완료: ${processId} - ${step.name} (${step.duration}ms)`);
    
    // 이벤트 발생
    this.emit('stepCompleted', {
      processId,
      stepIndex,
      stepName: step.name,
      duration: step.duration,
      result,
      process: this._sanitizeProcess(process)
    });
    
    // 다음 단계 시작 또는 프로세스 완료
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < process.totalSteps) {
      // 다음 단계 시작
      setTimeout(() => {
        this.startStep(processId, nextStepIndex);
      }, 100); // 작은 지연으로 이벤트 순서 보장
    } else {
      // 프로세스 완료
      this.completeProcess(processId, { success: true });
    }
    
    // 캐시 업데이트
    cacheManager.set(`progress:${processId}`, process, 3600);
    
    return true;
  }
  
  /**
   * 프로세스 완료
   * @param {string} processId - 프로세스 ID
   * @param {Object} finalResult - 최종 결과
   */
  completeProcess(processId, finalResult = {}) {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      return false;
    }
    
    const now = Date.now();
    
    // 프로세스 완료 처리
    process.status = finalResult.success !== false ? 'completed' : 'failed';
    process.endTime = now;
    process.duration = now - process.startTime;
    process.progress = 100;
    process.result = finalResult;
    process.metadata.updatedAt = new Date();
    
    // 실행 중인 단계가 있다면 완료 처리
    const currentStep = process.steps[process.currentStep];
    if (currentStep && currentStep.status === 'running') {
      currentStep.status = 'completed';
      currentStep.endTime = now;
      currentStep.duration = now - currentStep.startTime;
      currentStep.progress = 100;
    }
    
    // 활성 프로세스에서 제거하고 완료된 프로세스로 이동
    this.activeProcesses.delete(processId);
    this.completedProcesses.set(processId, process);
    
    logger.info(`프로세스 완료: ${processId} (${process.duration}ms, 상태: ${process.status})`);
    
    // 이벤트 발생
    this.emit('processCompleted', {
      processId,
      status: process.status,
      duration: process.duration,
      result: finalResult,
      process: this._sanitizeProcess(process)
    });
    
    // 캐시 업데이트 (완료된 프로세스는 더 오래 보관)
    cacheManager.set(`progress:${processId}`, process, 86400); // 24시간 TTL
    
    return true;
  }
  
  /**
   * 프로세스 실패 처리
   * @param {string} processId - 프로세스 ID
   * @param {Error|string} error - 오류 정보
   * @param {number} failedStepIndex - 실패한 단계 인덱스
   */
  failProcess(processId, error, failedStepIndex = null) {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      return false;
    }
    
    const now = Date.now();
    const errorMessage = error instanceof Error ? error.message : error;
    
    // 프로세스 실패 처리
    process.status = 'failed';
    process.endTime = now;
    process.duration = now - process.startTime;
    process.error = {
      message: errorMessage,
      failedStepIndex,
      timestamp: now
    };
    process.metadata.updatedAt = new Date();
    
    // 실패한 단계 처리
    if (failedStepIndex !== null && process.steps[failedStepIndex]) {
      const failedStep = process.steps[failedStepIndex];
      failedStep.status = 'failed';
      failedStep.endTime = now;
      failedStep.duration = now - failedStep.startTime;
      failedStep.error = errorMessage;
    }
    
    // 오류 로그 추가
    process.errors.push({
      timestamp: now,
      stepIndex: failedStepIndex,
      message: errorMessage,
      type: 'error'
    });
    
    // 활성 프로세스에서 제거하고 완료된 프로세스로 이동
    this.activeProcesses.delete(processId);
    this.completedProcesses.set(processId, process);
    
    logger.error(`프로세스 실패: ${processId} - ${errorMessage}`);
    
    // 이벤트 발생
    this.emit('processFailed', {
      processId,
      error: errorMessage,
      failedStepIndex,
      process: this._sanitizeProcess(process)
    });
    
    // 캐시 업데이트
    cacheManager.set(`progress:${processId}`, process, 86400);
    
    return true;
  }
  
  /**
   * 프로세스 상태 조회
   * @param {string} processId - 프로세스 ID
   * @returns {Object|null} 프로세스 정보
   */
  getProcessStatus(processId) {
    // 활성 프로세스 확인
    let process = this.activeProcesses.get(processId);
    
    // 완료된 프로세스 확인
    if (!process) {
      process = this.completedProcesses.get(processId);
    }
    
    // 캐시에서 확인
    if (!process) {
      process = cacheManager.get(`progress:${processId}`);
    }
    
    return process ? this._sanitizeProcess(process) : null;
  }
  
  /**
   * 사용자의 모든 프로세스 조회
   * @param {string} userId - 사용자 ID
   * @returns {Array} 프로세스 목록
   */
  getUserProcesses(userId) {
    const userProcesses = [];
    
    // 활성 프로세스 검색
    for (const [processId, process] of this.activeProcesses) {
      if (process.metadata?.userId === userId) {
        userProcesses.push(this._sanitizeProcess(process));
      }
    }
    
    // 완료된 프로세스 검색
    for (const [processId, process] of this.completedProcesses) {
      if (process.metadata?.userId === userId) {
        userProcesses.push(this._sanitizeProcess(process));
      }
    }
    
    // 시간순 정렬 (최신순)
    return userProcesses.sort((a, b) => b.startTime - a.startTime);
  }
  
  /**
   * 프로세스 통계 조회
   * @returns {Object} 통계 정보
   */
  getStatistics() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const stats = {
      active: this.activeProcesses.size,
      completed: 0,
      failed: 0,
      totalDuration: 0,
      averageDuration: 0,
      recentProcesses: 0,
      processTypes: {},
      stepStatistics: {}
    };
    
    // 완료된 프로세스 분석
    for (const [processId, process] of this.completedProcesses) {
      if (process.status === 'completed') {
        stats.completed++;
      } else if (process.status === 'failed') {
        stats.failed++;
      }
      
      if (process.duration) {
        stats.totalDuration += process.duration;
      }
      
      if (process.startTime > last24Hours) {
        stats.recentProcesses++;
      }
      
      // 프로세스 타입별 통계
      const type = process.type;
      if (!stats.processTypes[type]) {
        stats.processTypes[type] = { count: 0, avgDuration: 0, totalDuration: 0 };
      }
      stats.processTypes[type].count++;
      if (process.duration) {
        stats.processTypes[type].totalDuration += process.duration;
        stats.processTypes[type].avgDuration = stats.processTypes[type].totalDuration / stats.processTypes[type].count;
      }
    }
    
    // 평균 처리 시간 계산
    const totalProcesses = stats.completed + stats.failed;
    if (totalProcesses > 0) {
      stats.averageDuration = stats.totalDuration / totalProcesses;
    }
    
    return stats;
  }
  
  /**
   * 기본 진행단계 정의
   */
  _defineDefaultSteps() {
    // 비자 평가 단계
    this.processSteps.set('evaluation', [
      { name: 'preCheck', description: '사전 검증' },
      { name: 'applicationTypeCheck', description: '신청 유형 판단' },
      { name: 'basicQualification', description: '기본 자격요건 평가' },
      { name: 'documentCompleteness', description: '서류 완성도 검토' },
      { name: 'experienceEvaluation', description: '경력/경험 평가' },
      { name: 'languageProficiency', description: '언어능력 평가' },
      { name: 'financialCapability', description: '재정능력 평가' },
      { name: 'specialConditions', description: '특별 조건 평가' },
      { name: 'riskAssessment', description: '리스크 평가' },
      { name: 'comprehensiveScore', description: '종합 점수 계산' },
      { name: 'finalDecision', description: '최종 판정' }
    ]);
    
    // 문서 처리 단계
    this.processSteps.set('document', [
      { name: 'fileUpload', description: '파일 업로드' },
      { name: 'fileValidation', description: '파일 검증' },
      { name: 'documentParsing', description: '문서 파싱' },
      { name: 'contentValidation', description: '내용 검증' },
      { name: 'qualityCheck', description: '품질 검사' },
      { name: 'finalProcessing', description: '최종 처리' }
    ]);
    
    // 신청서 처리 단계
    this.processSteps.set('application', [
      { name: 'dataValidation', description: '데이터 검증' },
      { name: 'documentCollection', description: '서류 수집' },
      { name: 'completenessCheck', description: '완성도 검사' },
      { name: 'preliminaryReview', description: '예비 검토' },
      { name: 'finalReview', description: '최종 검토' },
      { name: 'submission', description: '제출 처리' }
    ]);
    
    // 기본 단계
    this.processSteps.set('default', [
      { name: 'initialization', description: '초기화' },
      { name: 'processing', description: '처리 중' },
      { name: 'finalization', description: '완료 처리' }
    ]);
  }
  
  /**
   * 프로세스 정보 정리 (민감한 정보 제거)
   */
  _sanitizeProcess(process) {
    const sanitized = { ...process };
    
    // 민감한 메타데이터 제거 또는 마스킹
    if (sanitized.metadata) {
      delete sanitized.metadata.internalId;
      delete sanitized.metadata.debugInfo;
    }
    
    // 큰 데이터 객체 요약
    if (sanitized.result && typeof sanitized.result === 'object') {
      if (sanitized.result.fullData) {
        sanitized.result.fullDataSize = JSON.stringify(sanitized.result.fullData).length;
        delete sanitized.result.fullData;
      }
    }
    
    return sanitized;
  }
  
  /**
   * 오래된 프로세스 정리
   * @param {number} maxAge - 최대 보관 기간 (밀리초)
   */
  cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 기본 7일
    const cutoffTime = Date.now() - maxAge;
    let cleanedCount = 0;
    
    // 완료된 프로세스 정리
    for (const [processId, process] of this.completedProcesses) {
      if (process.endTime && process.endTime < cutoffTime) {
        this.completedProcesses.delete(processId);
        cacheManager.del(`progress:${processId}`);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`오래된 프로세스 정리 완료: ${cleanedCount}개 프로세스`);
    }
    
    return cleanedCount;
  }
}

// 싱글톤 인스턴스 생성
const progressTracker = new ProgressTracker();

// 정기적으로 오래된 프로세스 정리 (매일 자정)
setInterval(() => {
  progressTracker.cleanup();
}, 24 * 60 * 60 * 1000);

module.exports = progressTracker; 