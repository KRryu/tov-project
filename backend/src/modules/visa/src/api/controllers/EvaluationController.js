/**
 * 비자 평가 컨트롤러
 * 새로운 V4 API 엔드포인트
 */

const asyncHandler = require('../../../../../utils/asyncHandler');
const logger = require('../../../../../utils/logger');
const VisaModule = require('../../index');

class EvaluationController {
  /**
   * 비자 평가 실행
   * POST /api/v3/visa/evaluate
   */
  static evaluate = asyncHandler(async (req, res) => {
    const { visaType, applicationType, data } = req.body;

    // 입력 검증
    if (!visaType || !applicationType || !data) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다.'
      });
    }

    // 모듈 초기화 확인
    if (!VisaModule.initialized) {
      await VisaModule.initialize();
    }

    // 평가 실행
    const result = await VisaModule.evaluate({
      visaType,
      applicationType,
      data
    });

    // 응답
    res.status(result.success ? 200 : 400).json(result);
  });

  /**
   * 지원 비자 타입 조회
   * GET /api/v3/visa/supported-types
   */
  static getSupportedTypes = asyncHandler(async (req, res) => {
    if (!VisaModule.initialized) {
      await VisaModule.initialize();
    }

    const types = await VisaModule.visaService.getSupportedVisaTypes();
    
    res.json({
      success: true,
      count: types.length,
      types
    });
  });

  /**
   * 비자 요구사항 조회
   * GET /api/v3/visa/requirements/:visaType/:applicationType
   */
  static getRequirements = asyncHandler(async (req, res) => {
    const { visaType, applicationType } = req.params;

    if (!VisaModule.initialized) {
      await VisaModule.initialize();
    }

    const requirements = await VisaModule.visaService.getVisaRequirements(
      visaType,
      applicationType
    );

    res.json({
      success: true,
      requirements
    });
  });

  /**
   * 변경 가능 경로 조회
   * GET /api/v3/visa/change-paths/:currentVisa
   */
  static getChangePaths = asyncHandler(async (req, res) => {
    const { currentVisa } = req.params;

    if (!VisaModule.initialized) {
      await VisaModule.initialize();
    }

    const paths = await VisaModule.visaService.getChangePaths(currentVisa);

    res.json({
      success: true,
      paths
    });
  });

  /**
   * 배치 평가
   * POST /api/v3/visa/batch-evaluate
   */
  static batchEvaluate = asyncHandler(async (req, res) => {
    const { evaluations } = req.body;

    if (!Array.isArray(evaluations)) {
      return res.status(400).json({
        success: false,
        error: 'evaluations는 배열이어야 합니다.'
      });
    }

    if (!VisaModule.initialized) {
      await VisaModule.initialize();
    }

    const results = await VisaModule.visaService.batchEvaluate(evaluations);

    res.json({
      success: true,
      results
    });
  });

  /**
   * 모듈 상태 확인
   * GET /api/v3/visa/status
   */
  static getStatus = asyncHandler(async (req, res) => {
    const status = VisaModule.getStatus();

    res.json({
      success: true,
      status
    });
  });

  // 레거시 호환성을 위한 메서드들
  /**
   * 레거시 평가 (V1/V2 호환)
   * POST /api/v3/visa/legacy/evaluate
   */
  static legacyEvaluate = asyncHandler(async (req, res) => {
    const { visaType, ...data } = req.body;

    // 레거시 형식을 새 형식으로 변환
    const applicationType = data.applicationType || 'NEW';
    delete data.applicationType;

    const result = await EvaluationController.evaluate({
      body: {
        visaType,
        applicationType,
        data
      }
    }, res);
  });

  /**
   * 빠른 평가 (간소화된 평가)
   * POST /api/v3/visa/quick-evaluate
   */
  static quickEvaluate = asyncHandler(async (req, res) => {
    const { visaType, applicationType = 'NEW' } = req.body;

    // 최소 데이터로 기본 평가만 수행
    const minimalData = {
      education: req.body.education || 'BACHELOR',
      experience: req.body.experience || 0,
      age: req.body.age || 30
    };

    const result = await VisaModule.evaluate({
      visaType,
      applicationType,
      data: minimalData
    });

    res.json({
      success: result.success,
      eligible: result.result?.eligible,
      score: result.result?.score,
      message: result.result?.eligible 
        ? '기본 요건을 충족합니다.' 
        : '기본 요건이 부족합니다.'
    });
  });
}

module.exports = EvaluationController;