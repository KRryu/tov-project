/**
 * E-1 비자 실시간 검증 및 피드백 시스템
 * 매뉴얼 기반 즉시 검증
 */

const { TEACHING_REQUIREMENTS, EDUCATION_INSTITUTION_TYPES } = require('../evaluators/E1ApplicationTypeEvaluators');

/**
 * E-1 실시간 검증기
 */
class E1RealTimeValidator {
  constructor() {
    this.validationRules = this.initializeValidationRules();
  }

  initializeValidationRules() {
    return {
      weeklyTeachingHours: (hours, type) => {
        const minimum = TEACHING_REQUIREMENTS.weeklyTeachingHours.minimum;
        
        if (type === 'EXTENSION' && hours < minimum) {
          return {
            valid: false,
            severity: 'CRITICAL',
            message: `연장 신청시 주 ${minimum}시간 이상 강의 필수`,
            solution: '추가 강의 배정 요청 또는 계약 수정',
            currentValue: hours,
            requiredValue: minimum
          };
        }
        
        if (type === 'NEW' && hours < minimum) {
          return {
            valid: false,
            severity: 'HIGH',
            message: `신규 신청시 주 ${minimum}시간 이상 강의 권장`,
            solution: '강의 시수 증대 협상',
            currentValue: hours,
            requiredValue: minimum
          };
        }
        
        return { valid: true, score: Math.min((hours / minimum) * 100, 100) };
      },

      onlineTeachingRatio: (ratio, type) => {
        const maxRatio = TEACHING_REQUIREMENTS.onlineTeachingLimit.maxPercentage / 100;
        
        if (ratio >= maxRatio) {
          return {
            valid: false,
            severity: 'CRITICAL',
            message: '온라인 강의는 전체의 50% 미만이어야 함',
            solution: '오프라인 강의 비중 증가 필요',
            currentValue: `${Math.round(ratio * 100)}%`,
            requiredValue: '<50%'
          };
        }
        
        if (ratio >= 0.4) {
          return {
            valid: true,
            severity: 'WARNING',
            message: '온라인 강의 비율이 높습니다',
            solution: '가능하면 오프라인 강의 비중을 더 늘리세요',
            currentValue: `${Math.round(ratio * 100)}%`,
            score: 100 - (ratio * 100)
          };
        }
        
        return { valid: true, score: 100 - (ratio * 50) };
      },

      institutionType: (type, applicationType) => {
        const eligible = EDUCATION_INSTITUTION_TYPES.eligible[type];
        const ineligible = EDUCATION_INSTITUTION_TYPES.ineligible[type];
        
        if (eligible) {
          let response = {
            valid: true,
            severity: 'SUCCESS',
            message: `${type}은(는) E-1 비자에 적합한 교육기관입니다`,
            score: 100
          };
          
          if (eligible.special) {
            response.additionalCheck = eligible.special;
            response.severity = 'INFO';
          }
          
          return response;
        }
        
        if (ineligible) {
          return {
            valid: false,
            severity: 'CRITICAL',
            message: `${type}은(는) E-1 비자 대상이 아닙니다`,
            solution: `${ineligible.alternative} 비자를 고려하세요`,
            alternative: ineligible.alternative
          };
        }
        
        return {
          valid: false,
          severity: 'HIGH',
          message: '교육기관 유형을 확인할 수 없습니다',
          solution: '고등교육법상 인정 교육기관인지 확인하세요'
        };
      },

      contractPeriod: (months, applicationType) => {
        if (applicationType === 'NEW') {
          if (months >= 12) {
            return {
              valid: true,
              severity: 'SUCCESS',
              message: '1년 이상 계약으로 복수비자 발급 가능',
              visaType: '복수사증',
              score: 100
            };
          } else if (months >= 6) {
            return {
              valid: true,
              severity: 'WARNING',
              message: '6개월 이상 계약이지만 1년 이상 권장',
              solution: '가능하면 1년 이상 계약으로 수정',
              visaType: '단수사증',
              score: 70
            };
          } else if (months >= 3) {
            return {
              valid: true,
              severity: 'WARNING',
              message: '3개월 이상 계약이지만 짧은 편입니다',
              solution: '계약 기간 연장 협상 권장',
              visaType: '단수사증',
              score: 50
            };
          } else {
            return {
              valid: false,
              severity: 'CRITICAL',
              message: '3개월 미만 계약은 비자 발급이 어렵습니다',
              solution: '최소 3개월 이상 계약 필요'
            };
          }
        }
        
        return { valid: true, score: 80 };
      },

      educationLevel: (level, position) => {
        const levelScores = {
          'phd': 100,
          'master': 80,
          'bachelor': 60
        };
        
        const positionRequirements = {
          '교수': 'master',
          '부교수': 'master',
          '조교수': 'master',
          '강사': 'bachelor'
        };
        
        const required = positionRequirements[position] || 'bachelor';
        const score = levelScores[level] || 0;
        
        if (level === 'phd') {
          return {
            valid: true,
            severity: 'SUCCESS',
            message: '박사 학위는 모든 교수직에 최적입니다',
            score: 100
          };
        }
        
        if (level === 'master' && required === 'master') {
          return {
            valid: true,
            severity: 'SUCCESS',
            message: `${position} 직급에 적합한 학력입니다`,
            score: 80
          };
        }
        
        if (level === 'bachelor' && position !== '강사') {
          return {
            valid: true,
            severity: 'WARNING',
            message: `${position} 직급에는 석사 이상 학위가 일반적입니다`,
            solution: '석사 학위 취득을 고려하세요',
            score: 60
          };
        }
        
        if (score === 0) {
          return {
            valid: false,
            severity: 'CRITICAL',
            message: 'E-1 비자는 최소 학사 학위가 필요합니다',
            solution: '학사 이상 학위 취득 필요'
          };
        }
        
        return { valid: true, score };
      },

      currentVisa: (visa, applicationType) => {
        if (applicationType !== 'CHANGE') {
          return { valid: true, score: 100 };
        }
        
        const directChangeAllowed = ['D-2', 'D-10', 'E-2', 'E-3', 'E-7', 'F-2', 'F-4', 'F-5'];
        const conditionalChange = {
          'D-2': '졸업 또는 수료 후 가능',
          'E-2': '석사 이상 학위 + 경력 필요'
        };
        const notAllowed = ['C-3', 'C-4', 'B-1', 'B-2', 'G-1', 'H-1', 'H-2'];
        
        if (directChangeAllowed.includes(visa)) {
          return {
            valid: true,
            severity: 'SUCCESS',
            message: `${visa}에서 E-1으로 직접 변경 가능`,
            score: 100
          };
        }
        
        if (conditionalChange[visa]) {
          return {
            valid: true,
            severity: 'INFO',
            message: `${visa}에서 E-1 변경 가능 (조건부)`,
            condition: conditionalChange[visa],
            score: 80
          };
        }
        
        if (notAllowed.includes(visa)) {
          return {
            valid: false,
            severity: 'CRITICAL',
            message: `${visa}에서 E-1으로 변경 불가`,
            solution: '다른 비자 유형을 고려하세요'
          };
        }
        
        return {
          valid: false,
          severity: 'HIGH',
          message: '변경 가능성을 확인할 수 없습니다',
          solution: '출입국 관리사무소에 문의하세요'
        };
      }
    };
  }

