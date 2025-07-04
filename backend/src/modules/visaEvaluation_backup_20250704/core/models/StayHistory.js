/**
 * 체류 이력 모델
 * 연장/변경 신청 시 과거 체류 기록을 평가하기 위한 데이터 모델
 * 경로: /backend/src/modules/visaEvaluation/core/models/StayHistory.js
 */

/**
 * 체류 이력 상태 정의
 */
const STAY_STATUS = {
  LEGAL: 'LEGAL',                    // 적법 체류
  OVERSTAY: 'OVERSTAY',             // 체류기간 초과
  ILLEGAL_WORK: 'ILLEGAL_WORK',     // 불법 취업
  VIOLATION: 'VIOLATION',           // 기타 위반
  DEPARTURE: 'DEPARTURE'            // 출국
};

/**
 * 체류 활동 유형
 */
const ACTIVITY_TYPE = {
  STUDY: 'STUDY',                   // 학업
  WORK: 'WORK',                     // 취업
  RESEARCH: 'RESEARCH',             // 연구
  BUSINESS: 'BUSINESS',             // 사업
  FAMILY: 'FAMILY',                 // 가족
  OTHER: 'OTHER'                    // 기타
};

/**
 * 체류 이력 클래스
 */
class StayHistory {
  constructor(data = {}) {
    this.periods = data.periods || [];
    this.violations = data.violations || [];
    this.contributions = data.contributions || [];
    this.currentStatus = data.currentStatus || null;
    this.totalStayDuration = this.calculateTotalDuration();
  }

  /**
   * 체류 기간 추가
   */
  addStayPeriod(period) {
    const stayPeriod = {
      visaType: period.visaType,
      startDate: new Date(period.startDate),
      endDate: new Date(period.endDate),
      status: period.status || STAY_STATUS.LEGAL,
      activityType: period.activityType,
      employer: period.employer || null,
      institution: period.institution || null,
      address: period.address || null,
      // 활동 세부사항
      details: {
        workHours: period.workHours || null,
        salary: period.salary || null,
        position: period.position || null,
        department: period.department || null
      }
    };
    
    this.periods.push(stayPeriod);
    this.totalStayDuration = this.calculateTotalDuration();
  }

  /**
   * 위반 이력 추가
   */
  addViolation(violation) {
    const violationRecord = {
      type: violation.type,
      date: new Date(violation.date),
      description: violation.description,
      penalty: violation.penalty || null,
      resolved: violation.resolved || false,
      severity: violation.severity || 'MINOR' // MINOR, MAJOR, SEVERE
    };
    
    this.violations.push(violationRecord);
  }

  /**
   * 사회 기여 활동 추가
   */
  addContribution(contribution) {
    const contributionRecord = {
      type: contribution.type, // TAX, INSURANCE, VOLUNTEER, DONATION
      period: contribution.period,
      amount: contribution.amount || null,
      description: contribution.description,
      verified: contribution.verified || false
    };
    
    this.contributions.push(contributionRecord);
  }

  /**
   * 전체 체류 기간 계산 (개월 단위)
   */
  calculateTotalDuration() {
    let totalMonths = 0;
    
    this.periods.forEach(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                     (end.getMonth() - start.getMonth());
      totalMonths += months;
    });
    
    return totalMonths;
  }

  /**
   * 특정 비자 타입의 체류 기간 계산
   */
  getStayDurationByVisaType(visaType) {
    const relevantPeriods = this.periods.filter(p => p.visaType === visaType);
    let totalMonths = 0;
    
    relevantPeriods.forEach(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                     (end.getMonth() - start.getMonth());
      totalMonths += months;
    });
    
    return totalMonths;
  }

  /**
   * 법규 위반 심각도 평가
   */
  getViolationSeverity() {
    if (this.violations.length === 0) return 'NONE';
    
    const severityLevels = this.violations.map(v => v.severity);
    
    if (severityLevels.includes('SEVERE')) return 'SEVERE';
    if (severityLevels.includes('MAJOR')) return 'MAJOR';
    if (severityLevels.includes('MINOR')) return 'MINOR';
    
    return 'NONE';
  }

  /**
   * 체류 안정성 평가
   */
  evaluateStability() {
    const addressChanges = this.getAddressChangeFrequency();
    const employerChanges = this.getEmployerChangeFrequency();
    const continuity = this.evaluateContinuity();
    
    return {
      addressStability: addressChanges <= 2 ? 'HIGH' : addressChanges <= 4 ? 'MEDIUM' : 'LOW',
      employmentStability: employerChanges <= 1 ? 'HIGH' : employerChanges <= 3 ? 'MEDIUM' : 'LOW',
      overallContinuity: continuity
    };
  }

  /**
   * 주소 변경 빈도 계산
   */
  getAddressChangeFrequency() {
    const addresses = this.periods.map(p => p.address).filter(addr => addr);
    const uniqueAddresses = [...new Set(addresses)];
    return uniqueAddresses.length;
  }

  /**
   * 고용주 변경 빈도 계산
   */
  getEmployerChangeFrequency() {
    const employers = this.periods.map(p => p.employer).filter(emp => emp);
    const uniqueEmployers = [...new Set(employers)];
    return uniqueEmployers.length;
  }

  /**
   * 활동 연속성 평가
   */
  evaluateContinuity() {
    if (this.periods.length <= 1) return 'HIGH';
    
    const gaps = [];
    for (let i = 1; i < this.periods.length; i++) {
      const prevEnd = new Date(this.periods[i-1].endDate);
      const currentStart = new Date(this.periods[i].startDate);
      const gapDays = (currentStart - prevEnd) / (1000 * 60 * 60 * 24);
      gaps.push(gapDays);
    }
    
    const maxGap = Math.max(...gaps);
    
    if (maxGap <= 30) return 'HIGH';      // 30일 이하 공백
    if (maxGap <= 90) return 'MEDIUM';    // 90일 이하 공백
    return 'LOW';                         // 90일 초과 공백
  }

  /**
   * 세금 납부 이력 조회
   */
  getTaxPaymentHistory() {
    return this.contributions.filter(c => c.type === 'TAX');
  }

  /**
   * 보험 가입 이력 조회
   */
  getInsuranceHistory() {
    return this.contributions.filter(c => c.type === 'INSURANCE');
  }

  /**
   * 체류 이력 요약
   */
  getSummary() {
    return {
      totalDuration: this.totalStayDuration,
      totalPeriods: this.periods.length,
      violationCount: this.violations.length,
      violationSeverity: this.getViolationSeverity(),
      stability: this.evaluateStability(),
      contributions: {
        tax: this.getTaxPaymentHistory().length,
        insurance: this.getInsuranceHistory().length,
        volunteer: this.contributions.filter(c => c.type === 'VOLUNTEER').length
      },
      currentStatus: this.currentStatus
    };
  }
}

module.exports = {
  StayHistory,
  STAY_STATUS,
  ACTIVITY_TYPE
}; 