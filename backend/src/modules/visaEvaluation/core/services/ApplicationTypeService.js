/**
 * 신청 유형 관리 서비스
 * 신규/연장/변경 신청에 대한 비즈니스 로직 관리
 * 경로: /backend/src/modules/visaEvaluation/core/services/ApplicationTypeService.js
 */

const { APPLICATION_TYPES } = require('../models/ApplicationType');
const ApplicationTypeEvaluator = require('../evaluators/ApplicationTypeEvaluator');
const { DocumentValidator } = require('../../config/documents/documentRequirements');
const logger = require('../../../../utils/logger');

class ApplicationTypeService {
  constructor() {
    this.evaluator = new ApplicationTypeEvaluator();
    this.documentValidator = new DocumentValidator();
  }

  /**
   * 신청 유형 자동 결정
   */
  determineApplicationType(applicantData) {
    const indicators = {
      hasCurrentVisa: !!applicantData.currentVisa,
      isExtension: applicantData.isExtension === true,
      isStatusChange: applicantData.isStatusChange === true,
      currentVisaType: applicantData.currentVisa?.type,
      targetVisaType: applicantData.targetVisaType,
      hasKoreanVisa: applicantData.hasKoreanVisa === true
    };

    let type = APPLICATION_TYPES.NEW;
    let confidence = 'HIGH';
    let reason = '';

    // 명시적 지정이 있는 경우
    if (indicators.isExtension) {
      type = APPLICATION_TYPES.EXTENSION;
      reason = '연장 신청으로 명시됨';
    } else if (indicators.isStatusChange) {
      type = APPLICATION_TYPES.CHANGE;
      reason = '변경 신청으로 명시됨';
    } 
    // 현재 비자 정보로 추론
    else if (indicators.hasCurrentVisa) {
      if (indicators.currentVisaType === indicators.targetVisaType) {
        type = APPLICATION_TYPES.EXTENSION;
        reason = '동일 비자 타입 재신청';
        confidence = 'MEDIUM';
      } else if (indicators.currentVisaType && indicators.targetVisaType) {
        type = APPLICATION_TYPES.CHANGE;
        reason = '다른 비자 타입으로 신청';
      }
    }
    // 한국 비자 보유 여부로 추론
    else if (indicators.hasKoreanVisa) {
      type = APPLICATION_TYPES.CHANGE;
      reason = '한국 비자 보유자의 신청';
      confidence = 'LOW';
    }

    logger.info('신청 유형 결정', {
      type,
      confidence,
      reason,
      indicators
    });

    return { type, confidence, reason, indicators };
  }

  /**
   * 신청 유형별 평가 실행
   */
  async evaluateByApplicationType(visaType, applicantData, applicationType, options = {}) {
    try {
      // 평가 실행
      const evaluation = await this.evaluator.evaluate(
        visaType, 
        applicantData, 
        applicationType, 
        options
      );

      // 추가 정보 보강
      const enrichedResult = {
        ...evaluation,
        visaType,
        applicationType,
        applicationTypeName: this.getApplicationTypeName(applicationType),
        
        // 문서 체크리스트
        documents: this.documentValidator.generateDocumentChecklist(
          visaType, 
          applicationType, 
          applicantData
        ),
        
        // 진행 상황
        progress: this.trackProgress(applicationType, 'evaluation', 100, evaluation),
        
        // 다음 단계
        nextSteps: this.generateNextSteps(applicationType, evaluation),
        
        // 예상 처리 시간
        estimatedProcessing: this.getEstimatedProcessingTime(visaType, applicationType),
        
        // 위험 분석
        riskAnalysis: this.analyzeRisks(applicationType, evaluation),
        
        // 강점 분석
        strengthAnalysis: this.analyzeStrengths(applicationType, evaluation)
      };

      return enrichedResult;

    } catch (error) {
      logger.error('신청 유형별 평가 오류', error);
      throw error;
    }
  }

  /**
   * 신청 유형명 조회
   */
  getApplicationTypeName(applicationType) {
    const names = {
      [APPLICATION_TYPES.NEW]: '신규 신청',
      [APPLICATION_TYPES.EXTENSION]: '체류기간 연장',
      [APPLICATION_TYPES.CHANGE]: '체류자격 변경',
      [APPLICATION_TYPES.REENTRY]: '재입국 허가'
    };
    return names[applicationType] || applicationType;
  }

