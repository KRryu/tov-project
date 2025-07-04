/**
 * 기본 비자 평가기 클래스 - 개선된 버전 (v2.0)
 * 경로: /backend/src/modules/visaEvaluation/core/evaluators/BaseEvaluator.js
 */

const { APPLICATION_TYPES } = require('../models/ApplicationType');
const { EVALUATION_STATUS, CONFIDENCE_LEVELS } = require('../models/EvaluationResult');

// === 🔄 기존 유틸리티 모듈들 활용 ===
const { normalizeVisaCode, formatVisaTypeForDisplay, getVisaName } = require('../../../../utils/visaType');
const { normalizeNumericFields, normalizeBooleanFields } = require('../../../../utils/dataNormalizer');
const logger = require('../../../../utils/logger');

// === 🚀 새로운 개선 시스템들 ===
const RuleEngine = require('../rules/RuleEngine');
const cacheManager = require('../../../../utils/cacheManager');
const progressTracker = require('../../../../utils/progressTracker');

/**
 * 모든 비자 평가기의 기본 클래스 - 개선된 버전 (v2.0)
 * 전문가 조언을 반영한 11단계 평가 흐름을 제공
 * 규칙 엔진, 캐싱, 진행상황 추적 기능 통합
 */
class BaseEvaluator {
  constructor(visaType) {
    this.visaType = formatVisaTypeForDisplay(normalizeVisaCode(visaType));
    this.visaName = getVisaName(this.visaType);
    this.evaluationSteps = [
      'preCheck',           // 1. 사전 검증
      'applicationTypeCheck', // 2. 신청 유형 판단
      'basicQualification', // 3. 기본 자격요건
      'documentCompleteness', // 4. 서류 완성도
      'experienceEvaluation', // 5. 경력/경험 평가
      'languageProficiency', // 6. 언어능력
      'financialCapability', // 7. 재정능력
      'specialConditions',  // 8. 특별 조건
      'riskAssessment',     // 9. 리스크 평가
      'comprehensiveScore', // 10. 종합 점수 계산
      'finalDecision'       // 11. 최종 판정
    ];
    
    // === 🚀 새로운 시스템들 초기화 ===
    this.ruleEngine = new RuleEngine();
    this.useCache = true;  // 캐시 사용 여부
    this.trackProgress = true;  // 진행상황 추적 여부
    
    logger.info(`BaseEvaluator v2.0 초기화: ${this.visaType} (${this.visaName})`);
  }
  
