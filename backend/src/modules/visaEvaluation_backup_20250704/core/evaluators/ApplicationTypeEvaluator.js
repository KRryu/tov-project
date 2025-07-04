/**
 * 신청 유형별 특화 평가기
 * 신규/연장/변경 신청에 따른 특화된 평가 로직 제공
 * 경로: /backend/src/modules/visaEvaluation/core/evaluators/ApplicationTypeEvaluator.js
 */

const { APPLICATION_TYPES } = require('../models/ApplicationType');
const { DocumentValidator } = require('../../config/documents/documentRequirements');
const StayHistoryEvaluator = require('./StayHistoryEvaluator');
const logger = require('../../../../utils/logger');

/**
 * 신청 유형별 평가 전략
 */
class ApplicationTypeEvaluator {
  constructor() {
    this.documentValidator = new DocumentValidator();
    this.stayHistoryEvaluator = new StayHistoryEvaluator();
    
    // 전략 패턴 구현
    this.strategies = {
      [APPLICATION_TYPES.NEW]: new NewApplicationStrategy(this),
      [APPLICATION_TYPES.EXTENSION]: new ExtensionStrategy(this),
      [APPLICATION_TYPES.CHANGE]: new ChangeStrategy(this)
    };
  }

  async evaluate(visaType, applicantData, applicationType, options = {}) {
    const strategy = this.strategies[applicationType];
    
    if (!strategy) {
      throw new Error(`지원되지 않는 신청 유형: ${applicationType}`);
    }
    
    logger.info(`신청 유형별 평가 시작: ${visaType} - ${applicationType}`);
    
    try {
      const result = await strategy.evaluate(visaType, applicantData, options);
      
      logger.info(`신청 유형별 평가 완료: ${applicationType}`, {
        score: result.score,
        eligible: result.eligible
      });
      
      return result;
    } catch (error) {
      logger.error(`신청 유형별 평가 오류: ${applicationType}`, error);
      throw error;
    }
  }
}

/**
 * 신규 신청 평가 전략
 */
class NewApplicationStrategy {
  constructor(evaluator) {
    this.evaluator = evaluator;
  }

  async evaluate(visaType, applicantData, options) {
    const evaluation = {
      applicationType: APPLICATION_TYPES.NEW,
      score: 0,
      eligible: false,
      breakdown: {},
      requirements: [],
      recommendations: []
    };

    // 1. 기본 자격 요건 확인
    const eligibility = this._checkBasicEligibility(visaType, applicantData);
    evaluation.breakdown.eligibility = eligibility;
    evaluation.score += eligibility.score * 0.4;

    // 2. 문서 완성도 평가
    const documents = await this._evaluateDocuments(visaType, applicantData);
    evaluation.breakdown.documents = documents;
    evaluation.score += documents.score * 0.3;

    // 3. 전문성/경력 평가
    const qualification = this._evaluateQualification(visaType, applicantData);
    evaluation.breakdown.qualification = qualification;
    evaluation.score += qualification.score * 0.3;

    // 최종 평가
    evaluation.score = Math.round(evaluation.score);
    evaluation.eligible = evaluation.score >= 70;
    
    // 요구사항 및 추천사항 생성
    evaluation.requirements = this._generateRequirements(evaluation);
    evaluation.recommendations = this._generateRecommendations(evaluation);

    return evaluation;
  }