  /**
   * 신청 유형별 가이드 제공
   */
  getApplicationTypeGuide(applicationType, visaType) {
    const guides = {
      [APPLICATION_TYPES.NEW]: {
        title: '신규 비자 신청 가이드',
        steps: [
          '자격 요건 확인',
          '필요 서류 준비',
          '온라인 신청서 작성',
          '수수료 납부',
          '서류 제출 및 면접',
          '결과 확인'
        ],
        timeline: '2-4주',
        tips: [
          '모든 서류는 최근 3개월 이내 발급',
          '번역 공증이 필요한 서류 미리 준비',
          '여권 유효기간 6개월 이상 확인'
        ]
      },
      [APPLICATION_TYPES.EXTENSION]: {
        title: '체류기간 연장 가이드',
        steps: [
          '연장 가능 여부 확인',
          '활동 증명 서류 준비',
          '고용계약서 갱신',
          '출입국 사무소 방문 예약',
          '연장 신청서 제출',
          '결과 수령'
        ],
        timeline: '1-2주',
        tips: [
          '만료 2개월 전부터 신청 가능',
          '체류기간 만료 전 반드시 신청',
          '세금 납부 증명서 필수'
        ]
      },
      [APPLICATION_TYPES.CHANGE]: {
        title: '체류자격 변경 가이드',
        steps: [
          '변경 가능 경로 확인',
          '새 비자 요건 검토',
          '필요 서류 준비',
          '변경 사유서 작성',
          '출입국 사무소 신청',
          '심사 및 결과 확인'
        ],
        timeline: '3-6주',
        tips: [
          '현재 체류 상태 적법성 유지',
          '변경 사유 명확히 설명',
          '이전 활동 종료 증명 필요'
        ]
      }
    };

    return guides[applicationType] || guides[APPLICATION_TYPES.NEW];
  }

  /**
   * 다음 단계 생성
   */
  generateNextSteps(applicationType, evaluation) {
    const steps = [];

    if (!evaluation.eligible) {
      steps.push({
        priority: 'HIGH',
        action: '자격 요건 보완',
        details: '현재 미충족 요건을 확인하고 보완하세요'
      });
    }

    if (evaluation.breakdown?.documents?.missing?.length > 0) {
      steps.push({
        priority: 'HIGH',
        action: '필수 서류 준비',
        details: `누락된 서류 ${evaluation.breakdown.documents.missing.length}개 준비`
      });
    }

    if (evaluation.score >= 70) {
      steps.push({
        priority: 'MEDIUM',
        action: '신청서 작성',
        details: '온라인 또는 오프라인 신청서 작성 시작'
      });
    }

    return steps;
  }

  /**
   * 예상 처리 시간
   */
  getEstimatedProcessingTime(visaType, applicationType) {
    const processingTimes = {
      NEW: { min: 10, max: 20, average: 15 },
      EXTENSION: { min: 5, max: 10, average: 7 },
      CHANGE: { min: 14, max: 30, average: 21 }
    };

    const times = processingTimes[applicationType] || processingTimes.NEW;
    
    return {
      ...times,
      unit: 'days',
      description: `약 ${times.average}일 (${times.min}-${times.max}일)`
    };
  }

  /**
   * 위험 요소 분석
   */
  analyzeRisks(applicationType, evaluation) {
    const risks = [];

    if (evaluation.score < 50) {
      risks.push({
        level: 'HIGH',
        factor: '낮은 승인 가능성',
        description: '전체 평가 점수가 매우 낮습니다',
        mitigation: '자격 요건 대폭 보완 필요'
      });
    }

    if (applicationType === APPLICATION_TYPES.CHANGE && evaluation.changeability && !evaluation.changeability.possible) {
      risks.push({
        level: 'CRITICAL',
        factor: '변경 불가 경로',
        description: '현재 비자에서 목표 비자로 직접 변경 불가',
        mitigation: '대안 경로 검토 필요'
      });
    }

    if (evaluation.breakdown?.stayHistory?.riskFactors?.length > 0) {
      evaluation.breakdown.stayHistory.riskFactors.forEach(risk => {
        risks.push({
          level: risk.impact,
          factor: risk.type,
          description: risk.description,
          mitigation: '체류 이력 개선 필요'
        });
      });
    }

    return risks;
  }

  /**
   * 강점 분석
   */
  analyzeStrengths(applicationType, evaluation) {
    const strengths = [];

    if (evaluation.score >= 80) {
      strengths.push({
        factor: '높은 평가 점수',
        description: '전반적으로 우수한 자격 요건',
        advantage: '빠른 승인 가능성'
      });
    }

    if (evaluation.breakdown?.stayHistory?.strengths?.length > 0) {
      evaluation.breakdown.stayHistory.strengths.forEach(strength => {
        strengths.push({
          factor: strength.type,
          description: strength.description,
          advantage: strength.value
        });
      });
    }

    return strengths;
  }

