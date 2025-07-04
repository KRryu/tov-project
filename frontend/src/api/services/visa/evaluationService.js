/**
 * 비자 평가 서비스 (v2 API)
 * 백엔드의 RuleEngine 기반 지능형 평가 시스템과 연동
 */
import { apiClient, extractData, generateCacheKey, subscribeToProgress } from '../../config/apiClient';

/**
 * 비자 평가 API 서비스
 */
export class VisaEvaluationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * 지원 비자 타입 조회
   */
  async getSupportedTypes() {
    const cacheKey = 'supported_visa_types';
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    
    try {
      const response = await apiClient.get('/v2/visa/evaluation/supported-types');
      const data = extractData(response);
      
      // 캐시 저장
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch supported visa types:', error);
      throw error;
    }
  }

  /**
   * 표준 비자 평가 (백엔드 v2 API 매치)
   * @param {string} visaType - 비자 타입 (E-1, E-2, etc.)
   * @param {Object} applicantData - 신청자 데이터
   * @param {Function} onProgress - 진행상황 콜백
   */
  async evaluate(visaType, applicantData, onProgress = null) {
    try {
      // 비자 타입 정규화
      const normalizedVisaType = this.normalizeVisaType(visaType);
      
      // 백엔드가 기대하는 형식으로 데이터 구조 변경
      const requestData = this.formatEvaluationRequest(applicantData, normalizedVisaType);
      
      // 평가 요청 - 백엔드 라우터와 매치: POST /v2/visa/evaluation/:visaType
      const response = await apiClient.post(`/v2/visa/evaluation/${normalizedVisaType}`, requestData);
      
      const result = extractData(response);
      
      // 진행상황 추적 설정
      if (onProgress && result.evaluationId) {
        subscribeToProgress(result.evaluationId, onProgress);
      }
      
      return {
        ...result,
        visaType: normalizedVisaType,
        evaluatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Visa evaluation failed:', error);
      throw error;
    }
  }

  /**
   * 지능형 비자 평가 (RuleEngine 기반)
   * @param {string} visaType - 비자 타입 (E-1, E-2, etc.)
   * @param {Object} applicantData - 신청자 데이터
   * @param {Function} onProgress - 진행상황 콜백
   */
  async evaluateSmart(visaType, applicantData, onProgress = null) {
    try {
      // 비자 타입 정규화
      const normalizedVisaType = this.normalizeVisaType(visaType);
      
      // 백엔드가 기대하는 형식으로 데이터 구조 변경
      const requestData = this.formatEvaluationRequest(applicantData, normalizedVisaType);
      
      // 지능형 평가 요청 - 백엔드 라우터와 매치: POST /v2/visa/evaluation/smart/:visaType
      const response = await apiClient.post(`/v2/visa/evaluation/smart/${normalizedVisaType}`, requestData);
      
      const result = extractData(response);
      
      // 진행상황 추적 설정
      if (onProgress && result.evaluationId) {
        subscribeToProgress(result.evaluationId, onProgress);
      }
      
      return {
        ...result,
        visaType: normalizedVisaType,
        evaluatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Smart evaluation failed:', error);
      throw error;
    }
  }

  /**
   * 빠른 예비 평가 (캐시 활용)
   * @param {string} visaType 
   * @param {Object} basicData 
   */
  async quickEvaluate(visaType, basicData) {
    const normalizedVisaType = this.normalizeVisaType(visaType);
    const cacheKey = generateCacheKey(`quick_eval_${normalizedVisaType}`, basicData);
    
    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return { ...cached.data, fromCache: true };
      }
    }
    
    try {
      // 백엔드는 빠른 평가용 별도 엔드포인트가 없으므로 일반 평가 사용
      const response = await apiClient.post(`/v2/visa/evaluation/${normalizedVisaType}`, {
        ...this.formatEvaluationRequest(basicData, normalizedVisaType),
        options: {
          quickMode: true,
          enableCache: true
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
      console.error('Quick evaluation failed:', error);
      throw error;
    }
  }

  /**
   * 비자 추천 시스템
   * @param {Object} profileData - 사용자 프로필 데이터
   */
  async recommendVisa(profileData) {
    try {
      // 백엔드 라우터와 매치: POST /v2/visa/evaluation/recommend
      const response = await apiClient.post('/v2/visa/evaluation/recommend', profileData);
      
      return extractData(response);
      
    } catch (error) {
      console.error('Visa recommendation failed:', error);
      throw error;
    }
  }

  /**
   * 평가 이력 조회
   * @param {Object} params - 조회 파라미터
   */
  async getEvaluationHistory(params = {}) {
    try {
      // 백엔드 라우터와 매치: GET /v2/visa/evaluation/history
      const response = await apiClient.get('/v2/visa/evaluation/history', {
        params: {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          ...params
        }
      });
      
      return extractData(response);
      
    } catch (error) {
      console.error('Failed to fetch evaluation history:', error);
      throw error;
    }
  }

  /**
   * 평가 상세 조회
   * @param {string} evaluationId 
   */
  async getEvaluationDetail(evaluationId) {
    try {
      // 백엔드 라우터와 매치: GET /v2/visa/evaluation/history/:id
      const response = await apiClient.get(`/v2/visa/evaluation/history/${evaluationId}`);
      return extractData(response);
    } catch (error) {
      console.error('Failed to fetch evaluation detail:', error);
      throw error;
    }
  }

  /**
   * 평가 비교
   * @param {Array} evaluationIds 
   */
  async compareEvaluations(evaluationIds) {
    try {
      // 백엔드 라우터와 매치: POST /v2/visa/evaluation/compare
      const response = await apiClient.post('/v2/visa/evaluation/compare', {
        evaluationIds
      });
      
      return extractData(response);
      
    } catch (error) {
      console.error('Failed to compare evaluations:', error);
      throw error;
    }
  }

  /**
   * 평가 통계 및 분석
   */
  async getAnalytics() {
    const cacheKey = 'evaluation_analytics';
    
    // 캐시 확인 (분석 데이터는 짧게 캐시)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1분
        return cached.data;
      }
    }
    
    try {
      // 백엔드 라우터와 매치: GET /v2/visa/evaluation/analytics
      const response = await apiClient.get('/v2/visa/evaluation/analytics');
      const data = extractData(response);
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
      
    } catch (error) {
      console.error('Failed to fetch evaluation analytics:', error);
      throw error;
    }
  }

  /**
   * 평가 피드백 제출
   * @param {string} evaluationId 
   * @param {Object} feedback 
   */
  async submitFeedback(evaluationId, feedback) {
    try {
      // 백엔드 라우터와 매치: POST /v2/visa/evaluation/feedback
      const response = await apiClient.post('/v2/visa/evaluation/feedback', {
        evaluationId,
        ...feedback
      });
      
      return extractData(response);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * 백엔드가 기대하는 평가 요청 형식으로 변환
   * @param {Object} applicantData 
   * @param {string} visaType 
   */
  formatEvaluationRequest(applicantData, visaType) {
    // 백엔드 visaEvaluationController가 기대하는 형식
    return {
      visaType: visaType,
      evaluation: applicantData.evaluation || applicantData,
      administrative: applicantData.administrative || {
        fullName: applicantData.fullName,
        birthDate: applicantData.birthDate,
        nationality: applicantData.nationality,
        passportNumber: applicantData.passportNumber,
        gender: applicantData.gender,
        email: applicantData.email,
        phone: applicantData.phone
      },
      metadata: {
        source: 'frontend_v2',
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...applicantData.metadata
      }
    };
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
   * 신청자 데이터 전처리
   * @param {Object} data 
   * @param {string} visaType 
   */
  preprocessApplicantData(data, visaType) {
    const processed = {
      evaluation: { ...data.evaluation },
      administrative: { ...data.administrative },
      metadata: {
        visaType,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...data.metadata
      }
    };

    // 비자별 특수 처리
    switch (visaType) {
      case 'E-1':
        processed.evaluation = this.preprocessE1Data(processed.evaluation);
        break;
      case 'E-2':
        processed.evaluation = this.preprocessE2Data(processed.evaluation);
        break;
      case 'E-3':
        processed.evaluation = this.preprocessE3Data(processed.evaluation);
        break;
      case 'E-4':
        processed.evaluation = this.preprocessE4Data(processed.evaluation);
        break;
      case 'E-5':
        processed.evaluation = this.preprocessE5Data(processed.evaluation);
        break;
      default:
        break;
    }

    return processed;
  }

  /**
   * E-1 비자 데이터 전처리
   */
  preprocessE1Data(data) {
    return {
      ...data,
      // 필수 필드 기본값 설정
      educationLevel: data.educationLevel || 'bachelor',
      experienceYears: parseInt(data.experienceYears) || 0,
      institutionType: data.institutionType || 'university',
      // 배열 필드 처리
      experienceTypes: Array.isArray(data.experienceTypes) 
        ? data.experienceTypes 
        : (data.experienceTypes ? [data.experienceTypes] : []),
      // 불린 필드 처리
      hasInstitutionRecommendation: Boolean(data.hasInstitutionRecommendation),
      hasPresidentRecommendation: Boolean(data.hasPresidentRecommendation),
      hasTeachingCertificate: Boolean(data.hasTeachingCertificate),
      // 숫자 필드 처리
      publications: parseInt(data.publications) || 0,
      internationalPublications: parseInt(data.internationalPublications) || 0,
      salary: parseInt(data.salary) || 0,
      contractPeriod: parseInt(data.contractPeriod) || 0
    };
  }

  /**
   * E-2 비자 데이터 전처리
   */
  preprocessE2Data(data) {
    return {
      ...data,
      educationLevel: data.educationLevel || 'bachelor',
      experienceYears: parseInt(data.experienceYears) || 0,
      teachingExperience: parseInt(data.teachingExperience) || 0,
      language: data.language || 'english',
      isNativeSpeaker: Boolean(data.isNativeSpeaker),
      hasGovernmentInvitation: Boolean(data.hasGovernmentInvitation),
      hasCriminalRecord: Boolean(data.hasCriminalRecord),
      hasHealthCheck: Boolean(data.hasHealthCheck),
      teachingCertificates: Array.isArray(data.teachingCertificates)
        ? data.teachingCertificates
        : (data.teachingCertificates ? [data.teachingCertificates] : [])
    };
  }

  /**
   * E-3 비자 데이터 전처리
   */
  preprocessE3Data(data) {
    return {
      ...data,
      educationLevel: data.educationLevel || 'master',
      experienceYears: parseInt(data.experienceYears) || 0,
      researchExperienceYears: parseInt(data.researchExperienceYears) || parseInt(data.experienceYears) || 0,
      publications: Array.isArray(data.publications) ? data.publications : [],
      patents: parseInt(data.patents) || 0,
      hasAccreditation: Boolean(data.hasAccreditation),
      canCommunicate: Boolean(data.canCommunicate),
      experienceTypes: Array.isArray(data.experienceTypes)
        ? data.experienceTypes
        : (data.experienceTypes ? [data.experienceTypes] : [])
    };
  }

  /**
   * E-4 비자 데이터 전처리
   */
  preprocessE4Data(data) {
    return {
      ...data,
      experienceYears: parseInt(data.experienceYears) || 0,
      relevantExperience: parseInt(data.relevantExperience) || 0,
      internationalExperience: parseInt(data.internationalExperience) || 0,
      hasCertifications: Boolean(data.hasCertifications),
      hasPatents: Boolean(data.hasPatents),
      hasGoldCard: Boolean(data.hasGoldCard),
      technicalCertifications: Array.isArray(data.technicalCertifications)
        ? data.technicalCertifications
        : (data.technicalCertifications ? [data.technicalCertifications] : [])
    };
  }

  /**
   * E-5 비자 데이터 전처리
   */
  preprocessE5Data(data) {
    return {
      ...data,
      experienceYears: parseInt(data.experienceYears) || 0,
      koreanExperienceYears: parseInt(data.koreanExperienceYears) || 0,
      koreanExamPassed: Boolean(data.koreanExamPassed),
      majorFirmExperience: Boolean(data.majorFirmExperience),
      prestigiousUniversity: Boolean(data.prestigiousUniversity),
      expectedIncome: parseInt(data.expectedIncome) || 0
    };
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 특정 키 캐시 삭제
   */
  deleteCacheKey(key) {
    this.cache.delete(key);
  }
}

// 싱글톤 인스턴스 생성
const visaEvaluationService = new VisaEvaluationService();

export default visaEvaluationService; 