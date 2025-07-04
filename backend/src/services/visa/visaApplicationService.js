const VisaApplication = require('../../models/visa/VisaApplication');
const logger = require('../../utils/logger');
const { normalizeVisaType, formatVisaTypeForDisplay } = require('../../utils/visaType');

/**
 * 비자 신청 서비스
 */
const visaApplicationService = {
  /**
   * 필수 필드 검증 함수
   */
  getMissingFields(visaType, evaluation = {}, administrative = {}) {
    const normalizedType = normalizeVisaType(visaType);
    const visaFields = VisaApplication.VISA_FIELDS[normalizedType];
    
    if (!visaFields) {
      return { missingEvaluation: [], missingAdministrative: [] };
    }

    const missingEvaluation = visaFields.evaluation.required.filter(field => {
      const value = evaluation[field];
      return value === undefined || value === null || value === '';
    });

    const missingAdministrative = visaFields.administrative.required.filter(field => {
      const value = administrative[field];
      return value === undefined || value === null || value === '';
    });

    return { missingEvaluation, missingAdministrative };
  },

  /**
   * 평가 데이터 유효성 검사 (공통)
   */
  validateEvaluationData(visaType, evaluationData) {
    if (!evaluationData) throw new Error('평가 데이터가 필요합니다.');

    const normalizedType = normalizeVisaType(visaType);
    const visaFields = VisaApplication.VISA_FIELDS[normalizedType];

    // 필수 필드 검증 (플레이스홀더 비자일 경우 스킵)
    if (visaFields) {
      const missing = visaFields.evaluation.required.filter(field => {
        const v = evaluationData[field];
        return v === undefined || v === null || v === '';
      });
      if (missing.length > 0) {
        throw new Error(`다음 필수 평가 필드가 누락되었습니다: ${missing.join(', ')}`);
      }
    }

    // 숫자형 문자열 → 숫자 자동 변환 (전 필드 대상)
    Object.keys(evaluationData).forEach(key => {
      const val = evaluationData[key];
      if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(val)) {
        const num = Number(val);
        if (!Number.isNaN(num)) evaluationData[key] = num;
      }
    });

    // 쉼표 구분 문자열 → 배열 자동 변환 (공통 후보)
    ['experienceTypes', 'teachingCertificates', 'previousVisaTypes'].forEach(key => {
      if (evaluationData[key] && typeof evaluationData[key] === 'string') {
        evaluationData[key] = evaluationData[key].split(',').map(t => t.trim());
      }
    });

    // 불린 문자열 → 불린 변환
    Object.keys(evaluationData).forEach(key => {
      const val = evaluationData[key];
      if (typeof val === 'string') {
        const lowered = val.toLowerCase();
        if (['true', 'false', '1', '0'].includes(lowered)) {
          evaluationData[key] = (lowered === 'true' || lowered === '1');
        }
      }
    });

    return true;
  },

  /**
   * 비자 신청서 생성 또는 업데이트 (공통)
   */
  async createOrUpdate(userId, visaInfo) {
    try {
      if (!visaInfo) {
        throw new Error('비자 정보가 필요합니다.');
      }

      if (!visaInfo.visaType) {
        throw new Error('비자 유형이 필요합니다.');
      }

      // 비자 유형 정규화
      const normalizedVisaType = normalizeVisaType(visaInfo.visaType);

      // 필수 필드 검증
      if (!visaInfo.personalInfo) {
        throw new Error('개인 정보가 필요합니다.');
      }

      const evalBlock = visaInfo.evaluation || visaInfo.evaluationData || {};

      this.validateEvaluationData(normalizedVisaType, evalBlock);

      // 기존 신청서 찾기
      let application = await VisaApplication.findOne({
        userId,
        visaType: normalizedVisaType,
        status: { $ne: VisaApplication.APPLICATION_STATUS.COMPLETED }
      }).sort({ createdAt: -1 });

      // 신청서 데이터 준비
      const applicationData = {
        userId,
        visaType: normalizedVisaType,
        personalInfo: {
          fullName: visaInfo.personalInfo.fullName || '',
          birthDate: visaInfo.personalInfo.birthDate || new Date(),
          nationality: visaInfo.personalInfo.nationality || '',
          email: visaInfo.personalInfo.email || '',
          phone: visaInfo.personalInfo.phone || '',
          passportNumber: visaInfo.personalInfo.passportNumber || '',
          currentVisaStatus: visaInfo.personalInfo.currentVisaStatus || ''
        },
        evaluationData: evalBlock,
        evaluation: evalBlock,
        administrativeData: visaInfo.administrativeData || {},
        status: VisaApplication.APPLICATION_STATUS.DRAFT,
        metadata: {
          version: 1,
          source: 'WEB',
          lastModifiedBy: userId,
          evaluationVersion: '1.0'
        }
      };

      // 데이터 로깅
      logger.info('신청서 데이터 준비:', {
        visaType: normalizedVisaType,
        userId,
        isNew: !application,
        evaluationData: applicationData.evaluationData,
        personalInfo: applicationData.personalInfo
      });

      if (!application) {
        // 새 신청서 생성
        application = await VisaApplication.create(applicationData);
        logger.info('새 신청서 생성됨:', application._id);
      } else {
        // 기존 신청서 업데이트
        Object.assign(application, applicationData);
        application.metadata.version += 1;
        application.metadata.lastModifiedBy = userId;
        
        await application.save();
        logger.info('기존 신청서 업데이트됨:', application._id);
      }

      return {
        applicationId: application._id,
        visaType: application.visaType,
        visaTypeDisplay: formatVisaTypeForDisplay(application.visaType),
        status: application.status,
        message: '신청서가 저장되었습니다.'
      };
    } catch (error) {
      logger.error('신청서 처리 중 오류:', error);
      throw error;
    }
  },

  /**
   * 현재 진행 중인 신청서 조회
   */
  async getCurrentApplication(userId, visaType = null) {
    const query = {
      userId,
      status: { 
        $nin: [
          VisaApplication.APPLICATION_STATUS.COMPLETED,
          VisaApplication.APPLICATION_STATUS.REJECTED
        ]
      }
    };

    if (visaType) {
      const normalizedVisaType = normalizeVisaType(visaType);
      query.visaType = normalizedVisaType;
    }

    const application = await VisaApplication.findOne(query)
      .sort({ updatedAt: -1 })
      .lean();

    if (!application) {
      return null;
    }

    return {
      ...application,
      visaTypeDisplay: formatVisaTypeForDisplay(application.visaType)
    };
  },

  /**
   * 특정 ID의 신청서 조회
   */
  async getApplicationById(applicationId, userId) {
    const application = await VisaApplication.findById(applicationId).lean();

    if (!application) {
      throw new Error('해당 ID의 신청서를 찾을 수 없습니다.');
    }

    if (application.userId.toString() !== userId) {
      throw new Error('해당 신청서에 대한 접근 권한이 없습니다.');
    }

    return {
      ...application,
      visaTypeDisplay: formatVisaTypeForDisplay(application.visaType)
    };
  },

  /**
   * 신청서 제출
   */
  async submitApplication(applicationId, userId) {
    const application = await VisaApplication.findById(applicationId);

    if (!application) {
      throw new Error('해당 ID의 신청서를 찾을 수 없습니다.');
    }

    if (application.userId.toString() !== userId) {
      throw new Error('해당 신청서에 대한 접근 권한이 없습니다.');
    }

    // 필수 문서 확인
    const requiredDocs = VisaApplication.REQUIRED_DOCUMENTS[application.visaType] || [];
    const uploadedDocTypes = application.documents.map(doc => doc.documentType);
    const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));

    if (missingDocs.length > 0) {
      throw new Error(`다음 필수 문서가 누락되었습니다: ${missingDocs.join(', ')}`);
    }

    application.status = VisaApplication.APPLICATION_STATUS.SUBMITTED;
    application.submittedAt = new Date();
    application.metadata.version += 1;
    application.metadata.lastModifiedBy = userId;
    
    await application.save();

    return {
      applicationId: application._id,
      status: application.status,
      submittedAt: application.submittedAt,
      message: '신청서가 성공적으로 제출되었습니다.'
    };
  },

  /**
   * 사용자의 모든 신청서 조회
   */
  async getUserApplications(userId, status = null) {
    const query = { userId };
    
    if (status) {
      // 상태 코드 유효성 검증
      const normalizedStatus = status.toUpperCase();
      if (!Object.values(VisaApplication.APPLICATION_STATUS).includes(normalizedStatus)) {
        throw new Error(`유효하지 않은 상태 코드입니다: ${status}`);
      }
      query.status = normalizedStatus;
    }

    const applications = await VisaApplication.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return applications.map(app => ({
      ...app,
      visaTypeDisplay: formatVisaTypeForDisplay(app.visaType)
    }));
  }
};

module.exports = visaApplicationService;