  _checkBasicEligibility(visaType, applicantData) {
    // 비자별 기본 자격 요건 확인
    const eligibilityRules = {
      'E-1': { minEducation: 'master', minExperience: 0 },
      'E-2': { minEducation: 'bachelor', nationality: 'E2_COUNTRIES' },
      'E-7': { minEducation: 'bachelor', minExperience: 1 },
      'D-2': { minEducation: 'high_school', minExperience: 0 },
      'F-2': { minEducation: 'bachelor', minExperience: 2 }
    };

    const rules = eligibilityRules[visaType] || { minEducation: 'bachelor', minExperience: 0 };
    let score = 100;
    const issues = [];

    // 학력 확인
    if (rules.minEducation) {
      const hasEducation = this._checkEducationRequirement(
        applicantData.evaluation?.educationLevel || applicantData.educationLevel, 
        rules.minEducation
      );
      if (!hasEducation) {
        score -= 50;
        issues.push('최소 학력 요건 미충족');
      }
    }

    // 경력 확인
    const experienceYears = applicantData.evaluation?.experienceYears || applicantData.experienceYears || 0;
    if (rules.minExperience && experienceYears < rules.minExperience) {
      score -= 30;
      issues.push(`최소 ${rules.minExperience}년 경력 필요`);
    }

    // 국적 확인 (E-2 등)
    if (rules.nationality === 'E2_COUNTRIES') {
      const nativeEnglishCountries = ['US', 'CA', 'GB', 'AU', 'NZ', 'IE', 'ZA'];
      const nationality = applicantData.nationality || applicantData.evaluation?.nationality;
      if (!nativeEnglishCountries.includes(nationality)) {
        score -= 40;
        issues.push('영어 원어민 국적 요구사항 미충족');
      }
    }

    return { score: Math.max(score, 0), issues };
  }

  _evaluateDocuments(visaType, applicantData) {
    const submittedDocs = applicantData.documents || applicantData.submittedDocuments || {};
    
    return this.evaluator.documentValidator.validateDocuments(
      visaType,
      APPLICATION_TYPES.NEW,
      submittedDocs,
      applicantData
    );
  }

  _evaluateQualification(visaType, applicantData) {
    // 전문성 평가 로직
    let score = 70; // 기본 점수
    
    // 학력 가산점
    const educationLevel = applicantData.evaluation?.educationLevel || applicantData.educationLevel;
    const educationBonus = {
      'phd': 30,
      'master': 20,
      'bachelor': 10,
      'associate': 5
    };
    score += educationBonus[educationLevel] || 0;

    // 경력 가산점
    const experienceYears = applicantData.evaluation?.experienceYears || applicantData.experienceYears || 0;
    score += Math.min(experienceYears * 3, 30);

    // 전문 자격증
    if (applicantData.evaluation?.hasSpecialization || applicantData.certifications) {
      score += 15;
    }

    // 언어 능력
    if (applicantData.evaluation?.topikLevel) {
      const topikBonus = {
        '6급': 20, '5급': 15, '4급': 10, '3급': 5
      };
      score += topikBonus[applicantData.evaluation.topikLevel] || 0;
    }

    return {
      score: Math.min(score, 100),
      educationLevel,
      experienceYears,
      specializations: applicantData.evaluation?.hasSpecialization || false
    };
  }

  _checkEducationRequirement(actual, required) {
    const levels = ['high_school', 'associate', 'bachelor', 'master', 'phd'];
    const actualIndex = levels.indexOf(actual);
    const requiredIndex = levels.indexOf(required);
    
    return actualIndex >= requiredIndex && actualIndex !== -1;
  }

  _generateRequirements(evaluation) {
    const requirements = [];
    
    if (evaluation.breakdown.eligibility.issues.length > 0) {
      requirements.push({
        category: 'ELIGIBILITY',
        priority: 'HIGH',
        items: evaluation.breakdown.eligibility.issues
      });
    }

    if (evaluation.breakdown.documents.missing && evaluation.breakdown.documents.missing.length > 0) {
      requirements.push({
        category: 'DOCUMENTS',
        priority: 'HIGH',
        items: evaluation.breakdown.documents.missing.map(doc => 
          `필수 서류 제출: ${doc}`
        )
      });
    }

    return requirements;
  }

  _generateRecommendations(evaluation) {
    const recommendations = [];

    if (evaluation.score < 70) {
      recommendations.push({
        priority: 'HIGH',
        message: '비자 승인을 위해 추가 준비가 필요합니다.',
        actions: ['자격 요건 보완', '필수 서류 완비', '경력 증명 강화']
      });
    } else if (evaluation.score < 85) {
      recommendations.push({
        priority: 'MEDIUM',
        message: '승인 가능성을 높이기 위한 개선사항이 있습니다.',
        actions: ['선택 서류 추가 제출', '전문성 증명 보완']
      });
    }

    return recommendations;
  }
}

