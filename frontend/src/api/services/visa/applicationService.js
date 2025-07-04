/**
 * 비자 신청서 관리 서비스 (v2 API)
 * 백엔드의 신청서 관리 시스템과 연동
 */
import { apiClient, extractData, subscribeToProgress } from '../../config/apiClient';

/**
 * 신청서 관리 API 서비스
 */
export class VisaApplicationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * 신청서 생성
   * @param {Object} applicationData 
   */
  async createApplication(applicationData) {
    try {
      const response = await apiClient.post('/v2/visa/application/create', {
        ...applicationData,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          ...applicationData.metadata
        }
      });

      const result = extractData(response);
      
      // 생성 후 캐시 클리어
      this.clearUserApplicationsCache();
      
      return result;

    } catch (error) {
      console.error('Application creation failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 조회
   * @param {string} applicationId 
   */
  async getApplication(applicationId) {
    const cacheKey = `application_${applicationId}`;
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await apiClient.get(`/v2/visa/application/${applicationId}`);
      const data = extractData(response);

      // 캐시 저장
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;

    } catch (error) {
      console.error('Failed to fetch application:', error);
      throw error;
    }
  }

  /**
   * 신청서 목록 조회
   * @param {Object} params 
   */
  async getApplications(params = {}) {
    const cacheKey = `applications_${JSON.stringify(params)}`;
    
    // 캐시 확인 (목록은 짧게 캐시)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1분
        return cached.data;
      }
    }

    try {
      const response = await apiClient.get('/v2/visa/application/list', {
        params: {
          page: 1,
          limit: 20,
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          ...params
        }
      });

      const data = extractData(response);

      // 캐시 저장
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;

    } catch (error) {
      console.error('Failed to fetch applications:', error);
      throw error;
    }
  }

  /**
   * 신청서 업데이트
   * @param {string} applicationId 
   * @param {Object} updateData 
   */
  async updateApplication(applicationId, updateData) {
    try {
      const response = await apiClient.patch(`/v2/visa/application/${applicationId}`, {
        ...updateData,
        metadata: {
          lastModified: new Date().toISOString(),
          ...updateData.metadata
        }
      });

      const result = extractData(response);

      // 관련 캐시 삭제
      this.clearApplicationCache(applicationId);

      return result;

    } catch (error) {
      console.error('Application update failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 제출
   * @param {string} applicationId 
   * @param {Object} submissionOptions 
   */
  async submitApplication(applicationId, submissionOptions = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/submit`, {
        options: {
          validateBeforeSubmit: submissionOptions.validateBeforeSubmit !== false,
          includeDocumentCheck: submissionOptions.includeDocumentCheck !== false,
          notifyByEmail: submissionOptions.notifyByEmail !== false,
          ...submissionOptions
        }
      });

      const result = extractData(response);

      // 제출 진행상황 추적
      if (result.processId && submissionOptions.onProgress) {
        subscribeToProgress(result.processId, submissionOptions.onProgress);
      }

      // 관련 캐시 삭제
      this.clearApplicationCache(applicationId);

      return result;

    } catch (error) {
      console.error('Application submission failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 철회
   * @param {string} applicationId 
   * @param {string} reason 
   */
  async withdrawApplication(applicationId, reason = '') {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/withdraw`, {
        reason
      });

      const result = extractData(response);

      // 관련 캐시 삭제
      this.clearApplicationCache(applicationId);

      return result;

    } catch (error) {
      console.error('Application withdrawal failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 복사/복제
   * @param {string} applicationId 
   * @param {Object} newData 
   */
  async cloneApplication(applicationId, newData = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/clone`, {
        modifications: newData
      });

      const result = extractData(response);

      // 목록 캐시 클리어
      this.clearUserApplicationsCache();

      return result;

    } catch (error) {
      console.error('Application cloning failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 상태 확인
   * @param {string} applicationId 
   */
  async getApplicationStatus(applicationId) {
    try {
      const response = await apiClient.get(`/v2/visa/application/${applicationId}/status`);
      return extractData(response);
    } catch (error) {
      console.error('Failed to fetch application status:', error);
      throw error;
    }
  }

  /**
   * 신청서 이력 조회
   * @param {string} applicationId 
   */
  async getApplicationHistory(applicationId) {
    try {
      const response = await apiClient.get(`/v2/visa/application/${applicationId}/history`);
      return extractData(response);
    } catch (error) {
      console.error('Failed to fetch application history:', error);
      throw error;
    }
  }

  /**
   * 신청서 검증
   * @param {string} applicationId 
   * @param {Object} validationOptions 
   */
  async validateApplication(applicationId, validationOptions = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/validate`, {
        options: {
          checkCompleteness: validationOptions.checkCompleteness !== false,
          validateDocuments: validationOptions.validateDocuments !== false,
          checkEligibility: validationOptions.checkEligibility !== false,
          includeRecommendations: validationOptions.includeRecommendations !== false,
          ...validationOptions
        }
      });

      return extractData(response);

    } catch (error) {
      console.error('Application validation failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 임시저장
   * @param {string} applicationId 
   * @param {Object} draftData 
   */
  async saveDraft(applicationId, draftData) {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/draft`, {
        draftData,
        timestamp: new Date().toISOString()
      });

      return extractData(response);

    } catch (error) {
      console.error('Draft save failed:', error);
      throw error;
    }
  }

  /**
   * 임시저장 데이터 조회
   * @param {string} applicationId 
   */
  async getDraft(applicationId) {
    try {
      const response = await apiClient.get(`/v2/visa/application/${applicationId}/draft`);
      return extractData(response);
    } catch (error) {
      console.error('Failed to fetch draft:', error);
      throw error;
    }
  }

  /**
   * 신청서 템플릿 조회
   * @param {string} visaType 
   * @param {string} applicationType 
   */
  async getApplicationTemplate(visaType, applicationType = 'NEW') {
    const cacheKey = `template_${visaType}_${applicationType}`;
    
    // 캐시 확인 (템플릿은 길게 캐시)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30분
        return cached.data;
      }
    }

    try {
      const response = await apiClient.get(`/v2/visa/application/template/${visaType}`, {
        params: { applicationType }
      });

      const data = extractData(response);

      // 캐시 저장
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;

    } catch (error) {
      console.error('Failed to fetch application template:', error);
      throw error;
    }
  }

  /**
   * 신청 가능 비자 타입 조회
   * @param {Object} userProfile 
   */
  async getEligibleVisaTypes(userProfile = {}) {
    try {
      const response = await apiClient.post('/v2/visa/application/eligible-types', {
        profile: userProfile
      });

      return extractData(response);

    } catch (error) {
      console.error('Failed to fetch eligible visa types:', error);
      throw error;
    }
  }

  /**
   * 신청서 미리보기/출력용 데이터
   * @param {string} applicationId 
   * @param {Object} options 
   */
  async generatePreview(applicationId, options = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/preview`, {
        options: {
          format: options.format || 'pdf',
          includeDocuments: options.includeDocuments || false,
          language: options.language || 'ko',
          ...options
        }
      });

      return extractData(response);

    } catch (error) {
      console.error('Preview generation failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 PDF 다운로드
   * @param {string} applicationId 
   * @param {Object} options 
   */
  async downloadApplicationPdf(applicationId, options = {}) {
    try {
      const response = await apiClient.get(`/v2/visa/application/${applicationId}/download`, {
        responseType: 'blob',
        params: {
          format: 'pdf',
          ...options
        }
      });

      // Blob URL 생성
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // 파일명 생성
      const filename = `visa_application_${applicationId}.pdf`;

      return {
        url,
        filename,
        blob
      };

    } catch (error) {
      console.error('PDF download failed:', error);
      throw error;
    }
  }

  /**
   * 신청 통계 조회
   */
  async getApplicationStatistics() {
    const cacheKey = 'application_statistics';
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1분
        return cached.data;
      }
    }

    try {
      const response = await apiClient.get('/v2/visa/application/statistics');
      const data = extractData(response);

      // 캐시 저장
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;

    } catch (error) {
      console.error('Failed to fetch application statistics:', error);
      throw error;
    }
  }

  /**
   * 신청서 삭제
   * @param {string} applicationId 
   */
  async deleteApplication(applicationId) {
    try {
      const response = await apiClient.delete(`/v2/visa/application/${applicationId}`);
      
      // 관련 캐시 삭제
      this.clearApplicationCache(applicationId);
      this.clearUserApplicationsCache();

      return extractData(response);

    } catch (error) {
      console.error('Application deletion failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 자동 완성 제안
   * @param {string} applicationId 
   * @param {Object} currentData 
   */
  async getAutoCompleteSuggestions(applicationId, currentData) {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/auto-complete`, {
        currentData
      });

      return extractData(response);

    } catch (error) {
      console.error('Auto-complete suggestions failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 유효성 실시간 검사
   * @param {string} applicationId 
   * @param {string} fieldName 
   * @param {any} fieldValue 
   */
  async validateField(applicationId, fieldName, fieldValue) {
    try {
      const response = await apiClient.post(`/v2/visa/application/${applicationId}/validate-field`, {
        fieldName,
        fieldValue
      });

      return extractData(response);

    } catch (error) {
      console.error('Field validation failed:', error);
      throw error;
    }
  }

  /**
   * 신청서 진행률 계산
   * @param {Object} applicationData 
   * @param {string} visaType 
   */
  calculateProgress(applicationData, visaType) {
    if (!applicationData || !visaType) return 0;

    const requiredFields = this.getRequiredFields(visaType);
    const completedFields = requiredFields.filter(field => {
      const value = this.getNestedValue(applicationData, field);
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  /**
   * 비자 타입별 필수 필드 조회
   * @param {string} visaType 
   */
  getRequiredFields(visaType) {
    const commonFields = [
      'evaluation.nationality',
      'evaluation.educationLevel',
      'administrative.fullName',
      'administrative.birthDate',
      'administrative.passportNumber'
    ];

    const typeSpecificFields = {
      'E-1': [
        'evaluation.experienceYears',
        'evaluation.institutionType',
        'evaluation.position',
        'evaluation.salary'
      ],
      'E-2': [
        'evaluation.teachingExperience',
        'evaluation.language',
        'evaluation.isNativeSpeaker'
      ],
      'E-3': [
        'evaluation.researchField',
        'evaluation.publications',
        'evaluation.researchExperienceYears'
      ],
      'E-4': [
        'evaluation.technologyField',
        'evaluation.experienceYears',
        'evaluation.expertiseLevel'
      ],
      'E-5': [
        'evaluation.licenseType',
        'evaluation.experienceYears',
        'evaluation.koreanExamPassed'
      ]
    };

    return [...commonFields, ...(typeSpecificFields[visaType] || [])];
  }

  /**
   * 중첩된 객체에서 값 추출
   * @param {Object} obj 
   * @param {string} path 
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * 특정 신청서 캐시 삭제
   * @param {string} applicationId 
   */
  clearApplicationCache(applicationId) {
    const keysToDelete = [];
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(applicationId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 사용자 신청서 목록 캐시 삭제
   */
  clearUserApplicationsCache() {
    const keysToDelete = [];
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith('applications_')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 전체 캐시 클리어
   */
  clearCache() {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스 생성
const visaApplicationService = new VisaApplicationService();

export default visaApplicationService; 