/**
 * 비자 평가 서비스 v2
 * 플러그인 기반 확장 가능한 구조
 */

const { getPluginLoader } = require('../loaders/PluginLoader');
const GenericPreScreeningService = require('./GenericPreScreeningService');
const E1ServiceAdapter = require('../adapters/E1ServiceAdapter');
const logger = require('../../../../utils/logger');
const { ValidationError } = require('../../../../utils/errors');

class VisaEvaluationServiceV2 {
  constructor() {
    this.pluginLoader = getPluginLoader();
    this.services = new Map();
    this.initialized = false;
  }

  /**
   * 서비스 초기화
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      logger.info('Initializing Visa Evaluation Service V2...');
      
      // 플러그인 로드
      await this.pluginLoader.loadAllPlugins();
      
      // E-1은 특별히 어댑터 사용
      await this.initializeE1Service();
      
      this.initialized = true;
      logger.info('Visa Evaluation Service V2 initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize Visa Evaluation Service V2:', error);
      throw error;
    }
  }

  /**
   * E-1 서비스 초기화
   */
  async initializeE1Service() {
    const e1Config = this.pluginLoader.getConfig('E-1');
    if (e1Config) {
      const e1Adapter = new E1ServiceAdapter(e1Config);
      await e1Adapter.initialize();
      this.services.set('E-1', e1Adapter);
      logger.info('E-1 service adapter initialized');
    }
  }

  /**
   * 비자 사전심사
   */
  async performPreScreening(visaType, applicantData) {
    await this.ensureInitialized();
    
    // 입력 검증
    this.validateInput(visaType, applicantData);
    
    try {
      // 서비스 가져오기
      const service = await this.getOrCreateService(visaType);
      
      // 사전심사 수행
      const result = await service.performPreScreening(applicantData);
      
      // 로깅
      logger.info(`Pre-screening completed for ${visaType}`, {
        visaType,
        passed: result.passPreScreening,
        rejectionCount: result.immediateRejectionReasons.length,
        issueCount: result.remediableIssues.length
      });
      
      return result;
      
    } catch (error) {
      logger.error(`Pre-screening error for ${visaType}:`, error);
      throw error;
    }
  }

  /**
   * 상세 평가
   */
  async evaluate(visaType, applicantData, options = {}) {
    await this.ensureInitialized();
    
    // 입력 검증
    this.validateInput(visaType, applicantData);
    
    try {
      // 서비스 가져오기
      const service = await this.getOrCreateService(visaType);
      
      // 평가 수행
      const result = await service.evaluate(applicantData, options);
      
      // 로깅
      logger.info(`Evaluation completed for ${visaType}`, {
        visaType,
        applicationType: options.applicationType || 'NEW',
        score: result.score,
        status: result.status
      });
      
      return result;
      
    } catch (error) {
      logger.error(`Evaluation error for ${visaType}:`, error);
      throw error;
    }
  }

  /**
   * 실시간 필드 검증
   */
  async validateField(visaType, fieldName, value, context = {}) {
    await this.ensureInitialized();
    
    try {
      const service = await this.getOrCreateService(visaType);
      return service.validateField(fieldName, value, context);
      
    } catch (error) {
      logger.error(`Field validation error for ${visaType}.${fieldName}:`, error);
      return {
        valid: false,
        severity: 'error',
        message: 'Validation service unavailable'
      };
    }
  }

  /**
   * 비자별 지원 기능 확인
   */
  async getVisaTypeFeatures(visaType) {
    await this.ensureInitialized();
    
    const config = this.pluginLoader.getConfig(visaType);
    const plugin = this.pluginLoader.getPlugin(visaType);
    
    if (!config) {
      throw new ValidationError(`Unsupported visa type: ${visaType}`);
    }
    
    return {
      visaType,
      name: config.name,
      category: config.category,
      description: config.description,
      supportedFeatures: plugin ? plugin.getSupportedFeatures() : config.features || {},
      hasSpecializedPlugin: !!plugin,
      applicationTypes: config.applicationTypes || ['NEW', 'EXTENSION', 'CHANGE']
    };
  }

  /**
   * 모든 지원 비자 타입
   */
  getSupportedVisaTypes() {
    return this.pluginLoader.getSupportedVisaTypes();
  }

  /**
   * 비자 타입별 요구사항
   */
  async getVisaRequirements(visaType, applicationType = 'NEW', nationality = null) {
    await this.ensureInitialized();
    
    const config = this.pluginLoader.getConfig(visaType);
    if (!config) {
      throw new ValidationError(`Unsupported visa type: ${visaType}`);
    }
    
    const plugin = this.pluginLoader.getPlugin(visaType);
    
    // 기본 요구사항
    const requirements = {
      eligibility: config.requirements?.eligibility || {},
      restrictions: config.requirements?.restrictions || {},
      specific: config.requirements?.specific || {}
    };
    
    // 문서 요구사항
    const documents = {
      basic: config.documents?.basic || [],
      specific: config.documents?.byApplicationType?.[applicationType] || []
    };
    
    // 국적별 추가 문서
    if (nationality && config.documents?.byNationality) {
      const nationalityDocs = config.documents.byNationality[nationality] || 
                             config.documents.byNationality['DEFAULT'] || [];
      documents.nationality = nationalityDocs;
    }
    
    // 플러그인에서 추가 정보
    if (plugin) {
      const pluginReqs = plugin.getRequirements();
      requirements.additional = pluginReqs;
    }
    
    return {
      visaType,
      applicationType,
      requirements,
      documents,
      processingTime: config.processingTime || { min: 7, max: 30 }
    };
  }

