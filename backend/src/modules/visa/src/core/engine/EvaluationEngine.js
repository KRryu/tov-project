/**
 * 평가 엔진 - 비자 평가의 핵심
 * 모든 비자 타입과 신청 유형에 대한 평가 로직 처리
 */

const logger = require('../../../../../utils/logger');
const RuleEngine = require('./RuleEngine');
const WorkflowEngine = require('./WorkflowEngine');
const { APPLICATION_TYPES, EVALUATION_STATUS } = require('../../config/shared/constants');

class EvaluationEngine {
  constructor(configManager) {
    this.configManager = configManager;
    this.ruleEngine = null;
    this.workflowEngine = null;
    this.strategies = new Map();
  }

  /**
   * 엔진 초기화
   */
  async initialize() {
    try {
      // 규칙 엔진 초기화
      this.ruleEngine = new RuleEngine(this.configManager);
      await this.ruleEngine.initialize();

      // 워크플로우 엔진 초기화
      this.workflowEngine = new WorkflowEngine(this.configManager);
      await this.workflowEngine.initialize();

      // 전략 패턴 로드
      await this.loadStrategies();

      logger.info('✅ 평가 엔진 초기화 완료');
    } catch (error) {
      logger.error('평가 엔진 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 신청 유형별 전략 로드
   */
  async loadStrategies() {
    const strategyFiles = {
      [APPLICATION_TYPES.NEW]: '../strategies/NewApplicationStrategy',
      [APPLICATION_TYPES.EXTENSION]: '../strategies/ExtensionStrategy',
      [APPLICATION_TYPES.CHANGE]: '../strategies/ChangeStrategy'
    };

    for (const [type, file] of Object.entries(strategyFiles)) {
      try {
        const Strategy = require(file);
        this.strategies.set(type, new Strategy(this.configManager, this.ruleEngine));
      } catch (error) {
        logger.warn(`전략 로드 실패 ${type}:`, error.message);
        // 기본 전략 사용
        const BaseStrategy = require('../strategies/BaseStrategy');
        this.strategies.set(type, new BaseStrategy(this.configManager, this.ruleEngine));
      }
    }
  }

  /**
   * 비자 평가 실행
   */
  async evaluate(params) {
    const { visaType, applicationType, data } = params;
    const evaluationId = this.generateEvaluationId();

    logger.info(`🔍 평가 시작: ${evaluationId} - ${visaType}/${applicationType}`);

    try {
      // 1. 입력 검증
      this.validateInput(visaType, applicationType, data);

      // 2. 평가 컨텍스트 생성
      const context = this.createEvaluationContext(visaType, applicationType, data);

      // 3. 전략 선택 및 실행
      const strategy = this.strategies.get(applicationType);
      if (!strategy) {
        throw new Error(`지원하지 않는 신청 유형: ${applicationType}`);
      }

      // 4. 평가 실행
      const evaluationResult = await strategy.evaluate(context);

      // 5. 후처리
      const finalResult = await this.postProcess(evaluationResult, context);

      logger.info(`✅ 평가 완료: ${evaluationId} - 결과: ${finalResult.eligible ? '적격' : '부적격'}`);

      return {
        success: true,
        evaluationId,
        result: finalResult,
        metadata: {
          visaType,
          applicationType,
          timestamp: new Date().toISOString(),
          version: '4.0.0'
        }
      };

    } catch (error) {
      logger.error(`❌ 평가 실패: ${evaluationId}`, error);
      
      return {
        success: false,
        evaluationId,
        error: {
          code: error.code || 'EVALUATION_FAILED',
          message: error.message,
          details: error.details || {}
        },
        metadata: {
          visaType,
          applicationType,
          timestamp: new Date().toISOString(),
          version: '4.0.0'
        }
      };
    }
  }

  /**
   * 입력 검증
   */
  validateInput(visaType, applicationType, data) {
    // 비자 타입 검증
    const visaConfig = this.configManager.getVisaConfig(visaType);
    if (!visaConfig) {
      throw new Error(`지원하지 않는 비자 타입: ${visaType}`);
    }

    // 신청 유형 검증
    if (!visaConfig.supported_applications.includes(applicationType)) {
      throw new Error(`${visaType} 비자는 ${applicationType} 신청을 지원하지 않습니다`);
    }

    // 필수 데이터 검증
    if (!data || typeof data !== 'object') {
      throw new Error('평가 데이터가 없습니다');
    }
  }

  /**
   * 평가 컨텍스트 생성
   */
  createEvaluationContext(visaType, applicationType, data) {
    const visaConfig = this.configManager.getVisaConfig(visaType);
    const appTypeConfig = this.configManager.getApplicationTypeConfig(applicationType);

    return {
      visaType,
      applicationType,
      visaConfig,
      appTypeConfig,
      data,
      scores: {},
      validations: [],
      recommendations: [],
      requiredDocuments: [],
      timestamp: new Date()
    };
  }

  /**
   * 평가 후처리
   */
  async postProcess(evaluationResult, context) {
    // 1. 점수 계산
    const finalScore = this.calculateFinalScore(evaluationResult.scores, context);

    // 2. 합격 여부 결정
    const passingScore = context.appTypeConfig?.requirements?.passing_score || 70;
    const eligible = finalScore >= passingScore;

    // 3. 다음 단계 결정
    const nextSteps = await this.workflowEngine.determineNextSteps(
      eligible,
      context.visaType,
      context.applicationType
    );

    // 4. 최종 결과 구성
    return {
      eligible,
      score: finalScore,
      details: evaluationResult,
      recommendations: evaluationResult.recommendations || [],
      requiredDocuments: evaluationResult.requiredDocuments || [],
      nextSteps,
      processingTime: this.estimateProcessingTime(context),
      complexity: this.analyzeComplexity(context)
    };
  }

  /**
   * 최종 점수 계산
   */
  calculateFinalScore(scores, context) {
    const weights = context.appTypeConfig?.scoring?.weights || {
      eligibility: 40,
      documents: 30,
      expertise: 30
    };
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, scoreData] of Object.entries(scores)) {
      const score = typeof scoreData === 'object' ? scoreData.score : scoreData;
      const weight = scoreData.weight || weights[category] || 10;
      totalScore += (score || 0) * (weight / 100);
      totalWeight += weight;
    }

    // 가중치 정규화
    if (totalWeight > 0 && totalWeight !== 100) {
      totalScore = (totalScore / totalWeight) * 100;
    }

    return Math.round(totalScore);
  }

  /**
   * 처리 시간 예측
   */
  estimateProcessingTime(context) {
    const baseTime = context.visaConfig.processing_days || { min: 7, max: 30 };
    
    // 복잡도에 따른 조정
    const complexity = context.visaConfig.complexity || 'MEDIUM';
    const multiplier = {
      LOW: 0.7,
      MEDIUM: 1.0,
      HIGH: 1.3,
      VERY_HIGH: 1.5
    }[complexity] || 1.0;

    return {
      min: Math.ceil(baseTime.min * multiplier),
      max: Math.ceil(baseTime.max * multiplier),
      unit: 'days'
    };
  }

  /**
   * 복잡도 분석
   */
  analyzeComplexity(context) {
    // 기본 복잡도
    let complexity = context.visaConfig.complexity || 'MEDIUM';

    // 변경 신청인 경우 복잡도 증가
    if (context.applicationType === APPLICATION_TYPES.CHANGE) {
      const complexityMap = {
        LOW: 'MEDIUM',
        MEDIUM: 'HIGH',
        HIGH: 'VERY_HIGH',
        VERY_HIGH: 'VERY_HIGH'
      };
      complexity = complexityMap[complexity] || 'HIGH';
    }

    return complexity;
  }

  /**
   * 평가 ID 생성
   */
  generateEvaluationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `EVAL-${timestamp}-${random}`.toUpperCase();
  }
}

module.exports = EvaluationEngine;