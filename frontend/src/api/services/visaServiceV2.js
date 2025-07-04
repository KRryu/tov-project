/**
 * 통합 비자 서비스 (v2 API 통합)
 * 기존 visaService와 새로운 v2 API 서비스들의 통합 인터페이스
 */
import visaEvaluationService from './visa/evaluationService';
import visaApplicationService from './visa/applicationService';
import visaDocumentService from './visa/documentService';
import advancedVisaService from './visa/advancedService';

/**
 * 통합 비자 서비스 클래스
 * 기존 코드와의 호환성을 유지하면서 v2 API 기능을 활용
 */
class VisaServiceV2 {
  constructor() {
    this.evaluation = visaEvaluationService;
    this.application = visaApplicationService;
    this.document = visaDocumentService;
    this.advanced = advancedVisaService;
  }

  /**
   * 비자 평가 실행 (v2 API 사용)
   * @param {Object} formData - 기존 형식의 폼 데이터
   * @returns {Object} v2 API 평가 결과
   */
  async evaluateVisa(formData) {
    try {
      const { visaType, ...applicantData } = formData;
      
      // 기존 형식을 v2 API 형식으로 변환
      const v2ApplicantData = this.transformToV2Format(applicantData, visaType);
      
      // v2 API 평가 실행
      const result = await this.evaluation.evaluateSmart(visaType, v2ApplicantData);
      
      // 기존 형식으로 결과 변환 (호환성)
      return this.transformToLegacyFormat(result, visaType);
      
    } catch (error) {
      console.error('V2 Visa evaluation failed:', error);
      throw error;
    }
  }