  /**
   * 비자 변경 가능성 확인
   */
  async checkChangeability(fromVisa, toVisa) {
    await this.ensureInitialized();
    
    const toConfig = this.pluginLoader.getConfig(toVisa);
    if (!toConfig) {
      throw new ValidationError(`Unsupported visa type: ${toVisa}`);
    }
    
    const changeability = toConfig.changeability?.from || {};
    
    // 직접 변경 가능
    if (changeability.allowed?.includes(fromVisa)) {
      return {
        possible: true,
        type: 'direct',
        conditions: [],
        requiredDocuments: []
      };
    }
    
    // 조건부 변경 가능
    if (changeability.conditional?.[fromVisa]) {
      const condition = changeability.conditional[fromVisa];
      return {
        possible: true,
        type: 'conditional',
        conditions: [condition.condition],
        requiredDocuments: condition.documents || []
      };
    }
    
    // 변경 불가
    if (changeability.prohibited?.includes(fromVisa)) {
      return {
        possible: false,
        type: 'prohibited',
        reason: 'Direct change not allowed',
        alternatives: this.findAlternativeChangePaths(fromVisa, toVisa)
      };
    }
    
    // 정보 없음
    return {
      possible: false,
      type: 'unknown',
      reason: 'No changeability information available'
    };
  }

  /**
   * 배치 평가
   */
  async evaluateBatch(evaluationRequests) {
    await this.ensureInitialized();
    
    const results = [];
    
    for (const request of evaluationRequests) {
      try {
        const { visaType, applicantData, applicationType, evaluationType } = request;
        
        let result;
        if (evaluationType === 'preScreening') {
          result = await this.performPreScreening(visaType, applicantData);
        } else {
          result = await this.evaluate(visaType, applicantData, { applicationType });
        }
        
        results.push({
          ...request,
          result,
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          ...request,
          result: null,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  // === 헬퍼 메서드 ===

  /**
   * 서비스 가져오기 또는 생성
   */
  async getOrCreateService(visaType) {
    // 캐시된 서비스 확인
    if (this.services.has(visaType)) {
      return this.services.get(visaType);
    }
    
    // 플러그인 확인
    let plugin = this.pluginLoader.getPlugin(visaType);
    const config = this.pluginLoader.getConfig(visaType);
    
    if (!config) {
      throw new ValidationError(`Unsupported visa type: ${visaType}`);
    }
    
    // 플러그인이 없으면 생성
    if (!plugin) {
      plugin = await this.pluginLoader.createGenericPlugin(visaType);
    }
    
    // 범용 서비스 생성
    const service = new GenericPreScreeningService(visaType, config, plugin);
    this.services.set(visaType, service);
    
    return service;
  }

  /**
   * 초기화 확인
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * 입력 검증
   */
  validateInput(visaType, applicantData) {
    if (!visaType) {
      throw new ValidationError('Visa type is required');
    }
    
    if (!applicantData) {
      throw new ValidationError('Applicant data is required');
    }
    
    if (!applicantData.nationality) {
      throw new ValidationError('Nationality is required');
    }
    
    if (!applicantData.applicationType) {
      throw new ValidationError('Application type is required');
    }
  }

  /**
   * 대체 변경 경로 찾기
   */
  findAlternativeChangePaths(fromVisa, toVisa) {
    // 간단한 구현 - 실제로는 더 복잡한 경로 탐색 필요
    const alternatives = [];
    
    // D-10을 거쳐가는 경로
    if (fromVisa !== 'D-10' && toVisa !== 'D-10') {
      alternatives.push({
        path: [fromVisa, 'D-10', toVisa],
        description: 'Change to D-10 (Job Seeker) first, then to target visa'
      });
    }
    
    return alternatives;
  }

  /**
   * 서비스 종료
   */
  async shutdown() {
    logger.info('Shutting down Visa Evaluation Service V2...');
    
    // 모든 서비스 종료
    for (const [visaType, service] of this.services) {
      if (service && typeof service.shutdown === 'function') {
        await service.shutdown();
      }
    }
    
    // 플러그인 로더 종료
    await this.pluginLoader.shutdown();
    
    this.services.clear();
    this.initialized = false;
    
    logger.info('Visa Evaluation Service V2 shut down');
  }
}

// 싱글톤 인스턴스
let serviceInstance = null;

/**
 * 서비스 인스턴스 가져오기
 */
function getVisaEvaluationService() {
  if (!serviceInstance) {
    serviceInstance = new VisaEvaluationServiceV2();
  }
  return serviceInstance;
}

module.exports = {
  VisaEvaluationServiceV2,
  getVisaEvaluationService
};