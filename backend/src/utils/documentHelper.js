const path = require('path');
const logger = require('./logger');

/**
 * 문서 헬퍼 유틸리티
 * 경로: /backend/src/utils/documentHelper.js
 * 
 * 역할: 문서명 파싱, 분류, 누락 서류 제안
 */

/**
 * 파일 확장자별 MIME 타입 매핑
 */
const MIME_TYPE_MAP = {
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'txt': 'text/plain',
  'rtf': 'application/rtf'
};

/**
 * 허용되는 파일 확장자
 */
const ALLOWED_EXTENSIONS = Object.keys(MIME_TYPE_MAP);

/**
 * 문서 카테고리별 키워드 매핑
 */
const DOCUMENT_KEYWORDS = {
  passport: ['여권', 'passport', '구경', '국경', 'p.p'],
  photo: ['사진', 'photo', '증명사진', 'portrait', '얼굴'],
  diploma: ['학위', '졸업', 'diploma', 'degree', '학사', '석사', '박사', '전문학사'],
  transcript: ['성적', '성적표', 'transcript', 'grade', '성적증명서'],
  employment_contract: ['고용계약서', '근로계약서', 'employment', 'contract', '계약서'],
  career_certificate: ['경력증명서', 'career', '재직증명서', '경력', 'experience'],
  criminal_record: ['범죄경력', '무범죄', 'criminal', 'background', '범죄기록'],
  health_certificate: ['건강진단서', 'health', 'medical', '의료', '건강검진'],
  company_registration: ['사업자등록증', 'business', 'registration', '회사등록', '법인등록'],
  business_license: ['사업면허', 'license', '영업허가', '면허증'],
  recommendation_letter: ['추천서', 'recommendation', 'reference', '추천장'],
  research_paper: ['논문', 'paper', 'research', '연구', '학술'],
  publications: ['출판물', 'publication', '논문목록', 'journal'],
  patent: ['특허', 'patent', '특허증', '지적재산권'],
  financial_statement: ['재정증명서', 'financial', '잔고증명서', '통장사본', '은행']
};

/**
 * 국가별 문서명 변형
 */
const COUNTRY_VARIATIONS = {
  'KR': {
    passport: ['여권'],
    diploma: ['학위증명서', '졸업증명서', '학위기'],
    criminal_record: ['범죄경력증명서', '무범죄증명서']
  },
  'US': {
    passport: ['passport'],
    diploma: ['diploma', 'degree certificate'],
    criminal_record: ['background check', 'criminal background check']
  },
  'CN': {
    passport: ['护照'],
    diploma: ['学位证书', '毕业证书'],
    criminal_record: ['无犯罪记录证明']
  }
};

/**
 * 비자별 문서 우선순위
 */
const DOCUMENT_PRIORITY = {
  'E-1': {
    critical: ['passport', 'diploma', 'employment_contract'],
    important: ['company_registration', 'career_certificate'],
    optional: ['recommendation_letter', 'research_paper']
  },
  'E-2': {
    critical: ['passport', 'diploma', 'employment_contract', 'criminal_record'],
    important: ['health_certificate', 'career_certificate'],
    optional: ['recommendation_letter']
  },
  'E-3': {
    critical: ['passport', 'diploma', 'research_paper'],
    important: ['employment_contract', 'publications'],
    optional: ['patent', 'recommendation_letter']
  }
};

/**
 * 문서 헬퍼 클래스
 */
class DocumentHelper {
  
  /**
   * 파일명에서 문서 타입 파싱
   * @param {string} fileName - 파일명
   * @param {string} visaType - 비자 타입 (선택)
   * @returns {Object} 파싱 결과
   */
  static parseDocumentName(fileName, visaType = null) {
    try {
      const normalizedName = fileName.toLowerCase().trim();
      const detectedTypes = [];
      let confidence = 0;
      
      logger.debug('문서명 파싱 시작', { fileName, visaType });
      
      // 키워드 기반 매칭
      for (const [docType, keywords] of Object.entries(DOCUMENT_KEYWORDS)) {
        for (const keyword of keywords) {
          if (normalizedName.includes(keyword.toLowerCase())) {
            detectedTypes.push({
              type: docType,
              confidence: this._calculateKeywordConfidence(keyword, normalizedName),
              matchedKeyword: keyword
            });
          }
        }
      }
      
      // 신뢰도 기준 정렬
      detectedTypes.sort((a, b) => b.confidence - a.confidence);
      
      const result = {
        fileName,
        detectedTypes,
        primaryType: detectedTypes.length > 0 ? detectedTypes[0].type : 'unknown',
        confidence: detectedTypes.length > 0 ? detectedTypes[0].confidence : 0,
        suggestions: this._generateTypeSuggestions(detectedTypes, visaType),
        fileInfo: this._analyzeFileInfo(fileName)
      };
      
      logger.debug('문서명 파싱 완료', result);
      
      return result;
    } catch (error) {
      logger.error('문서명 파싱 오류:', error);
      return {
        fileName,
        primaryType: 'unknown',
        confidence: 0,
        error: error.message
      };
    }
  }
  
