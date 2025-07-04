/**
 * 준법성 기록 모델
 * 비자 신청자의 한국 법규 준수 이력을 추적하고 평가
 * 경로: /backend/src/modules/visaEvaluation/core/models/ComplianceRecord.js
 */

/**
 * 준법성 평가 영역
 */
const COMPLIANCE_AREAS = {
  IMMIGRATION: 'IMMIGRATION',       // 출입국 관리법
  TAX: 'TAX',                      // 세법
  LABOR: 'LABOR',                  // 근로기준법
  INSURANCE: 'INSURANCE',          // 사회보험
  CRIMINAL: 'CRIMINAL',            // 형사법
  CIVIL: 'CIVIL',                  // 민사법
  ADMINISTRATIVE: 'ADMINISTRATIVE'  // 행정법
};

/**
 * 위반 심각도 레벨
 */
const VIOLATION_SEVERITY = {
  MINOR: {
    level: 1,
    description: '경미한 위반 (행정지도, 경고)',
    impact: 'LOW',
    points: -5
  },
  MODERATE: {
    level: 2,
    description: '중간 정도 위반 (과태료, 벌금)',
    impact: 'MEDIUM',
    points: -15
  },
  MAJOR: {
    level: 3,
    description: '중대한 위반 (업무정지, 자격취소)',
    impact: 'HIGH',
    points: -30
  },
  SEVERE: {
    level: 4,
    description: '심각한 위반 (형사처벌, 강제출국)',
    impact: 'CRITICAL',
    points: -50
  }
};

/**
 * 준법성 기록 클래스
 */
class ComplianceRecord {
  constructor(data = {}) {
    this.violations = data.violations || [];
    this.positiveRecords = data.positiveRecords || [];
    this.taxRecords = data.taxRecords || [];
    this.insuranceRecords = data.insuranceRecords || [];
    this.evaluationDate = new Date();
  }

  /**
   * 위반 기록 추가
   */
  addViolation(violation) {
    const violationRecord = {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      area: violation.area,
      type: violation.type,
      date: new Date(violation.date),
      description: violation.description,
      severity: violation.severity || 'MINOR',
      penalty: {
        type: violation.penalty?.type || null, // FINE, SUSPENSION, WARNING
        amount: violation.penalty?.amount || null,
        period: violation.penalty?.period || null
      },
      status: violation.status || 'ACTIVE', // ACTIVE, RESOLVED, APPEALED
      resolution: {
        date: violation.resolution?.date || null,
        method: violation.resolution?.method || null,
        details: violation.resolution?.details || null
      },
      impact: this._calculateViolationImpact(violation.severity, violation.area)
    };

    this.violations.push(violationRecord);
    return violationRecord.id;
  }

