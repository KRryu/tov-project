/**
 * 비자 문서 관리 서비스 (v2 API)
 * 백엔드의 문서 검증 시스템과 연동
 */
import { apiClient, fileApiClient, extractData, subscribeToProgress } from '../../config/apiClient';

/**
 * 문서 관리 API 서비스
 */
export class VisaDocumentService {
  constructor() {
    this.uploadProgress = new Map();
    this.validationCache = new Map();
  }

  /**
   * 문서 업로드
   * @param {string} applicationId - 신청서 ID
   * @param {Array|File} files - 업로드할 파일들
   * @param {Object} options - 업로드 옵션
   */
  async uploadDocuments(applicationId, files, options = {}) {
    const formData = new FormData();
    formData.append('applicationId', applicationId);
    
    // 파일 배열 처리
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach((file, index) => {
      formData.append('documents', file);
      
      // 파일 메타데이터 추가
      if (options.documentTypes && options.documentTypes[index]) {
        formData.append(`documentType_${index}`, options.documentTypes[index]);
      }
      if (options.descriptions && options.descriptions[index]) {
        formData.append(`description_${index}`, options.descriptions[index]);
      }
    });

    // 업로드 옵션 추가
    if (options.autoValidate !== false) {
      formData.append('autoValidate', 'true');
    }
    if (options.extractText) {
      formData.append('extractText', 'true');
    }

    try {
      const response = await fileApiClient.post('/v2/visa/documents/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          
          // 진행상황 콜백 실행
          if (options.onProgress) {
            options.onProgress(percentCompleted);
          }
          
          this.uploadProgress.set(applicationId, percentCompleted);
        }
      });

      const result = extractData(response);

      // 업로드 완료 후 진행상황 추적 설정
      if (result.processId && options.onValidationProgress) {
        subscribeToProgress(result.processId, options.onValidationProgress);
      }