  /**
   * 단일 필드 실시간 검증
   */
  validateField(fieldName, value, context = {}) {
    const { applicationType = 'NEW', position, currentVisa } = context;
    
    const validator = this.validationRules[fieldName];
    if (!validator) {
      return { valid: true, message: '검증 규칙이 없습니다' };
    }
    
    try {
      switch (fieldName) {
        case 'weeklyTeachingHours':
          return validator(parseInt(value) || 0, applicationType);
        
        case 'onlineTeachingRatio':
          return validator(parseFloat(value) || 0, applicationType);
        
        case 'institutionType':
          return validator(value, applicationType);
        
        case 'contractPeriod':
          return validator(parseInt(value) || 0, applicationType);
        
        case 'educationLevel':
          return validator(value, position);
        
        case 'currentVisa':
          return validator(value, applicationType);
        
        default:
          return { valid: true };
      }
    } catch (error) {
      return {
        valid: false,
        severity: 'ERROR',
        message: '검증 중 오류가 발생했습니다',
        error: error.message
      };
    }
  }

  /**
   * 다중 필드 종합 검증
   */
  validateMultipleFields(fields, context = {}) {
    const results = {};
    const issues = [];
    const warnings = [];
    const successes = [];
    
    Object.entries(fields).forEach(([fieldName, value]) => {
      const result = this.validateField(fieldName, value, context);
      results[fieldName] = result;
      
      if (!result.valid) {
        issues.push({
          field: fieldName,
          severity: result.severity,
          message: result.message,
          solution: result.solution
        });
      } else if (result.severity === 'WARNING') {
        warnings.push({
          field: fieldName,
          message: result.message,
          solution: result.solution
        });
      } else if (result.severity === 'SUCCESS') {
        successes.push({
          field: fieldName,
          message: result.message
        });
      }
    });
    
    return {
      results,
      summary: {
        totalFields: Object.keys(fields).length,
        validFields: Object.values(results).filter(r => r.valid).length,
        issues: issues.length,
        warnings: warnings.length,
        successes: successes.length
      },
      issues,
      warnings,
      successes,
      overallValid: issues.length === 0
    };
  }

