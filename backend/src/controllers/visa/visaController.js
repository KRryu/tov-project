const VisaApplication = require('../../models/visa/VisaApplication');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const logger = require('../../utils/logger');
const { normalizeVisaType, formatVisaTypeForDisplay } = require('../../utils/visaType');
const visaApplicationService = require('../../services/visa/visaApplicationService');
const { normalizeNumericFields, normalizeBooleanFields } = require('../../utils/dataNormalizer');

/**
 * API 응답 생성 유틸리티
 */
const createResponse = (success, data = null, error = null) => {
  const response = { success };
  if (data) response.data = data;
  if (error) response.error = error;
  return response;
};

/**
 * 에러 응답 생성 유틸리티
 */
const createErrorResponse = (error, defaultMessage = '처리 중 오류가 발생했습니다.') => {
  logger.error('API 에러:', error);
  const status = error.status || 500;
  const message = error.message || defaultMessage;
  return { status, response: createResponse(false, null, message) };
};

/**
 * 비자 신청서 생성 또는 업데이트 - E1 고도화 대응
 */
exports.createOrUpdateApplication = async (req, res) => {
  try {
    const { user } = req;
    const visaInfo = req.body;

    if (!user || !user.id) {
      return res.status(401).json(createResponse(false, null, '인증 정보가 필요합니다.'));
    }

    // 프런트는 evaluation 블록만 보내도록 변경됨 => 하위 호환 처리
    if (!visaInfo.evaluationData && visaInfo.evaluation) {
      visaInfo.evaluationData = visaInfo.evaluation;
    }

    const visaType = normalizeVisaType(visaInfo.visaType);

    if (!visaInfo.evaluation) {
      return res.status(400).json(createResponse(false, null, '평가 데이터가 필요합니다.'));
    }

    const { missingEvaluation, missingAdministrative } = VisaApplication.getMissingFields(visaType, visaInfo.evaluation, visaInfo.administrative);

    if (missingEvaluation.length || missingAdministrative.length) {
      const missing = [...missingEvaluation, ...missingAdministrative];
      return res.status(400).json(createResponse(false, null, `필수 필드가 누락되었습니다: ${missing.join(', ')}`));
    }

    const result = await visaApplicationService.createOrUpdate(user.id, visaInfo);
    
    // E1 비자의 경우 추가 정보 로깅
    if (visaType === 'E1' && result.applicationId) {
      logger.info('E1 비자 신청서 생성/업데이트 완료:', {
        applicationId: result.applicationId,
        evaluationVersion: '2.0',
        hasAdvancedFields: true
      });
    }
    
    return res.status(200).json(createResponse(true, result));
  } catch (error) {
    logger.error('비자 신청서 처리 중 오류:', error);
    const { status, response } = createErrorResponse(error, '비자 신청서 저장 중 오류가 발생했습니다.');
    return res.status(status).json(response);
  }
};

/**
 * 특정 사용자의 최신 비자 신청서 조회
 */
exports.getCurrentApplication = async (req, res) => {
  try {
    const { user } = req;
    const { visaType } = req.query;

    if (!user || !user.id) {
      return res.status(401).json(createResponse(false, null, '인증 정보가 필요합니다.'));
    }

    const application = await visaApplicationService.getCurrentApplication(user.id, visaType);
    
    if (!application) {
      return res.status(204).json(createResponse(true, null));
    }
    
    return res.status(200).json(createResponse(true, application));
  } catch (error) {
    const { status, response } = createErrorResponse(error, '신청서 조회 중 오류가 발생했습니다.');
    return res.status(status).json(response);
  }
};