/**
 * 연장 신청 평가 전략
 */
class ExtensionStrategy {
  constructor(evaluator) {
    this.evaluator = evaluator;
  }

  async evaluate(visaType, applicantData, options) {
    const evaluation = {
      applicationType: APPLICATION_TYPES.EXTENSION,
      score: 0,
      eligible: false,
      breakdown: {},
      requirements: [],
      recommendations: []
    };

    // 1. 체류 이력 평가 (가장 중요)
    const stayHistory = await this.evaluator.stayHistoryEvaluator.evaluate({
      visaType,
      applicationType: APPLICATION_TYPES.EXTENSION,
      applicantData,
      currentVisa: applicantData.currentVisa,
      stayHistory: applicantData.stayHistory
    });
    
    evaluation.breakdown.stayHistory = stayHistory;
    evaluation.score += stayHistory.totalScore * 0.4;

    // 2. 활동 실적 평가
    const activityRecord = this._evaluateActivityRecord(visaType, applicantData);
    evaluation.breakdown.activityRecord = activityRecord;
    evaluation.score += activityRecord.score * 0.3;

    // 3. 계약 연속성 평가
    const continuity = this._evaluateContractContinuity(applicantData);
    evaluation.breakdown.continuity = continuity;
    evaluation.score += continuity.score * 0.2;

    // 4. 문서 평가
    const documents = await this._evaluateDocuments(visaType, applicantData);
    evaluation.breakdown.documents = documents;
    evaluation.score += documents.score * 0.1;

    // 최종 평가
    evaluation.score = Math.round(evaluation.score);
    evaluation.eligible = evaluation.score >= 65 && !this._hasDisqualifyingFactors(stayHistory);

    // 연장 가능 횟수 확인
    evaluation.extensionInfo = this._checkExtensionLimit(visaType, applicantData);

    // 요구사항 및 추천사항 생성
    evaluation.requirements = this._generateRequirements(evaluation);
    evaluation.recommendations = this._generateRecommendations(evaluation);

    return evaluation;
  }

  _evaluateActivityRecord(visaType, applicantData) {
    let score = 70; // 기본 점수
    
    // E-1의 경우 교육/연구 활동 확인
    if (visaType === 'E-1') {
      const teachingHours = applicantData.weeklyTeachingHours || 0;
      const researchProjects = applicantData.researchProjects || 0;
      
      if (teachingHours >= 9) score += 20;
      if (researchProjects > 0) score += 15;
    }
    
    // E-2의 경우 수업 시간 확인
    if (visaType === 'E-2' && applicantData.weeklyTeachingHours) {
      if (applicantData.weeklyTeachingHours >= 15) score += 30;
      else if (applicantData.weeklyTeachingHours >= 9) score += 20;
      else score -= 20;
    }

    // E-7의 경우 프로젝트 성과 확인
    if (visaType === 'E-7') {
      const projectCompletions = applicantData.projectCompletions || 0;
      const performanceRating = applicantData.performanceRating || 'average';
      
      score += Math.min(projectCompletions * 10, 30);
      
      if (performanceRating === 'excellent') score += 20;
      else if (performanceRating === 'good') score += 10;
    }

    // 출석률 확인
    if (applicantData.attendanceRate) {
      if (applicantData.attendanceRate >= 95) score += 10;
      else if (applicantData.attendanceRate < 80) score -= 15;
    }

    return { 
      score: Math.min(score, 100),
      details: {
        teachingHours: applicantData.weeklyTeachingHours,
        attendanceRate: applicantData.attendanceRate,
        performanceMetrics: applicantData.performanceRating
      }
    };
  }

