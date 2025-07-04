/**
 * 비자 평가 규칙 엔진
 * 경로: /backend/src/modules/visaEvaluation/core/rules/RuleEngine.js
 */

const logger = require('../../../../utils/logger');

/**
 * 규칙 기반 평가 엔진
 * 동적으로 평가 규칙을 추가/수정/삭제 가능
 */
class RuleEngine {
  constructor() {
    this.rules = new Map();
    this.ruleCategories = new Map();
    this.evaluationMetrics = new Map();
    
    logger.info('RuleEngine 초기화');
    
    // 기본 규칙들 로드
    this._loadDefaultRules();
  }
  
  /**
   * 규칙 추가
   * @param {string} ruleId - 규칙 고유 ID
   * @param {Object} ruleConfig - 규칙 설정
   */
  addRule(ruleId, ruleConfig) {
    const {
      category,
      priority = 1,
      condition,
      action,
      weight = 1,
      description,
      enabled = true
    } = ruleConfig;
    
    if (!category || !condition || !action) {
      throw new Error('규칙에는 category, condition, action이 필수입니다.');
    }
    
    const rule = {
      id: ruleId,
      category,
      priority,
      condition,
      action,
      weight,
      description,
      enabled,
      createdAt: new Date(),
      executionCount: 0,
      lastExecuted: null
    };
    
    this.rules.set(ruleId, rule);
    
    // 카테고리별 규칙 그룹핑
    if (!this.ruleCategories.has(category)) {
      this.ruleCategories.set(category, []);
    }
    this.ruleCategories.get(category).push(ruleId);
    
    logger.debug(`규칙 추가: ${ruleId} (${category})`);
    
    return this;
  }
  