  /**
   * 문서 분류
   * @param {Array} documents - 문서 목록
   * @returns {Object} 분류 결과
   */
  static categorizeDocuments(documents) {
    try {
      const categories = {
        identity: [],
        education: [],
        employment: [],
        research: [],
        background: [],
        financial: [],
        organization: [],
        other: []
      };
      
      const categoryMap = {
        passport: 'identity',
        photo: 'identity',
        diploma: 'education',
        transcript: 'education',
        employment_contract: 'employment',
        career_certificate: 'employment',
        research_paper: 'research',
        publications: 'research',
        patent: 'research',
        criminal_record: 'background',
        health_certificate: 'background',
        financial_statement: 'financial',
        company_registration: 'organization',
        business_license: 'organization'
      };
      
      let totalSize = 0;
      let validDocuments = 0;
      
      for (const doc of documents) {
        const docType = doc.documentType || doc.type;
        const category = categoryMap[docType] || 'other';
        
        categories[category].push({
          ...doc,
          category,
          parsedInfo: this.parseDocumentName(doc.originalName || doc.fileName)
        });
        
        if (doc.fileSize) {
          totalSize += doc.fileSize;
        }
        
        if (docType !== 'unknown') {
          validDocuments++;
        }
      }
      
      return {
        categories,
        summary: {
          total: documents.length,
          validDocuments,
          categorized: documents.length - categories.other.length,
          totalSize,
          completeness: Math.round((validDocuments / documents.length) * 100)
        },
        recommendations: this._generateCategoryRecommendations(categories)
      };
    } catch (error) {
      logger.error('문서 분류 오류:', error);
      return {
        categories: {},
        error: error.message
      };
    }
  }
  
  /**
   * 누락 문서 제안
   * @param {Array} submittedDocuments - 제출된 문서들
   * @param {string} visaType - 비자 타입
   * @returns {Object} 제안 결과
   */
  static suggestMissingDocuments(submittedDocuments, visaType) {
    try {
      const submittedTypes = submittedDocuments.map(doc => doc.documentType || doc.type);
      const requirements = DOCUMENT_PRIORITY[visaType];
      
      if (!requirements) {
        return {
          missingDocuments: [],
          message: `${visaType} 비자에 대한 문서 요구사항 정보가 없습니다.`
        };
      }
      
      const missing = {
        critical: [],
        important: [],
        optional: []
      };
      
      // 누락된 문서 찾기
      for (const [priority, docTypes] of Object.entries(requirements)) {
        for (const docType of docTypes) {
          if (!submittedTypes.includes(docType)) {
            missing[priority].push({
              type: docType,
              name: this._getDocumentDisplayName(docType),
              priority,
              alternatives: this._getAlternativeDocuments(docType),
              description: this._getDocumentDescription(docType),
              urgency: priority === 'critical' ? 'high' : 'medium'
            });
          }
        }
      }
      
      // 제안사항 생성
      const suggestions = [
        ...missing.critical.map(doc => ({
          ...doc,
          message: `${doc.name}는 필수 문서입니다. 반드시 제출해 주세요.`
        })),
        ...missing.important.map(doc => ({
          ...doc,
          message: `${doc.name} 제출을 권장합니다. 승인 확률이 높아집니다.`
        })),
        ...missing.optional.map(doc => ({
          ...doc,
          message: `${doc.name}가 있으면 더 유리할 수 있습니다.`
        }))
      ];
      
      return {
        missingDocuments: missing,
        suggestions,
        totalMissing: missing.critical.length + missing.important.length + missing.optional.length,
        completeness: this._calculateDocumentCompleteness(submittedTypes, requirements),
        nextSteps: this._generateNextSteps(missing)
      };
    } catch (error) {
      logger.error('누락 문서 제안 오류:', error);
      return {
        missingDocuments: [],
        error: error.message
      };
    }
  }
  
