/**
 * 비자 플러그인 추상 클래스
 * 모든 비자 타입의 플러그인이 상속받아야 하는 기본 클래스
 * @abstract
 */

const logger = require('../../../../utils/logger');

class AbstractVisaPlugin {
  constructor(visaType, config) {
    if (new.target === AbstractVisaPlugin) {
      throw new Error('Cannot instantiate abstract class directly');
    }
    
    this.visaType = visaType;
    this.config = config;
    this.version = config?.version || '1.0';
    this.initialized = false;
  }

  /**
   * 플러그인 초기화
   */
  async initialize() {
    try {
      logger.info(`Initializing ${this.visaType} plugin...`);
      
      // 설정 검증
      this.validateConfiguration();
      
      // 필요한 리소스 로드
      await this.loadResources();
      
      // 초기화 완료
      this.initialized = true;
      logger.info(`${this.visaType} plugin initialized successfully`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize ${this.visaType} plugin:`, error);
      throw error;
    }
  }

  /**
   * 플러그인 정보 반환
   */
  getInfo() {
    return {
      code: this.visaType,
      name: this.config?.name || this.visaType,
      category: this.config?.category || 'UNKNOWN',
      description: this.config?.description || '',
      version: this.version,
      supportedFeatures: this.getSupportedFeatures(),
      requirements: this.getRequirements(),
      metadata: this.getMetadata()
    };
  }

  /**
   * 지원 기능 목록
   */
  getSupportedFeatures() {
    return {
      preScreening: this.supportsPreScreening(),
      detailedEvaluation: this.supportsDetailedEvaluation(),
      documentValidation: this.supportsDocumentValidation(),
      realTimeValidation: this.supportsRealTimeValidation(),
      complexityAnalysis: this.supportsComplexityAnalysis(),
      activityValidation: this.supportsActivityValidation(),
      certificateIssuance: this.supportsCertificateIssuance(),
      legalMatching: this.supportsLegalMatching()
    };
  }

  /**
   * 요구사항 정의
   */
  getRequirements() {
    return {
      documents: this.getDocumentRequirements(),
      eligibility: this.getEligibilityRequirements(),
      restrictions: this.getRestrictions()
    };
  }

  /**
   * 평가 규칙 반환
   */
  getEvaluationRules() {
    return {
      immediateRejection: this.getImmediateRejectionRules(),
      remediableIssues: this.getRemediableIssueRules(),
      scoring: this.getScoringRules(),
      validation: this.getValidationRules()
    };
  }

  /**
   * 필드 검증 규칙 반환
   */
  getFieldValidationRules() {
    const baseRules = this.getCommonFieldRules();
    const specificRules = this.getVisaSpecificFieldRules();
    
    return {
      ...baseRules,
      ...specificRules
    };
  }

  /**
   * 문서 요구사항 템플릿
   */
  getDocumentTemplate(applicationType = 'NEW') {
    const baseDocuments = this.getBaseDocuments();
    const typeSpecificDocuments = this.getApplicationTypeDocuments(applicationType);
    const nationalitySpecificDocuments = this.getNationalitySpecificDocuments();
    
    return {
      required: [...baseDocuments.required, ...typeSpecificDocuments.required],
      optional: [...baseDocuments.optional, ...typeSpecificDocuments.optional],
      conditional: nationalitySpecificDocuments
    };
  }

  /**
   * 프로세싱 타임 계산
   */
  calculateProcessingTime(applicantData) {
    const baseTime = this.config?.processingTime || { min: 7, max: 21 };
    const adjustments = this.getProcessingTimeAdjustments(applicantData);
    
    return {
      minimum: Math.max(baseTime.min + adjustments.min, 5),
      maximum: baseTime.max + adjustments.max,
      factors: adjustments.factors
    };
  }

  // === 추상 메서드 (하위 클래스에서 구현 필수) ===

  /**
   * @abstract
   * 설정 검증
   */
  validateConfiguration() {
    throw new Error('Method validateConfiguration must be implemented');
  }

  /**
   * @abstract
   * 리소스 로드
   */
  async loadResources() {
    throw new Error('Method loadResources must be implemented');
  }

  /**
   * @abstract
   * 즉시 거부 규칙
   */
  getImmediateRejectionRules() {
    throw new Error('Method getImmediateRejectionRules must be implemented');
  }

  /**
   * @abstract
   * 보완 가능 사항 규칙
   */
  getRemediableIssueRules() {
    throw new Error('Method getRemediableIssueRules must be implemented');
  }

  /**
   * @abstract
   * 비자별 필드 규칙
   */
  getVisaSpecificFieldRules() {
    throw new Error('Method getVisaSpecificFieldRules must be implemented');
  }

  /**
   * @abstract
   * 자격 요건
   */
  getEligibilityRequirements() {
    throw new Error('Method getEligibilityRequirements must be implemented');
  }

  // === 기본 구현 메서드 (오버라이드 가능) ===

  /**
   * 기본 지원 여부 - 사전심사
   */
  supportsPreScreening() {
    return true;
  }

  /**
   * 기본 지원 여부 - 상세평가
   */
  supportsDetailedEvaluation() {
    return true;
  }

  /**
   * 기본 지원 여부 - 문서검증
   */
  supportsDocumentValidation() {
    return true;
  }

  /**
   * 기본 지원 여부 - 실시간검증
   */
  supportsRealTimeValidation() {
    return false;
  }

  /**
   * 기본 지원 여부 - 복잡도분석
   */
  supportsComplexityAnalysis() {
    return false;
  }

  /**
   * 기본 지원 여부 - 활동검증
   */
  supportsActivityValidation() {
    return false;
  }

  /**
   * 기본 지원 여부 - 증명서발급
   */
  supportsCertificateIssuance() {
    return false;
  }

  /**
   * 기본 지원 여부 - 법무대리인매칭
   */
  supportsLegalMatching() {
    return false;
  }

  /**
   * 공통 필드 규칙
   */
  getCommonFieldRules() {
    return {
      nationality: {
        required: true,
        type: 'string',
        pattern: /^[A-Z]{2}$/,
        message: 'ISO 3166-1 alpha-2 국가코드'
      },
      applicationType: {
        required: true,
        type: 'string',
        enum: ['NEW', 'EXTENSION', 'CHANGE'],
        message: '신청 유형 선택'
      },
      passportNumber: {
        required: true,
        type: 'string',
        pattern: /^[A-Z0-9]+$/,
        message: '여권번호'
      },
      passportExpiry: {
        required: true,
        type: 'date',
        validation: (value) => {
          const sixMonthsFromNow = new Date();
          sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
          return new Date(value) > sixMonthsFromNow;
        },
        message: '여권 유효기간 6개월 이상 필요'
      }
    };
  }

  /**
   * 기본 문서 요구사항
   */
  getBaseDocuments() {
    return {
      required: [
        { code: 'APPLICATION_FORM', name: '사증발급신청서' },
        { code: 'PASSPORT', name: '여권' },
        { code: 'PHOTO', name: '사진' },
        { code: 'FEE', name: '수수료' }
      ],
      optional: []
    };
  }

  /**
   * 신청 유형별 문서
   */
  getApplicationTypeDocuments(applicationType) {
    const documents = {
      'NEW': {
        required: [],
        optional: []
      },
      'EXTENSION': {
        required: [
          { code: 'ALIEN_REGISTRATION', name: '외국인등록증' }
        ],
        optional: []
      },
      'CHANGE': {
        required: [
          { code: 'ALIEN_REGISTRATION', name: '외국인등록증' },
          { code: 'CURRENT_VISA_PROOF', name: '현 체류자격 증명' }
        ],
        optional: []
      }
    };
    
    return documents[applicationType] || documents['NEW'];
  }

  /**
   * 국적별 문서 (기본값)
   */
  getNationalitySpecificDocuments() {
    return [];
  }

  /**
   * 문서 요구사항
   */
  getDocumentRequirements() {
    return this.getDocumentTemplate();
  }

  /**
   * 제한사항
   */
  getRestrictions() {
    return {
      age: null,
      gender: null,
      nationality: [],
      other: []
    };
  }

  /**
   * 점수 규칙
   */
  getScoringRules() {
    return {
      weights: {
        eligibility: 0.4,
        documents: 0.2,
        experience: 0.2,
        other: 0.2
      },
      thresholds: {
        approved: 70,
        conditional: 50,
        rejected: 0
      }
    };
  }

  /**
   * 검증 규칙
   */
  getValidationRules() {
    return {};
  }

  /**
   * 처리시간 조정
   */
  getProcessingTimeAdjustments(applicantData) {
    const adjustments = {
      min: 0,
      max: 0,
      factors: []
    };
    
    // 신청 유형별 조정
    if (applicantData.applicationType === 'NEW') {
      adjustments.min += 5;
      adjustments.factors.push('신규 신청');
    } else if (applicantData.applicationType === 'CHANGE') {
      adjustments.max += 10;
      adjustments.factors.push('변경 신청');
    }
    
    return adjustments;
  }

  /**
   * 메타데이터
   */
  getMetadata() {
    return {
      lastUpdated: new Date().toISOString(),
      version: this.version,
      author: 'System'
    };
  }

  /**
   * 플러그인 종료
   */
  async shutdown() {
    logger.info(`Shutting down ${this.visaType} plugin...`);
    this.initialized = false;
  }
}

module.exports = AbstractVisaPlugin;