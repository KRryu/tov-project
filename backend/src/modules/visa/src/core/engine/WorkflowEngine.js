/**
 * 워크플로우 엔진 - 비자 신청 프로세스 관리
 * 평가 → 매칭 → 결제 → 서류제출의 전체 플로우 관리
 */

const logger = require('../../../../../utils/logger');
const { APPLICATION_TYPES, EVALUATION_STATUS } = require('../../config/shared/constants');

class WorkflowEngine {
  constructor(configManager) {
    this.configManager = configManager;
    this.workflows = new Map();
    this.steps = new Map();
  }

  /**
   * 워크플로우 엔진 초기화
   */
  async initialize() {
    try {
      // 기본 워크플로우 정의
      this.defineBaseWorkflows();
      
      // 워크플로우 단계 정의
      this.defineWorkflowSteps();
      
      logger.info('✅ 워크플로우 엔진 초기화 완료');
    } catch (error) {
      logger.error('워크플로우 엔진 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 기본 워크플로우 정의
   */
  defineBaseWorkflows() {
    // 적격 판정 시 워크플로우
    this.workflows.set('ELIGIBLE', {
      steps: [
        'EVALUATION_COMPLETE',
        'LEGAL_MATCHING',
        'PAYMENT_REQUIRED',
        'DOCUMENT_SUBMISSION',
        'FINAL_REVIEW',
        'APPLICATION_SUBMISSION'
      ],
      transitions: {
        EVALUATION_COMPLETE: ['LEGAL_MATCHING', 'PAYMENT_REQUIRED'],
        LEGAL_MATCHING: ['PAYMENT_REQUIRED'],
        PAYMENT_REQUIRED: ['DOCUMENT_SUBMISSION'],
        DOCUMENT_SUBMISSION: ['FINAL_REVIEW'],
        FINAL_REVIEW: ['APPLICATION_SUBMISSION']
      }
    });

    // 부적격 판정 시 워크플로우
    this.workflows.set('INELIGIBLE', {
      steps: [
        'EVALUATION_COMPLETE',
        'IMPROVEMENT_SUGGESTIONS',
        'REAPPLICATION_GUIDE'
      ],
      transitions: {
        EVALUATION_COMPLETE: ['IMPROVEMENT_SUGGESTIONS'],
        IMPROVEMENT_SUGGESTIONS: ['REAPPLICATION_GUIDE']
      }
    });

    // 조건부 적격 워크플로우
    this.workflows.set('CONDITIONAL', {
      steps: [
        'EVALUATION_COMPLETE',
        'CONDITION_REVIEW',
        'ADDITIONAL_DOCUMENTS',
        'RE_EVALUATION',
        'PROCEED_OR_REJECT'
      ],
      transitions: {
        EVALUATION_COMPLETE: ['CONDITION_REVIEW'],
        CONDITION_REVIEW: ['ADDITIONAL_DOCUMENTS'],
        ADDITIONAL_DOCUMENTS: ['RE_EVALUATION'],
        RE_EVALUATION: ['PROCEED_OR_REJECT']
      }
    });
  }

  /**
   * 워크플로우 단계별 상세 정의
   */
  defineWorkflowSteps() {
    // 평가 완료
    this.steps.set('EVALUATION_COMPLETE', {
      name: '평가 완료',
      description: '비자 적격성 평가가 완료되었습니다',
      actions: ['VIEW_RESULT', 'DOWNLOAD_REPORT'],
      requiredTime: 0
    });

    // 법무대리인 매칭
    this.steps.set('LEGAL_MATCHING', {
      name: '법무대리인 매칭',
      description: '전문 법무대리인 추천 및 선택',
      actions: ['VIEW_LAWYERS', 'SELECT_LAWYER', 'SKIP_LAWYER'],
      requiredTime: 1,
      optional: true
    });

    // 결제 요청
    this.steps.set('PAYMENT_REQUIRED', {
      name: '서비스 이용료 결제',
      description: '비자 신청 서비스 이용료 결제',
      actions: ['PAY_NOW', 'PAY_LATER'],
      requiredTime: 0,
      required: true
    });

    // 서류 제출
    this.steps.set('DOCUMENT_SUBMISSION', {
      name: '필수 서류 제출',
      description: '비자 신청에 필요한 서류 업로드',
      actions: ['UPLOAD_DOCUMENTS', 'CHECK_REQUIREMENTS'],
      requiredTime: 3,
      required: true
    });

    // 최종 검토
    this.steps.set('FINAL_REVIEW', {
      name: '최종 검토',
      description: '제출된 모든 정보와 서류 최종 확인',
      actions: ['REVIEW_APPLICATION', 'EDIT_APPLICATION'],
      requiredTime: 1
    });

    // 신청서 제출
    this.steps.set('APPLICATION_SUBMISSION', {
      name: '출입국 신청',
      description: '출입국 사무소에 비자 신청서 제출',
      actions: ['SUBMIT_APPLICATION', 'SCHEDULE_VISIT'],
      requiredTime: 1
    });

    // 개선 제안
    this.steps.set('IMPROVEMENT_SUGGESTIONS', {
      name: '개선 방안 제시',
      description: '비자 적격성을 위한 개선 방안',
      actions: ['VIEW_SUGGESTIONS', 'CONSULT_EXPERT'],
      requiredTime: 0
    });

    // 재신청 안내
    this.steps.set('REAPPLICATION_GUIDE', {
      name: '재신청 안내',
      description: '조건 충족 후 재신청 방법 안내',
      actions: ['SAVE_FOR_LATER', 'SET_REMINDER'],
      requiredTime: 0
    });
  }

  /**
   * 다음 단계 결정
   */
  async determineNextSteps(eligible, visaType, applicationType) {
    try {
      let workflowType = 'ELIGIBLE';
      
      if (!eligible) {
        workflowType = 'INELIGIBLE';
      } else if (this.needsConditionalReview(visaType, applicationType)) {
        workflowType = 'CONDITIONAL';
      }

      const workflow = this.workflows.get(workflowType);
      const firstStep = workflow.steps[0];
      const stepDetails = this.steps.get(firstStep);

      return {
        currentStep: firstStep,
        nextSteps: this.getNextPossibleSteps(workflowType, firstStep),
        workflow: workflowType,
        estimatedDays: this.calculateTotalTime(workflow),
        actions: stepDetails.actions,
        description: stepDetails.description
      };
    } catch (error) {
      logger.error('다음 단계 결정 중 오류:', error);
      return {
        currentStep: 'ERROR',
        nextSteps: [],
        workflow: 'ERROR',
        error: error.message
      };
    }
  }

  /**
   * 조건부 검토 필요 여부 확인
   */
  needsConditionalReview(visaType, applicationType) {
    // 변경 신청은 항상 조건부 검토
    if (applicationType === APPLICATION_TYPES.CHANGE) {
      return true;
    }

    // 특정 비자는 추가 검토 필요
    const conditionalVisas = ['E-7', 'F-2', 'F-5'];
    return conditionalVisas.includes(visaType);
  }

  /**
   * 다음 가능한 단계 조회
   */
  getNextPossibleSteps(workflowType, currentStep) {
    const workflow = this.workflows.get(workflowType);
    const transitions = workflow.transitions[currentStep] || [];
    
    return transitions.map(step => {
      const stepDetails = this.steps.get(step);
      return {
        step,
        name: stepDetails.name,
        required: stepDetails.required !== false,
        estimatedDays: stepDetails.requiredTime
      };
    });
  }

  /**
   * 전체 소요 시간 계산
   */
  calculateTotalTime(workflow) {
    let totalDays = 0;
    
    for (const step of workflow.steps) {
      const stepDetails = this.steps.get(step);
      if (stepDetails && stepDetails.requiredTime) {
        totalDays += stepDetails.requiredTime;
      }
    }
    
    return totalDays;
  }

  /**
   * 워크플로우 진행
   */
  async proceedToNextStep(currentWorkflow, currentStep, selectedAction) {
    try {
      const workflow = this.workflows.get(currentWorkflow);
      if (!workflow) {
        throw new Error(`Unknown workflow: ${currentWorkflow}`);
      }

      const possibleNextSteps = workflow.transitions[currentStep] || [];
      let nextStep = null;

      // 액션에 따른 다음 단계 결정
      switch (selectedAction) {
        case 'SKIP_LAWYER':
          nextStep = possibleNextSteps.find(s => s !== 'LEGAL_MATCHING');
          break;
        case 'PAY_LATER':
          // 결제를 나중에 하는 경우 워크플로우 일시 중단
          return {
            status: 'PAUSED',
            message: '결제 완료 후 진행 가능합니다',
            resumeFrom: 'PAYMENT_REQUIRED'
          };
        default:
          nextStep = possibleNextSteps[0];
      }

      if (!nextStep) {
        return {
          status: 'COMPLETED',
          message: '모든 단계가 완료되었습니다'
        };
      }

      const stepDetails = this.steps.get(nextStep);
      
      return {
        status: 'PROCEED',
        currentStep: nextStep,
        stepDetails: {
          name: stepDetails.name,
          description: stepDetails.description,
          actions: stepDetails.actions,
          required: stepDetails.required !== false,
          estimatedDays: stepDetails.requiredTime
        },
        nextPossibleSteps: this.getNextPossibleSteps(currentWorkflow, nextStep)
      };
    } catch (error) {
      logger.error('워크플로우 진행 중 오류:', error);
      throw error;
    }
  }

  /**
   * 워크플로우 상태 조회
   */
  getWorkflowStatus(workflowId) {
    // TODO: 실제 구현 시 데이터베이스에서 조회
    return {
      id: workflowId,
      type: 'ELIGIBLE',
      currentStep: 'PAYMENT_REQUIRED',
      completedSteps: ['EVALUATION_COMPLETE', 'LEGAL_MATCHING'],
      remainingSteps: ['DOCUMENT_SUBMISSION', 'FINAL_REVIEW', 'APPLICATION_SUBMISSION'],
      progress: 33,
      estimatedCompletion: '5일'
    };
  }

  /**
   * 필수 액션 확인
   */
  getRequiredActions(workflowType, currentStep) {
    const stepDetails = this.steps.get(currentStep);
    if (!stepDetails) return [];

    const requiredActions = [];

    if (stepDetails.required) {
      requiredActions.push({
        step: currentStep,
        name: stepDetails.name,
        actions: stepDetails.actions.filter(a => !a.includes('SKIP') && !a.includes('LATER'))
      });
    }

    return requiredActions;
  }

  /**
   * 워크플로우 검증
   */
  validateWorkflowTransition(currentStep, targetStep, workflowType) {
    const workflow = this.workflows.get(workflowType);
    if (!workflow) return false;

    const allowedTransitions = workflow.transitions[currentStep] || [];
    return allowedTransitions.includes(targetStep);
  }
}

module.exports = WorkflowEngine;