  /**
   * 메인 평가 함수 - 개선된 버전 (v2.0)
   * 캐싱, 진행상황 추적, 규칙 엔진 통합
   * @param {Object} applicantData - 신청자 데이터
   * @param {Object} options - 평가 옵션
   * @returns {Object} 평가 결과
   */
  async evaluate(applicantData, options = {}) {
    const evaluationId = options.evaluationId || `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let processId = null;
    
    try {
      logger.info(`기본 평가기 v2.0 시작: ${this.visaType} (ID: ${evaluationId})`);
      
      // === 🔍 캐시 확인 ===
      if (this.useCache && !options.forceEvaluation) {
        const cacheKey = cacheManager.generateEvaluationKey(this.visaType, applicantData, options);
        const cachedResult = cacheManager.getEvaluationResult(cacheKey);
        
        if (cachedResult) {
          logger.info(`캐시된 평가 결과 반환: ${this.visaType} (키: ${cacheKey})`);
          return {
            ...cachedResult,
            evaluationId,
            _fromCache: true,
            _cacheKey: cacheKey
          };
        }
      }
      
      // === 📊 진행상황 추적 시작 ===
      if (this.trackProgress) {
        processId = `eval_${evaluationId}`;
        progressTracker.startProcess(processId, 'evaluation', {
          visaType: this.visaType,
          userId: options.userId,
          evaluationId
        });
      }
      
      // 데이터 정규화 (기존 유틸리티 활용)
      const normalizedData = this._normalizeInputData(applicantData);
      
      // 평가 컨텍스트 초기화
      const context = {
        visaType: this.visaType,
        visaName: this.visaName,
        applicantData: normalizedData,
        applicationType: this._determineApplicationType(normalizedData),
        scores: {},
        issues: [],
        strengths: [],
        weaknesses: [],
        startTime: Date.now(),
        evaluationId,
        processId,
        options
      };
      
      logger.debug('평가 컨텍스트 초기화', {
        visaType: context.visaType,
        applicationType: context.applicationType,
        evaluationId
      });
      
      // === 🤖 규칙 엔진 활용 여부 확인 ===
      const useRuleEngine = options.useRuleEngine !== false; // 기본값: true
      
      if (useRuleEngine) {
        // 규칙 엔진 기반 평가 실행
        const ruleEngineResult = this.ruleEngine.evaluate(context);
        
        // 규칙 엔진 결과를 컨텍스트에 통합
        context.ruleEngineResult = ruleEngineResult;
        context.scores = { ...context.scores, ...ruleEngineResult.categoryResults };
        context.issues.push(...ruleEngineResult.overallIssues);
        context.strengths.push(...ruleEngineResult.overallStrengths);
        context.weaknesses.push(...ruleEngineResult.overallRecommendations);
        
        // 규칙 엔진 결과로부터 종합 점수와 최종 판정 생성
        context.totalScore = ruleEngineResult.totalScore;
        context.finalDecision = this._makeFinalDecision(context);
        
        logger.debug('규칙 엔진 평가 완료', {
          totalScore: ruleEngineResult.totalScore,
          rulesExecuted: ruleEngineResult.metadata.rulesExecuted
        });
      } else {
        // 기존 11단계 평가 흐름 실행
        for (let i = 0; i < this.evaluationSteps.length; i++) {
          const step = this.evaluationSteps[i];
          
          // 진행상황 업데이트
          if (this.trackProgress && processId) {
            progressTracker.updateStepProgress(processId, i, 0, { stepName: step }, `${step} 단계 시작`);
          }
          
          logger.debug(`평가 단계 실행: ${step}`);
          await this._executeStep(step, context);
          
          // 진행상황 완료
          if (this.trackProgress && processId) {
            progressTracker.completeStep(processId, i, { stepName: step, completed: true });
          }
        }
      }
      
      // 최종 결과 생성
      const result = this._generateFinalResult(context);
      
      // === 💾 캐시에 결과 저장 ===
      if (this.useCache && result.success !== false) {
        const cacheKey = cacheManager.generateEvaluationKey(this.visaType, applicantData, options);
        cacheManager.setEvaluationResult(cacheKey, result);
        result._cacheKey = cacheKey;
      }
      
      // === 📊 진행상황 완료 ===
      if (this.trackProgress && processId) {
        progressTracker.completeProcess(processId, { 
          success: true, 
          totalScore: result.totalScore,
          status: result.status 
        });
      }
      
      logger.info(`기본 평가기 v2.0 완료: ${this.visaType}`, {
        evaluationId,
        totalScore: result.totalScore,
        status: result.status,
        duration: `${Date.now() - context.startTime}ms`,
        useRuleEngine,
        cached: false
      });
      
      return {
        ...result,
        evaluationId,
        _fromCache: false
      };
      
    } catch (error) {
      logger.error(`기본 평가기 v2.0 오류 (${this.visaType}):`, error);
      
      // === 📊 진행상황 실패 처리 ===
      if (this.trackProgress && processId) {
        progressTracker.failProcess(processId, error);
      }
      
      return {
        success: false,
        message: '평가 중 오류가 발생했습니다.',
        error: error.message,
        visaType: this.visaType,
        evaluationId,
        _fromCache: false
      };
    }
  }
  
  /**
   * 입력 데이터 정규화 (기존 유틸리티 활용)
   */
  _normalizeInputData(data) {
    const normalized = {
      evaluation: { ...data.evaluation } || {},
      administrative: { ...data.administrative } || {},
      _originalData: data
    };
    
    logger.debug('데이터 정규화 시작');
    
    // === 🔧 기존 dataNormalizer 활용 ===
    
    // 수치 필드 정규화
    const numericFields = [
      'age', 'experienceYears', 'teachingExperience', 'researchExperience',
      'publications', 'patents', 'salary', 'contractPeriod', 'contractValue',
      'marriageDuration', 'householdSize', 'annualIncome', 'totalAssets'
    ];
    
    normalizeNumericFields(normalized.evaluation, numericFields);
    normalizeNumericFields(normalized.administrative, numericFields);
    
    // 불린 필드 정규화  
    const booleanFields = [
      'hasExperience', 'hasDegree', 'hasCertification', 'isNativeSpeaker',
      'hasAccreditation', 'hasCriminalRecord', 'hasHealthCheck', 'hasRecommendation',
      'livingTogether', 'hasChildren', 'marriageProgram', 'stableIncome'
    ];
    
    normalizeBooleanFields(normalized.evaluation, booleanFields);
    normalizeBooleanFields(normalized.administrative, booleanFields);
    
    // 배열 필드 정규화
    this._normalizeArrayFields(normalized);
    
    // 공통 필드 통합
    this._unifyCommonFields(normalized);
    
    logger.debug('데이터 정규화 완료', {
      numericFields: numericFields.length,
      booleanFields: booleanFields.length
    });
    
    return normalized;
  }
  
  /**
   * 배열 필드 정규화
   */
  _normalizeArrayFields(data) {
    const arrayFields = ['experienceTypes', 'teachingCertificates', 'publications', 'languages'];
    
    arrayFields.forEach(field => {
      if (data.evaluation[field] && typeof data.evaluation[field] === 'string') {
        data.evaluation[field] = data.evaluation[field].split(',').map(item => item.trim());
      }
    });
  }
  
  /**
   * 공통 필드 통합
   */
  _unifyCommonFields(data) {
    // 국적 정보 통합
    data.evaluation.nationality = data.evaluation.nationality || 
                                 data.administrative?.nationality || 
                                 data._originalData?.nationality;
    
    // 나이 정보 통합
    data.evaluation.age = data.evaluation.age || 
                         data.administrative?.age || 
                         data._originalData?.age;
    
    // 이메일 정보 통합
    data.evaluation.email = data.evaluation.email || 
                           data.administrative?.email || 
                           data._originalData?.email;
  }
  
  /**
   * 신청 유형 판단
   */
  _determineApplicationType(data) {
    if (data.evaluation?.isExtension || data.administrative?.isExtension) {
      return APPLICATION_TYPES.EXTENSION;
    }
    
    if (data.evaluation?.isStatusChange || data.administrative?.isStatusChange) {
      return APPLICATION_TYPES.CHANGE;
    }
    
    return APPLICATION_TYPES.NEW;
  }
  
  /**
   * 평가 단계 실행
   */
  async _executeStep(stepName, context) {
    const stepMethod = `_step${stepName.charAt(0).toUpperCase() + stepName.slice(1)}`;
    
    if (typeof this[stepMethod] === 'function') {
      await this[stepMethod](context);
    } else {
      // 기본 단계 구현
      await this._defaultStepImplementation(stepName, context);
    }
  }
  
  /**
   * 기본 단계 구현
   */
  async _defaultStepImplementation(stepName, context) {
    switch (stepName) {
      case 'preCheck':
        context.scores.preCheck = this._evaluatePreCheck(context);
        break;
        
      case 'applicationTypeCheck':
        context.scores.applicationTypeCheck = this._evaluateApplicationType(context);
        break;
        
      case 'basicQualification':
        context.scores.basicQualification = this._evaluateBasicQualification(context);
        break;
        
      case 'documentCompleteness':
        context.scores.documentCompleteness = this._evaluateDocumentCompleteness(context);
        break;
        
      case 'experienceEvaluation':
        context.scores.experienceEvaluation = this._evaluateExperience(context);
        break;
        
      case 'languageProficiency':
        context.scores.languageProficiency = this._evaluateLanguageProficiency(context);
        break;
        
      case 'financialCapability':
        context.scores.financialCapability = this._evaluateFinancialCapability(context);
        break;
        
      case 'specialConditions':
        context.scores.specialConditions = this._evaluateSpecialConditions(context);
        break;
        
      case 'riskAssessment':
        context.scores.riskAssessment = this._evaluateRiskAssessment(context);
        break;
        
      case 'comprehensiveScore':
        context.totalScore = this._calculateComprehensiveScore(context);
        break;
        
      case 'finalDecision':
        context.finalDecision = this._makeFinalDecision(context);
        break;
        
      default:
        logger.warn(`알 수 없는 평가 단계: ${stepName}`);
    }
  }
  
  /**
   * 1. 사전 검증
   */
  _evaluatePreCheck(context) {
    let score = 100;
    const data = context.applicantData;
    
    // 기본 정보 체크
    if (!data.evaluation?.nationality) {
      score -= 20;
      context.issues.push({
        category: 'basic_info',
        severity: 'high',
        message: '국적 정보가 누락되었습니다.'
      });
    }
    
    if (!data.evaluation?.age) {
      score -= 10;
      context.issues.push({
        category: 'basic_info',
        severity: 'medium',
        message: '나이 정보가 누락되었습니다.'
      });
    }
    
    return Math.max(score, 0);
  }
  
  /**
   * 2. 신청 유형 평가
   */
  _evaluateApplicationType(context) {
    const applicationType = context.applicationType;
    
    // 신청 유형별 기본 점수
    const baseScores = {
      [APPLICATION_TYPES.NEW]: 80,        // 신규 신청
      [APPLICATION_TYPES.EXTENSION]: 90,  // 연장 (기존 이력 있음)
      [APPLICATION_TYPES.CHANGE]: 85,     // 변경 (중간 난이도)
      [APPLICATION_TYPES.REENTRY]: 95     // 재입국 (가장 유리)
    };
    
    return baseScores[applicationType] || 80;
  }
  
  /**
   * 3. 기본 자격요건 평가
   */
  _evaluateBasicQualification(context) {
    const data = context.applicantData.evaluation;
    let score = 0;
    
    // 학력 평가
    const educationScores = {
      'phd': 100,
      'master': 90,
      'bachelor': 80,
      'associate': 60,
      'high_school': 40,
      'other': 20
    };
    
    score += (educationScores[data.educationLevel] || 50) * 0.4;
    
    // 경력 평가 (기본)
    const experience = data.experienceYears || 0;
    const experienceScore = Math.min(experience * 10, 100);
    score += experienceScore * 0.3;
    
    // 전문성 평가
    if (data.hasSpecialization) {
      score += 30;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * 4. 서류 완성도 평가
   */
  _evaluateDocumentCompleteness(context) {
    // 기본 구현 - 실제로는 업로드된 문서를 체크해야 함
    const data = context.applicantData;
    let score = 60; // 기본 점수
    
    // 필수 정보 완성도 체크
    const requiredFields = ['nationality', 'educationLevel', 'experienceYears'];
    const completedFields = requiredFields.filter(field => 
      data.evaluation?.[field] || data.administrative?.[field]
    );
    
    score += (completedFields.length / requiredFields.length) * 40;
    
    return Math.min(score, 100);
  }
  
  /**
   * 5. 경력/경험 평가
   */
  _evaluateExperience(context) {
    const data = context.applicantData.evaluation;
    let score = 0;
    
    // 총 경력 년수
    const totalExperience = (data.experienceYears || 0) + 
                           (data.teachingExperience || 0) + 
                           (data.researchExperience || 0);
    
    if (totalExperience >= 10) score += 100;
    else if (totalExperience >= 5) score += 80;
    else if (totalExperience >= 3) score += 60;
    else if (totalExperience >= 1) score += 40;
    else score += 20;
    
    return Math.min(score, 100);
  }
  
  /**
   * 6. 언어능력 평가
   */
  _evaluateLanguageProficiency(context) {
    const data = context.applicantData.evaluation;
    let score = 50; // 기본 점수
    
    // 한국어 능력
    if (data.topikLevel) {
      const topikScores = { '1급': 60, '2급': 70, '3급': 80, '4급': 90, '5급': 95, '6급': 100 };
      score = Math.max(score, topikScores[data.topikLevel] || 50);
    }
    
    // 영어 능력 (국제적 업무의 경우)
    if (data.englishLevel && ['E-1', 'E-3', 'E-7'].includes(context.visaType)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * 7. 재정능력 평가
   */
  _evaluateFinancialCapability(context) {
    const data = context.applicantData.evaluation;
    let score = 60; // 기본 점수
    
    if (data.salary && data.salary > 0) {
      // 연봉 기준 평가 (단위: 만원)
      if (data.salary >= 5000) score = 100;
      else if (data.salary >= 3000) score = 90;
      else if (data.salary >= 2000) score = 80;
      else score = 70;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * 8. 특별 조건 평가
   */
  _evaluateSpecialConditions(context) {
    const data = context.applicantData.evaluation;
    let score = 80; // 기본 점수
    
    // 추천서 있음
    if (data.hasRecommendation) {
      score += 10;
    }
    
    // 정부 초청
    if (data.hasGovernmentInvitation) {
      score += 15;
    }
    
    // 특별 인증
    if (data.hasAccreditation) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * 9. 리스크 평가
   */
  _evaluateRiskAssessment(context) {
    const data = context.applicantData.evaluation;
    let score = 100; // 기본 점수 (리스크 없음)
    
    // 범죄 경력
    if (data.hasCriminalRecord) {
      score -= 50;
      context.issues.push({
        category: 'background',
        severity: 'critical',
        message: '범죄 경력이 있습니다.'
      });
    }
    
    // 건강 상태 문제
    if (data.hasHealthIssues) {
      score -= 20;
    }
    
    // 이전 비자 위반 이력
    if (data.hasViolationHistory) {
      score -= 30;
    }
    
    return Math.max(score, 0);
  }
  
  /**
   * 10. 종합 점수 계산
   */
  _calculateComprehensiveScore(context) {
    const scores = context.scores;
    const weights = {
      preCheck: 0.05,
      applicationTypeCheck: 0.1,
      basicQualification: 0.2,
      documentCompleteness: 0.1,
      experienceEvaluation: 0.2,
      languageProficiency: 0.1,
      financialCapability: 0.1,
      specialConditions: 0.05,
      riskAssessment: 0.1
    };
    
    let totalScore = 0;
    Object.entries(weights).forEach(([category, weight]) => {
      if (scores[category] !== undefined) {
        totalScore += scores[category] * weight;
      }
    });
    
    return Math.round(totalScore);
  }
  
  /**
   * 11. 최종 판정
   */
  _makeFinalDecision(context) {
    const score = context.totalScore;
    
    if (score >= 85) {
      return {
        status: EVALUATION_STATUS.ELIGIBLE,
        confidence: CONFIDENCE_LEVELS.HIGH,
        message: '비자 승인 가능성이 매우 높습니다.'
      };
    } else if (score >= 70) {
      return {
        status: EVALUATION_STATUS.BORDERLINE,
        confidence: CONFIDENCE_LEVELS.MEDIUM,
        message: '비자 승인 가능성이 높습니다.'
      };
    } else if (score >= 50) {
      return {
        status: EVALUATION_STATUS.INELIGIBLE,
        confidence: CONFIDENCE_LEVELS.LOW,
        message: '추가 검토가 필요합니다.'
      };
    } else {
      return {
        status: EVALUATION_STATUS.INELIGIBLE,
        confidence: CONFIDENCE_LEVELS.LOW,
        message: '현재 상태로는 승인이 어렵습니다.'
      };
    }
  }
  
  /**
   * 최종 결과 생성
   */
  _generateFinalResult(context) {
    const result = {
      success: true,
      visaType: context.visaType,
      visaName: context.visaName,
      applicationType: context.applicationType,
      
      // 점수 정보
      totalScore: context.totalScore,
      categoryScores: context.scores,
      
      // 판정 결과
      status: context.finalDecision.status,
      confidence: context.finalDecision.confidence,
      message: context.finalDecision.message,
      
      // 상세 분석
      issues: context.issues,
      strengths: context.strengths,
      weaknesses: context.weaknesses,
      
      // 메타 정보
      evaluatedAt: new Date().toISOString(),
      evaluationSteps: this.evaluationSteps,
      processingTime: Date.now() - context.startTime,
      evaluatorVersion: '2.0',
      
      // 유틸리티 버전 정보
      utilityVersions: {
        visaType: 'backend/src/utils/visaType.js',
        dataNormalizer: 'backend/src/utils/dataNormalizer.js',
        logger: 'backend/src/utils/logger.js'
      }
    };
    
    logger.debug('최종 결과 생성 완료', {
      visaType: result.visaType,
      totalScore: result.totalScore,
      status: result.status,
      issueCount: result.issues.length
    });
    
    return result;
  }
}

module.exports = BaseEvaluator; 