  _evaluateContractContinuity(applicantData) {
    let score = 100;
    const issues = [];
    
    if (!applicantData.contractRenewal) {
      score -= 50;
      issues.push('고용계약 갱신 필요');
    }
    
    if (applicantData.employerChanged) {
      score -= 20;
      issues.push('고용주 변경으로 인한 감점');
    }

    const remainingMonths = applicantData.contractRemainingMonths || 0;
    if (remainingMonths < 3) {
      score -= 30;
      issues.push('계약 잔여 기간 부족');
    }

    // 급여 수준 확인
    const currentSalary = applicantData.currentSalary || 0;
    const minimumSalary = this._getMinimumSalary(applicantData.visaType);
    if (currentSalary < minimumSalary) {
      score -= 25;
      issues.push('최소 급여 기준 미달');
    }

    return { 
      score: Math.max(score, 0),
      issues,
      contractRenewal: applicantData.contractRenewal,
      remainingMonths
    };
  }

  _hasDisqualifyingFactors(stayHistory) {
    // 심각한 위반 이력 확인
    return stayHistory.riskFactors && stayHistory.riskFactors.some(risk => risk.impact === 'CRITICAL');
  }

  _checkExtensionLimit(visaType, applicantData) {
    const limits = {
      'E-1': { maxExtensions: null, maxYears: null }, // 제한 없음
      'E-2': { maxExtensions: 10, maxYears: 5 },
      'E-7': { maxExtensions: 10, maxYears: 5 },
      'D-2': { maxExtensions: null, maxYears: null }, // 제한 없음
      'D-4': { maxExtensions: 4, maxYears: 2 }
    };

    const limit = limits[visaType] || { maxExtensions: 10, maxYears: 5 };
    const currentExtensions = applicantData.previousExtensions || 0;

    return {
      currentCount: currentExtensions,
      maxCount: limit.maxExtensions,
      remaining: limit.maxExtensions ? limit.maxExtensions - currentExtensions : null,
      canExtend: !limit.maxExtensions || currentExtensions < limit.maxExtensions,
      isUnlimited: !limit.maxExtensions
    };
  }

  _getMinimumSalary(visaType) {
    const salaries = {
      'E-1': 2500000,  // 250만원
      'E-2': 2200000,  // 220만원
      'E-7': 2800000   // 280만원
    };
    return salaries[visaType] || 2000000;
  }

  _evaluateDocuments(visaType, applicantData) {
    const submittedDocs = applicantData.documents || applicantData.submittedDocuments || {};
    
    return this.evaluator.documentValidator.validateDocuments(
      visaType,
      APPLICATION_TYPES.EXTENSION,
      submittedDocs,
      applicantData
    );
  }

  _generateRequirements(evaluation) {
    const requirements = [];
    
    if (evaluation.breakdown.continuity.issues.length > 0) {
      requirements.push({
        category: 'CONTRACT',
        priority: 'HIGH',
        items: evaluation.breakdown.continuity.issues
      });
    }

    if (!evaluation.extensionInfo.canExtend) {
      requirements.push({
        category: 'EXTENSION_LIMIT',
        priority: 'CRITICAL',
        items: ['연장 한도 초과 - 다른 비자로 변경 필요']
      });
    }

    return requirements;
  }

  _generateRecommendations(evaluation) {
    const recommendations = [];

    if (evaluation.score < 65) {
      recommendations.push({
        priority: 'HIGH',
        message: '연장 승인을 위해 준법성과 활동 실적을 개선하세요.',
        actions: ['세금 납부 완료', '출석률 개선', '계약 갱신 확정']
      });
    }

    if (evaluation.breakdown.activityRecord.score < 70) {
      recommendations.push({
        priority: 'MEDIUM',
        message: '비자 목적에 맞는 활동 실적을 보완하세요.',
        actions: ['수업 시간 확대', '연구 성과 제출', '성과 평가 개선']
      });
    }

    return recommendations;
  }
}

/**
 * 변경 신청 평가 전략
 */
class ChangeStrategy {
  constructor(evaluator) {
    this.evaluator = evaluator;
  }

