const logger = require('../../utils/logger');
const { normalizeVisaType, formatVisaTypeForDisplay } = require('../../utils/visaType');

/**
 * 문서 검증 서비스
 * 경로: /backend/src/services/visa/documentValidationService.js
 * 
 * 역할: 비자별 문서 타입 검증, 유효기간 확인, 대체 서류 제안
 */

/**
 * 문서 타입 정의
 */
const DOCUMENT_TYPES = {
  // 신분 관련
  PASSPORT: 'passport',
  PHOTO: 'photo',
  ALIEN_REGISTRATION: 'alien_registration',
  
  // 학력 관련
  DIPLOMA: 'diploma',
  TRANSCRIPT: 'transcript',
  DEGREE_VERIFICATION: 'degree_verification',
  
  // 경력 관련
  EMPLOYMENT_CONTRACT: 'employment_contract',
  CAREER_CERTIFICATE: 'career_certificate',
  RECOMMENDATION_LETTER: 'recommendation_letter',
  
  // 연구/논문 관련
  RESEARCH_PAPER: 'research_paper',
  PUBLICATIONS: 'publications',
  PATENT: 'patent',
  
  // 기관 관련
  COMPANY_REGISTRATION: 'company_registration',
  BUSINESS_LICENSE: 'business_license',
  INSTITUTION_VERIFICATION: 'institution_verification',
  
  // 기타
  CRIMINAL_RECORD: 'criminal_record',
  HEALTH_CERTIFICATE: 'health_certificate',
  FINANCIAL_STATEMENT: 'financial_statement'
};

/**
 * 비자별 필수 문서 정의
 */
const REQUIRED_DOCUMENTS = {
  'E-1': [
    DOCUMENT_TYPES.PASSPORT,
    DOCUMENT_TYPES.PHOTO,
    DOCUMENT_TYPES.DIPLOMA,
    DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
    DOCUMENT_TYPES.COMPANY_REGISTRATION
  ],
  
  'E-2': [
    DOCUMENT_TYPES.PASSPORT,
    DOCUMENT_TYPES.PHOTO,
    DOCUMENT_TYPES.DIPLOMA,
    DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
    DOCUMENT_TYPES.CRIMINAL_RECORD,
    DOCUMENT_TYPES.HEALTH_CERTIFICATE
  ],
  
  'E-3': [
    DOCUMENT_TYPES.PASSPORT,
    DOCUMENT_TYPES.PHOTO,
    DOCUMENT_TYPES.DIPLOMA,
    DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
    DOCUMENT_TYPES.RESEARCH_PAPER,
    DOCUMENT_TYPES.COMPANY_REGISTRATION
  ],
  
  'E-4': [
    DOCUMENT_TYPES.PASSPORT,
    DOCUMENT_TYPES.PHOTO,
    DOCUMENT_TYPES.DIPLOMA,
    DOCUMENT_TYPES.CAREER_CERTIFICATE,
    DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
    DOCUMENT_TYPES.COMPANY_REGISTRATION
  ],
  
  'F-6': [
    DOCUMENT_TYPES.PASSPORT,
    DOCUMENT_TYPES.PHOTO,
    DOCUMENT_TYPES.DIPLOMA,
    DOCUMENT_TYPES.CRIMINAL_RECORD,
    DOCUMENT_TYPES.HEALTH_CERTIFICATE,
    DOCUMENT_TYPES.FINANCIAL_STATEMENT
  ]
};

/**
 * 선택 문서 정의
 */
const OPTIONAL_DOCUMENTS = {
  'E-1': [
    DOCUMENT_TYPES.PUBLICATIONS,
    DOCUMENT_TYPES.RECOMMENDATION_LETTER,
    DOCUMENT_TYPES.RESEARCH_PAPER
  ],
  
  'E-2': [
    DOCUMENT_TYPES.RECOMMENDATION_LETTER,
    DOCUMENT_TYPES.CAREER_CERTIFICATE
  ],
  
  'E-3': [
    DOCUMENT_TYPES.PUBLICATIONS,
    DOCUMENT_TYPES.PATENT,
    DOCUMENT_TYPES.RECOMMENDATION_LETTER
  ]
};

/**
 * 대체 가능 문서 매핑
 */