  /**
   * 파일 유효성 검증
   * @param {Object} fileInfo - 파일 정보
   * @returns {Object} 검증 결과
   */
  static validateFile(fileInfo) {
    try {
      const { originalName, size, mimetype } = fileInfo;
      const errors = [];
      const warnings = [];
      
      // 파일 확장자 검증
      const extension = path.extname(originalName).toLowerCase().slice(1);
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`지원되지 않는 파일 형식입니다. (${extension})`);
      }
      
      // MIME 타입 검증
      const expectedMimeType = MIME_TYPE_MAP[extension];
      if (expectedMimeType && mimetype !== expectedMimeType) {
        warnings.push(`파일 형식이 일치하지 않을 수 있습니다. (${mimetype})`);
      }
      
      // 파일 크기 검증
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (size > maxSize) {
        errors.push(`파일 크기가 너무 큽니다. (${Math.round(size / 1024 / 1024)}MB > 10MB)`);
      }
      
      // 파일명 검증
      if (originalName.length > 255) {
        errors.push('파일명이 너무 깁니다.');
      }
      
      const hasSpecialChars = /[<>:"/\\|?*]/.test(originalName);
      if (hasSpecialChars) {
        warnings.push('파일명에 특수문자가 포함되어 있습니다.');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fileInfo: {
          extension,
          expectedMimeType,
          size,
          sizeFormatted: this._formatFileSize(size)
        }
      };
    } catch (error) {
      logger.error('파일 검증 오류:', error);
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }
  
  /**
   * 문서 세트 완성도 분석
   * @param {Array} documents - 문서 목록
   * @param {string} visaType - 비자 타입
   * @returns {Object} 분석 결과
   */
  static analyzeDocumentCompleteness(documents, visaType) {
    try {
      const submittedTypes = documents.map(doc => doc.documentType || doc.type);
      const requirements = DOCUMENT_PRIORITY[visaType];
      
      if (!requirements) {
        return {
          completeness: 0,
          message: '비자 타입에 대한 요구사항 정보가 없습니다.'
        };
      }
      
      const analysis = {
        critical: {
          required: requirements.critical.length,
          submitted: 0,
          missing: []
        },
        important: {
          required: requirements.important.length,
          submitted: 0,
          missing: []
        },
        optional: {
          required: requirements.optional.length,
          submitted: 0,
          missing: []
        }
      };
      
      // 각 우선순위별 분석
      for (const [priority, requiredDocs] of Object.entries(requirements)) {
        for (const docType of requiredDocs) {
          if (submittedTypes.includes(docType)) {
            analysis[priority].submitted++;
          } else {
            analysis[priority].missing.push(docType);
          }
        }
      }
      
      // 전체 완성도 계산
      const criticalWeight = 0.6;
      const importantWeight = 0.3;
      const optionalWeight = 0.1;
      
      const criticalScore = (analysis.critical.submitted / analysis.critical.required) * 100;
      const importantScore = (analysis.important.submitted / analysis.important.required) * 100;
      const optionalScore = (analysis.optional.submitted / analysis.optional.required) * 100;
      
      const weightedScore = (
        criticalScore * criticalWeight +
        importantScore * importantWeight +
        optionalScore * optionalWeight
      );
      
      return {
        completeness: Math.round(weightedScore),
        breakdown: analysis,
        scores: {
          critical: Math.round(criticalScore),
          important: Math.round(importantScore),
          optional: Math.round(optionalScore)
        },
        isMinimumMet: analysis.critical.missing.length === 0,
        recommendations: this._generateCompletenessRecommendations(analysis)
      };
    } catch (error) {
      logger.error('문서 완성도 분석 오류:', error);
      return {
        completeness: 0,
        error: error.message
      };
    }
  }
  
  // === 헬퍼 메서드 ===
  
  /**
   * 키워드 신뢰도 계산
   */
  static _calculateKeywordConfidence(keyword, fileName) {
    const exactMatch = fileName.includes(keyword.toLowerCase());
    const partialMatch = keyword.toLowerCase().split('').some(char => fileName.includes(char));
    
    if (exactMatch) {
      return 90 + (keyword.length * 2); // 정확히 일치하면 높은 점수
    } else if (partialMatch) {
      return 30 + (keyword.length); // 부분 일치
    }
    
    return 10; // 기본 점수
  }
  
  /**
   * 타입 제안 생성
   */
  static _generateTypeSuggestions(detectedTypes, visaType) {
    const suggestions = detectedTypes.slice(0, 3).map(type => ({
      type: type.type,
      name: this._getDocumentDisplayName(type.type),
      confidence: type.confidence,
      reason: `키워드 "${type.matchedKeyword}" 매칭`
    }));
    
    return suggestions;
  }
  
