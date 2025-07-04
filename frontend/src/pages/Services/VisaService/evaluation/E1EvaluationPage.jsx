import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  LinearProgress
} from '@mui/material';
import {
  School,
  Business,
  Work,
  AttachMoney,
  Star,
  Speed,
  Psychology,
  Compare,
  Save,
  Send,
  Refresh,
  Info,
  TrendingUp,
  Assignment
} from '@mui/icons-material';

// Redux actions 및 selectors
import {
  evaluateVisa,
  evaluateVisaSmart,
  quickEvaluate,
  clearCurrentEvaluation,
  clearQuickEvaluation,
  setSelectedVisaType,
  setEvaluationStep,
  selectCurrentEvaluation,
  selectQuickEvaluation,
  selectSupportedTypes,
  selectUIState,
  selectIsAnyLoading
} from '../../../../redux/slices/visaEvaluationSlice';

// 기존 컴포넌트들
import E1Form from '../../../../components/VisaEvaluation/forms/E1Form';
import ProgressTracker from '../../../../components/common/ProgressTracker';
import ErrorAlert from '../../../../components/common/ErrorAlert';
import EvaluationResultDisplay from '../../../../components/VisaEvaluation/results/EvaluationResultDisplay';

// 유틸리티
import { connectWebSocket } from '../../../../api/config/apiClient';

/**
 * E-1 비자 평가 유효성 검사 스키마
 */
const E1ValidationSchema = Yup.object().shape({
  // 기본 정보
  educationLevel: Yup.string()
    .required('학력을 선택해주세요')
    .oneOf(['bachelor', 'master_candidate', 'master', 'phd_candidate', 'phd'], '유효한 학력을 선택해주세요'),
  
  position: Yup.string()
    .required('직위를 선택해주세요')
    .oneOf(['교수', '부교수', '조교수', '강사'], '유효한 직위를 선택해주세요'),
  
  // 기관 정보
  institutionType: Yup.string()
    .required('기관 유형을 선택해주세요'),
  
  institution: Yup.string()
    .required('교육기관명을 입력해주세요')
    .min(2, '교육기관명은 2글자 이상이어야 합니다'),
  
  researchField: Yup.string()
    .required('연구 분야를 선택해주세요'),
  
  // 경력 정보
  experienceYears: Yup.number()
    .required('경력 연수를 입력해주세요')
    .min(0, '경력 연수는 0 이상이어야 합니다')
    .max(50, '경력 연수는 50년을 초과할 수 없습니다'),
  
  publications: Yup.number()
    .required('논문 수를 입력해주세요')
    .min(0, '논문 수는 0 이상이어야 합니다'),
  
  // 계약 조건
  salary: Yup.number()
    .required('연봉을 입력해주세요')
    .min(1000, '연봉은 1000만원 이상이어야 합니다'),
  
  contractPeriod: Yup.number()
    .required('계약 기간을 입력해주세요')
    .min(1, '계약 기간은 1개월 이상이어야 합니다')
    .max(60, '계약 기간은 60개월을 초과할 수 없습니다'),
  
  // 선택 사항
  internationalPublications: Yup.number()
    .min(0, '국제 논문 수는 0 이상이어야 합니다'),
  
  experienceTypes: Yup.array()
    .of(Yup.string()),
  
  hasInstitutionRecommendation: Yup.boolean(),
  hasPresidentRecommendation: Yup.boolean(),
  hasTeachingCertificate: Yup.boolean(),
  
  institutionRanking: Yup.number()
    .min(1, '순위는 1 이상이어야 합니다')
    .nullable()
});

/**
 * E-1 비자 평가 메인 페이지
 */
