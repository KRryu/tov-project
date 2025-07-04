import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Formik, Form } from 'formik';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  CircularProgress,
  Fade,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Collapse,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// 비자 폼 컴포넌트 및 유틸리티
import BaseForm from '../../../../components/VisaEvaluation/forms/BaseForm';
import { getVisaForm } from '../../../../components/VisaEvaluation/forms';
import { getValidationSchema } from '../../../../components/VisaEvaluation/validations';
import ResultDisplay from './ResultDisplay';

// API 서비스
import visaService from '../../../../api/services/visaService';
import ProgressTracker from '../../../../components/common/ProgressTracker';

// 폼 단계 정의
const FORM_STEPS = [
  {
    id: 'basic_info',
    label: '기본 정보',
    description: '비자 유형 및 개인정보',
    component: 'BaseForm'
  },
  {
    id: 'detailed_info', 
    label: '상세 정보',
    description: '비자별 맞춤 정보',
    component: 'VisaSpecificForm'
  }
];

/**
 * 비자 자격 평가를 위한 개선된 폼 컨테이너 컴포넌트
 * - 단계별 진행 구조
 * - 모든 필드를 명시적으로 표시
 * - 향상된 UX/UI
 * - E-1, E-2, E-3 비자 고도화 지원
 */
const FormContainer = ({
  initialData = {},
  personalInfo: userPersonalInfo = {},
  onNext,
  evaluationResult: existingResult,
  currentStep: parentCurrentStep,
  steps: parentSteps
}) => {
  const navigate = useNavigate();
  const [visaTypesList, setVisaTypesList] = useState([]);
  const [visaType, setVisaType] = useState(initialData?.visaType || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [evaluationPhase, setEvaluationPhase] = useState('');
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  const formRef = useRef(null);
  const [validationSchema, setValidationSchema] = useState(null);
  const [missingFieldsData, setMissingFieldsData] = useState([]);
  const [showMissingFieldsAlert, setShowMissingFieldsAlert] = useState(false);
  const [applicationId, setApplicationId] = useState(initialData?.applicationId || null);
  const [evaluationResult, setEvaluationResult] = useState(existingResult);
  const [activeTab, setActiveTab] = useState('form');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [documentList, setDocumentList] = useState([]);
  
  // 내부 폼 단계 관리
  const [currentFormStep, setCurrentFormStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set(['basic_info', 'detailed_info']));
  
  const theme = useTheme();

  // 비자 유형 한글 매핑 (E-3 추가)
  const visaTypeKoreanMap = {
    'E-1': 'E-1 (교수)',
    'E-2': 'E-2 (회화지도)',
    'E-3': 'E-3 (연구)',
    'E-4': 'E-4 (기술지도)',
    'E-5': 'E-5 (전문직)',
    'E-7': 'E-7 (특정활동)',
    'F-2': 'F-2 (영주)',
    'F-4': 'F-4 (재외동포)',
    'F-5': 'F-5 (영주)',
    'F-6': 'F-6 (결혼이민)',
    'D-8': 'D-8 (기업투자)',
    'D-9': 'D-9 (무역)',
    'D-10': 'D-10 (구직)'
  };

  // 카테고리 한글 매핑 (E-3 추가)
  const categoryKoreanMap = {
    education: '학력',
    experience: '경력',
    research_experience: '연구 경력',
    language: '언어',
    background: '배경',
    professional_license: '전문 자격',
    research_field: '연구 분야',
    publications: '출판물',
    patents: '특허',
    institution_type: '기관 유형',
    institution_suitability: '기관 적합성',
    international_activity: '국제 활동',
    project_capability: '프로젝트 수행능력',
    position: '직위',
    salary: '연봉',
    contract_period: '계약 기간',
    korean_language: '한국어 능력',
    korean_business_level: '한국어 비즈니스 수준',
    prestigious_university: '명문대 여부',
    topik_level: 'TOPIK 레벨'
  };

  // 초기값 포맷 함수
  const getFormattedInitialValues = () => ({
    visaType: initialData.visaType || visaType || '',
    birthDate: userPersonalInfo.birthDate
      ? new Date(userPersonalInfo.birthDate).toISOString().split('T')[0]
      : '',
    fullName: userPersonalInfo.name || '',
    email: userPersonalInfo.email || '',
    phone: userPersonalInfo.phone || '',
    nationality: userPersonalInfo.nationality || '',
    currentCity: userPersonalInfo.city || initialData.currentCity || 'seoul',
    educationLevel: initialData.educationLevel || '',
    koreanBusinessLevel: initialData.koreanBusinessLevel || false,
    ...initialData
  });

  // 비자 유형 목록 가져오기
  const loadVisaTypes = async () => {
    try {
      setIsLoading(true);
      const types = await visaService.getSupportedVisaTypes();
      setVisaTypesList(types);
    } catch (err) {
      console.error('비자 유형 목록 로딩 중 오류:', err);
      toast.error('비자 유형 목록을 불러오는데 실패했습니다.');
      setError('비자 유형 목록을 불러오는데 실패했습니다. 새로고침 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    loadVisaTypes();
    if (initialData.visaType) {
      setVisaType(initialData.visaType);
    }
  }, []);

  // initialData 변경 시 업데이트
  useEffect(() => {
    const newVisaType = initialData.visaType;
    if (newVisaType && newVisaType !== visaType) {
      setVisaType(newVisaType);
    }
  }, [initialData]);

  // 비자 유형 변경 시 유효성 검사 스키마 설정
  useEffect(() => {
    if (visaType) {
      try {
        const normalizedType = visaType.replace(/-/g, '');
        const schema = getValidationSchema(normalizedType);
        setValidationSchema(schema);
        setError(null);
        if (formRef.current && formRef.current.setFieldValue) {
          formRef.current.setFieldValue('visaType', visaType);
          setTimeout(() => {
            if (formRef.current) {
              formRef.current.validateForm();
            }
          }, 300);
        }
      } catch (err) {
        console.error('유효성 검사 스키마 설정 오류:', err);
        setError('유효성 검사 스키마를 설정하는 중 오류가 발생했습니다.');
      }
    } else {
      setValidationSchema(getValidationSchema('base'));
    }
  }, [visaType]);

  // 단계 완료 상태 확인 (메모화)
  const checkStepCompletion = useCallback((stepId, values) => {
    switch (stepId) {
      case 'basic_info':
        return !!(values.visaType && values.fullName && values.email && 
                 values.phone && values.nationality && values.birthDate && values.currentCity);
      case 'detailed_info':
        if (visaType === 'E-1') {
          return !!(values.educationLevel && values.position && values.institutionType && 
                   values.institution && values.researchField);
        }
        if (visaType === 'E-2') {
          return !!(values.educationLevel && values.language && values.citizenship && 
                   values.institutionType);
        }
        if (visaType === 'E-3') {
          return !!(values.educationLevel && values.researchExperienceYears && 
                   values.researchField && values.institutionType);
        }
        if (visaType === 'E-4') {
          return !!(values.educationLevel && values.experienceYears && 
                   values.technologyField && values.contractPeriod && 
                   values.contractValue && values.serviceType && 
                   values.organizationType);
        }
        return true;
      default:
        return false;
    }
  }, [visaType]);



  // E-5 비자 필드 검증 함수
  const validateE5Fields = (values) => {
    const errors = {};
    if (values.prestigiousUniversity === undefined) {
      errors.prestigiousUniversity = '명문대 여부를 선택해주세요.';
    }
    if (values.koreanBusinessLevel === undefined) {
      errors.koreanBusinessLevel = '한국어 비즈니스 수준을 선택해주세요.';
    }
    if (!values.topikLevel) {
      errors.topikLevel = 'TOPIK 레벨을 선택해주세요.';
    }
    return errors;
  };

  // E-1 비자 필수 필드 검증 함수
  const validateE1Fields = (values) => {
    const errors = {};
    const warnings = [];

    const requiredFields = [
      'educationLevel',
      'experienceYears',
      'publications',
      'institutionType',
      'institution',
      'position',
      'researchField',
      'salary',
      'contractPeriod'
    ];
    const enhancedFields = [
      'internationalPublications',
      'hasInstitutionRecommendation',
      'experienceTypes',
      'institutionRanking',
      'hasPresidentRecommendation',
      'hasTeachingCertificate'
    ];

    // 필수 필드 검증
    const missingRequired = requiredFields.filter(
      (field) => !values[field] || values[field] === ''
    );
    if (missingRequired.length > 0) {
      console.warn('⚠️ E1 필수 필드 누락:', missingRequired);
      return {
        isValid: false,
        missingFields: missingRequired,
        message: '필수 정보를 모두 입력해주세요.'
      };
    }

    // 고도화 필드 체크
    const missingEnhanced = enhancedFields.filter((field) => {
      if (field === 'experienceTypes') {
        return !values[field] || values[field].length === 0;
      }
      return values[field] === undefined || values[field] === null;
    });
    if (missingEnhanced.length > 0) {
      warnings.push({
        type: 'enhancement',
        message: 'E1 비자 고도화 평가를 위해 추가 정보 입력을 권장합니다.',
        fields: missingEnhanced
      });
    }

    // 논리적 검증
    if (values.internationalPublications > values.publications) {
      errors.internationalPublications =
        '국제 논문 수는 전체 논문 수를 초과할 수 없습니다.';
    }

    // 기관 유형 검증
    const educationalInstitutions = [
      'university',
      'college',
      'graduate_school',
      'industrial_university',
      'education_university',
      'cyber_university',
      'technical_college'
    ];
    if (!educationalInstitutions.includes(values.institutionType)) {
      warnings.push({
        type: 'institution',
        message: 'E-1 비자는 고등교육법에 의한 교육기관만 대상입니다.',
        recommendation:
          values.institutionType === 'research_institute'
            ? 'E-3(연구) 비자'
            : values.institutionType === 'company'
            ? 'E-7(특정활동) 비자'
            : null
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      hasEnhancedData: missingEnhanced.length === 0
    };
  };

  // E-3 비자 필수 필드 검증 함수 (새로 추가)
  const validateE3Fields = (values) => {
    const errors = {};
    const warnings = [];

    const requiredFields = [
      'educationLevel',
      'researchExperienceYears',
      'researchField',
      'institutionType',
      'position',
      'salary',
      'contractPeriod'
    ];
    
    const enhancedFields = [
      'publications',
      'internationalActivities', 
      'projects',
      'patents',
      'experienceTypes',
      'previousVisaTypes',
      'hasAccreditation',
      'institutionRanking',
      'topikLevel',
      'canCommunicate'
    ];

    // 필수 필드 검증
    const missingRequired = requiredFields.filter(
      (field) => !values[field] || values[field] === ''
    );
    if (missingRequired.length > 0) {
      console.warn('⚠️ E3 필수 필드 누락:', missingRequired);
      return {
        isValid: false,
        missingFields: missingRequired,
        message: '필수 정보를 모두 입력해주세요.'
      };
    }

    // 고도화 필드 체크
    const missingEnhanced = enhancedFields.filter((field) => {
      if (['experienceTypes', 'previousVisaTypes', 'publications', 'internationalActivities', 'projects'].includes(field)) {
        return !values[field] || (Array.isArray(values[field]) && values[field].length === 0);
      }
      return values[field] === undefined || values[field] === null;
    });
    
    if (missingEnhanced.length > 0) {
      warnings.push({
        type: 'enhancement',
        message: 'E3 비자 고도화 평가를 위해 추가 정보 입력을 권장합니다.',
        fields: missingEnhanced
      });
    }

    // 학력 검증 - 연구직은 최소 학사 필요
    if (['unknown', 'high_school', 'associate'].includes(values.educationLevel)) {
      errors.educationLevel = 'E-3 비자는 최소 학사 학위가 필요합니다.';
    }

    // 연구기관 적합성 검증
    const researchInstitutions = [
      'government_research',
      'public_research', 
      'university_research',
      'corporate_research',
      'nonprofit_research'
    ];
    if (!researchInstitutions.includes(values.institutionType)) {
      warnings.push({
        type: 'institution',
        message: 'E-3 비자는 연구기관에서만 신청 가능합니다.',
        recommendation: 'E-1(교수) 또는 E-7(특정활동) 비자 검토'
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      hasEnhancedData: missingEnhanced.length === 0
    };
  };

  // E-4 비자 필수 필드 검증 함수 수정
  const validateE4Fields = (values) => {
    const errors = {};
    const warnings = [];

    const requiredFields = [
      'educationLevel',
      'experienceYears',
      'expertiseLevel',
      'koreanCompanyNeed',
      'technologyField',
      'contractPeriod',
      'contractValue',
      'serviceType',
      'organizationType'
    ];
    
    const enhancedFields = [
      'relevantExperience',
      'internationalExperience',
      'hasCertifications',
      'hasPatents',
      'hasGoldCard',
      'hasGovernmentApproval',
      'isNationalProject'
    ];

    // 필수 필드 검증
    const missingRequired = requiredFields.filter(
      (field) => !values[field] || values[field] === ''
    );
    if (missingRequired.length > 0) {
      console.warn('⚠️ E4 필수 필드 누락:', missingRequired);
      return {
        isValid: false,
        missingFields: missingRequired,
        message: '필수 정보를 모두 입력해주세요.'
      };
    }

    // 고도화 필드 체크
    const missingEnhanced = enhancedFields.filter((field) => {
      return values[field] === undefined || values[field] === null;
    });
    if (missingEnhanced.length > 0) {
      warnings.push({
        type: 'enhancement',
        message: 'E4 비자 고도화 평가를 위해 추가 정보 입력을 권장합니다.',
        fields: missingEnhanced
      });
    }

    // 경력 검증 - E-4는 최소 5년 필요
    if (values.experienceYears < 5) {
      errors.experienceYears = 'E-4 비자는 최소 5년의 경력이 필요합니다.';
    }

    // 관련 경력이 총 경력을 초과하는지 검증
    if (values.relevantExperience > values.experienceYears) {
      errors.relevantExperience = '관련 경력은 총 경력을 초과할 수 없습니다.';
    }

    // GOLD CARD 자격 확인
    const goldCardEligibleFields = ['semiconductor', 'battery', 'advanced_manufacturing', 'it_software'];
    if (goldCardEligibleFields.includes(values.technologyField) && !values.hasGoldCard) {
      warnings.push({
        type: 'goldcard',
        message: 'GOLD CARD 발급 대상 기술 분야입니다. GOLD CARD 신청을 고려하세요.',
        recommendation: 'GOLD CARD 발급 시 비자 절차가 간소화됩니다.'
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      hasEnhancedData: missingEnhanced.length === 0
    };
  };

  // 평가 진행 상태 표시 함수
  const showEvaluationProgress = async () => {
    const hasSeenFullAnimation =
      localStorage.getItem('tovmate_seen_evaluation_animation') === 'true';
    const phases = hasSeenFullAnimation
      ? [{ text: 'AI 분석 진행 중...', duration: 1200 }]
      : [
          { text: '비자 요건 분석 중...', duration: 600 },
          { text: '결과 생성 중...', duration: 600 }
        ];
    let progressStart = hasSeenFullAnimation ? 30 : 0;

    for (let i = 0; i < phases.length; i++) {
      setEvaluationPhase(phases[i].text);
      const startProgress = progressStart;
      const endProgress = hasSeenFullAnimation
        ? 100
        : i === phases.length - 1
        ? 100
        : progressStart + (100 - progressStart) / phases.length;
      progressStart = endProgress;

      const steps = endProgress - startProgress;
      const stepTime = phases[i].duration / steps;
      for (let progress = startProgress; progress <= endProgress; progress++) {
        setEvaluationProgress(progress);
        await new Promise((resolve) => setTimeout(resolve, stepTime));
      }
    }
    localStorage.setItem('tovmate_seen_evaluation_animation', 'true');
  };

  // 비자 유형 변경 핸들러
  const handleVisaTypeChange = (e) => {
    try {
      if (!e || typeof e !== 'object') {
        console.error('이벤트 객체가 유효하지 않습니다:', e);
        return;
      }
      let selectedValue;
      if (e.target && e.target.value) {
        selectedValue = e.target.value;
      } else if (e.rawCode) {
        selectedValue = e.rawCode;
      } else {
        console.warn('비자 유형 선택 값을 찾을 수 없습니다.');
        return;
      }

      console.log('[FormContainer] 비자 유형 변경 감지:', selectedValue);
      if (!selectedValue) {
        setVisaType('');
        return;
      }

      setIsLoading(true);
      setVisaType(selectedValue);

      if (evaluationResult) {
        setEvaluationResult(null);
        setShowResult(false);
      }

      setTimeout(() => {
        setIsLoading(false);
      }, 300);

      if (formRef.current && formRef.current.setFieldValue) {
        console.log('[FormContainer] visaType 업데이트:', selectedValue);
        formRef.current.setFieldValue('visaType', selectedValue);
        setTimeout(() => {
          if (formRef.current.values) {
            console.log(
              '[FormContainer] 업데이트 후 폼 값 visaType:',
              formRef.current.values.visaType
            );
          }
        }, 200);
        setTimeout(() => {
          if (formRef.current && formRef.current.validateForm) {
            formRef.current.validateForm();
          }
        }, 500);
      }
    } catch (err) {
      console.error('비자 유형 변경 처리 중 오류:', err);
      setIsLoading(false);
    }
  };

  // 섹션 펼치기/접기 토글
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return newExpanded;
    });
  };

  // 자동 스크롤 제거 - 사용자가 직접 섹션을 선택하도록 함
  // useEffect(() => {
  //   const stepId = FORM_STEPS[currentFormStep]?.id;
  //   if (stepId) {
  //     const el = document.getElementById(`form-step-${stepId}`);
  //     if (el) {
  //       el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //     }
  //   }
  // }, [currentFormStep]);

  // 계속 진행 핸들러
  const handleContinue = () => {
    // 자동 스크롤 제거
    // window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const nextData = {
        visaInfo: {
          ...(formRef.current?.values || {}),
          visaType: formRef.current?.values?.visaType || visaType
        },
        evaluationResult,
        visaType,
        applicationId: applicationId,
        currentStep: 3,
        forceStep: 3
      };

      if (!nextData.applicationId && evaluationResult) {
        nextData.applicationId = `temp_${Date.now()}`;
      }

      if (typeof onNext === 'function') {
        onNext(nextData);
        toast.success('다음 단계로 이동합니다.', {
          position: 'top-center',
          autoClose: 2000
        });
      } else {
        const appId = nextData.applicationId;
        if (appId) {
          toast.info(`비자 신청서 페이지로 이동합니다. (ID: ${appId.substring(0, 8)}...)`);
          setTimeout(() => {
            navigate(`/services/visa/applications/${appId}`);
          }, 1000);
        } else {
          console.warn('applicationId가 없어 visaInfo를 임시 저장합니다.');
          localStorage.setItem('temp_visa_info', JSON.stringify(nextData.visaInfo));
          toast.info('임시 저장된 정보로 계속 진행합니다.');
          setTimeout(() => {
            navigate('/services/visa/applications/new');
          }, 1000);
        }
      }
    } catch (err) {
      console.error('[handleContinue] 오류:', err);
      toast.error('다음 단계로 이동 중 오류가 발생했습니다.');
    }
  };

  // 평가 결과 처리 로직
  const processFormSubmission = async (dataToSubmit) => {
    try {
      console.log('🚀 폼 제출 함수 호출 시작');
      setIsSubmitting(true);
      setError(null);

      // 평가 진행 화면 표시
      setIsEvaluating(true);
      await showEvaluationProgress();

      const result = await visaService.evaluateVisa(dataToSubmit);
      console.log('✅ API 응답 결과:', result);

      // E1 비자 고도화 결과 확인 로그
      if (result.visaType === 'E-1' || result.visaType === 'E1') {
        console.log('📊 E1 고도화 평가 결과:', {
          승인예측: result.approvalPrediction,
          로드맵: result.roadmap ? Object.keys(result.roadmap) : null,
          기관적합성: result.details?.institutionSuitability,
          직급자격: result.details?.qualificationDetails,
          평가버전: result.evaluationVersion || '1.0'
        });
        if (result.approvalPrediction) {
          toast.success('E1 비자 고도화 평가가 완료되었습니다!', {
            position: 'top-center',
            autoClose: 3000
          });
        }
      }

      // E2 비자 고도화 결과 확인 로그
      if (result.visaType === 'E-2' || result.visaType === 'E2') {
        console.log('📊 E2 고도화 평가 결과:', {
          승인예측: result.approvalPrediction,
          로드맵: result.roadmap ? Object.keys(result.roadmap) : null,
          언어매칭: result.details?.languageMatch,
          신원조회: result.details?.backgroundCheckStatus,
          평가버전: result.evaluationVersion || '1.0'
        });
        if (result.approvalPrediction) {
          toast.success('E2 비자 고도화 평가가 완료되었습니다!', {
            position: 'top-center',
            autoClose: 3000
          });
        }
      }

      // E3 비자 고도화 결과 확인 로그 (새로 추가)
      if (result.visaType === 'E-3' || result.visaType === 'E3') {
        console.log('📊 E3 고도화 평가 결과:', {
          승인예측: result.approvalPrediction,
          로드맵: result.roadmap ? Object.keys(result.roadmap) : null,
          연구분야: result.details?.researchField,
          기관적합성: result.details?.institutionSuitability,
          연구실적: result.details?.publicationCount,
          프로젝트수행능력: result.details?.projectCount,
          평가버전: result.evaluationVersion || '2.0'
        });
        if (result.approvalPrediction) {
          toast.success('E3 비자 고도화 평가가 완료되었습니다!', {
            position: 'top-center',
            autoClose: 3000
          });
        }
      }

      // E4 비자 고도화 결과 확인 로그 (새로 추가)
      if (result.visaType === 'E-4' || result.visaType === 'E4') {
        console.log('📊 E4 고도화 평가 결과:', {
          승인예측: result.approvalPrediction,
          로드맵: result.roadmap ? Object.keys(result.roadmap) : null,
          학력수준: result.details?.educationLevel,
          경력연수: result.details?.experienceYears,
          기술분야: result.details?.technologyField,
          계약기간: result.details?.contractPeriod,
          계약금액: result.details?.contractValue,
          서비스유형: result.details?.serviceType,
          초청기관유형: result.details?.organizationType,
          관련경력: result.details?.relevantExperience,
          국제경력: result.details?.internationalExperience,
          자격증발급: result.details?.hasCertifications,
          특허등록: result.details?.hasPatents,
          골드카드: result.details?.hasGoldCard,
          정부승인: result.details?.hasGovernmentApproval,
          국가프로젝트: result.details?.isNationalProject,
          평가버전: result.evaluationVersion || '3.0'
        });
        if (result.approvalPrediction) {
          toast.success('E4 비자 고도화 평가가 완료되었습니다!', {
            position: 'top-center',
            autoClose: 3000
          });
        }
      }

      // 결과 구조 검증
      const keysToCheck = [
        'visaType',
        'totalScore',
        'categoryScores',
        'weightedScores',
        'categoryInfo'
      ];
      keysToCheck.forEach((key) => {
        if (!result[key] && key !== 'totalScore') {
          console.warn(`결과에 ${key} 필드가 없습니다.`);
        } else {
          console.log(`✓ ${key} 필드 확인:`, result[key]);
        }
      });
      if (!result.categoryInfo) {
        console.error('⚠️ categoryInfo가 API 응답에 포함되지 않았습니다!');
      }

      result.inputData = dataToSubmit;
      setEvaluationPhase('데이터 분석 완료! 결과 보고서 준비 중...');
      setTimeout(() => {
        setEvaluationResult(result);
        if (result.applicationId) {
          console.log('📝 applicationId 설정:', result.applicationId);
          setApplicationId(result.applicationId);
        } else {
          console.warn('⚠️ API 응답에 applicationId가 없습니다. 임시 ID 생성...');
          setApplicationId(`temp_${Date.now()}`);
        }
        setIsEvaluating(false);
        setShowResult(true);
        setActiveTab('result');

        const totalScore = result.totalScore || result.overallScore || 0;
        const passThreshold = result.passThreshold || 80;
        if (totalScore >= passThreshold) {
          setFeedbackMessage('평가 결과, 비자 신청 자격 요건을 충족했습니다.');
        } else if (totalScore < 50) {
          setFeedbackMessage('평가 결과, 비자 신청 자격 요건이 부족합니다. 보완이 필요합니다.');
        } else {
          setFeedbackMessage('평가 결과, 비자 신청을 위해 일부 서류 보완이 필요합니다.');
        }

        toast.success('비자 평가가 완료되었습니다.');
        setIsSubmitting(false);
      }, localStorage.getItem('tovmate_seen_evaluation_animation') === 'true' ? 800 : 1800);
    } catch (apiError) {
      console.error('❌ API 호출 중 오류 발생:', apiError);

      const errorMessageFromAPI =
        apiError.response?.data?.error ||
        apiError.response?.data?.message ||
        apiError.message ||
        '알 수 없는 오류';

      const isValidationError =
        errorMessageFromAPI.includes('필수 정보') ||
        errorMessageFromAPI.includes('required') ||
        errorMessageFromAPI.includes('currentVisaStatus');

      if (isValidationError) {
        let detailedMessage = errorMessageFromAPI;
        if (
          errorMessageFromAPI.includes('currentVisaStatus') ||
          errorMessageFromAPI.includes('현재 비자 상태')
        ) {
          detailedMessage = '체류 자격 변경/연장 시 현재 비자 상태 정보가 필요합니다.';
          const currentVisaStatusField = document.querySelector(
            '[name="currentVisaStatus"]'
          );
        }
        setError(detailedMessage);
        toast.error(detailedMessage);
      } else {
        setError(`API 호출 오류: ${errorMessageFromAPI}`);
        toast.error(`평가 중 오류가 발생했습니다: ${errorMessageFromAPI}`);
      }

      setIsEvaluating(false);
      setIsSubmitting(false);
    }
  };

  // 평가 진행 화면 컴포넌트
  const EvaluationProgress = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(5px)'
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          position: 'relative',
          width: 280,
          bgcolor: '#222222',
          py: 3.5,
          px: 4,
          borderRadius: 2,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontWeight: 500,
            mb: 3,
            fontSize: '1.1rem'
          }}
        >
          TOVmate AI 분석
        </Typography>

        <Box
          sx={{
            position: 'relative',
            width: 120,
            height: 120,
            mx: 'auto',
            mb: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <CircularProgress
            size={120}
            thickness={5}
            variant="determinate"
            value={100}
            sx={{
              color: '#444444',
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginTop: -7.5,
              marginLeft: -7.5,
              transform: 'translate(-50%, -50%)'
            }}
          />
          <CircularProgress
            size={120}
            thickness={5}
            variant="determinate"
            value={evaluationProgress}
            sx={{
              color: '#2196f3',
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginTop: -7.5,
              marginLeft: -7.5,
              transform: 'translate(-50%, -50%)'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 500,
                fontSize: '1.8rem'
              }}
            >
              {`${Math.round(evaluationProgress)}%`}
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400,
            mb: 2
          }}
        >
          분석 진행 중...
        </Typography>
        <Box sx={{ width: '100%' }}>
          <Box
            sx={{
              height: 4,
              width: '100%',
              borderRadius: 2,
              backgroundColor: '#444444',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${evaluationProgress}%`,
                borderRadius: 2,
                position: 'absolute',
                left: 0,
                top: 0,
                backgroundColor: '#2196f3',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Box>
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255,255,255,0.5)',
          mt: 2,
          fontSize: '0.65rem'
        }}
      >
        © TOVmate 비자 평가 시스템
      </Typography>
    </Box>
  );

  // 단계별 폼 렌더링 함수
  const renderStepContent = (stepIndex, values) => {
    const step = FORM_STEPS[stepIndex];
    const isExpanded = expandedSections.has(step.id);
    const isCompleted = completedSteps.has(step.id);
    
    return (
      <Paper
        id={`form-step-${step.id}`}
        key={step.id}
        elevation={isExpanded ? 2 : 0}
        sx={{
          mb: 2,
          border: `2px solid ${isCompleted ? theme.palette.success.main : 
                               isExpanded ? theme.palette.primary.main : 
                               theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* 단계 헤더 */}
        <Box
          sx={{
            p: 3,
            bgcolor: isCompleted ? alpha(theme.palette.success.main, 0.05) : 
                     isExpanded ? alpha(theme.palette.primary.main, 0.05) : 
                     'background.default',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onClick={() => toggleSection(step.id)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: isCompleted ? 'success.main' : 
                         isExpanded ? 'primary.main' : 'grey.300',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {stepIndex + 1}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {step.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isCompleted && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                완료됨
              </Typography>
            )}
            <IconButton>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* 단계 컨텐츠 */}
        <Collapse in={isExpanded}>
          <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
            {step.component === 'BaseForm' && formRef.current && (
              <BaseForm
                values={values || {}}
                errors={formRef.current.errors || {}}
                touched={formRef.current.touched || {}}
                handleChange={formRef.current.handleChange}
                handleBlur={formRef.current.handleBlur}
                visaType={visaType}
                onVisaTypeChange={handleVisaTypeChange}
                visaTypes={visaTypesList}
                categoryKoreanMap={categoryKoreanMap}
                visaTypeKoreanMap={visaTypeKoreanMap}
              />
            )}
            
            {step.component === 'BaseForm' && !formRef.current && (
              <Alert severity="warning">
                폼이 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.
              </Alert>
            )}
            
            {step.component === 'VisaSpecificForm' && visaType && (() => {
              const DynamicForm = getVisaForm(visaType);
              if (!DynamicForm) {
                return (
                  <Alert severity="info">
                    {visaType} 비자에 대한 상세 정보 입력 양식을 준비 중입니다.
                  </Alert>
                );
              }
              
              if (!formRef.current) {
                return (
                  <Alert severity="warning">
                    폼이 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.
                  </Alert>
                );
              }
              
              return (
                <DynamicForm
                  key={visaType}
                  values={values || {}}
                  errors={formRef.current.errors || {}}
                  touched={formRef.current.touched || {}}
                  handleChange={formRef.current.handleChange}
                  handleBlur={formRef.current.handleBlur}
                  setFieldValue={formRef.current.setFieldValue}
                  categoryKoreanMap={categoryKoreanMap}
                />
              );
            })()}
          </Box>
        </Collapse>
      </Paper>
    );
  };

  // 결과 표시 시 자동 스크롤 제거
  // useEffect(() => {
  //   if (showResult) {
  //     window.scrollTo({ top: 0, behavior: 'smooth' });
  //   }
  // }, [showResult]);

  return (
    <Box sx={{ position: 'relative' }}>
      {isEvaluating && <EvaluationProgress />}

      {/* 로딩 인디케이터 */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 999,
            backdropFilter: 'blur(3px)'
          }}
        >
          <CircularProgress size={50} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            데이터를 불러오는 중입니다...
          </Typography>
        </Box>
      )}

      {/* 단계 표시 (상위 컴포넌트에서 전달된 경우) */}
      {parentSteps && !showResult && (
        <Box sx={{ mb: 4 }}>
          <ProgressTracker
            key={`progress-tracker-${parentCurrentStep || 1}`}
            steps={parentSteps}
            currentStep={parentCurrentStep || 1}
            sx={{
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              p: { xs: 2, md: 3 }
            }}
          />
        </Box>
      )}

      {/* 평가 결과 표시 */}
      {showResult ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            duration: 0.7
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Zoom in={true} timeout={800}>
                <Alert
                  severity="success"
                  variant="filled"
                  sx={{
                    mb: 2,
                    fontWeight: 'bold',
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem'
                    }
                  }}
                >
                  비자 자격 평가가 완료되었습니다!
                </Alert>
              </Zoom>
            </Box>

            <Fade in={true} timeout={1000}>
              <Box>
                <ResultDisplay
                  result={evaluationResult}
                  visaType={visaType}
                  visaInfo={formRef.current?.values}
                  isPreview={false}
                  onContinue={handleContinue}
                  steps={parentSteps}
                  currentStep={parentCurrentStep}
                />
              </Box>
            </Fade>
          </Box>
        </motion.div>
      ) : (
        <>
          <Formik
            enableReinitialize
            innerRef={formRef}
            initialValues={getFormattedInitialValues()}
            validationSchema={validationSchema}
          >
            {(formikProps) => {
              // 현재 완료된 단계들을 즉시 계산
              const currentCompletedSteps = new Set();
              if (formikProps.values) {
                FORM_STEPS.forEach(step => {
                  if (checkStepCompletion(step.id, formikProps.values)) {
                    currentCompletedSteps.add(step.id);
                  }
                });
              }
              
              // 완료 상태가 변경되었으면 업데이트 (한 번만 실행)
              const completedArray = Array.from(currentCompletedSteps).sort();
              const prevCompletedArray = Array.from(completedSteps).sort();
              if (JSON.stringify(completedArray) !== JSON.stringify(prevCompletedArray)) {
                setTimeout(() => setCompletedSteps(currentCompletedSteps), 0);
              }

              return (
                <Form>
                  {/* 전체 진행률 표시 */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: 4,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.08)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold" color="primary.dark" gutterBottom>
                      비자 자격 평가
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      단계별로 정보를 입력하여 정확한 비자 평가를 받아보세요
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        전체 진행률
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round((completedSteps.size / FORM_STEPS.length) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(completedSteps.size / FORM_STEPS.length) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.grey[300], 0.3),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`
                        }
                      }}
                    />
                  </Paper>

                  {/* 단계별 폼 섹션 */}
                  <Box sx={{ mb: 4 }}>
                    {FORM_STEPS.map((step, index) => 
                      renderStepContent(index, formikProps.values || {})
                    )}
                  </Box>

                  {/* 필수 항목 누락 경고 Alert */}
                  {showMissingFieldsAlert && (
                    <Box sx={{ my: 2 }}>
                      <Alert severity="warning">
                        필수 정보를 모두 입력해주세요.
                      </Alert>
                    </Box>
                  )}

                  {/* 평가 버튼 */}
                  <Box
                    sx={{
                      mt: 4,
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2
                    }}
                  >
                    <Button
                      type="button"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={isEvaluating || isSubmitting || completedSteps.size < 2}
                      startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        fontSize: '1.1rem'
                      }}
                      onClick={async () => {
                        try {
                          // formRef 확인
                          if (!formRef.current) {
                            console.error('❌ formRef가 없습니다');
                            toast.error('폼 데이터를 찾을 수 없습니다. 페이지를 새로고침해보세요.');
                            return;
                          }

                          // 최신 폼 값 가져오기
                          const currentValues = { ...formRef.current.values };
                          console.log('📄 현재 폼 값:', currentValues);

                          // 비자 유형 확인 및 설정
                          if (!currentValues.visaType && visaType) {
                            console.log(`📝 폼에 비자 유형 설정: ${visaType}`);
                            formRef.current.setFieldValue('visaType', visaType);
                            currentValues.visaType = visaType;
                          } else if (currentValues.visaType !== visaType && visaType) {
                            console.log(
                              `📝 폼의 비자 유형 동기화: ${currentValues.visaType} → ${visaType}`
                            );
                            formRef.current.setFieldValue('visaType', visaType);
                            currentValues.visaType = visaType;
                          }

                          // E1 비자인 경우 고도화 필드 검증
                          const isE1Visa = visaType === 'E-1' || visaType === 'E1';
                          if (isE1Visa) {
                            console.log('📋 E1 비자 고도화 필드 확인 중...');
                            const validation = validateE1Fields(currentValues);

                            if (!validation.isValid) {
                              if (validation.missingFields) {
                                const fieldNameMap = {
                                  educationLevel: '학력 수준',
                                  experienceYears: '경력 연수',
                                  publications: '논문/출판물 수',
                                  institutionType: '기관 유형',
                                  institution: '교육기관명',
                                  position: '직위',
                                  researchField: '연구 분야',
                                  salary: '연봉',
                                  contractPeriod: '계약 기간'
                                };
                                const missingFieldNames = validation.missingFields.map(
                                  (field) => fieldNameMap[field] || field
                                );
                                toast.warning(`필수 정보를 입력해주세요: ${missingFieldNames.join(', ')}`);
                                
                                // 상세 정보 섹션은 이미 항상 열려있음
                                
                                const firstMissingField = document.querySelector(
                                  `[name="${validation.missingFields[0]}"]`
                                );
                                if (firstMissingField) {
                                  // firstMissingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  setTimeout(() => firstMissingField.focus(), 500);
                                }
                                return;
                              }
                              if (validation.errors) {
                                const firstError = Object.keys(validation.errors)[0];
                                toast.error(validation.errors[firstError]);
                                return;
                              }
                            }
                            if (validation.hasEnhancedData) {
                              console.log('✅ E1 고도화 필드 모두 입력됨');
                              currentValues._hasEnhancedData = true;
                            } else if (validation.warnings && validation.warnings.length > 0) {
                              console.log('⚠️ E1 고도화 필드 일부 누락:', validation.warnings);
                              toast.info('더 정확한 평가를 위해 추가 정보 입력을 권장합니다.', {
                                autoClose: 5000
                              });
                            }
                          }

                          // E3 비자인 경우 고도화 필드 검증 (새로 추가)
                          const isE3Visa = visaType === 'E-3' || visaType === 'E3';
                          if (isE3Visa) {
                            console.log('📋 E3 비자 고도화 필드 확인 중...');
                            const validation = validateE3Fields(currentValues);

                            if (!validation.isValid) {
                              if (validation.missingFields) {
                                const fieldNameMap = {
                                  educationLevel: '학력 수준',
                                  researchExperienceYears: '연구 경력 연수',
                                  researchField: '연구 분야',
                                  institutionType: '기관 유형',
                                  position: '직위',
                                  salary: '연봉',
                                  contractPeriod: '계약 기간'
                                };
                                const missingFieldNames = validation.missingFields.map(
                                  (field) => fieldNameMap[field] || field
                                );
                                toast.warning(`필수 정보를 입력해주세요: ${missingFieldNames.join(', ')}`);
                                
                                // 상세 정보 섹션은 이미 항상 열려있음
                                
                                const firstMissingField = document.querySelector(
                                  `[name="${validation.missingFields[0]}"]`
                                );
                                if (firstMissingField) {
                                  // firstMissingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  setTimeout(() => firstMissingField.focus(), 500);
                                }
                                return;
                              }
                              if (validation.errors) {
                                const firstError = Object.keys(validation.errors)[0];
                                toast.error(validation.errors[firstError]);
                                return;
                              }
                            }
                            if (validation.hasEnhancedData) {
                              console.log('✅ E3 고도화 필드 모두 입력됨');
                              currentValues._hasEnhancedData = true;
                            } else if (validation.warnings && validation.warnings.length > 0) {
                              console.log('⚠️ E3 고도화 필드 일부 누락:', validation.warnings);
                              toast.info('더 정확한 평가를 위해 추가 정보 입력을 권장합니다.', {
                                autoClose: 5000
                              });
                            }
                          }

                          // E4 비자인 경우 고도화 필드 검증 (새로 추가)
                          const isE4Visa = visaType === 'E-4' || visaType === 'E4';
                          if (isE4Visa) {
                            console.log('📋 E4 비자 고도화 필드 확인 중...');
                            const validation = validateE4Fields(currentValues);

                            if (!validation.isValid) {
                              if (validation.missingFields) {
                                const fieldNameMap = {
                                  educationLevel: '학력 수준',
                                  experienceYears: '경력 연수',
                                  technologyField: '기술 분야',
                                  contractPeriod: '계약 기간',
                                  contractValue: '계약 금액',
                                  serviceType: '서비스 유형',
                                  organizationType: '초청기관 유형'
                                };
                                const missingFieldNames = validation.missingFields.map(
                                  (field) => fieldNameMap[field] || field
                                );
                                toast.warning(`필수 정보를 입력해주세요: ${missingFieldNames.join(', ')}`);
                                
                                // 상세 정보 섹션은 이미 항상 열려있음
                                
                                const firstMissingField = document.querySelector(
                                  `[name="${validation.missingFields[0]}"]`
                                );
                                if (firstMissingField) {
                                  // firstMissingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  setTimeout(() => firstMissingField.focus(), 500);
                                }
                                return;
                              }
                              if (validation.errors) {
                                const firstError = Object.keys(validation.errors)[0];
                                toast.error(validation.errors[firstError]);
                                return;
                              }
                            }
                            if (validation.hasEnhancedData) {
                              console.log('✅ E4 고도화 필드 모두 입력됨');
                              currentValues._hasEnhancedData = true;
                            } else if (validation.warnings && validation.warnings.length > 0) {
                              console.log('⚠️ E4 고도화 필드 일부 누락:', validation.warnings);
                              toast.info('더 정확한 평가를 위해 추가 정보 입력을 권장합니다.', {
                                autoClose: 5000
                              });
                            }
                          }

                          // Formik 유효성 검사
                          const errors = await formRef.current.validateForm();
                          const hasErrors = Object.keys(errors).length > 0;
                          if (hasErrors) {
                            console.warn('❌ 폼 유효성 검사 실패:', errors);
                            toast.warning('필수 정보를 모두 입력해주세요.');
                            // 자동 스크롤 제거 - 사용자가 직접 필드를 찾도록 함
                            return;
                          }

                          // 제출 데이터 구성
                          const dataToSubmit = {
                            ...currentValues,
                            visaType: visaType
                          };
                          console.log('🔸 최종 제출 데이터:', dataToSubmit);

                          // API 호출
                          await processFormSubmission(dataToSubmit);
                        } catch (err) {
                          console.error('❌ 버튼 클릭 처리 오류:', err);
                          toast.error('양식 제출 중 오류가 발생했습니다');
                          setIsEvaluating(false);
                          setIsSubmitting(false);
                        }
                      }}
                    >
                      {isSubmitting ? '평가 중...' : '평가하기'}
                    </Button>
                    
                    {completedSteps.size < 2 && (
                      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 2 }}>
                        기본 정보와 상세 정보를 모두 입력해주세요
                      </Typography>
                                        )}
                  </Box>
                </Form>
              );
            }}
          </Formik>
        </>
      )}

      {/* 에러 메시지 Dialog */}
      <Dialog
        open={showError}
        onClose={() => setShowError(false)}
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-description"
      >
        <DialogTitle id="error-dialog-title">오류 발생</DialogTitle>
        <DialogContent>
          <DialogContentText id="error-dialog-description">
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowError(false)} color="primary">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormContainer;