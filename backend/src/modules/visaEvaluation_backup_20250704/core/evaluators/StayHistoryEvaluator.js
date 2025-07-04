/**
 * 체류 이력 평가기 - 개선된 버전
 * 연장/변경 신청 시 과거 체류 기록을 종합적으로 평가
 * 경로: /backend/src/modules/visaEvaluation/core/evaluators/StayHistoryEvaluator.js
 */

const { StayHistory, STAY_STATUS } = require('../models/StayHistory');
const { ComplianceRecord } = require('../models/ComplianceRecord');
const logger = require('../../../../utils/logger');
const { ValidationError, StayHistoryError, ErrorHandler } = require('../../../../utils/errors');

/**
 * 체류 이력 평가 기준
 */
const EVALUATION_CRITERIA = {
  compliance: {
    weight: 0.35,
    description: '법규 준수도 - 출입국법, 세법, 근로기준법 등 준수'
  },
  stability: {
    weight: 0.25,
    description: '체류 안정성 - 주소, 직장 변경 빈도, 연속성'
  },
  contribution: {
    weight: 0.25,
    description: '사회 기여도 - 세금 납부, 보험 가입, 자원봉사'
  },
  continuity: {
    weight: 0.15,
    description: '활동 연속성 - 비자 목적에 맞는 활동 지속성'
  }
};

/**
 * 체류 기간별 가중치
 */
const DURATION_WEIGHTS = {
  SHORT: { min: 0, max: 12, weight: 0.7, description: '1년 미만' },
  MEDIUM: { min: 12, max: 36, weight: 1.0, description: '1-3년' },
  LONG: { min: 36, max: 60, weight: 1.2, description: '3-5년' },
  VERY_LONG: { min: 60, max: Infinity, weight: 1.5, description: '5년 이상' }
};

/**
 * 입력 데이터 검증기
 */