const ALTERNATIVE_DOCUMENTS = {
  [DOCUMENT_TYPES.DIPLOMA]: [
    DOCUMENT_TYPES.DEGREE_VERIFICATION,
    DOCUMENT_TYPES.TRANSCRIPT
  ],
  
  [DOCUMENT_TYPES.CAREER_CERTIFICATE]: [
    DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
    DOCUMENT_TYPES.RECOMMENDATION_LETTER
  ],
  
  [DOCUMENT_TYPES.COMPANY_REGISTRATION]: [
    DOCUMENT_TYPES.BUSINESS_LICENSE,
    DOCUMENT_TYPES.INSTITUTION_VERIFICATION
  ]
};

/**
 * 문서 유효기간 정의 (개월 단위)
 */
const DOCUMENT_VALIDITY = {
  [DOCUMENT_TYPES.PASSPORT]: 36, // 3년
  [DOCUMENT_TYPES.CRIMINAL_RECORD]: 6, // 6개월
  [DOCUMENT_TYPES.HEALTH_CERTIFICATE]: 3, // 3개월
  [DOCUMENT_TYPES.FINANCIAL_STATEMENT]: 3, // 3개월
  [DOCUMENT_TYPES.COMPANY_REGISTRATION]: 12, // 1년
  [DOCUMENT_TYPES.CAREER_CERTIFICATE]: 6, // 6개월
  'default': 12 // 기본 1년
};

/**
 * 문서 검증 서비스 클래스
 */
class DocumentValidationService {
  
  /**
   * 문서 타입 검증
   * @param {string} documentType - 문서 타입
   * @param {string} visaType - 비자 타입
   * @returns {Object} 검증 결과
   */
  validateDocumentType(documentType, visaType) {
    try {
      const normalizedVisa = formatVisaTypeForDisplay(visaType);
      
      logger.debug('문서 타입 검증 시작', { documentType, visaType: normalizedVisa });
      
      const requiredDocs = REQUIRED_DOCUMENTS[normalizedVisa] || [];
      const optionalDocs = OPTIONAL_DOCUMENTS[normalizedVisa] || [];
      
      const isRequired = requiredDocs.includes(documentType);
      const isOptional = optionalDocs.includes(documentType);
      const isValid = isRequired || isOptional;
      
      const result = {
        isValid,
        isRequired,
        isOptional,
        category: this._categorizeDocument(documentType),
        alternatives: ALTERNATIVE_DOCUMENTS[documentType] || []
      };
      
      logger.debug('문서 타입 검증 완료', result);
      
      return result;
    } catch (error) {
      logger.error('문서 타입 검증 오류:', error);
      return {
        isValid: false,
        isRequired: false,
        isOptional: false,
        error: error.message
      };
    }
  }
  