/**
 * 특정 ID의 비자 신청서 상세 조회 - E1 고도화 대응
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    if (!user || !user.id) {
      return res.status(401).json(createResponse(false, null, '인증 정보가 필요합니다.'));
    }

    const application = await visaApplicationService.getApplicationById(id, user.id);
    
    // E1 비자의 경우 고도화 정보 포맷팅
    if (application.visaType === 'E1' && application.evaluationResult) {
      const evaluationResult = application.evaluationResult;
      
      // 로드맵 정보 요약
      if (evaluationResult.roadmap) {
        application.roadmapSummary = {
          immediateActions: evaluationResult.roadmap.immediate?.length || 0,
          shortTermActions: evaluationResult.roadmap.shortTerm?.length || 0,
          mediumTermActions: evaluationResult.roadmap.mediumTerm?.length || 0,
          longTermActions: evaluationResult.roadmap.longTerm?.length || 0
        };
      }
      
      // 승인 예측 정보 강조
      if (evaluationResult.approvalPrediction) {
        application.approvalInfo = {
          chance: evaluationResult.approvalPrediction.chance,
          percentage: evaluationResult.approvalPrediction.percentage,
          description: evaluationResult.approvalPrediction.description
        };
      }
      
      logger.info('E1 비자 신청서 상세 조회 - 고도화 정보 포함:', {
        applicationId: id,
        hasRoadmap: !!evaluationResult.roadmap,
        hasApprovalPrediction: !!evaluationResult.approvalPrediction,
        evaluationVersion: application.metadata?.evaluationVersion
      });
    }

    // E2 비자의 경우 고도화 정보 포맷팅 (E1 처리 다음에 추가)
    if (application.visaType === 'E2' && application.evaluationResult) {
      const evaluationResult = application.evaluationResult;
      
      // 로드맵 정보 요약
      if (evaluationResult.roadmap) {
        application.roadmapSummary = {
          immediateActions: evaluationResult.roadmap.immediate?.length || 0,
          shortTermActions: evaluationResult.roadmap.shortTerm?.length || 0,
          mediumTermActions: evaluationResult.roadmap.mediumTerm?.length || 0,
          longTermActions: evaluationResult.roadmap.longTerm?.length || 0
        };
      }
      
      // 승인 예측 정보 강조
      if (evaluationResult.approvalPrediction) {
        application.approvalInfo = {
          chance: evaluationResult.approvalPrediction.chance,
          percentage: evaluationResult.approvalPrediction.percentage,
          description: evaluationResult.approvalPrediction.description
        };
      }
      
      // E2 특화 정보
      if (evaluationResult.details) {
        application.e2SpecificInfo = {
          languageMatch: evaluationResult.details.languageMatch,
          isNativeSpeaker: evaluationResult.details.isNativeSpeaker,
          backgroundCheckStatus: evaluationResult.details.backgroundCheckStatus,
          healthStatus: evaluationResult.details.healthStatus,
          hasCertificate: evaluationResult.details.hasCertificate,
          isProgramSupported: evaluationResult.details.isProgramSupported
        };
      }
      
      logger.info('E2 비자 신청서 상세 조회 - 고도화 정보 포함:', {
        applicationId: id,
        hasRoadmap: !!evaluationResult.roadmap,
        hasApprovalPrediction: !!evaluationResult.approvalPrediction,
        languageMatch: evaluationResult.details?.languageMatch,
        evaluationVersion: application.metadata?.evaluationVersion
      });
    }

    // E4 비자의 경우 고도화 정보 포맷팅
    if (application.visaType === 'E4' && application.evaluationResult) {
      const evaluationResult = application.evaluationResult;
      
      // 로드맵 정보 요약
      if (evaluationResult.roadmap) {
        application.roadmapSummary = {
          immediateActions: evaluationResult.roadmap.immediate?.length || 0,
          shortTermActions: evaluationResult.roadmap.shortTerm?.length || 0,
          mediumTermActions: evaluationResult.roadmap.mediumTerm?.length || 0,
          longTermActions: evaluationResult.roadmap.longTerm?.length || 0
        };
      }
      
      // E4 특화 정보
      if (evaluationResult.details) {
        application.e4SpecificInfo = {
          technicalQualification: evaluationResult.technicalQualification,
          technologyField: evaluationResult.technologyField,
          contractValueLevel: evaluationResult.contractDetails?.valueLevel,
          goldCardEligible: evaluationResult.goldCardEligible,
          organizationType: evaluationResult.organizationDetails?.type
        };
      }
      
      logger.info('E4 비자 신청서 상세 조회 - 고도화 정보 포함:', {
        applicationId: id,
        hasRoadmap: !!evaluationResult.roadmap,
        goldCardEligible: evaluationResult.goldCardEligible
      });
    }
    
    return res.status(200).json(createResponse(true, application));
  } catch (error) {
    const { status, response } = createErrorResponse(error, '신청서 조회 중 오류가 발생했습니다.');
    return res.status(status).json(response);
  }
};

/**
 * 비자 신청서 제출
 */
exports.submitApplication = async (req, res) => {
  try {
    const { user } = req;
    const { applicationId } = req.body;

    if (!user || !user.id) {
      return res.status(401).json(createResponse(false, null, '인증 정보가 필요합니다.'));
    }

    const result = await visaApplicationService.submitApplication(applicationId, user.id);
    return res.status(200).json(createResponse(true, result));
  } catch (error) {
    const { status, response } = createErrorResponse(error, '신청서 제출 중 오류가 발생했습니다.');
    return res.status(status).json(response);
  }
};

/**
 * 사용자의 모든 비자 신청 내역 조회 - E1 고도화 대응
 */
