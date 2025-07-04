/**
 * 규칙 엔진 - 비자별 규칙 적용 및 검증
 * 각 비자 타입과 신청 유형에 따른 규칙을 관리하고 적용
 */

const logger = require('../../../../../utils/logger');
const { APPLICATION_TYPES } = require('../../config/shared/constants');

class RuleEngine {
  constructor(configManager) {
    this.configManager = configManager;
    this.rules = new Map();
    this.validators = new Map();
  }

  /**
   * 규칙 엔진 초기화
   */
  async initialize() {
    try {
      // 기본 규칙 로드
      this.loadBaseRules();
      
      // 비자별 특수 규칙 로드
      await this.loadVisaSpecificRules();
      
      // 검증기 초기화
      this.initializeValidators();
      
      logger.info('✅ 규칙 엔진 초기화 완료');
    } catch (error) {
      logger.error('규칙 엔진 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 기본 규칙 로드
   */
  loadBaseRules() {
    // 신규 신청 기본 규칙
    this.rules.set('NEW_BASE', {
      required: ['education', 'experience', 'criminal_record'],
      validators: {
        education: this.validateEducation.bind(this),
        experience: this.validateExperience.bind(this),
        criminal_record: this.validateCriminalRecord.bind(this)
      }
    });

    // 연장 신청 기본 규칙
    this.rules.set('EXTENSION_BASE', {
      required: ['current_visa', 'stay_history', 'activity_proof'],
      validators: {
        current_visa: this.validateCurrentVisa.bind(this),
        stay_history: this.validateStayHistory.bind(this),
        activity_proof: this.validateActivityProof.bind(this)
      }
    });

    // 변경 신청 기본 규칙
    this.rules.set('CHANGE_BASE', {
      required: ['current_visa', 'change_reason', 'new_qualifications'],
      validators: {
        current_visa: this.validateCurrentVisa.bind(this),
        change_path: this.validateChangePath.bind(this),
        qualifications: this.validateNewQualifications.bind(this)
      }
    });
  }

  /**
   * 비자별 특수 규칙 로드
   */
  async loadVisaSpecificRules() {
    const visaTypes = this.configManager.getSupportedVisaTypes();
    
    for (const visaType of visaTypes) {
      const visaConfig = this.configManager.getVisaConfig(visaType);
      
      if (visaConfig.special_rules) {
        this.rules.set(visaType, visaConfig.special_rules);
      }
      
      // E-1 특수 규칙 추가
      if (visaType === 'E-1') {
        this.rules.set('E-1', {
          required: ['institution', 'weekly_hours', 'education', 'experience'],
          validators: {
            institution: this.validateE1Institution.bind(this),
            weekly_hours: this.validateE1WeeklyHours.bind(this),
            online_ratio: this.validateE1OnlineRatio.bind(this),
            concurrent_work: this.validateE1ConcurrentWork.bind(this),
            points_score: this.validateE1PointsScore.bind(this)
          },
          minimum_points: 60
        });
      }
    }
  }

  /**
   * 검증기 초기화
   */
  initializeValidators() {
    // 교육 수준 검증기
    this.validators.set('education', {
      levels: ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTERS', 'DOCTORATE'],
      validate: (value, required) => {
        const levels = this.validators.get('education').levels;
        const valueIndex = levels.indexOf(value);
        const requiredIndex = levels.indexOf(required);
        return valueIndex >= requiredIndex;
      }
    });

    // 경력 검증기
    this.validators.set('experience', {
      validate: (years, required) => years >= required
    });
  }

  /**
   * 규칙 적용 및 평가
   */
  async applyRules(context) {
    const { visaType, applicationType, data } = context;
    const results = {
      passed: [],
      failed: [],
      warnings: [],
      score: 0
    };

    try {
      // 1. 기본 규칙 적용
      const baseRules = this.getBaseRules(applicationType);
      const baseResults = await this.evaluateRules(baseRules, data, context);
      this.mergeResults(results, baseResults);

      // 2. 비자별 특수 규칙 적용
      const visaRules = this.rules.get(visaType);
      if (visaRules) {
        const visaResults = await this.evaluateRules(visaRules, data, context);
        this.mergeResults(results, visaResults);
      }

      // 3. 점수 계산
      results.score = this.calculateRuleScore(results);

      return results;
    } catch (error) {
      logger.error('규칙 적용 중 오류:', error);
      throw error;
    }
  }

  /**
   * 기본 규칙 가져오기
   */
  getBaseRules(applicationType) {
    const ruleKey = `${applicationType}_BASE`;
    return this.rules.get(ruleKey) || { required: [], validators: {} };
  }

  /**
   * 규칙 평가
   */
  async evaluateRules(rules, data, context) {
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };

    // 필수 필드 검사
    for (const field of rules.required || []) {
      if (!data[field]) {
        results.failed.push({
          rule: 'required_field',
          field,
          message: `${field} 필드는 필수입니다.`
        });
      }
    }

    // 검증기 실행
    for (const [field, validator] of Object.entries(rules.validators || {})) {
      if (data[field] !== undefined) {
        try {
          const result = await validator(data[field], context);
          if (result.valid) {
            results.passed.push({
              rule: field,
              message: result.message || `${field} 검증 통과`
            });
          } else {
            results.failed.push({
              rule: field,
              message: result.message || `${field} 검증 실패`
            });
          }
        } catch (error) {
          results.warnings.push({
            rule: field,
            message: `검증 중 오류: ${error.message}`
          });
        }
      }
    }

    return results;
  }

  /**
   * 교육 수준 검증
   */
  async validateEducation(education, context) {
    const required = context.visaConfig.base_requirements?.education;
    if (!required) return { valid: true };

    const validator = this.validators.get('education');
    const valid = validator.validate(education, required);

    return {
      valid,
      message: valid 
        ? `교육 수준 충족 (${education} >= ${required})`
        : `교육 수준 미달 (${education} < ${required})`
    };
  }

  /**
   * 경력 검증
   */
  async validateExperience(experience, context) {
    const required = context.visaConfig.base_requirements?.experience_years || 0;
    const valid = experience >= required;

    return {
      valid,
      message: valid
        ? `경력 요건 충족 (${experience}년 >= ${required}년)`
        : `경력 요건 미달 (${experience}년 < ${required}년)`
    };
  }

  /**
   * 범죄 기록 검증
   */
  async validateCriminalRecord(record, context) {
    const valid = !record || record === 'CLEAN';

    return {
      valid,
      message: valid
        ? '범죄 기록 없음'
        : '범죄 기록으로 인한 부적격'
    };
  }

  /**
   * 현재 비자 검증
   */
  async validateCurrentVisa(currentVisa, context) {
    const valid = currentVisa && currentVisa.status === 'VALID';

    return {
      valid,
      message: valid
        ? '유효한 체류 자격'
        : '유효하지 않은 체류 자격'
    };
  }

  /**
   * 체류 이력 검증
   */
  async validateStayHistory(history, context) {
    const violations = history.violations || 0;
    const valid = violations === 0;

    return {
      valid,
      message: valid
        ? '체류 이력 양호'
        : `체류 규정 위반 ${violations}건`
    };
  }

  /**
   * 활동 증명 검증
   */
  async validateActivityProof(proof, context) {
    if (context.visaType === 'E-1') {
      const weeklyHours = proof.weekly_hours || 0;
      const valid = weeklyHours >= 6;

      return {
        valid,
        message: valid
          ? `주당 강의시간 충족 (${weeklyHours}시간)`
          : `주당 강의시간 미달 (${weeklyHours}시간 < 6시간)`
      };
    }

    return { valid: true, message: '활동 증명 확인' };
  }

  /**
   * 변경 경로 검증
   */
  async validateChangePath(data, context) {
    const fromVisa = data.current_visa?.type;
    const toVisa = context.visaType;

    const changePath = this.configManager.getChangePath(fromVisa, toVisa);
    const valid = changePath !== null;

    return {
      valid,
      message: valid
        ? `${fromVisa} → ${toVisa} 변경 가능`
        : `${fromVisa} → ${toVisa} 변경 불가`
    };
  }

  /**
   * 새 자격요건 검증
   */
  async validateNewQualifications(qualifications, context) {
    // 변경하려는 비자의 요구사항 확인
    const newVisaConfig = context.visaConfig;
    const requirements = newVisaConfig.base_requirements || {};

    let valid = true;
    const messages = [];

    // 교육 요건 확인
    if (requirements.education) {
      const educationValid = this.validators.get('education').validate(
        qualifications.education,
        requirements.education
      );
      if (!educationValid) {
        valid = false;
        messages.push('교육 요건 미충족');
      }
    }

    // 경력 요건 확인
    if (requirements.experience_years) {
      const experienceValid = qualifications.experience >= requirements.experience_years;
      if (!experienceValid) {
        valid = false;
        messages.push('경력 요건 미충족');
      }
    }

    return {
      valid,
      message: valid ? '새 비자 요건 충족' : messages.join(', ')
    };
  }

  /**
   * 결과 병합
   */
  mergeResults(target, source) {
    target.passed.push(...source.passed);
    target.failed.push(...source.failed);
    target.warnings.push(...source.warnings);
  }

  /**
   * 규칙 점수 계산
   */
  calculateRuleScore(results) {
    const totalRules = results.passed.length + results.failed.length;
    if (totalRules === 0) return 0;

    const passRate = results.passed.length / totalRules;
    return Math.round(passRate * 100);
  }

  /**
   * 특정 비자의 변경 가능 여부 확인
   */
  isChangeAllowed(fromVisa, toVisa) {
    const changePath = this.configManager.getChangePath(fromVisa, toVisa);
    return changePath !== null;
  }

  /**
   * 문서 요구사항 가져오기
   */
  getDocumentRequirements(visaType, applicationType) {
    const appTypeConfig = this.configManager.getApplicationTypeConfig(applicationType);
    const visaConfig = this.configManager.getVisaConfig(visaType);

    return {
      required: appTypeConfig?.documents?.required || [],
      optional: appTypeConfig?.documents?.optional || [],
      special: visaConfig?.special_documents || []
    };
  }

  // E-1 특수 검증 메서드들
  
  /**
   * E-1 교육기관 검증
   */
  async validateE1Institution(institution, context) {
    const allowedTypes = [
      'UNIVERSITY', 'COLLEGE', 'JUNIOR_COLLEGE', 'RESEARCH_INSTITUTE'
    ];
    
    const valid = institution && allowedTypes.includes(institution.type);
    
    return {
      valid,
      message: valid
        ? `적합한 교육기관 (${institution.type})`
        : '고등교육법에 의한 교육기관이 아닙니다'
    };
  }

  /**
   * E-1 주당 강의시간 검증
   */
  async validateE1WeeklyHours(hours, context) {
    const minimum = 6;
    const valid = hours >= minimum;
    
    return {
      valid,
      message: valid
        ? `주당 강의시간 충족 (${hours}시간 >= ${minimum}시간)`
        : `주당 강의시간 미달 (${hours}시간 < ${minimum}시간)`
    };
  }

  /**
   * E-1 온라인 강의 비율 검증
   */
  async validateE1OnlineRatio(data, context) {
    const onlineRatio = data.online_hours / data.total_hours;
    const valid = onlineRatio <= 0.5;
    
    return {
      valid,
      message: valid
        ? `온라인 강의 비율 적정 (${Math.round(onlineRatio * 100)}%)`
        : `온라인 강의 비율 초과 (${Math.round(onlineRatio * 100)}% > 50%)`
    };
  }

  /**
   * E-1 겸직 검증
   */
  async validateE1ConcurrentWork(workplaces, context) {
    const maxAllowed = 2;
    const valid = workplaces.length <= maxAllowed;
    
    return {
      valid,
      message: valid
        ? `근무처 수 적정 (${workplaces.length}개)`
        : `근무처 수 초과 (${workplaces.length}개 > ${maxAllowed}개) - 사전 허가 필요`
    };
  }

  /**
   * E-1 점수제 검증
   */
  async validateE1PointsScore(data, context) {
    if (context.applicationType !== 'NEW') {
      return { valid: true, message: '점수제 평가 불필요 (신규 아님)' };
    }
    
    let score = 0;
    
    // 학위 점수
    const degreeScores = { DOCTORATE: 40, MASTERS: 30, BACHELOR: 20 };
    score += degreeScores[data.education] || 0;
    
    // 경력 점수
    score += Math.min(data.experience * 5, 30);
    
    // 연구실적 점수
    score += Math.min((data.publications || 0) * 5, 30);
    
    // 나이 점수
    if (data.age < 30) score += 20;
    else if (data.age < 40) score += 15;
    else if (data.age < 50) score += 10;
    else if (data.age < 60) score += 5;
    
    // 한국어 능력
    const topikScores = { TOPIK_6: 20, TOPIK_5: 15, TOPIK_4: 10, TOPIK_3: 5 };
    score += topikScores[data.koreanLevel] || 0;
    
    const valid = score >= 60;
    
    return {
      valid,
      message: valid
        ? `점수제 평가 통과 (${score}점 >= 60점)`
        : `점수제 평가 미달 (${score}점 < 60점)`,
      score
    };
  }
}

module.exports = RuleEngine;