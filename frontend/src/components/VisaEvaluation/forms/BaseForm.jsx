import React, { useState } from 'react';
import { Field } from 'formik';
import { 
  Grid, 
  FormControl, 
  TextField, 
  FormHelperText, 
  MenuItem,
  Typography,
  Box,
  Card,
  CardContent,
  Tooltip,
  InputLabel,
  Select,
  Divider,
  Alert,
  InputAdornment,
  Paper,
  Stack,
  Avatar,
  Chip,
  Collapse,
  Button
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import EventIcon from '@mui/icons-material/Event';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PublicIcon from '@mui/icons-material/Public';
import FlagIcon from '@mui/icons-material/Flag';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// 한국 주요 도시 목록
const KOREAN_CITIES = [
  { value: 'seoul', label: '서울특별시', description: '비자 대행 서비스 가능', recommend: true },
  { value: 'busan', label: '부산광역시', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'incheon', label: '인천광역시', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'daegu', label: '대구광역시', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'daejeon', label: '대전광역시', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'gwangju', label: '광주광역시', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'ulsan', label: '울산광역시', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'sejong', label: '세종특별자치시', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'gyeonggi', label: '경기도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'gangwon', label: '강원도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'chungbuk', label: '충청북도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'chungnam', label: '충청남도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'jeonbuk', label: '전라북도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'jeonnam', label: '전라남도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'gyeongbuk', label: '경상북도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'gyeongnam', label: '경상남도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'jeju', label: '제주특별자치도', description: '비자 대행 서비스 불가', recommend: false },
  { value: 'other', label: '기타 지역', description: '비자 대행 서비스 불가', recommend: false }
];

// 신청 목적 옵션
const APPLICATION_PURPOSES = [
  { 
    value: 'new', 
    label: '신규 비자 취득', 
    description: '한국에서 처음으로 비자를 신청하는 경우', 
    recommend: true,
    icon: <DescriptionIcon />,
    color: '#1976d2'
  },
  { 
    value: 'extension', 
    label: '체류 기간 연장', 
    description: '기존 비자의 체류 기간을 연장하는 경우', 
    recommend: true,
    icon: <EventIcon />,
    color: '#388e3c',
    requiresCurrentVisa: true
  },
  { 
    value: 'status_change', 
    label: '체류 자격 변경', 
    description: '다른 비자에서 현재 신청 비자로 변경하는 경우', 
    recommend: false,
    icon: <PublicIcon />,
    color: '#f57c00',
    requiresCurrentVisa: true
  }
];

/**
 * 개선된 기본 폼 필드 컴포넌트
 * - 모든 필드를 명시적으로 표시
 * - 단계적 정보 입력 구조
 * - 향상된 UX/UI
 */
const BaseForm = ({ errors, touched, visaTypes, onVisaTypeChange, handleChange, values }) => {
  // 테마 및 상태 관리
  const theme = useTheme();
  const [showCurrentVisaInfo, setShowCurrentVisaInfo] = useState(false);
  
  // 비자 유형이 유효한 배열인지 확인
  const hasVisaTypes = Array.isArray(visaTypes) && visaTypes.length > 0;
  
  // 개발용 로그 (필요한 정보만 남김)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[BaseForm] 선택된 비자 유형:', values?.visaType);
  }
  
  // 현재 비자 정보가 필요한지 확인
  const needsCurrentVisaInfo = values.visaApplicationPurpose === 'extension' || 
                               values.visaApplicationPurpose === 'status_change';
  
  // 현재 비자 정보 표시 여부 업데이트
  React.useEffect(() => {
    setShowCurrentVisaInfo(needsCurrentVisaInfo);
  }, [needsCurrentVisaInfo]);
  
  /**
   * 비자 유형 변경 핸들러 (내부 처리용)
   */
  const handleVisaTypeChangeInternal = (e) => {
    // 이벤트 객체로부터 선택된 비자 유형 값 추출
    const selectedValue = e.target.value;
    
    console.log('[BaseForm] 선택된 비자 유형:', selectedValue);
    
    // 상위 컴포넌트에 전달할 이벤트 데이터 생성
    const enhancedEvent = {
      target: e.target,
      rawCode: selectedValue, // 원본 코드 값 (E-1 형식)
    };
    
    // 상세 폼 렌더링을 위해 상위 컴포넌트 콜백 호출
    if (onVisaTypeChange) {
      onVisaTypeChange(enhancedEvent);
    }
    
    // formik의 handleChange도 호출하여 formik 상태 업데이트
    if (handleChange) {
      handleChange(e);
    }
    

  };

  // 도움말 툴팁 렌더링 함수
  const renderTooltip = (text) => (
    <Tooltip title={text}>
      <InfoIcon fontSize="small" color="primary" sx={{ ml: 0.5, fontSize: '1rem', opacity: 0.7 }} />
    </Tooltip>
  );

  // 옵션 카드 렌더링 함수 (신청 목적용)
  const renderApplicationPurposeCards = () => {
    const selectedValue = values.visaApplicationPurpose;
    
    return (
      <Grid container spacing={2}>
        {APPLICATION_PURPOSES.map(purpose => {
          const isSelected = selectedValue === purpose.value;
          
          return (
            <Grid item xs={12} md={4} key={purpose.value}>
                              <Card
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    position: 'relative',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid',
                    borderColor: isSelected ? purpose.color : alpha(theme.palette.grey[300], 0.5),
                    bgcolor: isSelected ? alpha(purpose.color, 0.05) : 'background.paper',
                    borderRadius: 3,
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: isSelected 
                        ? `linear-gradient(90deg, ${purpose.color} 0%, ${alpha(purpose.color, 0.7)} 100%)`
                        : 'transparent',
                      transition: 'all 0.3s ease'
                    },
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: `0 20px 40px ${alpha(purpose.color, 0.15)}`,
                      borderColor: purpose.color,
                      '&::before': {
                        background: `linear-gradient(90deg, ${purpose.color} 0%, ${alpha(purpose.color, 0.7)} 100%)`
                      }
                    }
                  }}
                  onClick={() => {
                    handleChange({
                      target: {
                        name: 'visaApplicationPurpose',
                        value: purpose.value
                      }
                    });
                  }}
                >
                {purpose.recommend && (
                  <Chip
                    label="일반적"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      fontWeight: 600,
                      height: 22,
                      fontSize: '0.75rem'
                    }}
                  />
                )}
                
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: purpose.color, mb: 2 }}>
                    {React.cloneElement(purpose.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected ? purpose.color : 'text.primary',
                      mb: 1
                    }}
                  >
                    {purpose.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      lineHeight: 1.5,
                      minHeight: 60
                    }}
                  >
                    {purpose.description}
                  </Typography>
                  
                  {purpose.requiresCurrentVisa && (
                    <Chip
                      label="현재 비자 정보 필요"
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // 현재 비자 상태 컴포넌트 렌더링
  const renderCurrentVisaStatus = () => {
    if (!showCurrentVisaInfo) return null;
    
    return (
      <Collapse in={showCurrentVisaInfo}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mt: 3, 
            borderRadius: 3, 
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'info.light',
            borderLeft: '6px solid',
            borderLeftColor: 'info.main'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
              <DescriptionIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" color="info.main" sx={{ fontWeight: 600 }}>
                현재 체류 상태 정보
              </Typography>
              <Typography variant="body2" color="text.secondary">
                현재 소지한 비자 및 체류 정보를 입력해주세요
              </Typography>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                required
                label="현재 비자 유형"
                name="currentVisaType"
                value={values.currentVisaType || ''}
                onChange={handleChange}
                error={touched.currentVisaType && Boolean(errors.currentVisaType)}
                helperText={touched.currentVisaType && errors.currentVisaType}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">선택하세요</MenuItem>
                <MenuItem value="none">비자 없음 (무비자 입국)</MenuItem>
                {/* 모든 비자 유형 동적으로 렌더링 */}
                {hasVisaTypes && visaTypes.map((type) => (
                  <MenuItem key={type.code} value={type.code}>
                    {type.name.split('(')[0].trim()} 
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({type.code})
                    </Typography>
                  </MenuItem>
                ))}
                <MenuItem value="OTHER">기타</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="비자 만료일"
                name="visaExpiryDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={values.visaExpiryDate || ''}
                onChange={handleChange}
                error={touched.visaExpiryDate && Boolean(errors.visaExpiryDate)}
                helperText={touched.visaExpiryDate && errors.visaExpiryDate}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="외국인 등록증 번호"
                name="alienRegistrationNumber"
                value={values.alienRegistrationNumber || ''}
                onChange={handleChange}
                error={touched.alienRegistrationNumber && Boolean(errors.alienRegistrationNumber)}
                helperText={touched.alienRegistrationNumber && errors.alienRegistrationNumber}
                placeholder="000000-0000000 형식"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="한국 체류 기간 (년)"
                name="stayDurationYears"
                type="number"
                value={values.stayDurationYears || ''}
                onChange={handleChange}
                error={touched.stayDurationYears && Boolean(errors.stayDurationYears)}
                helperText={touched.stayDurationYears && errors.stayDurationYears}
                inputProps={{ min: 0, step: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EventIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* 현재 비자 상태 필드 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                required
                label="현재 비자 상태"
                name="currentVisaStatus"
                value={values.currentVisaStatus || ''}
                onChange={handleChange}
                error={touched.currentVisaStatus && Boolean(errors.currentVisaStatus)}
                helperText={(touched.currentVisaStatus && errors.currentVisaStatus) || '현재 체류 자격에 대한 상태를 선택하세요'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">선택하세요</MenuItem>
                <MenuItem value="VALID">유효 (Valid)</MenuItem>
                <MenuItem value="EXPIRED">만료됨 (Expired)</MenuItem>
                <MenuItem value="EXTENSION_IN_PROGRESS">연장 신청 중 (Extension in progress)</MenuItem>
                <MenuItem value="CHANGING">자격 변경 중 (Status changing)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              현재 비자 정보가 필요한 이유
            </Typography>
            <Typography variant="body2">
              {values.visaApplicationPurpose === 'extension' 
                ? '체류 기간 연장 신청 시 현재 비자 정보를 통해 연장 가능성을 정확히 평가할 수 있습니다.'
                : '체류 자격 변경 시 현재 상태에서 새로운 비자로의 전환 가능성을 분석합니다.'
              }
            </Typography>
          </Alert>
        </Paper>
      </Collapse>
    );
  };

  return (
    <Box>
      {/* 비자 유형 선택 섹션 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4, 
          bgcolor: 'background.paper',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box 
            sx={{ 
              position: 'relative',
              mr: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -8,
                left: -8,
                right: -8,
                bottom: -8,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
                borderRadius: '50%',
                zIndex: 0
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                width: 64, 
                height: 64,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                position: 'relative',
                zIndex: 1
              }}
            >
              <DescriptionIcon fontSize="large" />
            </Avatar>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                color: 'primary.main',
                mb: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              비자 유형 선택
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              신청하려는 비자 유형과 목적을 선택해주세요
            </Typography>
          </Box>
          <Box
            sx={{
              px: 3,
              py: 1,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <Typography variant="caption" color="primary.main" fontWeight={600}>
              STEP 1
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={4}>
          {/* 비자 유형 선택 필드 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(errors.visaType && touched.visaType)}>
              <InputLabel id="visa-type-label">비자 유형 *</InputLabel>
              <Field
                as={Select}
                labelId="visa-type-label"
                name="visaType"
                label="비자 유형 *"
                variant="outlined"
                fullWidth
                onChange={handleVisaTypeChangeInternal}
                value={values.visaType || ""}
                disabled={!hasVisaTypes}
                required
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 400,
                      '& .MuiMenuItem-root': {
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1.5
                      }
                    }
                  }
                }}
              >
                <MenuItem value="">선택하세요</MenuItem>
                {hasVisaTypes && visaTypes.map((type) => (
                  <MenuItem 
                    key={type.code} 
                    value={type.code}
                    data-raw-code={type.code.replace(/-/g, '')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {type.name.split('(')[0].trim()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.code}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Field>
              
              {errors.visaType && touched.visaType && (
                <FormHelperText error>{errors.visaType}</FormHelperText>
              )}
              {!errors.visaType && (
                <FormHelperText>
                  지원하려는 비자 유형을 선택하세요. 비자 유형별로 필요한 정보가 다릅니다.
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          {/* 신청 목적 섹션 */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              신청 목적 *
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              비자 신청 목적에 따라 필요한 정보와 절차가 달라집니다
            </Typography>
            
            {renderApplicationPurposeCards()}
            
            {touched.visaApplicationPurpose && errors.visaApplicationPurpose && (
              <FormHelperText error sx={{ mt: 1 }}>
                {errors.visaApplicationPurpose}
              </FormHelperText>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* 개인정보 입력 섹션 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4, 
          bgcolor: 'background.paper',
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
          border: '1px solid',
          borderColor: alpha(theme.palette.secondary.main, 0.1),
          boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.08)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box 
            sx={{ 
              position: 'relative',
              mr: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -8,
                left: -8,
                right: -8,
                bottom: -8,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
                borderRadius: '50%',
                zIndex: 0
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'secondary.main', 
                width: 64, 
                height: 64,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.3)}`,
                position: 'relative',
                zIndex: 1
              }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                color: 'secondary.main',
                mb: 1,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              신청자 기본 정보
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              비자 신청에 필요한 개인정보를 입력해주세요
            </Typography>
          </Box>
          <Box
            sx={{
              px: 3,
              py: 1,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
            }}
          >
            <Typography variant="caption" color="secondary.main" fontWeight={600}>
              STEP 2
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {/* 개인 식별 정보 */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="이름 *"
              name="fullName"
              value={values.fullName || ''}
              onChange={handleChange}
              error={touched.fullName && Boolean(errors.fullName)}
              helperText={(touched.fullName && errors.fullName) || '여권에 기재된 영문 이름'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="secondary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="국적 *"
              name="nationality"
              value={values.nationality || ''}
              onChange={handleChange}
              error={touched.nationality && Boolean(errors.nationality)}
              helperText={(touched.nationality && errors.nationality) || '여권 발급 국가'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FlagIcon color="secondary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="이메일 *"
              name="email"
              type="email"
              value={values.email || ''}
              onChange={handleChange}
              error={touched.email && Boolean(errors.email)}
              helperText={(touched.email && errors.email) || '결과 및 상담 연결을 위해 필요'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="secondary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="전화번호 *"
              name="phone"
              value={values.phone || ''}
              onChange={handleChange}
              error={touched.phone && Boolean(errors.phone)}
              helperText={(touched.phone && errors.phone) || '국가번호 포함 (예: +82-10-1234-5678)'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="secondary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              name="birthDate"
              label="생년월일 *"
              type="date"
              value={values.birthDate || ''}
              onChange={handleChange}
              error={touched.birthDate && Boolean(errors.birthDate)}
              helperText={(touched.birthDate && errors.birthDate) || "여권에 기재된 생년월일"}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon color="secondary" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* 현재 거주 도시 */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={touched.currentCity && Boolean(errors.currentCity)} required>
              <InputLabel id="current-city-label">현재 거주 도시 *</InputLabel>
              <Field
                as={Select}
                labelId="current-city-label"
                name="currentCity"
                label="현재 거주 도시 *"
                value={values.currentCity || ''}
                onChange={handleChange}
                required
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 400,
                    }
                  }
                }}
              >
                <MenuItem value="">선택하세요</MenuItem>
                {KOREAN_CITIES.map(city => (
                  <MenuItem 
                    key={city.value} 
                    value={city.value}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography>{city.label}</Typography>
                      {city.recommend && (
                        <Chip 
                          label="대행가능" 
                          size="small" 
                          color="primary" 
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Field>
              {touched.currentCity && errors.currentCity ? (
                <FormHelperText error>{errors.currentCity}</FormHelperText>
              ) : (
                <FormHelperText>현재 거주하고 있는 도시를 선택하세요</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
        
        {/* 서비스 지역 안내 */}
        <Alert 
          severity={values.currentCity === 'seoul' ? 'success' : 'info'} 
          icon={<InfoIcon />} 
          sx={{ 
            mt: 3,
            bgcolor: values.currentCity === 'seoul' ? 'success.lighter' : 'info.lighter',
            borderColor: values.currentCity === 'seoul' ? 'success.light' : 'info.light'
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {values.currentCity === 'seoul' ? '비자 대행 서비스 이용 가능' : '서비스 지역 안내'}
          </Typography>
          <Typography variant="body2">
            {values.currentCity === 'seoul' 
              ? '서울 지역은 비자 대행 서비스를 이용하실 수 있습니다. 평가 완료 후 전문 행정사와 연결해드립니다.'
              : '현재 비자 대행 서비스는 서울 지역에서만 제공됩니다. 다른 지역은 자가 신청 가이드를 제공합니다.'
            }
          </Typography>
        </Alert>
      </Paper>
      
      {/* 현재 비자 상태 정보 (조건부 렌더링) */}
      {renderCurrentVisaStatus()}
    </Box>
  );
};

export default BaseForm;