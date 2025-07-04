/**
 * 비자 서비스 - 비즈니스 로직 레이어
 * 평가 엔진을 활용한 고수준 비즈니스 서비스 제공
 */

const logger = require('../../../../utils/logger');

class VisaService {
  constructor(evaluationEngine) {
    this.evaluationEngine = evaluationEngine;
  }

  /**
   * 비자 평가 실행
   */
  async evaluate(params) {
    try {
      // 평가 전 로깅
      logger.info('비자 평가 요청:', {
        visaType: params.visaType,
        applicationType: params.applicationType,
        dataKeys: Object.keys(params.data || {})
      });

      // 평가 실행
      const result = await this.evaluationEngine.evaluate(params);

      // 평가 후 처리
      if (result.success) {
        await this.saveEvaluationResult(result);
      }

      return result;
    } catch (error) {
      logger.error('비자 평가 서비스 오류:', error);
      throw error;
    }
  }

  /**
   * 평가 결과 저장
   */
  async saveEvaluationResult(result) {
    try {
      // TODO: 데이터베이스에 평가 결과 저장
      // 현재는 로깅만 수행
      logger.info('평가 결과 저장:', {
        evaluationId: result.evaluationId,
        eligible: result.result.eligible,
        score: result.result.score
      });
    } catch (error) {
      logger.error('평가 결과 저장 실패:', error);
      // 저장 실패해도 평가 결과는 반환
    }
  }

  /**
   * 비자 타입별 요구사항 조회
   */
  async getVisaRequirements(visaType, applicationType) {
    try {
      const visaConfig = this.evaluationEngine.configManager.getVisaConfig(visaType);
      const appTypeConfig = this.evaluationEngine.configManager.getApplicationTypeConfig(applicationType);

      if (!visaConfig) {
        throw new Error(`지원하지 않는 비자 타입: ${visaType}`);
      }

      return {
        visaType,
        applicationType,
        requirements: {
          basic: visaConfig.base_requirements || {},
          documents: appTypeConfig?.documents || {},
          scoring: appTypeConfig?.scoring || {}
        },
        processingTime: visaConfig.processing_days,
        complexity: visaConfig.complexity
      };
    } catch (error) {
      logger.error('요구사항 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 변경 가능한 비자 경로 조회
   */
  async getChangePaths(currentVisaType) {
    try {
      const paths = this.evaluationEngine.configManager.changePaths[currentVisaType];
      
      if (!paths) {
        return {
          currentVisa: currentVisaType,
          availablePaths: [],
          message: '변경 가능한 비자가 없습니다.'
        };
      }

      const availablePaths = paths.allowed.map(toVisa => ({
        toVisa,
        conditions: paths.conditions[toVisa] || {},
        difficulty: paths.conditions[toVisa]?.difficulty || 'MEDIUM',
        successRate: paths.conditions[toVisa]?.successRate || 50
      }));

      return {
        currentVisa: currentVisaType,
        availablePaths,
        totalOptions: availablePaths.length
      };
    } catch (error) {
      logger.error('변경 경로 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 지원되는 모든 비자 타입 조회
   */
  async getSupportedVisaTypes() {
    try {
      const visaTypes = this.evaluationEngine.configManager.getSupportedVisaTypes();
      
      return visaTypes.map(visaType => {
        const config = this.evaluationEngine.configManager.getVisaConfig(visaType);
        return {
          code: visaType,
          name: config.name,
          category: config.category,
          supportedApplications: config.supported_applications,
          complexity: config.complexity
        };
      });
    } catch (error) {
      logger.error('지원 비자 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 배치 평가 (여러 건 동시 평가)
   */
  async batchEvaluate(evaluations) {
    const results = [];

    for (const evaluation of evaluations) {
      try {
        const result = await this.evaluate(evaluation);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          input: evaluation
        });
      }
    }

    return {
      total: evaluations.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * 평가 이력 조회
   */
  async getEvaluationHistory(userId, limit = 10) {
    try {
      // TODO: 데이터베이스에서 평가 이력 조회
      // 현재는 더미 데이터 반환
      return {
        userId,
        totalEvaluations: 0,
        recentEvaluations: [],
        limit
      };
    } catch (error) {
      logger.error('평가 이력 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = VisaService;