  /**
   * 진행 상황 추적
   */
  trackProgress(applicationType, currentStage, stageProgress, completedData) {
    const stages = {
      [APPLICATION_TYPES.NEW]: [
        { id: 'eligibility', name: '자격 확인', weight: 0.2 },
        { id: 'documents', name: '서류 준비', weight: 0.3 },
        { id: 'application', name: '신청서 작성', weight: 0.2 },
        { id: 'submission', name: '제출', weight: 0.2 },
        { id: 'result', name: '결과', weight: 0.1 }
      ],
      [APPLICATION_TYPES.EXTENSION]: [
        { id: 'activity_check', name: '활동 확인', weight: 0.25 },
        { id: 'documents', name: '서류 준비', weight: 0.25 },
        { id: 'application', name: '신청', weight: 0.25 },
        { id: 'result', name: '결과', weight: 0.25 }
      ],
      [APPLICATION_TYPES.CHANGE]: [
        { id: 'changeability', name: '변경 가능성', weight: 0.2 },
        { id: 'requirements', name: '요건 확인', weight: 0.2 },
        { id: 'documents', name: '서류 준비', weight: 0.3 },
        { id: 'application', name: '신청', weight: 0.2 },
        { id: 'result', name: '결과', weight: 0.1 }
      ]
    };

    const typeStages = stages[applicationType] || stages[APPLICATION_TYPES.NEW];
    const currentStageIndex = typeStages.findIndex(s => s.id === currentStage);
    
    let totalProgress = 0;
    typeStages.forEach((stage, index) => {
      if (index < currentStageIndex) {
        totalProgress += stage.weight * 100;
      } else if (index === currentStageIndex) {
        totalProgress += stage.weight * stageProgress;
      }
    });

    return {
      currentStage,
      stageProgress,
      totalProgress: Math.round(totalProgress),
      stages: typeStages,
      completedStages: currentStageIndex,
      remainingStages: typeStages.length - currentStageIndex - 1
    };
  }

  /**
   * 신청 유형별 로드맵 생성
   */
  generateRoadmap(applicationType, currentState, targetState, timelineWeeks = 12) {
    const roadmap = {
      applicationType,
      currentState,
      targetState,
      timeline: `${timelineWeeks}주`,
      phases: []
    };

    switch (applicationType) {
      case APPLICATION_TYPES.NEW:
        roadmap.phases = [
          {
            week: '1-2',
            tasks: ['자격 요건 자가 진단', '필요 서류 목록 확인'],
            milestone: '준비 단계 완료'
          },
          {
            week: '3-6',
            tasks: ['서류 준비 및 번역', '공증/아포스티유'],
            milestone: '서류 준비 완료'
          },
          {
            week: '7-8',
            tasks: ['온라인 신청서 작성', '수수료 납부'],
            milestone: '신청 완료'
          },
          {
            week: '9-12',
            tasks: ['면접 준비', '추가 서류 대응'],
            milestone: '비자 발급'
          }
        ];
        break;

      case APPLICATION_TYPES.EXTENSION:
        roadmap.phases = [
          {
            week: '1',
            tasks: ['현재 활동 증명 자료 수집', '고용 계약 확인'],
            milestone: '현황 파악 완료'
          },
          {
            week: '2-3',
            tasks: ['필요 서류 준비', '세금/보험 정산'],
            milestone: '서류 준비 완료'
          },
          {
            week: '4',
            tasks: ['출입국 방문 예약', '신청서 제출'],
            milestone: '연장 신청 완료'
          }
        ];
        break;

      case APPLICATION_TYPES.CHANGE:
        roadmap.phases = [
          {
            week: '1-2',
            tasks: ['변경 가능성 확인', '목표 비자 요건 분석'],
            milestone: '타당성 검토 완료'
          },
          {
            week: '3-6',
            tasks: ['새 비자 요건 충족', '필요 서류 준비'],
            milestone: '자격 요건 충족'
          },
          {
            week: '7-10',
            tasks: ['변경 사유서 작성', '서류 제출'],
            milestone: '변경 신청 완료'
          },
          {
            week: '11-12',
            tasks: ['심사 대응', '결과 확인'],
            milestone: '비자 변경 완료'
          }
        ];
        break;
    }

    return roadmap;
  }
}

module.exports = ApplicationTypeService; 