  /**
   * 긍정적 기록 추가 (모범 납세, 사회봉사 등)
   */
  addPositiveRecord(record) {
    const positiveRecord = {
      id: `positive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: record.type, // TAX_COMPLIANCE, VOLUNTEER, DONATION, AWARD
      date: new Date(record.date),
      description: record.description,
      value: record.value || null,
      verificationSource: record.verificationSource || null,
      points: this._calculatePositivePoints(record.type, record.value)
    };

    this.positiveRecords.push(positiveRecord);
    return positiveRecord.id;
  }

  /**
   * 세금 납부 기록 추가
   */
  addTaxRecord(taxRecord) {
    const record = {
      year: taxRecord.year,
      type: taxRecord.type, // INCOME, BUSINESS, VAT
      amount: taxRecord.amount,
      dueDate: new Date(taxRecord.dueDate),
      paidDate: new Date(taxRecord.paidDate),
      status: taxRecord.status, // ON_TIME, LATE, UNPAID
      penalty: taxRecord.penalty || 0,
      compliance: this._evaluateTaxCompliance(taxRecord)
    };

    this.taxRecords.push(record);
  }

  /**
   * 사회보험 가입 기록 추가
   */
  addInsuranceRecord(insuranceRecord) {
    const record = {
      type: insuranceRecord.type, // HEALTH, PENSION, EMPLOYMENT, WORKERS_COMP
      startDate: new Date(insuranceRecord.startDate),
      endDate: insuranceRecord.endDate ? new Date(insuranceRecord.endDate) : null,
      employer: insuranceRecord.employer,
      premium: insuranceRecord.premium || null,
      status: insuranceRecord.status, // ACTIVE, TERMINATED, SUSPENDED
      compliance: this._evaluateInsuranceCompliance(insuranceRecord)
    };

    this.insuranceRecords.push(record);
  }

  /**
   * 전체 준법성 점수 계산
   */
  calculateComplianceScore() {
    let baseScore = 100;
    
    // 위반 점수 차감
    const violationDeduction = this.violations.reduce((total, violation) => {
      return total + VIOLATION_SEVERITY[violation.severity].points;
    }, 0);

    // 긍정적 기록 점수 추가
    const positiveAddition = this.positiveRecords.reduce((total, record) => {
      return total + record.points;
    }, 0);

    // 세금 납부 성실도
    const taxScore = this._calculateTaxComplianceScore();
    
    // 사회보험 가입 성실도
    const insuranceScore = this._calculateInsuranceComplianceScore();

    // 최종 점수 계산
    const finalScore = Math.max(0, Math.min(100, 
      baseScore + violationDeduction + positiveAddition + taxScore + insuranceScore
    ));

    return {
      totalScore: Math.round(finalScore),
      breakdown: {
        baseScore,
        violationDeduction,
        positiveAddition,
        taxScore,
        insuranceScore
      },
      level: this._getComplianceLevel(finalScore)
    };
  }

  /**
   * 위반 이력 분석
   */
  analyzeViolations() {
    const analysis = {
      totalCount: this.violations.length,
      byArea: {},
      bySeverity: {},
      recentViolations: [],
      trends: {}
    };

    // 영역별 분류
    Object.values(COMPLIANCE_AREAS).forEach(area => {
      analysis.byArea[area] = this.violations.filter(v => v.area === area).length;
    });

    // 심각도별 분류
    Object.keys(VIOLATION_SEVERITY).forEach(severity => {
      analysis.bySeverity[severity] = this.violations.filter(v => v.severity === severity).length;
    });

    // 최근 2년간 위반
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    analysis.recentViolations = this.violations.filter(v => v.date >= twoYearsAgo);

    return analysis;
  }

  /**
   * 리스크 레벨 평가
   */
  assessRiskLevel() {
    const score = this.calculateComplianceScore().totalScore;
    const violationAnalysis = this.analyzeViolations();
    
    // 심각한 위반이 있는 경우
    if (violationAnalysis.bySeverity.SEVERE > 0) {
      return {
        level: 'CRITICAL',
        description: '심각한 법규 위반 이력 보유',
        recommendation: '비자 승인 어려움 예상'
      };
    }

    // 점수 기반 평가
    if (score >= 85) {
      return {
        level: 'LOW',
        description: '우수한 준법성 기록',
        recommendation: '비자 승인에 긍정적 영향'
      };
    } else if (score >= 70) {
      return {
        level: 'MEDIUM',
        description: '양호한 준법성 기록',
        recommendation: '비자 승인 가능'
      };
    } else if (score >= 50) {
      return {
        level: 'HIGH',
        description: '준법성 개선 필요',
        recommendation: '추가 서류 또는 설명 필요'
      };
    } else {
      return {
        level: 'CRITICAL',
        description: '심각한 준법성 문제',
        recommendation: '비자 승인 매우 어려움'
      };
    }
  }

  // Private methods

  _calculateViolationImpact(severity, area) {
    const baseSeverity = VIOLATION_SEVERITY[severity];
    
    // 출입국 관련 위반은 더 큰 영향
    const areaMultiplier = area === COMPLIANCE_AREAS.IMMIGRATION ? 1.5 : 1.0;
    
    return {
      score: baseSeverity.points * areaMultiplier,
      level: baseSeverity.impact
    };
  }

  _calculatePositivePoints(type, value) {
    const pointsMap = {
      TAX_COMPLIANCE: 5,     // 성실 납세
      VOLUNTEER: 3,          // 자원봉사
      DONATION: 2,           // 기부
      AWARD: 10,             // 수상 경력
      COMMUNITY_SERVICE: 4   // 지역사회 봉사
    };

    return pointsMap[type] || 0;
  }

  _evaluateTaxCompliance(taxRecord) {
    const dueDate = taxRecord.dueDate;
    const paidDate = taxRecord.paidDate;
    
    if (taxRecord.status === 'UNPAID') return 'NON_COMPLIANT';
    if (taxRecord.status === 'ON_TIME') return 'EXCELLENT';
    
    // 지연 기간 계산
    const delayDays = (paidDate - dueDate) / (1000 * 60 * 60 * 24);
    
    if (delayDays <= 7) return 'GOOD';
    if (delayDays <= 30) return 'FAIR';
    return 'POOR';
  }

  _evaluateInsuranceCompliance(insuranceRecord) {
    if (insuranceRecord.status === 'ACTIVE') return 'COMPLIANT';
    if (insuranceRecord.status === 'TERMINATED') return 'NORMAL_TERMINATION';
    return 'NON_COMPLIANT';
  }

  _calculateTaxComplianceScore() {
    if (this.taxRecords.length === 0) return -5; // 기록 없음

    const complianceRates = this.taxRecords.map(record => {
      switch (record.compliance) {
        case 'EXCELLENT': return 5;
        case 'GOOD': return 3;
        case 'FAIR': return 1;
        case 'POOR': return -2;
        case 'NON_COMPLIANT': return -5;
        default: return 0;
      }
    });

    return complianceRates.reduce((sum, rate) => sum + rate, 0) / complianceRates.length;
  }

  _calculateInsuranceComplianceScore() {
    if (this.insuranceRecords.length === 0) return -3; // 기록 없음

    const compliantRecords = this.insuranceRecords.filter(
      record => record.compliance === 'COMPLIANT'
    );

    const complianceRate = compliantRecords.length / this.insuranceRecords.length;
    
    if (complianceRate >= 0.9) return 5;
    if (complianceRate >= 0.7) return 3;
    if (complianceRate >= 0.5) return 1;
    return -2;
  }

  _getComplianceLevel(score) {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'FAIR';
    if (score >= 60) return 'POOR';
    return 'CRITICAL';
  }
}

module.exports = {
  ComplianceRecord,
  COMPLIANCE_AREAS,
  VIOLATION_SEVERITY
}; 