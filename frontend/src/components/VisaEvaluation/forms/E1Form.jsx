import React, { useState, useEffect } from 'react';
import { Field } from 'formik';
import { 
  Grid, 
  TextField, 
  FormHelperText, 
  Typography,
  Box,
  Paper,
  FormControlLabel,
  Card,
  CardContent,
  Stack,
  Chip,
  Switch,
  InputAdornment,
  LinearProgress,
  useTheme,
  Button,
  FormGroup
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// Icons
import {
  School,
  Work,
  AttachMoney,
  Business,
  CheckCircle,
  Warning,
  Star
} from '@mui/icons-material';

/**
 * E-1 비자 필수 상수 정의 (백엔드와 동일)
 */

// 학력 수준 (백엔드 normalizeEducationLevel과 일치)
const EDUCATION_LEVELS = [
  { 
    value: 'bachelor', 
    label: '학사', 
    description: '⚠️ 강사직만 가능', 
    color: '#ff9800', 
    recommend: false,
    score: 60
  },
  { 
    value: 'master_candidate', 
    label: '석사수료', 
    description: '석사과정 수료', 
    color: '#ffc107', 
    recommend: false,
    score: 70
  },
  { 
    value: 'master', 
    label: '석사', 
    description: '✅ E-1 기본 요건', 
    color: '#4caf50', 
    recommend: true,
    score: 80
  },
  { 
    value: 'phd_candidate', 
    label: '박사수료', 
    description: '박사과정 수료', 
    color: '#00bcd4', 
    recommend: true,
    score: 90
  },
  { 
    value: 'phd', 
    label: '박사', 
    description: '✅ E-1 최적', 
    color: '#2196f3', 
    recommend: true,
    score: 100
  }
];

// 연구 분야 (백엔드와 일치)
const RESEARCH_FIELDS = [
  { value: 'ai_ml', label: 'AI/머신러닝', demand: 1.2, color: '#1976d2' },
  { value: 'biotechnology', label: '바이오기술', demand: 1.15, color: '#388e3c' },
  { value: 'semiconductor', label: '반도체', demand: 1.2, color: '#7b1fa2' },
  { value: 'energy', label: '에너지', demand: 1.1, color: '#f57c00' },
  { value: 'medicine', label: '의학', demand: 1.1, color: '#d32f2f' },
  { value: 'engineering', label: '공학', demand: 1.0, color: '#616161' },
  { value: 'natural_science', label: '자연과학', demand: 1.0, color: '#00897b' },
  { value: 'social_science', label: '사회과학', demand: 0.9, color: '#6a1b9a' },
  { value: 'humanities', label: '인문학', demand: 0.85, color: '#5d4037' },
  { value: 'arts', label: '예술', demand: 0.8, color: '#e91e63' },
  { value: 'other', label: '기타', demand: 0.9, color: '#757575' }
];

// 기관 유형 (백엔드와 일치)
const INSTITUTION_TYPES = [
  { 
    value: 'university', 
    label: '종합대학', 
    description: '고등교육법에 의한 4년제 종합대학', 
    recommend: true,
    weight: 1.0
  },
  { 
    value: 'college', 
    label: '전문대학', 
    description: '고등교육법에 의한 2-3년제 전문대학', 
    recommend: true,
    weight: 0.9
  },
  { 
    value: 'graduate_school', 
    label: '대학원대학', 
    description: '학부 없이 대학원 과정만 운영', 
    recommend: true,
    weight: 1.0
  },
  { 
    value: 'industrial_university', 
    label: '산업대학', 
    description: '고등교육법에 의한 산업대학', 
    recommend: true,
    weight: 0.95
  },
  { 
    value: 'education_university', 
    label: '교육대학', 
    description: '초등교원 양성 교육대학', 
    recommend: true,
    weight: 0.95
  },
  { 
    value: 'cyber_university', 
    label: '사이버대학', 
    description: '원격대학', 
    recommend: true,
    weight: 0.85
  },
  { 
    value: 'technical_college', 
    label: '기술대학', 
    description: '고등교육법에 의한 기술대학', 
    recommend: true,
    weight: 0.9
  },
  { 
    value: 'research_institute', 
    label: '연구소', 
    description: '⚠️ E-3(연구) 비자가 적합', 
    recommend: false,
    weight: 0
  },
  { 
    value: 'government', 
    label: '정부기관', 
    description: '⚠️ E-7(특정활동) 비자가 적합', 
    recommend: false,
    weight: 0
  },
  { 
    value: 'company', 
    label: '기업', 
    description: '⚠️ E-7(특정활동) 비자가 적합', 
    recommend: false,
    weight: 0
  }
];

// 직위 (백엔드와 일치)
const POSITIONS = [
  { value: '교수', label: '교수', description: '최고 직급' },
  { value: '부교수', label: '부교수', description: '중간 직급' },
  { value: '조교수', label: '조교수', description: '정규 교수직' },
  { value: '강사', label: '강사', description: '시간강사' }
];

// 경력 유형 (백엔드와 일치)
const EXPERIENCE_TYPES = [
  { value: 'university_teaching', label: '대학 강의', weight: 1.0 },
  { value: 'international_teaching', label: '해외 대학 강의', weight: 1.1 },
  { value: 'research_institute', label: '연구소 연구', weight: 0.9 },
  { value: 'government_research', label: '정부기관 연구', weight: 0.85 },
  { value: 'industry_research', label: '기업 연구', weight: 0.8 },
  { value: 'other', label: '기타', weight: 0.7 }
];

/**
 * E1 폼 메인 컴포넌트
 */
const E1Form = ({ errors = {}, touched = {}, values = {}, setFieldValue, handleChange, handleBlur }) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  
  // 단계 정의
  const STEPS = [
    { id: 'education', title: '학력 및 직위', icon: <School /> },
    { id: 'institution', title: '교육기관 정보', icon: <Business /> },
    { id: 'experience', title: '경력 및 실적', icon: <Work /> },
    { id: 'contract', title: '계약 조건', icon: <AttachMoney /> },
    { id: 'additional', title: '추가 정보', icon: <Star /> }
  ];

  // 초기값 설정
  useEffect(() => {
    const defaults = {
      hasInstitutionRecommendation: false,
      hasPresidentRecommendation: false,
      hasTeachingCertificate: false,
      experienceTypes: [],
      internationalPublications: 0,
      researchField: 'other',
      institutionRanking: null,
    };
    
    Object.entries(defaults).forEach(([key, value]) => {
      if (values[key] === undefined) {
        setFieldValue(key, value);
      }
    });
  }, [setFieldValue, values]);

  // 단계 완료 상태 확인
  const isStepComplete = (stepIndex) => {
    const step = STEPS[stepIndex];
    
    switch (step.id) {
      case 'education':
        return values.educationLevel && values.position;
      case 'institution':
        return values.institutionType && values.institution && values.researchField;
      case 'experience':
        return values.experienceYears !== undefined && values.publications !== undefined;
      case 'contract':
        return values.salary && values.contractPeriod;
      case 'additional':
        return true; // 선택사항이므로 항상 완료
      default:
        return false;
    }
  };

  // 옵션 카드 렌더링 헬퍼
  const renderOptionCards = (options, fieldName, title, multiple = false) => (
    <Box>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Grid container spacing={2}>
        {options.map((option) => {
          const isSelected = multiple 
            ? (values[fieldName] || []).includes(option.value)
            : values[fieldName] === option.value;
          const isRecommended = option.recommend !== false;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={option.value}>
              <Card 
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? theme.palette.primary.main : 'divider',
                  backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                  },
                  position: 'relative'
                }}
                onClick={() => {
                  if (multiple) {
                    const currentValues = values[fieldName] || [];
                    const newValues = isSelected
                      ? currentValues.filter(v => v !== option.value)
                      : [...currentValues, option.value];
                    setFieldValue(fieldName, newValues);
                  } else {
                    setFieldValue(fieldName, option.value);
                  }
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {option.label}
                    </Typography>
                    {isSelected && <CheckCircle color="primary" />}
                    {!isRecommended && <Warning color="warning" />}
                  </Box>
                  
                  {option.description && (
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {option.description}
                    </Typography>
                  )}
                  
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {option.demand && (
                      <Chip
                        label={`수요: ${option.demand}x`} 
                        size="small"
                        color={option.demand > 1.1 ? 'success' : option.demand > 1.0 ? 'warning' : 'default'}
                      />
                    )}
                    {option.score && (
                      <Chip 
                        label={`${option.score}점`} 
                        size="small" 
                        color="info"
                      />
                    )}
                    {option.weight && (
                      <Chip 
                        label={`가중치: ${option.weight}`} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      
      {errors[fieldName] && touched[fieldName] && (
        <FormHelperText error sx={{ mt: 1 }}>
          {errors[fieldName]}
        </FormHelperText>
      )}
    </Box>
  );

  // 단계별 콘텐츠 렌더링
  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'education':
        return (
          <Stack spacing={4}>
            {renderOptionCards(EDUCATION_LEVELS, 'educationLevel', '학력 수준')}
            {renderOptionCards(POSITIONS, 'position', '직위')}
          </Stack>
        );
        
      case 'institution':
        return (
          <Stack spacing={4}>
            {renderOptionCards(INSTITUTION_TYPES, 'institutionType', '기관 유형')}
            
            <Box>
              <Typography variant="h6" gutterBottom>교육기관명</Typography>
              <Field name="institution">
                {({ field, meta }) => (
                  <TextField
                    {...field}
                    fullWidth
                    placeholder="예: 서울대학교, 연세대학교"
                    error={meta.touched && !!meta.error}
                    helperText={meta.touched && meta.error}
                  />
                )}
              </Field>
            </Box>
            
            {renderOptionCards(RESEARCH_FIELDS, 'researchField', '연구 분야')}
          </Stack>
        );
        
      case 'experience':
        return (
          <Stack spacing={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>경력 연수</Typography>
                <Field name="experienceYears">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="0"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">년</InputAdornment>
                      }}
                      error={meta.touched && !!meta.error}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>논문/출판물 수</Typography>
                <Field name="publications">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="0"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">편</InputAdornment>
                      }}
                      error={meta.touched && !!meta.error}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>국제 논문 수 (선택)</Typography>
                <Field name="internationalPublications">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="0"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">편</InputAdornment>
                      }}
                      error={meta.touched && !!meta.error}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
              </Grid>
            </Grid>
            
            {renderOptionCards(EXPERIENCE_TYPES, 'experienceTypes', '경력 유형 (복수 선택 가능)', true)}
          </Stack>
        );
        
      case 'contract':
        return (
          <Stack spacing={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>연봉</Typography>
                <Field name="salary">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="3000"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₩</InputAdornment>,
                        endAdornment: <InputAdornment position="end">만원</InputAdornment>
                      }}
                      error={meta.touched && !!meta.error}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>계약 기간</Typography>
                <Field name="contractPeriod">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      type="number"
                      fullWidth
                      placeholder="12"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">개월</InputAdornment>
                      }}
                      error={meta.touched && !!meta.error}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
              </Grid>
            </Grid>
          </Stack>
        );
        
      case 'additional':
        return (
          <Stack spacing={4}>
            <Typography variant="h6" gutterBottom>추가 자격 정보 (선택사항)</Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.hasInstitutionRecommendation || false}
                    onChange={(e) => setFieldValue('hasInstitutionRecommendation', e.target.checked)}
                  />
                }
                label="기관 추천서 보유"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={values.hasPresidentRecommendation || false}
                    onChange={(e) => setFieldValue('hasPresidentRecommendation', e.target.checked)}
                  />
                }
                label="총장/학장 추천서 보유"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={values.hasTeachingCertificate || false}
                    onChange={(e) => setFieldValue('hasTeachingCertificate', e.target.checked)}
                  />
                }
                label="교원자격증 보유"
              />
            </FormGroup>
            
            <Box>
              <Typography variant="h6" gutterBottom>기관 순위 (선택)</Typography>
              <Field name="institutionRanking">
                {({ field, meta }) => (
                  <TextField
                    {...field}
                    type="number"
                    fullWidth
                    placeholder="예: 50"
                    helperText="QS 세계대학순위, 국내 순위 등"
                    error={meta.touched && !!meta.error}
                  />
                )}
              </Field>
            </Box>
          </Stack>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box>
      {/* 단계 표시 */}
      <Box mb={4}>
        <LinearProgress 
          variant="determinate" 
          value={((currentStep + 1) / STEPS.length) * 100} 
          sx={{ mb: 2 }} 
        />
        <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
          {STEPS.map((step, index) => (
            <Chip
              key={step.id}
              icon={step.icon}
              label={step.title}
              color={index === currentStep ? 'primary' : isStepComplete(index) ? 'success' : 'default'}
              variant={index === currentStep ? 'filled' : 'outlined'}
              onClick={() => setCurrentStep(index)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>

      {/* 현재 단계 콘텐츠 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          {STEPS[currentStep].icon}
          <Typography variant="h5" sx={{ ml: 1 }}>
            {STEPS[currentStep].title}
          </Typography>
        </Box>
        
        {renderStepContent()}
      </Paper>

      {/* 네비게이션 버튼 */}
      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          이전
        </Button>
        
        <Button
          variant="contained"
          onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
          disabled={currentStep === STEPS.length - 1}
        >
          다음
        </Button>
      </Box>
    </Box>
  );
};

export default E1Form;