  /**
   * 파일 정보 분석
   */
  static _analyzeFileInfo(fileName) {
    const extension = path.extname(fileName).toLowerCase().slice(1);
    const baseName = path.basename(fileName, path.extname(fileName));
    
    return {
      extension,
      baseName,
      isImage: ['jpg', 'jpeg', 'png', 'gif'].includes(extension),
      isPdf: extension === 'pdf',
      isDocument: ['doc', 'docx', 'txt', 'rtf'].includes(extension),
      expectedMimeType: MIME_TYPE_MAP[extension] || 'application/octet-stream'
    };
  }
  
  /**
   * 카테고리별 추천사항 생성
   */
  static _generateCategoryRecommendations(categories) {
    const recommendations = [];
    
    if (categories.identity.length === 0) {
      recommendations.push('신원 확인 문서(여권, 사진)를 제출해 주세요.');
    }
    
    if (categories.education.length === 0) {
      recommendations.push('학력 관련 문서를 제출해 주세요.');
    }
    
    if (categories.other.length > 0) {
      recommendations.push(`${categories.other.length}개 문서의 타입을 확인해 주세요.`);
    }
    
    return recommendations;
  }
  
  /**
   * 문서 표시명 반환
   */
  static _getDocumentDisplayName(docType) {
    const names = {
      passport: '여권',
      photo: '증명사진',
      diploma: '학위증명서',
      transcript: '성적증명서',
      employment_contract: '고용계약서',
      career_certificate: '경력증명서',
      criminal_record: '범죄경력증명서',
      health_certificate: '건강진단서',
      company_registration: '사업자등록증',
      business_license: '사업면허증',
      recommendation_letter: '추천서',
      research_paper: '연구논문',
      publications: '논문목록',
      patent: '특허증',
      financial_statement: '재정증명서'
    };
    
    return names[docType] || docType;
  }
  
  /**
   * 문서 설명 반환
   */
  static _getDocumentDescription(docType) {
    const descriptions = {
      passport: '유효기간이 6개월 이상 남은 여권 사본',
      diploma: '최종학력 학위증명서 (공증 필요)',
      criminal_record: '최근 6개월 이내 발급된 범죄경력증명서',
      health_certificate: '최근 3개월 이내 발급된 건강진단서'
    };
    
    return descriptions[docType] || `${this._getDocumentDisplayName(docType)} 관련 서류`;
  }
  
  /**
   * 대체 문서 반환
   */
  static _getAlternativeDocuments(docType) {
    const alternatives = {
      diploma: ['degree_verification', 'transcript'],
      career_certificate: ['employment_contract', 'recommendation_letter'],
      company_registration: ['business_license']
    };
    
    return alternatives[docType] || [];
  }
  
  /**
   * 문서 완성도 계산
   */
  static _calculateDocumentCompleteness(submittedTypes, requirements) {
    const totalRequired = Object.values(requirements).flat().length;
    const submitted = Object.values(requirements).flat().filter(type => 
      submittedTypes.includes(type)
    ).length;
    
    return Math.round((submitted / totalRequired) * 100);
  }
  
  /**
   * 다음 단계 제안
   */
  static _generateNextSteps(missing) {
    const steps = [];
    
    if (missing.critical.length > 0) {
      steps.push(`필수 문서 ${missing.critical.length}개를 우선 준비하세요.`);
    }
    
    if (missing.important.length > 0) {
      steps.push(`중요 문서 ${missing.important.length}개 제출을 고려하세요.`);
    }
    
    if (missing.critical.length === 0 && missing.important.length === 0) {
      steps.push('모든 주요 문서가 준비되었습니다. 신청을 진행하세요.');
    }
    
    return steps;
  }
  
  /**
   * 완성도별 추천사항 생성
   */
  static _generateCompletenessRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.critical.missing.length > 0) {
      recommendations.push({
        priority: 'high',
        message: `필수 문서 ${analysis.critical.missing.length}개가 누락되었습니다.`,
        action: '즉시 준비 필요'
      });
    }
    
    if (analysis.important.missing.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: `중요 문서 ${analysis.important.missing.length}개 제출을 권장합니다.`,
        action: '승인률 향상을 위해 준비'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 파일 크기 포맷팅
   */
  static _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = {
  DocumentHelper,
  DOCUMENT_KEYWORDS,
  DOCUMENT_PRIORITY,
  ALLOWED_EXTENSIONS,
  MIME_TYPE_MAP
}; 