  async evaluate(visaType, applicantData, options) {
    const currentVisa = applicantData.currentVisa?.type;
    const targetVisa = visaType;

    const evaluation = {
      applicationType: APPLICATION_TYPES.CHANGE,
      currentVisa,
      targetVisa,
      score: 0,
      eligible: false,
      breakdown: {},
      changeability: null,
      requirements: [],
      recommendations: []
    };

    // 1. 변경 가능성 확인 (가장 중요)
    const changeability = this._checkChangeability(currentVisa, targetVisa, applicantData);
    evaluation.changeability = changeability;
    
    if (!changeability.possible) {
      evaluation.eligible = false;
      evaluation.score = 0;
      evaluation.message = changeability.reason;
      evaluation.recommendations = [{
        priority: 'CRITICAL',
        message: changeability.reason,
        actions: changeability.alternatives || ['전문가 상담 권장']
      }];
      return evaluation;
    }

    evaluation.score += changeability.score * 0.3;

    // 2. 체류 이력 평가
    const stayHistory = await this.evaluator.stayHistoryEvaluator.evaluate({
      visaType: currentVisa,
      applicationType: APPLICATION_TYPES.CHANGE,
      applicantData,
      currentVisa: applicantData.currentVisa,
      stayHistory: applicantData.stayHistory
    });
    
    evaluation.breakdown.stayHistory = stayHistory;
    evaluation.score += stayHistory.totalScore * 0.2;

    // 3. 새 비자 요건 충족도
    const targetRequirements = this._evaluateTargetVisaRequirements(targetVisa, applicantData);
    evaluation.breakdown.targetRequirements = targetRequirements;
    evaluation.score += targetRequirements.score * 0.3;

    // 4. 변경 사유 타당성
    const changeReason = this._evaluateChangeReason(applicantData);
    evaluation.breakdown.changeReason = changeReason;
    evaluation.score += changeReason.score * 0.1;

    // 5. 문서 평가
    const documents = await this._evaluateDocuments(targetVisa, applicantData);
    evaluation.breakdown.documents = documents;
    evaluation.score += documents.score * 0.1;

    // 최종 평가
    evaluation.score = Math.round(evaluation.score);
    evaluation.eligible = evaluation.score >= 60;

    // 요구사항 및 추천사항 생성
    evaluation.requirements = this._generateRequirements(evaluation);
    evaluation.recommendations = this._generateRecommendations(evaluation);

    return evaluation;
  }

  _checkChangeability(currentVisa, targetVisa, applicantData) {
    try {
      // 비자 변경 경로 설정 모듈 사용
      const { checkChangeability, checkConditionsMet } = require('../../config/changeability/visaChangePaths');
      
      const changeabilityResult = checkChangeability(currentVisa, targetVisa);
      
      if (!changeabilityResult.possible) {
        return {
          possible: false,
          score: 0,
          reason: changeabilityResult.reason,
          alternatives: changeabilityResult.alternatives || this._suggestAlternativePaths(currentVisa, targetVisa)
        };
      }
      
      // 조건 충족 여부 확인
      const conditionsResult = checkConditionsMet(changeabilityResult.conditions, {
        educationLevel: applicantData.evaluation?.educationLevel || applicantData.educationLevel,
        experienceYears: applicantData.evaluation?.experienceYears || applicantData.experienceYears || 0,
        hasJobOffer: applicantData.hasJobOffer || false,
        salary: applicantData.currentSalary || applicantData.salary || 0,
        stayDurationMonths: applicantData.stayDurationMonths || 0,
        f2Points: applicantData.f2Points || 0,
        graduationStatus: applicantData.graduationStatus,
        changeReason: applicantData.changeReason
      });
      
      return {
        possible: true,
        score: changeabilityResult.difficulty.score,
        difficulty: changeabilityResult.difficulty.description,
        successRate: changeabilityResult.successRate,
        requirements: changeabilityResult.requirements,
        restrictions: changeabilityResult.restrictions,
        conditions: changeabilityResult.conditions,
        conditionsMet: conditionsResult.allMet,
        unmetConditions: conditionsResult.unmet,
        metConditions: conditionsResult.met,
        conditionsScore: conditionsResult.score
      };
      
    } catch (error) {
      logger.error('비자 변경 경로 모듈 오류, 폴백 로직 사용:', error);
      
      // 폴백: 기본 로직
      return this._checkChangeabilityFallback(currentVisa, targetVisa, applicantData);
    }
  }
  
