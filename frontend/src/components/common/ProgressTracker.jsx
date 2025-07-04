import React from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Error as ErrorIcon,
  PlayArrow
} from '@mui/icons-material';

const ProgressTracker = ({ 
  steps = [], 
  currentStep = 0, 
  progress = 0,
  message = '',
  isComplete = false,
  hasError = false,
  sx = {} 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 단계별 아이콘 결정
  const getStepIcon = (stepIndex, stepStatus) => {
    if (hasError && stepIndex === currentStep) return <ErrorIcon color="error" />;
    if (stepIndex < currentStep) return <CheckCircle color="success" />;
    if (stepIndex === currentStep) return <PlayArrow color="primary" />;
    return <HourglassEmpty color="disabled" />;
  };

  // 진행률 바 색상 결정
  const getProgressColor = () => {
    if (hasError) return 'error';
    if (isComplete) return 'success';
    return 'primary';
  };

  return (
    <Box sx={{ 
      width: '100%', 
      p: 3,
      backgroundColor: 'background.paper',
      borderRadius: 2,
      border: `1px solid ${theme.palette.divider}`,
      ...sx 
    }}>
      {/* 헤더 */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom align="center">
          평가 진행 상황
        </Typography>
        
        {/* 전체 진행률 */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              전체 진행률
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={getProgressColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* 현재 상태 메시지 */}
        {message && (
          <Box textAlign="center" mb={2}>
            <Chip
              label={message}
              color={hasError ? 'error' : isComplete ? 'success' : 'primary'}
              variant={hasError ? 'filled' : 'outlined'}
              size="small"
            />
          </Box>
        )}
      </Box>
      
      {/* 단계별 진행상황 */}
      {steps && steps.length > 0 ? (
        <Stepper 
          activeStep={currentStep} 
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ mt: 2 }}
        >
          {steps.map((step, index) => {
            const stepStatus = step.status || (
              index < currentStep ? 'completed' :
              index === currentStep ? 'active' : 'pending'
            );

            return (
              <Step key={step.id || index} completed={stepStatus === 'completed'}>
                <StepLabel 
                  icon={getStepIcon(index, stepStatus)}
                  error={stepStatus === 'error'}
                >
                  <Stack spacing={0.5}>
                    <Typography variant={isMobile ? 'body2' : 'body1'}>
                      {step.title || step.label || step.name || `단계 ${index + 1}`}
                    </Typography>
                    {step.description && (
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    )}
                    {step.duration && (
                      <Typography variant="caption" color="text.secondary">
                        소요시간: {step.duration}ms
                      </Typography>
                    )}
                  </Stack>
                </StepLabel>
                
                {/* 모바일에서 세부 내용 표시 */}
                {isMobile && (
                  <StepContent>
                    {step.progress !== undefined && (
                      <Box mt={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={step.progress} 
                          size="small"
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    )}
                  </StepContent>
                )}
              </Step>
            );
          })}
        </Stepper>
      ) : (
        // 단계 정보가 없을 때 기본 메시지
        <Box textAlign="center" py={2}>
          <Typography variant="body2" color="text.secondary">
            {hasError ? '평가 중 오류가 발생했습니다.' :
             isComplete ? '평가가 완료되었습니다.' :
             '평가를 진행 중입니다...'}
          </Typography>
        </Box>
      )}

      {/* 완료/오류 상태 추가 정보 */}
      {(isComplete || hasError) && (
        <Box mt={3} textAlign="center">
          <Chip
            label={isComplete ? '평가 완료' : '평가 실패'}
            color={isComplete ? 'success' : 'error'}
            variant="filled"
            icon={isComplete ? <CheckCircle /> : <ErrorIcon />}
          />
        </Box>
      )}
    </Box>
  );
};

export default ProgressTracker; 