  /**
   * 카테고리별 규칙 평가
   * @param {string} category - 평가할 카테고리
   * @param {Object} context - 평가 컨텍스트
   * @returns {Object} 평가 결과
   */
  evaluateCategory(category, context) {
    const categoryRules = this.ruleCategories.get(category) || [];
    const results = {
      category,
      score: 0,
      maxScore: 0,
      appliedRules: [],
      issues: [],
      strengths: [],
      recommendations: []
    };
    
    if (categoryRules.length === 0) {
      logger.warn(`카테고리 '${category}'에 적용할 규칙이 없습니다.`);
      return results;
    }
    
    // 우선순위별로 규칙 정렬
    const sortedRules = categoryRules
      .map(ruleId => this.rules.get(ruleId))
      .filter(rule => rule && rule.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    logger.debug(`카테고리 '${category}' 평가 시작 (규칙 ${sortedRules.length}개)`);
    
    // 규칙 실행
    for (const rule of sortedRules) {
      try {
        // 조건 검사
        if (rule.condition(context)) {
          // 액션 실행
          const actionResult = rule.action(context);
          
          // 결과 집계
          if (actionResult) {
            results.score += (actionResult.score || 0) * rule.weight;
            results.maxScore += 100 * rule.weight;
            
            if (actionResult.issues) {
              results.issues.push(...actionResult.issues);
            }
            
            if (actionResult.strengths) {
              results.strengths.push(...actionResult.strengths);
            }
            
            if (actionResult.recommendations) {
              results.recommendations.push(...actionResult.recommendations);
            }
            
            results.appliedRules.push({
              ruleId: rule.id,
              score: actionResult.score,
              weight: rule.weight,
              description: rule.description
            });
          }
          
          // 실행 통계 업데이트
          rule.executionCount++;
          rule.lastExecuted = new Date();
        }
        
      } catch (error) {
        logger.error(`규칙 실행 오류 (${rule.id}):`, error);
        results.issues.push({
          category: 'system',
          severity: 'high',
          message: `규칙 실행 중 오류 발생: ${rule.id}`,
          ruleId: rule.id
        });
      }
    }
    
    // 최종 점수 계산 (0-100 범위로 정규화)
    if (results.maxScore > 0) {
      results.score = Math.round((results.score / results.maxScore) * 100);
    }
    
    logger.debug(`카테고리 '${category}' 평가 완료`, {
      finalScore: results.score,
      appliedRulesCount: results.appliedRules.length,
      issuesCount: results.issues.length
    });
    
    return results;
  }
  
  /**
   * 전체 평가 실행
   * @param {Object} context - 평가 컨텍스트
   * @returns {Object} 전체 평가 결과
   */
  evaluate(context) {
    const startTime = Date.now();
    const results = {
      totalScore: 0,
      categoryResults: {},
      overallIssues: [],
      overallStrengths: [],
      overallRecommendations: [],
      metadata: {
        evaluationTime: 0,
        rulesExecuted: 0,
        categoriesEvaluated: 0
      }
    };
    
    logger.info('RuleEngine 전체 평가 시작');
    
    const categories = Array.from(this.ruleCategories.keys());
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    // 카테고리별 가중치 (설정 가능)
    const categoryWeights = {
      'preCheck': 0.05,
      'applicationType': 0.1,
      'basicQualification': 0.2,
      'documentCompleteness': 0.1,
      'experience': 0.2,
      'language': 0.1,
      'financial': 0.1,
      'specialConditions': 0.05,
      'riskAssessment': 0.1
    };
    
    // 각 카테고리 평가
    for (const category of categories) {
      const categoryResult = this.evaluateCategory(category, context);
      results.categoryResults[category] = categoryResult;
      
      const weight = categoryWeights[category] || 1;
      totalWeightedScore += categoryResult.score * weight;
      totalWeight += weight;
      
      // 이슈, 강점, 추천사항 통합
      results.overallIssues.push(...categoryResult.issues);
      results.overallStrengths.push(...categoryResult.strengths);
      results.overallRecommendations.push(...categoryResult.recommendations);
      
      results.metadata.rulesExecuted += categoryResult.appliedRules.length;
    }
    
    // 최종 점수 계산
    if (totalWeight > 0) {
      results.totalScore = Math.round(totalWeightedScore / totalWeight);
    }
    
    // 메타데이터 완성
    results.metadata.evaluationTime = Date.now() - startTime;
    results.metadata.categoriesEvaluated = categories.length;
    
    logger.info('RuleEngine 전체 평가 완료', {
      totalScore: results.totalScore,
      evaluationTime: results.metadata.evaluationTime,
      rulesExecuted: results.metadata.rulesExecuted
    });
    
    return results;
  }
  
  /**
   * 규칙 제거
   * @param {string} ruleId - 제거할 규칙 ID
   */
  removeRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      
      // 카테고리에서도 제거
      const categoryRules = this.ruleCategories.get(rule.category);
      if (categoryRules) {
        const index = categoryRules.indexOf(ruleId);
        if (index > -1) {
          categoryRules.splice(index, 1);
        }
      }
      
      logger.debug(`규칙 제거: ${ruleId}`);
      return true;
    }
    return false;
  }
  
  /**
   * 규칙 상태 토글
   * @param {string} ruleId - 토글할 규칙 ID
   */
  toggleRule(ruleId) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      logger.debug(`규칙 상태 변경: ${ruleId} -> ${rule.enabled ? 'enabled' : 'disabled'}`);
      return rule.enabled;
    }
    return null;
  }
  
  /**
   * 평가 통계 조회
   * @returns {Object} 규칙 실행 통계
   */
  getStatistics() {
    const stats = {
      totalRules: this.rules.size,
      enabledRules: 0,
      categories: {},
      mostUsedRules: [],
      recentlyUsedRules: []
    };
    
    const rulesArray = Array.from(this.rules.values());
    
    // 활성화된 규칙 수
    stats.enabledRules = rulesArray.filter(rule => rule.enabled).length;
    
    // 카테고리별 통계
    for (const [category, ruleIds] of this.ruleCategories) {
      stats.categories[category] = {
        totalRules: ruleIds.length,
        enabledRules: ruleIds.filter(id => {
          const rule = this.rules.get(id);
          return rule && rule.enabled;
        }).length
      };
    }
    
    // 가장 많이 사용된 규칙 (상위 5개)
    stats.mostUsedRules = rulesArray
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 5)
      .map(rule => ({
        id: rule.id,
        category: rule.category,
        executionCount: rule.executionCount,
        description: rule.description
      }));
    
    // 최근 사용된 규칙 (상위 5개)
    stats.recentlyUsedRules = rulesArray
      .filter(rule => rule.lastExecuted)
      .sort((a, b) => new Date(b.lastExecuted) - new Date(a.lastExecuted))
      .slice(0, 5)
      .map(rule => ({
        id: rule.id,
        category: rule.category,
        lastExecuted: rule.lastExecuted,
        description: rule.description
      }));
    
    return stats;
  }
  
  /**
   * 기본 규칙들 로드
   */
  _loadDefaultRules() {
    logger.debug('기본 규칙 로드 시작');
    
    // === 사전 검증 규칙 ===
    this.addRule('precheck-nationality', {
      category: 'preCheck',
      priority: 10,
      description: '국적 정보 확인',
      condition: (context) => true,
      action: (context) => {
        const data = context.applicantData;
        if (!data.evaluation?.nationality) {
          return {
            score: 0,
            issues: [{
              category: 'basic_info',
              severity: 'high',
              message: '국적 정보가 누락되었습니다.',
              field: 'nationality'
            }]
          };
        }
        return { score: 100 };
      }
    });
    
    this.addRule('precheck-age', {
      category: 'preCheck',
      priority: 8,
      description: '나이 정보 확인',
      condition: (context) => true,
      action: (context) => {
        const data = context.applicantData;
        const age = data.evaluation?.age;
        
        if (!age) {
          return {
            score: 50,
            issues: [{
              category: 'basic_info',
              severity: 'medium',
              message: '나이 정보가 누락되었습니다.',
              field: 'age'
            }]
          };
        }
        
        if (age < 18 || age > 65) {
          return {
            score: 70,
            issues: [{
              category: 'basic_info',
              severity: 'medium',
              message: '일반적인 비자 신청 연령대를 벗어납니다.',
              field: 'age'
            }]
          };
        }
        
        return { score: 100 };
      }
    });
    
    // === 기본 자격요건 규칙 ===
    this.addRule('qualification-education', {
      category: 'basicQualification',
      priority: 10,
      description: '학력 요건 평가',
      condition: (context) => true,
      action: (context) => {
        const data = context.applicantData.evaluation;
        const educationScores = {
          'phd': 100,
          'master': 90,
          'bachelor': 80,
          'associate': 60,
          'high_school': 40,
          'other': 20
        };
        
        const score = educationScores[data.educationLevel] || 50;
        
        const result = { score };
        
        if (score >= 80) {
          result.strengths = [{
            category: 'education',
            message: '우수한 학력 조건을 갖추고 있습니다.',
            field: 'educationLevel'
          }];
        } else if (score < 60) {
          result.recommendations = [{
            category: 'education',
            message: '추가 학력 증명이나 전문 자격증을 준비하시기 바랍니다.',
            field: 'educationLevel'
          }];
        }
        
        return result;
      }
    });
    
    this.addRule('qualification-experience', {
      category: 'basicQualification',
      priority: 9,
      description: '경력 요건 평가',
      condition: (context) => true,
      action: (context) => {
        const data = context.applicantData.evaluation;
        const experience = data.experienceYears || 0;
        
        let score;
        if (experience >= 10) score = 100;
        else if (experience >= 5) score = 90;
        else if (experience >= 3) score = 75;
        else if (experience >= 1) score = 60;
        else score = 30;
        
        const result = { score };
        
        if (experience >= 5) {
          result.strengths = [{
            category: 'experience',
            message: '충분한 경력을 보유하고 있습니다.',
            field: 'experienceYears'
          }];
        } else if (experience < 2) {
          result.recommendations = [{
            category: 'experience',
            message: '관련 분야 경력을 더 쌓으시기 바랍니다.',
            field: 'experienceYears'
          }];
        }
        
        return result;
      }
    });
    
    // === 리스크 평가 규칙 ===
    this.addRule('risk-criminal-record', {
      category: 'riskAssessment',
      priority: 10,
      description: '범죄 경력 확인',
      condition: (context) => true,
      action: (context) => {
        const data = context.applicantData.evaluation;
        
        if (data.hasCriminalRecord) {
          return {
            score: 0,
            issues: [{
              category: 'background',
              severity: 'critical',
              message: '범죄 경력이 비자 승인에 부정적 영향을 미칠 수 있습니다.',
              field: 'hasCriminalRecord'
            }]
          };
        }
        
        return {
          score: 100,
          strengths: [{
            category: 'background',
            message: '깨끗한 신원 조회 결과입니다.',
            field: 'hasCriminalRecord'
          }]
        };
      }
    });
    
    this.addRule('risk-health-check', {
      category: 'riskAssessment',
      priority: 8,
      description: '건강 진단 확인',
      condition: (context) => true,
      action: (context) => {
        const data = context.applicantData.evaluation;
        
        if (data.hasHealthCheck === false) {
          return {
            score: 60,
            recommendations: [{
              category: 'health',
              message: '건강진단서 준비가 필요합니다.',
              field: 'hasHealthCheck'
            }]
          };
        }
        
        if (data.hasHealthIssues) {
          return {
            score: 70,
            issues: [{
              category: 'health',
              severity: 'medium',
              message: '건강 상태 문제가 검토될 수 있습니다.',
              field: 'hasHealthIssues'
            }]
          };
        }
        
        return { score: 100 };
      }
    });
    
    // === 비자별 특화 규칙 로드 ===
    
    // E-1 규칙 로드
    try {
      const loadE1Rules = require('./e1/E1Rules');
      loadE1Rules(this);
      logger.info('E-1 규칙 로드 성공');
    } catch (error) {
      logger.warn('E-1 규칙 로드 실패:', error.message);
    }
    
    // 향후 다른 비자 규칙들도 여기에 추가
    // E-2, E-3, E-4, E-5, E-6, E-7, E-8, E-9, E-10 규칙들...
    
    logger.info(`기본 규칙 로드 완료 (총 ${this.rules.size}개 규칙)`);
  }
}

module.exports = RuleEngine; 