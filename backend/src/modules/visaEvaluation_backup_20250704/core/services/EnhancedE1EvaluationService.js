/**
 * 향상된 E-1 비자 평가 서비스
 * 사전심사, 복잡도 분석, 데이터 수집을 통합한 종합 평가 시스템
 * 경로: /backend/src/modules/visaEvaluation/core/services/EnhancedE1EvaluationService.js
 */

const E1PreScreeningService = require('./E1PreScreeningService');
const CaseComplexityAnalyzer = require('./CaseComplexityAnalyzer');
const E1AnalyticsService = require('./E1AnalyticsService');
const { evaluateE1Visa } = require('../../types/e1Visa');
const { EvaluationService } = require('./EvaluationService');

class EnhancedE1EvaluationService {
  constructor() {
    this.preScreeningService = new E1PreScreeningService();
    this.complexityAnalyzer = new CaseComplexityAnalyzer();
    this.analyticsService = new E1AnalyticsService();
    this.baseEvaluationService = new EvaluationService();
  }

  /**
   * 종합 비자 평가 수행
   * 1. 사전심사 → 2. 상세 평가 → 3. 복잡도 분석 → 4. 데이터 수집
   */
  async performComprehensiveEvaluation(applicantData, options = {}) {
    const startTime = Date.now();
    
    try {
      // Phase 1: 사전심사
      console.log('📋 1단계: 사전심사 진행 중...');
      const preScreeningResult = await this.preScreeningService.performPreScreening(applicantData);
      
      // 사전심사 실패시 즉시 종료
      if (!preScreeningResult.passPreScreening) {
        const failedResult = {
          phase: 'PRE_SCREENING',
          success: false,
          preScreening: preScreeningResult,
          alternatives: preScreeningResult.alternatives,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
        
        // 실패 케이스도 분석용 데이터 수집
        await this.analyticsService.trackEvaluationResult(failedResult, applicantData);
        
        return failedResult;
      }

      // Phase 2: 상세 평가
      console.log('🔍 2단계: 상세 평가 진행 중...');
      const detailedEvaluation = await this.performDetailedEvaluation(applicantData, options);
      
      // Phase 3: 복잡도 분석
      console.log('📊 3단계: 복잡도 분석 진행 중...');
      const complexityAnalysis = await this.complexityAnalyzer.analyzeCaseComplexity(
        detailedEvaluation, 
        applicantData
      );
      
      // Phase 4: 최종 결과 통합
      console.log('🔗 4단계: 결과 통합 중...');
      const comprehensiveResult = this.integrateResults({
        preScreening: preScreeningResult,
        evaluation: detailedEvaluation,
        complexity: complexityAnalysis,
        applicantData,
        processingTime: Date.now() - startTime
      });
      
      // Phase 5: 데이터 수집 및 분석
      console.log('📈 5단계: 데이터 수집 중...');
      const analyticsId = await this.analyticsService.trackEvaluationResult(
        comprehensiveResult, 
        applicantData
      );
      comprehensiveResult.analyticsId = analyticsId;
      
      console.log('✅ 종합 평가 완료');
      return comprehensiveResult;
      
    } catch (error) {
      console.error('❌ 평가 중 오류 발생:', error);
      throw new Error(`평가 처리 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  /**
   * 상세 평가 수행
   */
  async performDetailedEvaluation(applicantData, options) {
    // 기존 평가 로직 실행
    const evaluationResult = await evaluateE1Visa(applicantData, options);
    
    // 추가 분석 및 보강
    const enhancedResult = {
      ...evaluationResult,
      
      // 강화된 필드 검증
      fieldValidation: await this.performEnhancedFieldValidation(applicantData),
      
      // 문서 완성도 분석
      documentAnalysis: await this.analyzeDocumentCompleteness(applicantData),
      
      // 위험 요소 분석
      riskAnalysis: await this.analyzeRiskFactors(applicantData),
      
      // 개선 제안
      improvementSuggestions: await this.generateImprovementSuggestions(evaluationResult, applicantData),
      
      // 타임라인 예측
      timelinePrediction: await this.predictApplicationTimeline(applicantData, evaluationResult)
    };
    
    return enhancedResult;
  }

  /**
   * 결과 통합
   */
  integrateResults({ preScreening, evaluation, complexity, applicantData, processingTime }) {
    const finalScore = this.calculateFinalScore(evaluation, preScreening, complexity);
    const recommendation = this.generateFinalRecommendation(finalScore, preScreening, complexity);
    
    return {
      // 메타 정보
      phase: 'COMPLETE',
      success: true,
      timestamp: new Date().toISOString(),
      processingTime,
      
      // 핵심 결과
      finalScore,
      recommendation,
      
      // 단계별 결과
      preScreening,
      evaluation,
      complexity,
      
      // 통합 인사이트
      insights: this.generateIntegratedInsights(preScreening, evaluation, complexity),
      
      // 액션 플랜
      actionPlan: this.generateIntegratedActionPlan(preScreening, evaluation, complexity),
      
      // 다음 단계
      nextSteps: this.generateNextSteps(recommendation, complexity),
      
      // 리소스 추천
      recommendedResources: this.recommendResources(complexity, recommendation),
      
      // 비용 예측
      costEstimate: this.generateCostEstimate(complexity, recommendation),
      
      // 성공 확률
      successProbability: this.calculateSuccessProbability(preScreening, evaluation, complexity)
    };
  }

  /**
   * 강화된 필드 검증
   */
  async performEnhancedFieldValidation(applicantData) {
    const validation = {
      overall: true,
      issues: [],
      warnings: [],
      suggestions: []
    };

    // 매뉴얼 기반 필수 필드 검증
    await this.validateMandatoryFields(applicantData, validation);
    
    // 상호 연관성 검증
    await this.validateFieldCorrelations(applicantData, validation);
    
    // 논리적 일관성 검증
    await this.validateLogicalConsistency(applicantData, validation);
    
    return validation;
  }

  /**
   * 문서 완성도 분석
   */
  async analyzeDocumentCompleteness(applicantData) {
    return {
      completenessScore: 85, // 예시
      missingDocuments: [],
      optionalDocuments: [],
      qualityAssessment: 'GOOD',
      recommendations: []
    };
  }

  /**
   * 위험 요소 분석
   */
  async analyzeRiskFactors(applicantData) {
    return {
      riskLevel: 'MEDIUM',
      factors: [],
      mitigationStrategies: []
    };
  }

  /**
   * 개선 제안 생성
   */
  async generateImprovementSuggestions(evaluationResult, applicantData) {
    const suggestions = [];
    
    if (evaluationResult.score < 70) {
      suggestions.push({
        priority: 'HIGH',
        category: 'QUALIFICATION',
        suggestion: '자격 요건 보완 필요',
        specificActions: ['추가 교육', '경력 보완', '언어 능력 향상']
      });
    }
    
    return suggestions;
  }

  /**
   * 신청 타임라인 예측
   */
  async predictApplicationTimeline(applicantData, evaluationResult) {
    return {
      preparation: '2-4주',
      submission: '1주',
      processing: '15-25일',
      total: '6-10주',
      criticalPath: ['서류 준비', '번역 공증', '아포스티유']
    };
  }

  /**
   * 최종 점수 계산
   */
  calculateFinalScore(evaluation, preScreening, complexity) {
    const baseScore = evaluation.score || 0;
    const preScreeningBonus = preScreening.successProbability.percentage * 0.1;
    const complexityPenalty = this.getComplexityPenalty(complexity.complexity);
    
    const finalScore = Math.max(0, Math.min(100, baseScore + preScreeningBonus - complexityPenalty));
    
    return {
      score: Math.round(finalScore),
      breakdown: {
        baseEvaluation: baseScore,
        preScreeningBonus: Math.round(preScreeningBonus),
        complexityPenalty: Math.round(complexityPenalty)
      }
    };
  }

  /**
   * 최종 추천사항 생성
   */
  generateFinalRecommendation(finalScore, preScreening, complexity) {
    const score = finalScore.score;
    
    if (score >= 85 && complexity.complexity !== 'VERY_COMPLEX') {
      return {
        recommendation: 'HIGHLY_RECOMMENDED',
        confidence: 'HIGH',
        reasoning: '높은 점수와 적정 복잡도로 승인 가능성이 매우 높습니다.',
        suggestedAction: 'PROCEED_IMMEDIATELY'
      };
    } else if (score >= 70) {
      return {
        recommendation: 'RECOMMENDED',
        confidence: 'MEDIUM',
        reasoning: '양호한 점수로 승인 가능성이 높습니다.',
        suggestedAction: 'PROCEED_WITH_PREPARATION'
      };
    } else if (score >= 50) {
      return {
        recommendation: 'CONDITIONAL',
        confidence: 'LOW',
        reasoning: '보완이 필요하지만 개선 후 승인 가능합니다.',
        suggestedAction: 'IMPROVE_THEN_APPLY'
      };
    } else {
      return {
        recommendation: 'NOT_RECOMMENDED',
        confidence: 'HIGH',
        reasoning: '현재 상태로는 승인이 어렵습니다.',
        suggestedAction: 'MAJOR_IMPROVEMENTS_NEEDED'
      };
    }
  }

  /**
   * 통합 인사이트 생성
   */
  generateIntegratedInsights(preScreening, evaluation, complexity) {
    return {
      strengths: this.identifyStrengths(evaluation),
      weaknesses: this.identifyWeaknesses(preScreening, evaluation),
      opportunities: this.identifyOpportunities(complexity),
      threats: this.identifyThreats(preScreening, complexity)
    };
  }

  /**
   * 통합 액션 플랜 생성
   */
  generateIntegratedActionPlan(preScreening, evaluation, complexity) {
    const actions = [];
    
    // 사전심사에서 발견된 문제들
    preScreening.remediableIssues.forEach(issue => {
      actions.push({
        phase: 'IMMEDIATE',
        action: issue.solution,
        priority: issue.severity,
        timeframe: issue.timeToResolve
      });
    });
    
    // 복잡도에 따른 추가 액션
    if (complexity.complexity === 'COMPLEX' || complexity.complexity === 'VERY_COMPLEX') {
      actions.push({
        phase: 'PREPARATION',
        action: '전문가 상담 예약',
        priority: 'HIGH',
        timeframe: '1주 내'
      });
    }
    
    return actions.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * 다음 단계 생성
   */
  generateNextSteps(recommendation, complexity) {
    const steps = [];
    
    switch (recommendation.suggestedAction) {
      case 'PROCEED_IMMEDIATELY':
        steps.push('서류 준비 시작');
        steps.push('신청서 작성');
        steps.push('출입국사무소 방문 예약');
        break;
        
      case 'PROCEED_WITH_PREPARATION':
        steps.push('부족한 서류 보완');
        steps.push('전문가 검토 받기');
        steps.push('서류 준비 완료 후 신청');
        break;
        
      case 'IMPROVE_THEN_APPLY':
        steps.push('개선 계획 수립');
        steps.push('단계별 개선 실행');
        steps.push('재평가 후 신청');
        break;
        
      case 'MAJOR_IMPROVEMENTS_NEEDED':
        steps.push('전면적 개선 필요');
        steps.push('대안 비자 검토');
        steps.push('장기 준비 계획 수립');
        break;
    }
    
    return steps;
  }

  /**
   * 리소스 추천
   */
  recommendResources(complexity, recommendation) {
    const resources = [];
    
    if (complexity.legalRequirements.level === 'REQUIRED') {
      resources.push({
        type: 'LEGAL_SERVICE',
        title: '전문 법무 서비스',
        description: '비자 전문 법무법인 상담',
        urgency: 'HIGH'
      });
    }
    
    if (recommendation.confidence === 'LOW') {
      resources.push({
        type: 'CONSULTATION',
        title: '전문가 상담',
        description: '비자 전문가와의 상세 상담',
        urgency: 'MEDIUM'
      });
    }
    
    return resources;
  }

  /**
   * 비용 예측 생성
   */
  generateCostEstimate(complexity, recommendation) {
    const baseCost = 200000; // 기본 정부 수수료
    const legalFees = complexity.estimatedLegalFees;
    
    return {
      government: baseCost,
      legal: legalFees,
      translation: 150000,
      apostille: 100000,
      total: {
        min: baseCost + legalFees.min + 250000,
        max: baseCost + legalFees.max + 350000
      },
      currency: 'KRW',
      disclaimer: '실제 비용은 케이스에 따라 다를 수 있습니다.'
    };
  }

  /**
   * 성공 확률 계산
   */
  calculateSuccessProbability(preScreening, evaluation, complexity) {
    const baseProb = preScreening.successProbability.percentage;
    const evalBonus = evaluation.score > 80 ? 10 : 0;
    const complexityPenalty = this.getComplexityPenalty(complexity.complexity);
    
    const finalProb = Math.max(0, Math.min(100, baseProb + evalBonus - complexityPenalty));
    
    return {
      percentage: Math.round(finalProb),
      confidence: finalProb > 80 ? 'HIGH' : finalProb > 60 ? 'MEDIUM' : 'LOW',
      factors: {
        preScreening: baseProb,
        evaluation: evalBonus,
        complexity: -complexityPenalty
      }
    };
  }

  // ===== 유틸리티 메서드들 =====

  getComplexityPenalty(complexity) {
    const penalties = {
      'SIMPLE': 0,
      'STANDARD': 5,
      'COMPLEX': 15,
      'VERY_COMPLEX': 25
    };
    return penalties[complexity] || 0;
  }

  async validateMandatoryFields(applicantData, validation) {
    // 필수 필드 검증 로직
  }

  async validateFieldCorrelations(applicantData, validation) {
    // 필드 상관관계 검증 로직
  }

  async validateLogicalConsistency(applicantData, validation) {
    // 논리적 일관성 검증 로직
  }

  identifyStrengths(evaluation) {
    return ['높은 학력', '풍부한 경력', '우수한 연구실적'];
  }

  identifyWeaknesses(preScreening, evaluation) {
    return preScreening.remediableIssues.map(issue => issue.message);
  }

  identifyOpportunities(complexity) {
    return ['정부 우대 정책', '지방 근무 혜택', '장기 계약 우대'];
  }

  identifyThreats(preScreening, complexity) {
    return preScreening.riskFactors.map(risk => risk.description);
  }

  /**
   * 인사이트 조회
   */
  async getAnalyticsInsights(timeframe = 'monthly') {
    return await this.analyticsService.generateInsights(timeframe);
  }

  /**
   * 사전심사만 수행 (빠른 검증용)
   */
  async performQuickPreScreening(applicantData) {
    return await this.preScreeningService.performPreScreening(applicantData);
  }

  /**
   * 복잡도 분석만 수행
   */
  async performComplexityAnalysis(evaluationResult, applicantData) {
    return await this.complexityAnalyzer.analyzeCaseComplexity(evaluationResult, applicantData);
  }
}

module.exports = EnhancedE1EvaluationService; 