exports.getUserApplications = async (req, res) => {
  try {
    const { user } = req;
    const { status, visaType } = req.query;

    if (!user || !user.id) {
      return res.status(401).json(createResponse(false, null, '인증 정보가 필요합니다.'));
    }

    const applications = await visaApplicationService.getUserApplications(user.id, status);
    
    // E1 비자 신청서에 대한 추가 정보 포함
    const enhancedApplications = applications.map(app => {
      if (app.visaType === 'E1' && app.evaluationResult) {
        // 기존 E1 처리
        return {
          ...app,
          hasApprovalPrediction: !!app.evaluationResult.approvalPrediction,
          approvalPercentage: app.evaluationResult.approvalPrediction?.percentage,
          criticalIssueCount: app.evaluationResult.issues?.filter(i => i.severity === 'critical').length || 0,
          evaluationVersion: app.metadata?.evaluationVersion || '1.0'
        };
      } else if (app.visaType === 'E2' && app.evaluationResult) {
        // E2 고도화 정보 추가
        return {
          ...app,
          hasApprovalPrediction: !!app.evaluationResult.approvalPrediction,
          approvalPercentage: app.evaluationResult.approvalPrediction?.percentage,
          languageMatch: app.evaluationResult.details?.languageMatch,
          backgroundCheckStatus: app.evaluationResult.details?.backgroundCheckStatus,
          healthStatus: app.evaluationResult.details?.healthStatus,
          criticalIssueCount: app.evaluationResult.issues?.filter(i => i.severity === 'critical').length || 0,
          evaluationVersion: app.metadata?.evaluationVersion || '2.0'
        };
      } else if (app.visaType === 'E4' && app.evaluationResult) {
        return {
          ...app,
          hasApprovalPrediction: !!app.evaluationResult.approvalPrediction,
          approvalPercentage: app.evaluationResult.approvalPrediction?.percentage,
          technicalQualification: app.evaluationResult.technicalQualification,
          goldCardEligible: app.evaluationResult.goldCardEligible,
          criticalIssueCount: app.evaluationResult.issues?.filter(i => i.severity === 'critical').length || 0,
          evaluationVersion: app.metadata?.evaluationVersion || '1.0'
        };
      }
      return app;
    });
    
    return res.status(200).json(createResponse(true, enhancedApplications));
  } catch (error) {
    const { status, response } = createErrorResponse(error, '신청 내역 조회 중 오류가 발생했습니다.');
    return res.status(status).json(response);
  }
};

/**
 * 문서 업로드
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { user } = req;
    const { applicationId } = req.body;
    const files = req.files;

    // 인증 확인
    if (!user || !user.id) {
      return res.status(401).json(createResponse(false, null, '인증 정보가 필요합니다.'));
    }

    // 파일 확인
    if (!files || files.length === 0) {
      return res.status(400).json(createResponse(false, null, '업로드할 파일이 없습니다.'));
    }

    const result = await visaApplicationService.uploadDocuments(applicationId, user.id, files);
    return res.status(200).json(createResponse(true, result));
  } catch (error) {
    const { status, response } = createErrorResponse(error, '문서 업로드 중 오류가 발생했습니다.');
    return res.status(status).json(response);
  }
};

/**
 * 문서 다운로드
 */
exports.downloadDocument = async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    const userId = req.user.id;
    
    // 신청서 존재 여부 및 권한 확인
    const application = await VisaApplication.findOne({
      _id: applicationId,
      userId
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: '유효하지 않은 신청서입니다.'
      });
    }
    
    // 문서 찾기
    const document = application.documents.id(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: '문서를 찾을 수 없습니다.'
      });
    }
    
    // 파일 경로 구성
    const filePath = path.join(process.cwd(), document.filePath);
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '파일이 존재하지 않습니다.'
      });
    }
    
    // 파일 다운로드 응답
    return res.download(filePath, document.originalName);
  } catch (error) {
    console.error('문서 다운로드 오류:', error);
    return res.status(500).json({
      success: false,
      message: '문서 다운로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

/**
 * 문서 삭제
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    const userId = req.user.id;
    
    // 신청서 존재 여부 및 권한 확인
    const application = await VisaApplication.findOne({
      _id: applicationId,
      userId
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: '유효하지 않은 신청서입니다.'
      });
    }
    
    // 문서 찾기
    const document = application.documents.id(documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: '문서를 찾을 수 없습니다.'
      });
    }
    
    // 파일 삭제
    const filePath = path.join(process.cwd(), document.filePath);
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
    
    // 문서 정보 삭제
    application.documents.pull(documentId);
    application.updatedAt = new Date();
    await application.save();
    
    return res.status(200).json({
      success: true,
      message: '문서가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('문서 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      message: '문서 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}; 