  /**
   * 동적 추천사항 생성
   */
  generateDynamicRecommendations(validationResults, context = {}) {
    const recommendations = [];
    const { applicationType = 'NEW' } = context;
    
    // 높은 우선순위 이슈 먼저 처리
    const criticalIssues = validationResults.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = validationResults.issues.filter(i => i.severity === 'HIGH');
    
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        title: '즉시 해결 필요',
        items: criticalIssues.map(issue => ({
          issue: issue.message,
          solution: issue.solution,
          field: issue.field
        }))
      });
    }
    
    if (highIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: '우선 개선 사항',
        items: highIssues.map(issue => ({
          issue: issue.message,
          solution: issue.solution,
          field: issue.field
        }))
      });
    }
    
    // 경고 사항을 개선 권장사항으로 전환
    if (validationResults.warnings.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: '개선 권장 사항',
        items: validationResults.warnings.map(warning => ({
          issue: warning.message,
          solution: warning.solution,
          field: warning.field
        }))
      });
    }
    
    // 신청 유형별 특별 권장사항
    if (applicationType === 'NEW') {
      recommendations.push({
        priority: 'INFO',
        title: '신규 신청 팁',
        items: [
          {
            issue: '신규 신청시 충분한 준비 기간 확보',
            solution: '서류 준비에 최소 2-3개월 소요'
          },
          {
            issue: '아포스티유/영사확인 필수',
            solution: '학위증명서는 반드시 공증 받으세요'
          }
        ]
      });
    } else if (applicationType === 'EXTENSION') {
      recommendations.push({
        priority: 'INFO',
        title: '연장 신청 팁',
        items: [
          {
            issue: '활동 실적 증빙이 중요',
            solution: '강의 실적과 출석 현황을 상세히 준비'
          },
          {
            issue: '계약 갱신 확정 후 신청',
            solution: '새 계약서 준비 완료 후 연장 신청'
          }
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * 실시간 점수 계산
   */
  calculateRealTimeScore(validationResults) {
    const fieldScores = Object.values(validationResults.results)
      .filter(result => result.score !== undefined)
      .map(result => result.score);
    
    if (fieldScores.length === 0) return 0;
    
    const averageScore = fieldScores.reduce((sum, score) => sum + score, 0) / fieldScores.length;
    
    // 치명적 이슈가 있으면 점수 대폭 감점
    const criticalCount = validationResults.issues.filter(i => i.severity === 'CRITICAL').length;
    const penaltyPerCritical = 20;
    
    return Math.max(0, averageScore - (criticalCount * penaltyPerCritical));
  }
}

module.exports = {
  E1RealTimeValidator
}; 