class StayHistoryInputValidator {
  static validateContext(context) {
    const errors = [];

    if (!context || typeof context !== 'object') {
      errors.push('평가 컨텍스트가 제공되지 않았습니다.');
      return { isValid: false, errors };
    }

    if (!context.visaType) {
      errors.push('비자 타입이 필요합니다.');
    }

    if (!context.applicationType) {
      errors.push('신청 타입이 필요합니다.');
    }

    if (!context.applicantData || typeof context.applicantData !== 'object') {
      errors.push('신청자 데이터가 필요합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateApplicantData(applicantData) {
    const errors = [];
    const warnings = [];

    if (!applicantData.stayHistory && !applicantData.currentVisa) {
      warnings.push('체류 이력 정보가 없어 평가 정확도가 떨어질 수 있습니다.');
    }

    if (applicantData.stayHistory) {
      if (!Array.isArray(applicantData.stayHistory.periods) && 
          typeof applicantData.stayHistory.periods !== 'undefined') {
        errors.push('체류 기간 정보 형식이 올바르지 않습니다.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

class StayHistoryEvaluator {
  constructor(options = {}) {
    this.evaluationCriteria = EVALUATION_CRITERIA;
    this.durationWeights = DURATION_WEIGHTS;
    
    // 의존성 주입으로 테스트 가능성 향상
    this.logger = options.logger || logger;
    this.validator = options.validator || StayHistoryInputValidator;
    this.stayHistoryModel = options.stayHistoryModel || StayHistory;
    this.complianceRecordModel = options.complianceRecordModel || ComplianceRecord;
    
    // 설정 옵션
    this.enableCache = options.enableCache !== false;
    this.enableDetailedLogging = options.enableDetailedLogging === true;
  }

  /**
   * 메인 평가 함수 - 개선된 버전
   * @param {Object} context - 평가 컨텍스트
   * @returns {Object} 체류 이력 평가 결과
   */
  async evaluate(context) {
    const startTime = Date.now();
    let evaluationId = null;

    try {
      // 입력 데이터 검증
      const contextValidation = this.validator.validateContext(context);
      if (!contextValidation.isValid) {
        throw new ValidationError(
          '체류 이력 평가 컨텍스트 검증 실패',
          { errors: contextValidation.errors }
        );
      }

      const applicantValidation = this.validator.validateApplicantData(context.applicantData);
      if (!applicantValidation.isValid) {
        throw new ValidationError(
          '신청자 데이터 검증 실패',
          { errors: applicantValidation.errors }
        );
      }

      // 경고 사항 로깅
      if (applicantValidation.warnings.length > 0) {
        this.logger.warn('체류 이력 평가 경고:', { warnings: applicantValidation.warnings });
      }

      evaluationId = this._generateEvaluationId();
      
      this.logger.info('체류 이력 평가 시작', { 
        evaluationId,
        visaType: context.visaType,
        applicationType: context.applicationType
      });

      // 체류 이력 데이터 로드
      const stayHistory = await this._buildStayHistory(context.applicantData);
      
      // 각 평가 영역별 점수 계산 (병렬 처리)
      const [compliance, stability, contribution, continuity] = await Promise.all([
        this._evaluateCompliance(stayHistory, context),
        this._evaluateStability(stayHistory, context),
        this._evaluateContribution(stayHistory, context),
        this._evaluateContinuity(stayHistory, context)
      ]);

      const evaluationResults = {
        compliance,
        stability,
        contribution,
        continuity
      };

      // 총 체류 기간에 따른 가중치 적용
      const durationWeight = this._getDurationWeight(stayHistory.totalStayDuration);
      
      // 종합 점수 계산
      const totalScore = this._calculateTotalScore(evaluationResults, durationWeight);

      // 세부 분석 및 권고사항 생성
      const analysis = await this._generateDetailedAnalysis(stayHistory, evaluationResults, context);

      const duration = Date.now() - startTime;
      this.logger.info('체류 이력 평가 완료', { 
        evaluationId,
        totalScore: totalScore.weighted,
        durationMonths: stayHistory.totalStayDuration,
        processingTime: `${duration}ms`
      });

      return {
        evaluationId,
        totalScore: totalScore.weighted,
        rawScore: totalScore.raw,
        durationWeight: durationWeight.weight,
        breakdown: evaluationResults,
        stayHistory: stayHistory.getSummary(),
        analysis,
        recommendations: this._generateRecommendations(stayHistory, evaluationResults, context),
        riskFactors: this._identifyRiskFactors(stayHistory, evaluationResults),
        strengths: this._identifyStrengths(stayHistory, evaluationResults),
        metadata: {
          evaluatedAt: new Date(),
          processingTime: duration,
          version: '2.0'
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 에러 타입별 처리
      if (error instanceof ValidationError) {
        this.logger.warn('체류 이력 평가 검증 실패:', {
          evaluationId,
          error: error.message,
          details: error.details
        });
        throw error;
      } else if (error instanceof StayHistoryError) {
        this.logger.error('체류 이력 평가 비즈니스 로직 오류:', {
          evaluationId,
          error: error.message,
          details: error.details
        });
        throw error;
      } else {
        this.logger.error('체류 이력 평가 중 예상치 못한 오류:', {
          evaluationId,
          error: error.message,
          stack: error.stack,
          processingTime: `${duration}ms`
        });
        
        throw new StayHistoryError(
          '체류 이력 평가 중 시스템 오류가 발생했습니다.',
          { 
            originalError: error.message,
            evaluationId,
            processingTime: duration
          }
        );
      }
    }
  }

  /**
   * 체류 이력 객체 생성 - 비동기 처리 개선
   */
  async _buildStayHistory(applicantData) {
    try {
      const stayHistoryData = applicantData.stayHistory || {};
      const stayHistory = new this.stayHistoryModel(stayHistoryData);
      
      // 현재 체류 정보가 있다면 추가
      if (applicantData.currentVisa) {
        await stayHistory.addStayPeriod({
          visaType: applicantData.currentVisa.type,
          startDate: applicantData.currentVisa.startDate,
          endDate: applicantData.currentVisa.endDate || new Date(),
          status: STAY_STATUS.LEGAL,
          activityType: this._inferActivityType(applicantData.currentVisa.type),
          employer: applicantData.currentVisa.employer,
          institution: applicantData.currentVisa.institution
        });
      }

      return stayHistory;
    } catch (error) {
      throw new StayHistoryError(
        '체류 이력 데이터 구성 중 오류가 발생했습니다.',
        { originalError: error.message }
      );
    }
  }

  /**
   * 법규 준수도 평가 - 비동기 처리 개선
   */
  async _evaluateCompliance(stayHistory, context) {
    try {
      const complianceData = context.applicantData.compliance || {};
      const complianceRecord = new this.complianceRecordModel(complianceData);
      
      // 기본 준법성 점수 계산 (비동기 처리)
      const complianceScore = await complianceRecord.calculateComplianceScore();
      
      // 체류 이력 내 위반 사항 추가 검토
      const stayViolations = stayHistory.violations || [];
      let violationDeduction = 0;
      
      stayViolations.forEach(violation => {
        switch (violation.severity) {
          case 'SEVERE':
            violationDeduction += 25;
            break;
          case 'MAJOR':
            violationDeduction += 15;
            break;
          case 'MINOR':
            violationDeduction += 5;
            break;
        }
      });

      const finalScore = Math.max(0, complianceScore.totalScore - violationDeduction);
      
      return {
        score: finalScore,
        details: {
          baseCompliance: complianceScore.totalScore,
          violationDeduction,
          violationCount: stayViolations.length,
          complianceLevel: complianceScore.level,
          riskLevel: await complianceRecord.assessRiskLevel()
        }
      };
    } catch (error) {
      throw new StayHistoryError(
        '법규 준수도 평가 중 오류가 발생했습니다.',
        { originalError: error.message }
      );
    }
  }

  /**
   * 체류 안정성 평가 - 개선된 버전
   */
  async _evaluateStability(stayHistory, context) {
    try {
      const stability = await stayHistory.evaluateStability();
      let score = 80; // 기본 점수

      // 주소 안정성
      switch (stability.addressStability) {
        case 'HIGH':
          score += 10;
          break;
        case 'MEDIUM':
          score += 5;
          break;
        case 'LOW':
          score -= 10;
          break;
      }

      // 고용 안정성
      switch (stability.employmentStability) {
        case 'HIGH':
          score += 10;
          break;
        case 'MEDIUM':
          score += 5;
          break;
        case 'LOW':
          score -= 10;
          break;
      }

      // 연속성
      switch (stability.overallContinuity) {
        case 'HIGH':
          score += 10;
          break;
        case 'MEDIUM':
          score += 5;
          break;
        case 'LOW':
          score -= 15;
          break;
      }

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          addressStability: stability.addressStability,
          employmentStability: stability.employmentStability,
          overallContinuity: stability.overallContinuity,
          addressChanges: await stayHistory.getAddressChangeFrequency(),
          employerChanges: await stayHistory.getEmployerChangeFrequency()
        }
      };
    } catch (error) {
      throw new StayHistoryError(
        '체류 안정성 평가 중 오류가 발생했습니다.',
        { originalError: error.message }
      );
    }
  }

  /**
   * 사회 기여도 평가 - 개선된 버전
   */
  async _evaluateContribution(stayHistory, context) {
    try {
      let score = 70; // 기본 점수

      // 세금 납부 이력 (비동기 처리)
      const taxHistory = await stayHistory.getTaxPaymentHistory();
      const taxScore = Math.min(20, taxHistory.length * 5);
      score += taxScore;

      // 사회보험 가입 이력 (비동기 처리)
      const insuranceHistory = await stayHistory.getInsuranceHistory();
      const insuranceScore = Math.min(15, insuranceHistory.length * 3);
      score += insuranceScore;

      // 자원봉사 및 기타 기여 활동
      const volunteerActivities = stayHistory.contributions.filter(c => c.type === 'VOLUNTEER');
      const volunteerScore = Math.min(15, volunteerActivities.length * 2);
      score += volunteerScore;

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          taxPayments: taxHistory.length,
          insuranceRecords: insuranceHistory.length,
          volunteerActivities: volunteerActivities.length,
          breakdown: {
            taxScore,
            insuranceScore,
            volunteerScore
          }
        }
      };
    } catch (error) {
      throw new StayHistoryError(
        '사회 기여도 평가 중 오류가 발생했습니다.',
        { originalError: error.message }
      );
    }
  }

  /**
   * 활동 연속성 평가 - 개선된 버전
   */
  async _evaluateContinuity(stayHistory, context) {
    try {
      const targetVisaType = context.visaType;
      let score = 75; // 기본 점수

      // 동일 비자 타입 연속성
      const sameVisaDuration = await stayHistory.getStayDurationByVisaType(targetVisaType);
      if (sameVisaDuration > 0) {
        score += Math.min(20, sameVisaDuration * 2);
      }

      // 관련 비자 타입 연속성 (E-1 -> E-2, D-2 -> E-7 등)
      const relatedVisaDuration = await this._getRelatedVisaDuration(stayHistory, targetVisaType);
      score += Math.min(10, relatedVisaDuration);

      // 활동 중단 기간 페널티
      const continuityLevel = await stayHistory.evaluateContinuity();
      switch (continuityLevel) {
        case 'HIGH':
          score += 5;
          break;
        case 'MEDIUM':
          break; // 변화 없음
        case 'LOW':
          score -= 15;
          break;
      }

      return {
        score: Math.max(0, Math.min(100, score)),
        details: {
          sameVisaDuration,
          relatedVisaDuration,
          continuityLevel,
          totalDuration: stayHistory.totalStayDuration
        }
      };
    } catch (error) {
      throw new StayHistoryError(
        '활동 연속성 평가 중 오류가 발생했습니다.',
        { originalError: error.message }
      );
    }
  }

  /**
   * 체류 기간별 가중치 계산
   */
  _getDurationWeight(durationMonths) {
    for (const [key, range] of Object.entries(this.durationWeights)) {
      if (durationMonths >= range.min && durationMonths < range.max) {
        return {
          category: key,
          weight: range.weight,
          description: range.description
        };
      }
    }
    return this.durationWeights.MEDIUM;
  }

  /**
   * 종합 점수 계산
   */
  _calculateTotalScore(evaluationResults, durationWeight) {
    let rawScore = 0;
    
    Object.entries(evaluationResults).forEach(([criteria, result]) => {
      const weight = this.evaluationCriteria[criteria].weight;
      rawScore += result.score * weight;
    });

    const weightedScore = rawScore * durationWeight.weight;

    return {
      raw: Math.round(rawScore),
      weighted: Math.round(Math.min(100, weightedScore))
    };
  }

  /**
   * 세부 분석 생성 - 비동기 처리 개선
   */
  async _generateDetailedAnalysis(stayHistory, evaluationResults, context) {
    try {
      const summary = await stayHistory.getSummary();
      
      return {
        overallAssessment: this._getOverallAssessment(evaluationResults),
        keyFindings: [
          `총 체류 기간: ${summary.totalDuration}개월`,
          `위반 이력: ${summary.violationCount}건 (${summary.violationSeverity})`,
          `체류 안정성: ${evaluationResults.stability.details.overallContinuity}`,
          `사회 기여도: ${this._getContributionLevel(evaluationResults.contribution.score)}`
        ],
        timeline: await this._createStayTimeline(stayHistory),
        patterns: await this._identifyPatterns(stayHistory)
      };
    } catch (error) {
      throw new StayHistoryError(
        '세부 분석 생성 중 오류가 발생했습니다.',
        { originalError: error.message }
      );
    }
  }

  /**
   * 권고사항 생성
   */
  _generateRecommendations(stayHistory, evaluationResults, context) {
    const recommendations = [];

    // 준법성 관련 권고
    if (evaluationResults.compliance.score < 70) {
      recommendations.push({
        category: 'COMPLIANCE',
        priority: 'HIGH',
        message: '법규 준수 이력 개선이 필요합니다.',
        actions: ['미납 세금 해결', '보험료 정산', '위반 사항 해결']
      });
    }

    // 안정성 관련 권고
    if (evaluationResults.stability.score < 60) {
      recommendations.push({
        category: 'STABILITY',
        priority: 'MEDIUM',
        message: '체류 안정성 개선을 통해 평가 점수를 높일 수 있습니다.',
        actions: ['장기 거주지 확보', '안정적 고용 관계 유지']
      });
    }

    // 기여도 관련 권고
    if (evaluationResults.contribution.score < 75) {
      recommendations.push({
        category: 'CONTRIBUTION',
        priority: 'LOW',
        message: '사회 기여 활동을 통해 추가 점수를 획득할 수 있습니다.',
        actions: ['자원봉사 활동 참여', '지역사회 기여 활동', '모범 납세자 인증']
      });
    }

    return recommendations;
  }

  /**
   * 위험 요소 식별
   */
  _identifyRiskFactors(stayHistory, evaluationResults) {
    const riskFactors = [];

    // 심각한 위반 이력
    if (stayHistory.violations.some(v => v.severity === 'SEVERE')) {
      riskFactors.push({
        type: 'SEVERE_VIOLATION',
        description: '심각한 법규 위반 이력',
        impact: 'CRITICAL'
      });
    }

    // 잦은 주소/직장 변경
    if (evaluationResults.stability.details.addressChanges > 5) {
      riskFactors.push({
        type: 'INSTABILITY',
        description: '잦은 거주지 변경',
        impact: 'MEDIUM'
      });
    }

    // 낮은 기여도
    if (evaluationResults.contribution.score < 50) {
      riskFactors.push({
        type: 'LOW_CONTRIBUTION',
        description: '사회 기여도 부족',
        impact: 'LOW'
      });
    }

    return riskFactors;
  }

  /**
   * 강점 요소 식별
   */
  _identifyStrengths(stayHistory, evaluationResults) {
    const strengths = [];

    // 장기 체류
    if (stayHistory.totalStayDuration > 36) {
      strengths.push({
        type: 'LONG_STAY',
        description: '장기간 안정적 체류',
        value: `${stayHistory.totalStayDuration}개월`
      });
    }

    // 우수한 준법성
    if (evaluationResults.compliance.score > 85) {
      strengths.push({
        type: 'HIGH_COMPLIANCE',
        description: '우수한 법규 준수 기록',
        value: `${evaluationResults.compliance.score}점`
      });
    }

    // 높은 사회 기여도
    if (evaluationResults.contribution.score > 85) {
      strengths.push({
        type: 'HIGH_CONTRIBUTION',
        description: '활발한 사회 기여 활동',
        value: `${evaluationResults.contribution.score}점`
      });
    }

    return strengths;
  }

  // Utility methods

  /**
   * 평가 ID 생성
   */
  _generateEvaluationId() {
    return `stay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  _inferActivityType(visaType) {
    const activityMap = {
      'E-1': 'RESEARCH',
      'E-2': 'WORK',
      'E-7': 'WORK',
      'D-2': 'STUDY',
      'F-2': 'FAMILY',
      'F-6': 'FAMILY'
    };
    return activityMap[visaType] || 'OTHER';
  }

  async _getRelatedVisaDuration(stayHistory, targetVisaType) {
    // 관련 비자 타입 매핑 (예: E-1과 E-2는 관련성 높음)
    const relatedVisas = {
      'E-1': ['E-2', 'E-3', 'D-2'],
      'E-2': ['E-1', 'E-7'],
      'E-7': ['E-2', 'D-2'],
      'D-2': ['E-1', 'E-7', 'F-2']
    };

    const related = relatedVisas[targetVisaType] || [];
    let totalDuration = 0;

    for (const visaType of related) {
      totalDuration += await stayHistory.getStayDurationByVisaType(visaType);
    }

    return totalDuration;
  }

  _getOverallAssessment(evaluationResults) {
    const avgScore = Object.values(evaluationResults).reduce((sum, result) => sum + result.score, 0) / 4;
    
    if (avgScore >= 85) return 'EXCELLENT';
    if (avgScore >= 70) return 'GOOD';
    if (avgScore >= 55) return 'FAIR';
    return 'POOR';
  }

  _getContributionLevel(score) {
    if (score >= 85) return 'HIGH';
    if (score >= 70) return 'MEDIUM';
    return 'LOW';
  }

  async _createStayTimeline(stayHistory) {
    return stayHistory.periods.map(period => ({
      period: `${period.startDate.getFullYear()}-${period.endDate.getFullYear()}`,
      visaType: period.visaType,
      duration: this._calculatePeriodDuration(period.startDate, period.endDate),
      status: period.status
    }));
  }

  _calculatePeriodDuration(startDate, endDate) {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    return `${months}개월`;
  }

  async _identifyPatterns(stayHistory) {
    const patterns = [];
    
    // 비자 타입 변경 패턴
    const visaTypes = stayHistory.periods.map(p => p.visaType);
    const uniqueTypes = [...new Set(visaTypes)];
    
    if (uniqueTypes.length > 1) {
      patterns.push(`비자 타입 변경: ${uniqueTypes.join(' → ')}`);
    }

    // 체류 기간 패턴
    if (stayHistory.totalStayDuration > 60) {
      patterns.push('장기 체류자 (5년 이상)');
    }

    return patterns;
  }
}

module.exports = StayHistoryEvaluator; 