const E1EvaluationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux 상태
  const currentEvaluation = useSelector(selectCurrentEvaluation);
  const quickEvaluation = useSelector(selectQuickEvaluation);
  const supportedTypes = useSelector(selectSupportedTypes);
  const uiState = useSelector(selectUIState);
  const isLoading = useSelector(selectIsAnyLoading);
  
  // 로컬 상태
  const [activeTab, setActiveTab] = useState(0);
  const [showQuickEvaluation, setShowQuickEvaluation] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState('standard'); // 'standard' | 'smart'
  
  // 초기값
  const initialValues = {
    // 기본 정보
    educationLevel: '',
    position: '',
    
    // 기관 정보
    institutionType: '',
    institution: '',
    researchField: '',
    
    // 경력 정보
    experienceYears: 0,
    publications: 0,
    internationalPublications: 0,
    experienceTypes: [],
    
    // 계약 조건
    salary: 0,
    contractPeriod: 12,
    
    // 추가 정보
    hasInstitutionRecommendation: false,
    hasPresidentRecommendation: false,
    hasTeachingCertificate: false,
    institutionRanking: null,
    
    // 행정 정보 (선택적)
    fullName: '',
    nationality: 'KOR',
    birthDate: '',
    gender: '',
    email: '',
    phone: ''
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 비자 타입 설정
    dispatch(setSelectedVisaType('E-1'));
    
    // WebSocket 연결
    connectWebSocket();
    
    // 기존 평가 결과 클리어 (새로운 평가를 위해)
    dispatch(clearCurrentEvaluation());
    dispatch(clearQuickEvaluation());
    
    return () => {
      // 컴포넌트 언마운트 시 정리
    };
  }, [dispatch]);

  /**
   * 빠른 예비 평가 실행
   */
  const handleQuickEvaluation = async (basicData) => {
    try {
      const quickData = {
        educationLevel: basicData.educationLevel,
        position: basicData.position,
        experienceYears: basicData.experienceYears,
        publications: basicData.publications,
        institutionType: basicData.institutionType
      };
      
      await dispatch(quickEvaluate({
        visaType: 'E-1',
        basicData: quickData
      })).unwrap();
      
      setShowQuickEvaluation(true);
    } catch (error) {
      console.error('빠른 평가 실패:', error);
    }
  };

  /**
   * 정식 평가 실행
   */
  const handleFullEvaluation = async (values, { setSubmitting, setStatus }) => {
    try {
      setSubmitting(true);
      setStatus(null);
      
      // 진행상황 추적 다이얼로그 표시
      setShowProgressDialog(true);
      
      // 평가 데이터 구성
      const evaluationData = {
        evaluation: {
          // E-1 관련 필드들
          educationLevel: values.educationLevel,
          position: values.position,
          institutionType: values.institutionType,
          institution: values.institution,
          researchField: values.researchField,
          experienceYears: parseInt(values.experienceYears),
          publications: parseInt(values.publications),
          internationalPublications: parseInt(values.internationalPublications || 0),
          experienceTypes: values.experienceTypes || [],
          salary: parseInt(values.salary),
          contractPeriod: parseInt(values.contractPeriod),
          hasInstitutionRecommendation: values.hasInstitutionRecommendation,
          hasPresidentRecommendation: values.hasPresidentRecommendation,
          hasTeachingCertificate: values.hasTeachingCertificate,
          institutionRanking: values.institutionRanking ? parseInt(values.institutionRanking) : null
        },
        administrative: {
          fullName: values.fullName || '',
          nationality: values.nationality || 'KOR',
          birthDate: values.birthDate || '',
          gender: values.gender || '',
          email: values.email || '',
          phone: values.phone || ''
        },
        metadata: {
          evaluationMode,
          frontendVersion: '2.0',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };
      
      // 평가 실행 (모드에 따라)
      const action = evaluationMode === 'smart' ? evaluateVisaSmart : evaluateVisa;
      
      const result = await dispatch(action({
        visaType: 'E-1',
        applicantData: evaluationData,
        options: {
          trackProgress: true,
          evaluationMode,
          userId: null // 로그인 구현 시 추가
        }
      })).unwrap();
      
      // 성공 시 결과 페이지로 이동
      if (result.evaluationId) {
        navigate(`/visa/evaluation/result/${result.evaluationId}`);
      } else {
        // evaluationId가 없으면 현재 페이지에서 결과 표시
        setActiveTab(1); // 결과 탭으로 이동
      }
      
    } catch (error) {
      console.error('평가 실패:', error);
      setStatus(error.message || '평가 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
      setShowProgressDialog(false);
    }
  };

  /**
   * 탭 변경 핸들러
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * 평가 모드 변경
   */
  const handleEvaluationModeChange = (event) => {
    setEvaluationMode(event.target.checked ? 'smart' : 'standard');
  };

  /**
   * 평가 결과 저장
   */
  const handleSaveResult = async () => {
    try {
      // TODO: 평가 결과를 서버에 저장하는 API 호출
      console.log('평가 결과 저장:', currentEvaluation.result);
      // 성공 메시지 표시
    } catch (error) {
      console.error('결과 저장 실패:', error);
    }
  };

  /**
   * 평가 결과 공유
   */
  const handleShareResult = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'E-1 비자 평가 결과',
          text: `평가 점수: ${currentEvaluation.result?.totalScore}점`,
          url: window.location.href
        });
      } else {
        // 폴백: 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href);
        console.log('링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
  };

  /**
   * 평가 결과 PDF 다운로드
   */
  const handleDownloadResult = () => {
    try {
      // TODO: PDF 생성 및 다운로드 구현
      console.log('PDF 다운로드:', currentEvaluation.result);
    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
    }
  };

  /**
   * 피드백 제출
   */
  const handleSubmitFeedback = async (feedback) => {
    try {
      // TODO: 피드백 제출 API 호출
      console.log('피드백 제출:', feedback);
    } catch (error) {
      console.error('피드백 제출 실패:', error);
    }
  };

  /**
   * 다른 평가와 비교
   */
  const handleCompareResult = () => {
    try {
      // TODO: 비교 페이지로 이동
      console.log('평가 비교 페이지로 이동');
    } catch (error) {
      console.error('비교 기능 오류:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 헤더 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              E-1 비자 평가
            </Typography>
            <Typography variant="body1" color="text.secondary">
              교육 관련 전문 활동 비자 평가 시스템
            </Typography>
          </Box>
          
          <Box display="flex" gap={2} alignItems="center">
            {/* 평가 모드 스위치 */}
            <FormControlLabel
              control={
                <Switch
                  checked={evaluationMode === 'smart'}
                  onChange={handleEvaluationModeChange}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Psychology color={evaluationMode === 'smart' ? 'primary' : 'disabled'} />
                  <Typography variant="body2">
                    지능형 평가
                  </Typography>
                </Box>
              }
            />
            
            {/* 진행상황 추적 버튼 */}
            {currentEvaluation.isEvaluating && (
              <Button
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={() => setShowProgressDialog(true)}
              >
                진행상황
              </Button>
            )}
          </Box>
        </Box>
        
        {/* 모드 설명 */}
        <Alert 
          severity={evaluationMode === 'smart' ? 'info' : 'success'}
          sx={{ mb: 2 }}
        >
          {evaluationMode === 'smart' ? (
            <Box>
              <strong>지능형 평가 모드</strong>
              <br />
              AI 기반 문서 자동 분석, 개인화된 추천, 과거 평가 이력 활용으로 더욱 정확한 평가를 제공합니다.
            </Box>
          ) : (
            <Box>
              <strong>표준 평가 모드</strong>
              <br />
              기본적인 E-1 비자 요건에 따른 표준 평가를 진행합니다.
            </Box>
          )}
        </Alert>
      </Paper>

      {/* 메인 콘텐츠 */}
      <Paper sx={{ p: 0 }}>
        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            icon={<Assignment />} 
            label="평가 신청" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrendingUp />} 
            label="평가 결과" 
            iconPosition="start"
            disabled={!currentEvaluation.result}
          />
          <Tab 
            icon={<Compare />} 
            label="빠른 평가" 
            iconPosition="start"
          />
        </Tabs>

        {/* 탭 콘텐츠 */}
        <Box sx={{ p: 3 }}>
          {/* 평가 신청 탭 */}
          {activeTab === 0 && (
            <Formik
              initialValues={initialValues}
              validationSchema={E1ValidationSchema}
              onSubmit={handleFullEvaluation}
              enableReinitialize
            >
              {({ values, errors, touched, setFieldValue, handleChange, handleBlur, isSubmitting, status }) => (
                <Form>
                  <Grid container spacing={3}>
                    {/* 메인 폼 */}
                    <Grid item xs={12} lg={8}>
                      <E1Form
                        values={values}
                        errors={errors}
                        touched={touched}
                        setFieldValue={setFieldValue}
                        handleChange={handleChange}
                        handleBlur={handleBlur}
                      />
                      
                      {status && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {status}
                        </Alert>
                      )}
                    </Grid>
                    
                    {/* 사이드바 */}
                    <Grid item xs={12} lg={4}>
                      <Stack spacing={3}>
                        {/* 빠른 평가 */}
                        <Card>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Speed color="primary" />
                              <Typography variant="h6">빠른 예비 평가</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              기본 정보만으로 대략적인 평가 결과를 미리 확인해보세요.
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleQuickEvaluation(values)}
                              disabled={
                                !values.educationLevel || 
                                !values.position || 
                                !values.experienceYears ||
                                quickEvaluation.isEvaluating
                              }
                              startIcon={quickEvaluation.isEvaluating ? <CircularProgress size={16} /> : <Speed />}
                            >
                              {quickEvaluation.isEvaluating ? '평가 중...' : '빠른 평가'}
                            </Button>
                          </CardContent>
                        </Card>
                        
                        {/* 빠른 평가 결과 */}
                        {quickEvaluation.result && (
                          <Card>
                            <CardContent>
                              <Typography variant="h6" mb={2}>예비 평가 결과</Typography>
                              <Box mb={2}>
                                <Typography variant="body2" color="text.secondary">예상 점수</Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={quickEvaluation.result.score || 0} 
                                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                  />
                                  <Typography variant="body2" fontWeight="bold">
                                    {quickEvaluation.result.score || 0}점
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Chip
                                label={quickEvaluation.result.status || '평가 중'}
                                size="small"
                                color={
                                  quickEvaluation.result.score >= 70 ? 'success' :
                                  quickEvaluation.result.score >= 50 ? 'warning' : 'error'
                                }
                              />
                              
                              <Typography variant="body2" sx={{ mt: 2 }}>
                                정확한 평가를 위해 모든 정보를 입력 후 정식 평가를 진행해주세요.
                              </Typography>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* 평가 제출 */}
                        <Card>
                          <CardContent>
                            <Typography variant="h6" mb={2}>평가 제출</Typography>
                            <Stack spacing={2}>
                              <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                                startIcon={
                                  isSubmitting ? <CircularProgress size={16} /> : 
                                  evaluationMode === 'smart' ? <Psychology /> : <Send />
                                }
                                fullWidth
                              >
                                {isSubmitting ? '평가 중...' : 
                                 evaluationMode === 'smart' ? '지능형 평가 시작' : '평가 시작'}
                              </Button>
                              
                              <Typography variant="caption" color="text.secondary" textAlign="center">
                                평가는 보통 1-2분 정도 소요됩니다.
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Stack>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          )}

          {/* 평가 결과 탭 */}
          {activeTab === 1 && currentEvaluation.result && (
            <EvaluationResultDisplay
              result={currentEvaluation.result}
              onSave={handleSaveResult}
              onShare={handleShareResult}
              onDownload={handleDownloadResult}
              onSubmitFeedback={handleSubmitFeedback}
              onCompare={handleCompareResult}
              showActions={true}
            />
          )}
          
          {/* 평가 결과가 없을 때 */}
          {activeTab === 1 && !currentEvaluation.result && (
            <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                평가 결과가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                먼저 평가 신청 탭에서 평가를 진행해주세요.
              </Typography>
            </Alert>
          )}

          {/* 빠른 평가 탭 */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                빠른 평가 히스토리
              </Typography>
              {/* 여기에 빠른 평가 히스토리 추가 */}
              <Alert severity="info">
                빠른 평가 히스토리는 다음 단계에서 구현됩니다.
              </Alert>
            </Box>
          )}
        </Box>
      </Paper>

      {/* 진행상황 추적 다이얼로그 */}
      <Dialog
        open={showProgressDialog}
        onClose={() => setShowProgressDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp />
            평가 진행상황
          </Box>
        </DialogTitle>
        <DialogContent>
          <ProgressTracker
            progress={currentEvaluation.progress?.progress || 0}
            message={currentEvaluation.progress?.message || '평가 진행 중...'}
            steps={currentEvaluation.progress?.steps || []}
            currentStep={currentEvaluation.progress?.step || 0}
            isComplete={currentEvaluation.progress?.progress === 100}
            hasError={!!currentEvaluation.error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProgressDialog(false)}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default E1EvaluationPage; 