  /**
   * 폴백: 기본 변경 가능성 확인
   */
  _checkChangeabilityFallback(currentVisa, targetVisa, applicantData) {
    // 기본 변경 가능 경로 매트릭스
    const changePaths = {
      'D-2': ['E-1', 'E-2', 'E-3', 'E-7', 'D-10', 'F-2'],
      'E-2': ['E-1', 'E-7', 'F-2', 'F-5'],
      'E-7': ['F-2', 'F-5', 'D-8', 'D-9'],
      'D-10': ['E-1', 'E-2', 'E-3', 'E-7', 'F-2'],
      'F-4': ['F-2', 'F-5'],
      'H-2': ['E-9', 'F-4']
    };

    const allowedTargets = changePaths[currentVisa] || [];
    
    if (!allowedTargets.includes(targetVisa)) {
      return {
        possible: false,
        score: 0,
        reason: `${currentVisa}에서 ${targetVisa}로 직접 변경이 불가능합니다.`,
        alternatives: this._suggestAlternativePaths(currentVisa, targetVisa)
      };
    }

    // 변경 조건 확인
    const conditionsResult = this._checkChangeConditions(currentVisa, targetVisa, applicantData);
    
    if (!conditionsResult.allMet) {
      return {
        possible: false,
        score: 0,
        reason: '변경 조건을 충족하지 못합니다.',
        unmetConditions: conditionsResult.unmet,
        alternatives: ['조건 충족 후 재신청']
      };
    }

    // 변경 난이도 점수
    const difficultyScores = {
      'D-2_to_E-7': 80,
      'D-2_to_E-1': 70,
      'E-2_to_E-1': 75,
      'E-7_to_F-2': 85,
      'D-10_to_E-7': 90
    };

    const pathKey = `${currentVisa}_to_${targetVisa}`;
    const score = difficultyScores[pathKey] || 70;

    return {
      possible: true,
      score,
      requirements: this._getChangeRequirements(currentVisa, targetVisa),
      conditions: conditionsResult.met,
      conditionsMet: conditionsResult.allMet
    };
  }

  _checkChangeConditions(currentVisa, targetVisa, applicantData) {
    const conditions = {
      met: [],
      unmet: [],
      allMet: true
    };

    // D-2에서 E-7로 변경 시 조건
    if (currentVisa === 'D-2' && targetVisa === 'E-7') {
      // 학위 취득 여부
      if (applicantData.graduationStatus === 'graduated') {
        conditions.met.push('학위 취득 완료');
      } else {
        conditions.unmet.push('학위 취득 필요');
        conditions.allMet = false;
      }

      // 취업 제안서
      if (applicantData.hasJobOffer) {
        conditions.met.push('취업 제안서 보유');
      } else {
        conditions.unmet.push('취업 제안서 필요');
        conditions.allMet = false;
      }
    }

    // E-2에서 E-1로 변경 시 조건
    if (currentVisa === 'E-2' && targetVisa === 'E-1') {
      const educationLevel = applicantData.evaluation?.educationLevel || applicantData.educationLevel;
      if (educationLevel === 'master' || educationLevel === 'phd') {
        conditions.met.push('석사 이상 학위');
      } else {
        conditions.unmet.push('석사 이상 학위 필요');
        conditions.allMet = false;
      }

      const experience = applicantData.evaluation?.experienceYears || applicantData.experienceYears || 0;
      if (experience >= 3) {
        conditions.met.push('3년 이상 교육 경력');
      } else {
        conditions.unmet.push('3년 이상 교육 경력 필요');
        conditions.allMet = false;
      }
    }

    return conditions;
  }

  _suggestAlternativePaths(currentVisa, targetVisa) {
    // 간접 경로 제안 로직
    const alternatives = [];
    
    // D-10을 거치는 경로
    if (currentVisa !== 'D-10') {
      alternatives.push(`${currentVisa} → D-10 → ${targetVisa}`);
    }
    
    // 출국 후 신규 신청
    alternatives.push(`${currentVisa} → 출국 후 신규 신청`);
    
    // F-2를 거치는 경로 (장기 체류자)
    if (targetVisa !== 'F-2') {
      alternatives.push(`${currentVisa} → F-2 → ${targetVisa}`);
    }

    return alternatives;
  }