  /**
   * 빠른 평가 (v2 API 사용)
   * @param {string} visaType 
   * @param {Object} basicData 
   */
  async quickEvaluate(visaType, basicData) {
    try {
      return await this.evaluation.quickEvaluate(visaType, basicData);
    } catch (error) {
      console.error('Quick evaluation failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 생성/업데이트 (v2 API 사용)
   * @param {Object} applicationData 
   */
  async createOrUpdateApplication(applicationData) {
    try {
      if (applicationData.applicationId) {
        // 기존 신청서 업데이트
        return await this.application.updateApplication(
          applicationData.applicationId,
          applicationData
        );
      } else {
        // 새 신청서 생성
        return await this.application.createApplication(applicationData);
      }
    } catch (error) {
      console.error('Application create/update failed:', error);
      throw error;
    }
  }

  /**
   * 문서 업로드 (v2 API 사용)
   * @param {Object} uploadData 
   */
  async uploadDocument(uploadData) {
    try {
      const { visaType, applicationId, file, documentType } = uploadData;
      
      return await this.document.uploadSingleDocument(
        applicationId,
        file,
        { documentType, visaType }
      );
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  /**
   * 현재 신청서 조회 (v2 API 사용)
   */
  async getCurrentApplication() {
    try {
      // 사용자의 최근 신청서 조회
      const applications = await this.application.getApplications({
        limit: 1,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
      
      return applications.data?.[0] || null;
    } catch (error) {
      console.error('Failed to get current application:', error);
      throw error;
    }
  }

  /**
   * 사용자 신청서 목록 조회 (v2 API 사용)
   * @param {string} status 
   */
  async getUserApplications(status = null) {
    try {
      const params = {};
      if (status) {
        params.status = status;
      }
      
      return await this.application.getApplications(params);
    } catch (error) {
      console.error('Failed to get user applications:', error);
      throw error;
    }
  }

  /**
   * 지원 비자 타입 조회 (v2 API 사용)
   */
  async getSupportedVisaTypes() {
    try {
      return await this.evaluation.getSupportedTypes();
    } catch (error) {
      console.error('Failed to get supported visa types:', error);
      throw error;
    }
  }

  /**
   * 비자 추천 (v2 API 사용)
   * @param {Object} profileData 
   */
  async recommendVisa(profileData) {
    try {
      return await this.evaluation.recommendVisa(profileData);
    } catch (error) {
      console.error('Visa recommendation failed:', error);
      throw error;
    }
  }

  /**
   * 임시저장 (v2 API 사용)
   * @param {Object} applicationData 
   */
  async saveDraft(applicationData) {
    try {
      const { applicationId, ...draftData } = applicationData;
      
      if (applicationId) {
        return await this.application.saveDraft(applicationId, draftData);
      } else {
        // 새 신청서 생성 후 임시저장
        const newApplication = await this.application.createApplication({
          ...draftData,
          status: 'draft'
        });
        return newApplication;
      }
    } catch (error) {
      console.error('Draft save failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 제출 (v2 API 사용)
   * @param {string} applicationId 
   */
  async submitApplication(applicationId) {
    try {
      return await this.application.submitApplication(applicationId, {
        validateBeforeSubmit: true,
        includeDocumentCheck: true,
        notifyByEmail: true
      });
    } catch (error) {
      console.error('Application submission failed:', error);
      throw error;
    }
  }

  /**
   * 기존 형식을 v2 API 형식으로 변환
   * @param {Object} legacyData 
   * @param {string} visaType 
   */
  transformToV2Format(legacyData, visaType) {
    return {
      evaluation: {
        ...legacyData,
        visaType: this.normalizeVisaType(visaType)
      },
      administrative: {
        fullName: legacyData.fullName,
        birthDate: legacyData.birthDate,
        nationality: legacyData.nationality,
        passportNumber: legacyData.passportNumber,
        gender: legacyData.gender,
        email: legacyData.email,
        phone: legacyData.phone
      },
      metadata: {
        source: 'legacy_conversion',
        originalFormat: 'v1',
        convertedAt: new Date().toISOString()
      }
    };
  }

  /**
   * v2 API 결과를 기존 형식으로 변환 (호환성)
   * @param {Object} v2Result 
   * @param {string} visaType 
   */
  transformToLegacyFormat(v2Result, visaType) {
    if (!v2Result) return null;

    // v2 결과를 기존 형식으로 변환
    const legacyResult = {
      success: true,
      data: {
        totalScore: v2Result.totalScore || 0,
        categoryScores: {},
        overallAssessment: this.calculateOverallAssessment(v2Result.totalScore),
        recommendations: v2Result.overallRecommendations || [],
        issues: v2Result.overallIssues || [],
        strengths: v2Result.overallStrengths || [],
        
        // v2 특화 데이터
        v2Data: {
          evaluationId: v2Result.evaluationId,
          ruleEngine: v2Result.ruleEngine,
          categoryResults: v2Result.categoryResults,
          metadata: v2Result.metadata
        }
      }
    };

    // 카테고리별 점수 변환
    if (v2Result.categoryResults) {
      Object.entries(v2Result.categoryResults).forEach(([category, result]) => {
        legacyResult.data.categoryScores[category] = {
          score: result.score || 0,
          maxScore: result.maxScore || 100,
          percentage: Math.round((result.score / (result.maxScore || 100)) * 100)
        };
      });
    }

    return legacyResult;
  }

  /**
   * 전체 평가 계산
   * @param {number} totalScore 
   */
  calculateOverallAssessment(totalScore) {
    if (totalScore >= 85) {
      return {
        level: 'excellent',
        message: '매우 우수한 조건입니다.',
        approvalChance: 'high'
      };
    } else if (totalScore >= 70) {
      return {
        level: 'good',
        message: '양호한 조건입니다.',
        approvalChance: 'medium'
      };
    } else if (totalScore >= 50) {
      return {
        level: 'fair',
        message: '보통 수준입니다.',
        approvalChance: 'low'
      };
    } else {
      return {
        level: 'poor',
        message: '개선이 필요합니다.',
        approvalChance: 'very_low'
      };
    }
  }

  /**
   * 비자 타입 정규화
   * @param {string} visaType 
   */
  normalizeVisaType(visaType) {
    if (!visaType) return '';
    
    const normalized = visaType.toUpperCase().trim();
    
    // 하이픈이 없으면 추가 (E1 -> E-1)
    if (/^[A-Z]\d+$/.test(normalized)) {
      return normalized.replace(/([A-Z])(\d+)/, '$1-$2');
    }
    
    return normalized;
  }

  /**
   * 평가 이력 조회 (v2 API)
   * @param {Object} params 
   */
  async getEvaluationHistory(params = {}) {
    try {
      return await this.evaluation.getEvaluationHistory(params);
    } catch (error) {
      console.error('Failed to get evaluation history:', error);
      throw error;
    }
  }

  /**
   * 평가 비교 (v2 API)
   * @param {Array} evaluationIds 
   */
  async compareEvaluations(evaluationIds) {
    try {
      return await this.evaluation.compareEvaluations(evaluationIds);
    } catch (error) {
      console.error('Evaluation comparison failed:', error);
      throw error;
    }
  }

  /**
   * 문서 요구사항 조회 (v2 API)
   * @param {string} visaType 
   * @param {Object} applicantProfile 
   */
  async getDocumentRequirements(visaType, applicantProfile = {}) {
    try {
      return await this.document.getRequirements(visaType, applicantProfile);
    } catch (error) {
      console.error('Failed to get document requirements:', error);
      throw error;
    }
  }

  /**
   * 문서 검증 (v2 API)
   * @param {string} applicationId 
   */
  async validateDocuments(applicationId) {
    try {
      return await this.document.validateDocumentSet(applicationId);
    } catch (error) {
      console.error('Document validation failed:', error);
      throw error;
    }
  }

  /**
   * 비자 사전심사 (신규/연장/변경 지원)
   * @param {string} visaType 
   * @param {string} applicationType 
   * @param {Object} applicantData 
   */
  async performPreScreening(visaType, applicationType, applicantData) {
    try {
      return await this.advanced.performPreScreening(visaType, applicationType, applicantData);
    } catch (error) {
      console.error('Pre-screening failed:', error);
      throw error;
    }
  }

  /**
   * 상세 평가 (신규/연장/변경 지원)
   * @param {string} visaType 
   * @param {string} applicationType 
   * @param {Object} applicantData 
   * @param {string} applicationId 
   */
  async performDetailedEvaluation(visaType, applicationType, applicantData, applicationId = null) {
    try {
      return await this.advanced.performDetailedEvaluation(visaType, applicationType, applicantData, applicationId);
    } catch (error) {
      console.error('Detailed evaluation failed:', error);
      throw error;
    }
  }

  /**
   * 실시간 필드 검증
   * @param {string} visaType 
   * @param {string} fieldName 
   * @param {any} value 
   * @param {Object} context 
   */
  async validateFieldRealTime(visaType, fieldName, value, context = {}) {
    try {
      return await this.advanced.validateField(visaType, fieldName, value, context);
    } catch (error) {
      console.error('Field validation failed:', error);
      throw error;
    }
  }

  /**
   * 비자 변경 가능성 확인
   * @param {string} fromVisa 
   * @param {string} toVisa 
   */
  async checkChangeability(fromVisa, toVisa) {
    try {
      return await this.advanced.checkChangeability(fromVisa, toVisa);
    } catch (error) {
      console.error('Changeability check failed:', error);
      throw error;
    }
  }

  /**
   * 법무대리인 매칭
   * @param {Object} matchingData 
   */
  async matchLegalRepresentative(matchingData) {
    try {
      return await this.advanced.matchLegalRepresentative(matchingData);
    } catch (error) {
      console.error('Legal matching failed:', error);
      throw error;
    }
  }

  /**
   * 문서 업로드 (다중 파일 지원)
   * @param {string} applicationId 
   * @param {string} visaType 
   * @param {File[]} files 
   * @param {string} documentType 
   */
  async uploadMultipleDocuments(applicationId, visaType, files, documentType = 'general') {
    try {
      return await this.advanced.uploadDocuments(applicationId, visaType, files, documentType);
    } catch (error) {
      console.error('Multiple document upload failed:', error);
      throw error;
    }
  }

  /**
   * 문서 상태 확인
   * @param {string} applicationId 
   */
  async getDocumentStatus(applicationId) {
    try {
      return await this.advanced.getDocumentStatus(applicationId);
    } catch (error) {
      console.error('Document status check failed:', error);
      throw error;
    }
  }

  /**
   * 진행상황 추적 가능 여부 확인
   */
  supportsProgressTracking() {
    return true; // v2 API는 진행상황 추적 지원
  }

  /**
   * 비자 요구사항 조회 (확장 정보)
   * @param {string} visaType 
   * @param {string} applicationType 
   * @param {string} nationality 
   */
  async getDetailedRequirements(visaType, applicationType = 'NEW', nationality = null) {
    try {
      return await this.advanced.getRequirements(visaType, applicationType, nationality);
    } catch (error) {
      console.error('Requirements fetch failed:', error);
      throw error;
    }
  }

  /**
   * 지원되는 비자 타입 (확장 정보)
   * @param {Object} filters 
   */
  async getSupportedTypesWithDetails(filters = {}) {
    try {
      return await this.advanced.getSupportedTypes(filters);
    } catch (error) {
      console.error('Supported types fetch failed:', error);
      throw error;
    }
  }

  /**
   * 배치 평가
   * @param {Array} evaluationRequests 
   */
  async performBatchEvaluation(evaluationRequests) {
    try {
      return await this.advanced.performBatchEvaluation(evaluationRequests);
    } catch (error) {
      console.error('Batch evaluation failed:', error);
      throw error;
    }
  }

  /**
   * 비자 신청서 생성 (확장)
   * @param {string} visaType 
   * @param {string} applicationType 
   * @param {Object} applicationData 
   */
  async createAdvancedApplication(visaType, applicationType, applicationData) {
    try {
      return await this.advanced.createApplication(visaType, applicationType, applicationData);
    } catch (error) {
      console.error('Advanced application creation failed:', error);
      throw error;
    }
  }

  /**
   * 캐시 관리
   */
  clearCache() {
    this.evaluation.clearCache();
    this.application.clearCache();
    this.document.clearValidationCache();
    this.advanced.clearCache();
  }

  /**
   * 서비스 상태 확인
   */
  async getServiceStatus() {
    try {
      const [evaluationTypes, applicationStats] = await Promise.all([
        this.evaluation.getSupportedTypes(),
        this.application.getApplicationStatistics()
      ]);

      return {
        status: 'healthy',
        features: {
          evaluation: true,
          application: true,
          document: true,
          progressTracking: true,
          cache: true
        },
        supportedVisaTypes: evaluationTypes,
        statistics: applicationStats
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const visaServiceV2 = new VisaServiceV2();

export default visaServiceV2; 