      return result;

    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    } finally {
      this.uploadProgress.delete(applicationId);
    }
  }

  /**
   * 단일 문서 업로드
   * @param {string} applicationId 
   * @param {File} file 
   * @param {Object} metadata 
   */
  async uploadSingleDocument(applicationId, file, metadata = {}) {
    const formData = new FormData();
    formData.append('applicationId', applicationId);
    formData.append('document', file);
    
    // 메타데이터 추가
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    try {
      const response = await fileApiClient.post('/v2/visa/documents/upload-single', formData);
      return extractData(response);
    } catch (error) {
      console.error('Single document upload failed:', error);
      throw error;
    }
  }

  /**
   * 문서 목록 조회
   * @param {string} applicationId 
   */
  async getDocuments(applicationId) {
    try {
      const response = await apiClient.get(`/v2/visa/documents/${applicationId}`);
      return extractData(response);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      throw error;
    }
  }

  /**
   * 문서 상세 정보 조회
   * @param {string} documentId 
   */
  async getDocumentDetail(documentId) {
    try {
      const response = await apiClient.get(`/v2/visa/documents/detail/${documentId}`);
      return extractData(response);
    } catch (error) {
      console.error('Failed to fetch document detail:', error);
      throw error;
    }
  }

  /**
   * 문서 세트 검증
   * @param {string} applicationId 
   * @param {Object} options 
   */
  async validateDocumentSet(applicationId, options = {}) {
    const cacheKey = `validation_${applicationId}_${JSON.stringify(options)}`;
    
    // 캐시 확인 (검증 결과는 짧게 캐시)
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1분
        return cached.data;
      }
    }

    try {
      const response = await apiClient.post('/v2/visa/documents/validate-set', {
        applicationId,
        options: {
          strictMode: options.strictMode || false,
          includeRecommendations: options.includeRecommendations !== false,
          checkCompleteness: options.checkCompleteness !== false,
          validateContent: options.validateContent || false,
          ...options
        }
      });

      const data = extractData(response);

      // 검증 결과 캐시 저장
      this.validationCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;

    } catch (error) {
      console.error('Document set validation failed:', error);
      throw error;
    }
  }

  /**
   * 단일 문서 검증
   * @param {string} documentId 
   * @param {Object} validationOptions 
   */
  async validateSingleDocument(documentId, validationOptions = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/documents/validate/${documentId}`, {
        options: validationOptions
      });

      return extractData(response);

    } catch (error) {
      console.error('Single document validation failed:', error);
      throw error;
    }
  }

  /**
   * 문서 요구사항 조회
   * @param {string} visaType 
   * @param {Object} applicantProfile 
   */
  async getRequirements(visaType, applicantProfile = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/documents/requirements/${visaType}`, {
        applicantProfile
      });

      return extractData(response);

    } catch (error) {
      console.error('Failed to fetch document requirements:', error);
      throw error;
    }
  }

  /**
   * 문서 제안/추천
   * @param {string} visaType 
   * @param {Array} submittedDocuments 
   */
  async getSuggestions(visaType, submittedDocuments = []) {
    try {
      const response = await apiClient.get(`/v2/visa/documents/suggestions/${visaType}`, {
        params: {
          submitted: JSON.stringify(submittedDocuments)
        }
      });

      return extractData(response);

    } catch (error) {
      console.error('Failed to fetch document suggestions:', error);
      throw error;
    }
  }

  /**
   * 문서 다운로드
   * @param {string} documentId 
   * @param {Object} options 
   */
  async downloadDocument(documentId, options = {}) {
    try {
      const response = await apiClient.get(`/v2/visa/documents/download/${documentId}`, {
        responseType: 'blob',
        params: options
      });

      // Blob URL 생성
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      // 파일명 추출
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      return {
        url,
        filename,
        blob,
        size: blob.size,
        type: blob.type
      };

    } catch (error) {
      console.error('Document download failed:', error);
      throw error;
    }
  }

  /**
   * 문서 삭제
   * @param {string} documentId 
   */
  async deleteDocument(documentId) {
    try {
      const response = await apiClient.delete(`/v2/visa/documents/${documentId}`);
      
      // 관련 캐시 삭제
      this.clearValidationCache();
      
      return extractData(response);

    } catch (error) {
      console.error('Document deletion failed:', error);
      throw error;
    }
  }

  /**
   * 문서 메타데이터 업데이트
   * @param {string} documentId 
   * @param {Object} metadata 
   */
  async updateDocumentMetadata(documentId, metadata) {
    try {
      const response = await apiClient.patch(`/v2/visa/documents/${documentId}/metadata`, {
        metadata
      });

      return extractData(response);

    } catch (error) {
      console.error('Document metadata update failed:', error);
      throw error;
    }
  }

  /**
   * 문서 상태 변경
   * @param {string} documentId 
   * @param {string} status 
   * @param {string} reason 
   */
  async updateDocumentStatus(documentId, status, reason = '') {
    try {
      const response = await apiClient.patch(`/v2/visa/documents/${documentId}/status`, {
        status,
        reason
      });

      return extractData(response);

    } catch (error) {
      console.error('Document status update failed:', error);
      throw error;
    }
  }

  /**
   * 문서 미리보기 생성
   * @param {string} documentId 
   * @param {Object} options 
   */
  async generatePreview(documentId, options = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/documents/${documentId}/preview`, {
        options: {
          page: options.page || 1,
          quality: options.quality || 'medium',
          format: options.format || 'image',
          ...options
        }
      });

      return extractData(response);

    } catch (error) {
      console.error('Document preview generation failed:', error);
      throw error;
    }
  }

  /**
   * 문서 텍스트 추출
   * @param {string} documentId 
   * @param {Object} options 
   */
  async extractText(documentId, options = {}) {
    try {
      const response = await apiClient.post(`/v2/visa/documents/${documentId}/extract-text`, {
        options: {
          language: options.language || 'auto',
          includeFormatting: options.includeFormatting || false,
          ...options
        }
      });

      return extractData(response);

    } catch (error) {
      console.error('Text extraction failed:', error);
      throw error;
    }
  }

  /**
   * 문서 압축/변환
   * @param {Array} documentIds 
   * @param {Object} options 
   */
  async compressDocuments(documentIds, options = {}) {
    try {
      const response = await apiClient.post('/v2/visa/documents/compress', {
        documentIds,
        options: {
          format: options.format || 'zip',
          quality: options.quality || 'medium',
          includeMetadata: options.includeMetadata !== false,
          ...options
        }
      });

      const result = extractData(response);

      // 압축 진행상황 추적
      if (result.processId && options.onProgress) {
        subscribeToProgress(result.processId, options.onProgress);
      }

      return result;

    } catch (error) {
      console.error('Document compression failed:', error);
      throw error;
    }
  }

  /**
   * 문서 템플릿 조회
   * @param {string} visaType 
   * @param {string} documentType 
   */
  async getDocumentTemplate(visaType, documentType) {
    try {
      const response = await apiClient.get(`/v2/visa/documents/template/${visaType}/${documentType}`);
      return extractData(response);
    } catch (error) {
      console.error('Failed to fetch document template:', error);
      throw error;
    }
  }

  /**
   * 업로드 진행상황 조회
   * @param {string} applicationId 
   */
  getUploadProgress(applicationId) {
    return this.uploadProgress.get(applicationId) || 0;
  }

  /**
   * 파일 유효성 검사 (업로드 전)
   * @param {File} file 
   * @param {Object} constraints 
   */
  validateFile(file, constraints = {}) {
    const errors = [];
    
    // 파일 크기 검사
    const maxSize = constraints.maxSize || 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`파일 크기가 ${this.formatFileSize(maxSize)}를 초과합니다.`);
    }

    // 파일 형식 검사
    const allowedTypes = constraints.allowedTypes || [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('지원되지 않는 파일 형식입니다.');
    }

    // 파일명 검사
    if (constraints.maxNameLength && file.name.length > constraints.maxNameLength) {
      errors.push(`파일명이 ${constraints.maxNameLength}자를 초과합니다.`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 파일 크기 포맷팅
   * @param {number} bytes 
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 검증 캐시 클리어
   */
  clearValidationCache() {
    this.validationCache.clear();
  }

  /**
   * 특정 애플리케이션의 캐시 삭제
   * @param {string} applicationId 
   */
  clearApplicationCache(applicationId) {
    for (const [key, value] of this.validationCache.entries()) {
      if (key.includes(applicationId)) {
        this.validationCache.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스 생성
const visaDocumentService = new VisaDocumentService();

export default visaDocumentService; 