  _getChangeRequirements(currentVisa, targetVisa) {
    // 변경 시 특별 요구사항
    const requirements = {
      'D-2_to_E-1': ['석사 이상 학위', '교육기관 채용 확정', '학위 취득 증명'],
      'D-2_to_E-7': ['학사 이상 학위', '취업 확정', '전공 관련 업무'],
      'E-2_to_E-1': ['석사 이상 학위', '3년 이상 교육 경력', '대학 교원 자격'],
      'E-7_to_F-2': ['3년 이상 체류', '연소득 GNI 2배 이상', '점수제 요건']
    };

    return requirements[`${currentVisa}_to_${targetVisa}`] || ['기본 자격 요건 충족'];
  }

  _evaluateTargetVisaRequirements(targetVisa, applicantData) {
    // 목표 비자의 요건 충족도 평가
    // 신규 신청 전략의 자격 요건 확인 로직 재사용
    const newAppStrategy = new NewApplicationStrategy(this.evaluator);
    return newAppStrategy._checkBasicEligibility(targetVisa, applicantData);
  }

  _evaluateChangeReason(applicantData) {
    const reason = applicantData.changeReason;
    let score = 50; // 기본 점수

    const validReasons = {
      'graduation': 30,           // 졸업
      'career_advancement': 25,   // 경력 발전
      'job_offer': 25,           // 취업 제안
      'marriage': 20,            // 결혼
      'family_situation': 15,    // 가족 상황
      'business_opportunity': 20 // 사업 기회
    };

    if (validReasons[reason]) {
      score += validReasons[reason];
    }

    if (applicantData.changeReasonDocumented) {
      score += 20;
    }

    // 변경 사유의 구체성
    if (applicantData.changeReasonDetails && applicantData.changeReasonDetails.length > 100) {
      score += 10;
    }

    return { 
      score: Math.min(score, 100), 
      reason,
      documented: applicantData.changeReasonDocumented,
      details: applicantData.changeReasonDetails
    };
  }

  _evaluateDocuments(visaType, applicantData) {
    const submittedDocs = applicantData.documents || applicantData.submittedDocuments || {};
    
    return this.evaluator.documentValidator.validateDocuments(
      visaType,
      APPLICATION_TYPES.CHANGE,
      submittedDocs,
      applicantData
    );
  }

  _generateRequirements(evaluation) {
    const requirements = [];
    
    if (!evaluation.changeability.possible) {
      requirements.push({
        category: 'CHANGEABILITY',
        priority: 'CRITICAL',
        items: ['변경 불가능한 경로']
      });
    }

    if (evaluation.changeability.unmetConditions && evaluation.changeability.unmetConditions.length > 0) {
      requirements.push({
        category: 'CONDITIONS',
        priority: 'HIGH',
        items: evaluation.changeability.unmetConditions
      });
    }

    if (evaluation.breakdown.targetRequirements && evaluation.breakdown.targetRequirements.issues.length > 0) {
      requirements.push({
        category: 'TARGET_VISA',
        priority: 'HIGH',
        items: evaluation.breakdown.targetRequirements.issues
      });
    }

    return requirements;
  }

  _generateRecommendations(evaluation) {
    const recommendations = [];

    if (!evaluation.eligible) {
      if (!evaluation.changeability.possible) {
        recommendations.push({
          priority: 'CRITICAL',
          message: '현재 경로로는 변경이 불가능합니다.',
          actions: evaluation.changeability.alternatives || ['전문가 상담']
        });
      } else {
        recommendations.push({
          priority: 'HIGH',
          message: '변경 조건을 충족해야 합니다.',
          actions: ['필요 조건 보완', '서류 추가 준비', '변경 사유 구체화']
        });
      }
    } else {
      recommendations.push({
        priority: 'MEDIUM',
        message: '변경 승인 가능성이 있습니다.',
        actions: ['서류 최종 점검', '변경 신청서 작성', '면접 준비']
      });
    }

    return recommendations;
  }
}

module.exports = ApplicationTypeEvaluator; 