  /**
   * 문서 유효기간 검증
   * @param {string} documentType - 문서 타입
   * @param {Date} issueDate - 발급일
   * @returns {Object} 유효기간 검증 결과
   */
  checkDocumentExpiry(documentType, issueDate) {
    try {
      const validityMonths = DOCUMENT_VALIDITY[documentType] || DOCUMENT_VALIDITY.default;
      const expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
      
      const now = new Date();
      const isValid = now <= expiryDate;
      const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        isValid,
        issueDate,
        expiryDate,
        validityMonths,
        daysRemaining,
        needsRenewal: daysRemaining <= 30,
        status: this._getExpiryStatus(daysRemaining)
      };
    } catch (error) {
      logger.error('문서 유효기간 검증 오류:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }
  
  /**
   * 문서 세트 완성도 검증
   * @param {Array} submittedDocuments - 제출된 문서들
   * @param {string} visaType - 비자 타입
   * @returns {Object} 완성도 검증 결과
   */
  validateDocumentSet(submittedDocuments = [], visaType) {
    try {
      const normalizedVisa = formatVisaTypeForDisplay(visaType);
      
      logger.info('문서 세트 검증 시작', { 
        visaType: normalizedVisa, 
        submittedCount: submittedDocuments.length 
      });
      
      const requiredDocs = REQUIRED_DOCUMENTS[normalizedVisa] || [];
      const optionalDocs = OPTIONAL_DOCUMENTS[normalizedVisa] || [];
      
      // 제출된 문서 타입 추출
      const submittedTypes = submittedDocuments.map(doc => doc.documentType || doc.type);
      
      // 필수 문서 체크
      const missingRequired = requiredDocs.filter(docType => 
        !submittedTypes.includes(docType) && 
        !this._hasAlternative(docType, submittedTypes)
      );
      
      // 선택 문서 체크
      const submittedOptional = optionalDocs.filter(docType => 
        submittedTypes.includes(docType)
      );
      
      // 완성도 계산
      const requiredCompleteness = ((requiredDocs.length - missingRequired.length) / requiredDocs.length) * 100;
      const optionalCompleteness = optionalDocs.length > 0 ? 
        (submittedOptional.length / optionalDocs.length) * 100 : 100;
      
      const overallCompleteness = (requiredCompleteness * 0.8) + (optionalCompleteness * 0.2);
      
      const result = {
        isComplete: missingRequired.length === 0,
        completeness: {
          overall: Math.round(overallCompleteness),
          required: Math.round(requiredCompleteness),
          optional: Math.round(optionalCompleteness)
        },
        requiredDocuments: {
          total: requiredDocs.length,
          submitted: requiredDocs.length - missingRequired.length,
          missing: missingRequired
        },
        optionalDocuments: {
          total: optionalDocs.length,
          submitted: submittedOptional.length,
          available: optionalDocs.filter(doc => !submittedTypes.includes(doc))
        },
        suggestions: this._generateDocumentSuggestions(missingRequired, normalizedVisa)
      };
      
      logger.info('문서 세트 검증 완료', {
        visaType: normalizedVisa,
        isComplete: result.isComplete,
        completeness: result.completeness.overall
      });
      
      return result;
    } catch (error) {
      logger.error('문서 세트 검증 오류:', error);
      return {
        isComplete: false,
        error: error.message
      };
    }
  }
  
  /**
   * 대체 문서 제안
   * @param {string} missingDocumentType - 누락된 문서 타입
   * @param {string} visaType - 비자 타입
   * @returns {Object} 대체 문서 제안
   */
  getAlternativeDocuments(missingDocumentType, visaType) {
    try {
      const alternatives = ALTERNATIVE_DOCUMENTS[missingDocumentType] || [];
      
      return {
        originalDocument: missingDocumentType,
        originalName: this._getDocumentName(missingDocumentType),
        alternatives: alternatives.map(altType => ({
          type: altType,
          name: this._getDocumentName(altType),
          acceptanceLevel: this._getAlternativeAcceptance(missingDocumentType, altType),
          description: this._getDocumentDescription(altType)
        })),
        hasAlternatives: alternatives.length > 0,
        recommendation: this._getAlternativeRecommendation(missingDocumentType, visaType)
      };
    } catch (error) {
      logger.error('대체 문서 제안 오류:', error);
      return {
        hasAlternatives: false,
        error: error.message
      };
    }
  }
  
  /**
   * 문서 분류
   */
  _categorizeDocument(documentType) {
    const categories = {
      'identity': [DOCUMENT_TYPES.PASSPORT, DOCUMENT_TYPES.PHOTO, DOCUMENT_TYPES.ALIEN_REGISTRATION],
      'education': [DOCUMENT_TYPES.DIPLOMA, DOCUMENT_TYPES.TRANSCRIPT, DOCUMENT_TYPES.DEGREE_VERIFICATION],
      'employment': [DOCUMENT_TYPES.EMPLOYMENT_CONTRACT, DOCUMENT_TYPES.CAREER_CERTIFICATE],
      'research': [DOCUMENT_TYPES.RESEARCH_PAPER, DOCUMENT_TYPES.PUBLICATIONS, DOCUMENT_TYPES.PATENT],
      'background': [DOCUMENT_TYPES.CRIMINAL_RECORD, DOCUMENT_TYPES.HEALTH_CERTIFICATE],
      'financial': [DOCUMENT_TYPES.FINANCIAL_STATEMENT],
      'organization': [DOCUMENT_TYPES.COMPANY_REGISTRATION, DOCUMENT_TYPES.BUSINESS_LICENSE]
    };
    
    for (const [category, types] of Object.entries(categories)) {
      if (types.includes(documentType)) {
        return category;
      }
    }
    
    return 'other';
  }
  
  /**
   * 유효기간 상태 결정
   */
  _getExpiryStatus(daysRemaining) {
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 30) return 'expiring_soon';
    if (daysRemaining <= 90) return 'renewal_recommended';
    return 'valid';
  }
  
  /**
   * 대체 문서 존재 여부 확인
   */
  _hasAlternative(requiredDocType, submittedTypes) {
    const alternatives = ALTERNATIVE_DOCUMENTS[requiredDocType] || [];
    return alternatives.some(altType => submittedTypes.includes(altType));
  }
  
  /**
   * 문서 제안 생성
   */
  _generateDocumentSuggestions(missingDocs, visaType) {
    return missingDocs.map(docType => ({
      type: docType,
      name: this._getDocumentName(docType),
      priority: 'high',
      alternatives: ALTERNATIVE_DOCUMENTS[docType] || [],
      urgency: this._getDocumentUrgency(docType, visaType)
    }));
  }
  
  /**
   * 문서명 반환
   */
  _getDocumentName(documentType) {
    const names = {
      [DOCUMENT_TYPES.PASSPORT]: '여권',
      [DOCUMENT_TYPES.PHOTO]: '증명사진',
      [DOCUMENT_TYPES.DIPLOMA]: '학위증명서',
      [DOCUMENT_TYPES.EMPLOYMENT_CONTRACT]: '고용계약서',
      [DOCUMENT_TYPES.CRIMINAL_RECORD]: '범죄경력증명서',
      [DOCUMENT_TYPES.HEALTH_CERTIFICATE]: '건강진단서',
      [DOCUMENT_TYPES.COMPANY_REGISTRATION]: '사업자등록증',
      [DOCUMENT_TYPES.CAREER_CERTIFICATE]: '경력증명서',
      [DOCUMENT_TYPES.RESEARCH_PAPER]: '연구논문',
      [DOCUMENT_TYPES.PUBLICATIONS]: '논문목록',
      [DOCUMENT_TYPES.RECOMMENDATION_LETTER]: '추천서'
    };
    
    return names[documentType] || documentType;
  }
  
  /**
   * 문서 설명 반환
   */
  _getDocumentDescription(documentType) {
    const descriptions = {
      [DOCUMENT_TYPES.PASSPORT]: '유효기간이 6개월 이상 남은 여권',
      [DOCUMENT_TYPES.DIPLOMA]: '최종학력 학위증명서 (공증 필요)',
      [DOCUMENT_TYPES.CRIMINAL_RECORD]: '최근 6개월 이내 발급 범죄경력증명서',
      [DOCUMENT_TYPES.HEALTH_CERTIFICATE]: '최근 3개월 이내 건강진단서'
    };
    
    return descriptions[documentType] || '해당 문서';
  }
  
  /**
   * 대체 문서 수용도 반환
   */
  _getAlternativeAcceptance(originalType, alternativeType) {
    // 간단한 매핑 - 실제로는 더 복잡한 로직 필요
    return 'conditional'; // high, medium, low, conditional
  }
  
  /**
   * 대체 문서 추천 메시지
   */
  _getAlternativeRecommendation(missingDocType, visaType) {
    return `${this._getDocumentName(missingDocType)} 대신 제출 가능한 서류가 있습니다. 자세한 내용은 출입국관리사무소에 문의하세요.`;
  }
  
  /**
   * 문서 긴급도 반환
   */
  _getDocumentUrgency(docType, visaType) {
    const criticalDocs = [DOCUMENT_TYPES.PASSPORT, DOCUMENT_TYPES.EMPLOYMENT_CONTRACT];
    return criticalDocs.includes(docType) ? 'critical' : 'normal';
  }
}

// 싱글톤 인스턴스
let documentValidationInstance = null;

/**
 * 문서 검증 서비스 인스턴스 반환
 */
const getDocumentValidationService = () => {
  if (!documentValidationInstance) {
    documentValidationInstance = new DocumentValidationService();
    logger.info('DocumentValidationService 인스턴스 생성');
  }
  return documentValidationInstance;
};

module.exports = {
  DocumentValidationService,
  getDocumentValidationService,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENTS,
  OPTIONAL_DOCUMENTS,
  ALTERNATIVE_DOCUMENTS
}; 