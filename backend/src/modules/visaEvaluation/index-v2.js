/**
 * 비자 평가 모듈 v2 - 메인 엔트리 포인트
 * 확장 가능한 플러그인 기반 구조
 */

const { getVisaEvaluationService } = require('./core/services/VisaEvaluationServiceV2');
const { getPluginLoader } = require('./core/loaders/PluginLoader');
const logger = require('../../utils/logger');

// 서비스 인스턴스
let evaluationService = null;
let pluginLoader = null;

/**
 * 모듈 초기화
 */
async function initializeModule() {
  try {
    logger.info('Initializing Visa Evaluation Module v2...');
    
    // 서비스 인스턴스 가져오기
    evaluationService = getVisaEvaluationService();
    pluginLoader = getPluginLoader();
    
    // 서비스 초기화
    await evaluationService.initialize();
    
    logger.info('Visa Evaluation Module v2 initialized successfully');
    return true;
    
  } catch (error) {
    logger.error('Failed to initialize Visa Evaluation Module v2:', error);
    throw error;
  }
}

/**
 * 비자 사전심사
 */
async function performPreScreening(visaType, applicantData) {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.performPreScreening(visaType, applicantData);
}

/**
 * 비자 평가
 */
async function evaluateVisa(visaType, applicantData, options = {}) {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.evaluate(visaType, applicantData, options);
}

/**
 * 실시간 필드 검증
 */
async function validateField(visaType, fieldName, value, context = {}) {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.validateField(visaType, fieldName, value, context);
}

/**
 * 지원되는 비자 타입 목록
 */
async function getSupportedVisaTypes() {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.getSupportedVisaTypes();
}

/**
 * 비자 타입별 기능 정보
 */
async function getVisaTypeFeatures(visaType) {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.getVisaTypeFeatures(visaType);
}

/**
 * 비자 요구사항 조회
 */
async function getVisaRequirements(visaType, applicationType = 'NEW', nationality = null) {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.getVisaRequirements(visaType, applicationType, nationality);
}

/**
 * 비자 변경 가능성 확인
 */
async function checkChangeability(fromVisa, toVisa) {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.checkChangeability(fromVisa, toVisa);
}

/**
 * 배치 평가
 */
async function evaluateBatch(evaluationRequests) {
  if (!evaluationService) {
    await initializeModule();
  }
  
  return evaluationService.evaluateBatch(evaluationRequests);
}

/**
 * 플러그인 리로드
 */
async function reloadPlugin(visaType) {
  if (!pluginLoader) {
    await initializeModule();
  }
  
  return pluginLoader.reloadPlugin(visaType);
}

/**
 * 모듈 종료
 */
async function shutdown() {
  if (evaluationService) {
    await evaluationService.shutdown();
  }
  
  logger.info('Visa Evaluation Module v2 shut down');
}

// 레거시 호환성을 위한 함수들

/**
 * E-1 비자 평가 (레거시)
 */
async function evaluateE1Visa(applicantData, options = {}) {
  return evaluateVisa('E-1', applicantData, options);
}

/**
 * E-1 사전심사 (레거시)
 */
async function performE1PreScreening(applicantData) {
  return performPreScreening('E-1', applicantData);
}

/**
 * E-1 실시간 검증 (레거시)
 */
async function validateE1Field(fieldName, value, context = {}) {
  return validateField('E-1', fieldName, value, context);
}

module.exports = {
  // 초기화
  initializeModule,
  
  // 주요 기능
  performPreScreening,
  evaluateVisa,
  validateField,
  
  // 정보 조회
  getSupportedVisaTypes,
  getVisaTypeFeatures,
  getVisaRequirements,
  checkChangeability,
  
  // 배치 처리
  evaluateBatch,
  
  // 관리 기능
  reloadPlugin,
  shutdown,
  
  // 레거시 호환성
  evaluateE1Visa,
  performE1PreScreening,
  validateE1Field,
  
  // 버전 정보
  version: '2.0',
  architecture: 'PLUGIN_BASED'
};