import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

/* -------- 타임라인 컴포넌트는 @mui/lab 에서 가져옵니다 -------- */
import Timeline           from '@mui/lab/Timeline';
import TimelineItem       from '@mui/lab/TimelineItem';
import TimelineSeparator  from '@mui/lab/TimelineSeparator';
import TimelineDot        from '@mui/lab/TimelineDot';
import TimelineConnector  from '@mui/lab/TimelineConnector';
import TimelineContent    from '@mui/lab/TimelineContent';

import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimelineIcon from '@mui/icons-material/Timeline';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import TranslateIcon from '@mui/icons-material/Translate';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import GavelIcon from '@mui/icons-material/Gavel';
import ScienceIcon from '@mui/icons-material/Science';
import SchoolIcon from '@mui/icons-material/School';
import ArticleIcon from '@mui/icons-material/Article';
import EngineeringIcon from '@mui/icons-material/Engineering';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import { useNavigate } from 'react-router-dom';
// import { useSnackbar } from 'notistack';

/* ----------------- 모듈형 내부 컴포넌트 ----------------- */
import ProgressTracker from '../../../../components/common/ProgressTracker';
import visaService from '../../../../api/services/visaService';

// 임시 컴포넌트들 (기존 코드와 호환성을 위해)
const ScoreSummary = ({ visaType, totalScore, passThreshold, isPassing, status, isPreview }) => (
  <Card sx={{ mb: 4 }}>
    <CardContent>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {visaType} 평가 결과
      </Typography>
      <Box textAlign="center" py={2}>
        <Typography variant="h2" color={isPassing ? 'success.main' : 'error.main'}>
          {totalScore}점
        </Typography>
        <Typography variant="h6" color="text.secondary">
          합격 기준: {passThreshold}점
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const InputSummary = ({ details, visaInfo, visaType, categoryInfo, inputData }) => (
  <Box>
    <Typography variant="body2" color="text.secondary">
      입력된 정보를 바탕으로 평가가 진행되었습니다.
    </Typography>
  </Box>
);

const ScoreAnalysis = ({ categoryScores, categoryInfo, passThreshold, weightedScores, visaType, details, approvalPrediction, roadmap, issues, recommendations }) => (
  <Box>
    {Object.entries(categoryScores).map(([category, score]) => (
      <Box key={category} mb={2}>
        <Typography variant="subtitle2">{category}</Typography>
        <LinearProgress variant="determinate" value={score} sx={{ height: 8, borderRadius: 4 }} />
        <Typography variant="caption">{score}점</Typography>
      </Box>
    ))}
  </Box>
);

const StrengthWeakness = ({ categoryScores, categoryInfo, recommendations, issues, weightedScores, strengths, weaknesses, showTitle, visaType, roadmap, details, approvalPrediction }) => (
  <Grid container spacing={3}>
    {strengths?.length > 0 && (
      <Grid item xs={12} md={6}>
        <Typography variant="h6" color="success.main" gutterBottom>강점</Typography>
        <List>
          {strengths.map((strength, index) => (
            <ListItem key={index}>
              <ListItemText primary={typeof strength === 'string' ? strength : strength.text} />
            </ListItem>
          ))}
        </List>
      </Grid>
    )}
    {weaknesses?.length > 0 && (
      <Grid item xs={12} md={6}>
        <Typography variant="h6" color="warning.main" gutterBottom>개선 필요사항</Typography>
        <List>
          {weaknesses.map((weakness, index) => (
            <ListItem key={index}>
              <ListItemText primary={typeof weakness === 'string' ? weakness : weakness.text} />
            </ListItem>
          ))}
        </List>
      </Grid>
    )}
  </Grid>
);

/* -------------------------------------------------------------------------- */
/*                           E-1 고도화 전용 섹션들                            */
/* -------------------------------------------------------------------------- */

const E1ApprovalPrediction = ({ prediction }) => {
  const theme = useTheme();

  const schemes = {
    very_low: { bg: theme.palette.error.light, color: theme.palette.error.dark, icon: '😟' },
    low: { bg: theme.palette.warning.light, color: theme.palette.warning.dark, icon: '😐' },
    medium: { bg: theme.palette.info.light, color: theme.palette.info.dark, icon: '🙂' },
    high: { bg: theme.palette.success.light, color: theme.palette.success.dark, icon: '😊' },
  };
  const scheme = schemes[prediction.chance] || schemes.medium;

  return (
    <Card elevation={0} sx={{ border: `2px solid ${scheme.color}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: scheme.bg, width: 48, height: 48, mr: 2 }}>
            <AutoAwesomeIcon sx={{ color: scheme.color }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              AI 승인 가능성 예측
            </Typography>
            <Typography variant="body2" color="text.secondary">
              실제 합격 사례 분석 기반
            </Typography>
          </Box>
          <Chip label="고도화 평가" size="small" color="primary" variant="outlined" />
        </Box>

        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(scheme.bg, 0.3),
            border: `1px dashed ${scheme.color}`,
          }}
        >
          <Typography variant="h1" sx={{ fontSize: 64, fontWeight: 'bold', color: scheme.color }}>
            {prediction.percentage}%
          </Typography>
          <Typography
            variant="h5"
            sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          >
            <span style={{ fontSize: 32 }}>{scheme.icon}</span>
            {prediction.description}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={prediction.percentage}
          sx={{
            mt: 3,
            height: 12,
            borderRadius: 6,
            bgcolor: alpha(scheme.bg, 0.3),
            '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: scheme.color },
          }}
        />
      </CardContent>
    </Card>
  );
};

const E1Roadmap = ({ roadmap }) => {
  const theme = useTheme();
  const [open, setOpen] = useState('immediate');

  const phases = [
    { key: 'immediate', title: '즉시 실행', subtitle: '1-3개월', color: 'error', icon: <PriorityHighIcon /> },
    { key: 'shortTerm', title: '단기 과제', subtitle: '3-6개월', color: 'warning', icon: <TimelineIcon /> },
    { key: 'mediumTerm', title: '중기 과제', subtitle: '6-12개월', color: 'info', icon: <TrendingUpIcon /> },
    { key: 'longTerm', title: '장기 과제', subtitle: '1년 이상', color: 'success', icon: <AutoAwesomeIcon /> },
  ];

  const total = Object.values(roadmap).flat().length;

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48, mr: 2 }}>
            <TimelineIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              맞춤형 개선 로드맵
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 {total}개의 개선 과제
            </Typography>
          </Box>
        </Box>

        <Timeline position="right" sx={{ p: 0 }}>
          {phases.map((p, idx) => {
            const items = roadmap[p.key] || [];
            if (!items.length) return null;

            return (
              <TimelineItem key={p.key}>
                <TimelineSeparator>
                  <TimelineDot color={p.color}>{p.icon}</TimelineDot>
                  {idx < phases.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 4 }}>
                  <Accordion
                    expanded={open === p.key}
                    onChange={(_, exp) => setOpen(exp ? p.key : null)}
                    elevation={0}
                    sx={{ border: `1px solid ${theme.palette.divider}`, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {p.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {p.subtitle} • {items.length}개
                          </Typography>
                        </Box>
                        <Badge badgeContent={items.length} color={p.color} sx={{ mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {items.map((it, i) => (
                          <ListItem key={i} sx={{ pl: 0 }}>
                            <ListItemIcon>
                              <Chip
                                label={it.impact}
                                size="small"
                                color={it.impact === 'high' ? 'error' : it.impact === 'medium' ? 'warning' : 'default'}
                                sx={{ minWidth: 60, fontSize: '0.7rem' }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={it.action}
                              secondary={
                                it.details && (
                                  <List sx={{ pl: 2, mt: 1 }}>
                                    {it.details.map((d, j) => (
                                      <ListItem key={j} sx={{ py: 0.5 }}>
                                        <Typography variant="caption">• {d}</Typography>
                                      </ListItem>
                                    ))}
                                  </List>
                                )
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </CardContent>
    </Card>
  );
};

const E1InstitutionSuitability = ({ suitability }) => (
  <Alert severity={suitability.suitable ? 'success' : 'error'} icon={<BusinessIcon />} sx={{ mb: 2 }}>
    <AlertTitle>
      {suitability.institutionName} - {suitability.suitable ? '적합' : '부적합'}
    </AlertTitle>
    <Typography variant="body2">{suitability.message}</Typography>
    {suitability.recommendation && (
      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
        추천: {suitability.recommendation}
      </Typography>
    )}
  </Alert>
);

const E1QualificationDetails = ({ details }) => {
  const theme = useTheme();
  const ok = details.status === '충족';

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${ok ? theme.palette.success.main : theme.palette.warning.main}`,
        bgcolor: alpha(ok ? theme.palette.success.main : theme.palette.warning.main, 0.05),
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {ok ? (
            <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
          ) : (
            <WarningIcon sx={{ color: 'warning.main', mr: 1 }} />
          )}
          <Typography variant="subtitle1" fontWeight="bold">
            직급 자격 {details.status}
          </Typography>
        </Box>

        {details.requirements && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            요구사항: {details.requirements}
          </Typography>
        )}
        {details.currentQualification && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            현재 자격: {details.currentQualification}
          </Typography>
        )}

        {details.missing?.length > 0 && (
          <>
            <Typography variant="body2" color="error" fontWeight="bold">
              부족한 요건
            </Typography>
            <List dense>
              {details.missing.map((m, i) => (
                <ListItem key={i} sx={{ pl: 2 }}>
                  <Typography variant="body2" color="error">
                    • {m}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {details.exceeds && <Chip label={details.exceeds} color="success" size="small" sx={{ mt: 1 }} />}
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*                           E-2 고도화 전용 섹션들                            */
/* -------------------------------------------------------------------------- */

const E2ApprovalPrediction = ({ prediction }) => {
  const theme = useTheme();

  const schemes = {
    very_low: { bg: theme.palette.error.light, color: theme.palette.error.dark, icon: '😟' },
    low: { bg: theme.palette.warning.light, color: theme.palette.warning.dark, icon: '😐' },
    medium: { bg: theme.palette.info.light, color: theme.palette.info.dark, icon: '🙂' },
    high: { bg: theme.palette.success.light, color: theme.palette.success.dark, icon: '😊' },
  };
  const scheme = schemes[prediction.chance] || schemes.medium;

  return (
    <Card elevation={0} sx={{ border: `2px solid ${scheme.color}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: scheme.bg, width: 48, height: 48, mr: 2 }}>
            <AutoAwesomeIcon sx={{ color: scheme.color }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              AI 승인 가능성 예측
            </Typography>
            <Typography variant="body2" color="text.secondary">
              회화지도 비자 합격 사례 분석 기반
            </Typography>
          </Box>
          <Chip label="E-2 고도화 평가" size="small" color="secondary" variant="outlined" />
        </Box>

        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(scheme.bg, 0.3),
            border: `1px dashed ${scheme.color}`,
          }}
        >
          <Typography variant="h1" sx={{ fontSize: 64, fontWeight: 'bold', color: scheme.color }}>
            {prediction.percentage}%
          </Typography>
          <Typography
            variant="h5"
            sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          >
            <span style={{ fontSize: 32 }}>{scheme.icon}</span>
            {prediction.description}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={prediction.percentage}
          sx={{
            mt: 3,
            height: 12,
            borderRadius: 6,
            bgcolor: alpha(scheme.bg, 0.3),
            '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: scheme.color },
          }}
        />
      </CardContent>
    </Card>
  );
};

const E2LanguageRequirement = ({ details }) => {
  const theme = useTheme();
  const isNative = details.isNativeSpeaker && details.languageMatch;

  return (
    <Alert 
      severity={isNative ? 'success' : 'error'} 
      icon={<TranslateIcon />}
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        언어 요건 {isNative ? '충족' : '미충족'}
      </AlertTitle>
      <Typography variant="body2">
        {details.language} 교육 - {details.citizenship} 국적
      </Typography>
      {!isNative && (
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          E-2 비자는 해당 언어의 모국어 사용자만 신청 가능합니다.
        </Typography>
      )}
    </Alert>
  );
};

const E2BackgroundCheck = ({ details }) => {
  const theme = useTheme();
  const bgOk = details.backgroundCheckStatus === '양호';
  const healthOk = details.healthStatus === '양호';

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${bgOk ? theme.palette.success.main : theme.palette.error.main}`,
            bgcolor: alpha(bgOk ? theme.palette.success.main : theme.palette.error.main, 0.05),
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GavelIcon sx={{ color: bgOk ? 'success.main' : 'error.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                범죄경력 조회
              </Typography>
            </Box>
            <Typography variant="body2">
              상태: {details.backgroundCheckStatus}
            </Typography>
            {!bgOk && details.hasCriminalRecord && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                범죄경력 관련 상세 검토 필요
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${healthOk ? theme.palette.success.main : theme.palette.warning.main}`,
            bgcolor: alpha(healthOk ? theme.palette.success.main : theme.palette.warning.main, 0.05),
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalHospitalIcon sx={{ color: healthOk ? 'success.main' : 'warning.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                건강검진
              </Typography>
            </Box>
            <Typography variant="body2">
              상태: {details.healthStatus}
            </Typography>
            {!details.hasHealthCheck && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                법무부 지정병원 검진 필요
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/* -------------------------------------------------------------------------- */
/*                           E-3 고도화 전용 섹션들 (신규 추가)                   */
/* -------------------------------------------------------------------------- */

const E3ApprovalPrediction = ({ prediction }) => {
  const theme = useTheme();

  const schemes = {
    very_low: { bg: theme.palette.error.light, color: theme.palette.error.dark, icon: '😟' },
    low: { bg: theme.palette.warning.light, color: theme.palette.warning.dark, icon: '😐' },
    medium: { bg: theme.palette.info.light, color: theme.palette.info.dark, icon: '🙂' },
    high: { bg: theme.palette.success.light, color: theme.palette.success.dark, icon: '😊' },
  };
  const scheme = schemes[prediction.chance] || schemes.medium;

  return (
    <Card elevation={0} sx={{ border: `2px solid ${scheme.color}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: scheme.bg, width: 48, height: 48, mr: 2 }}>
            <ScienceIcon sx={{ color: scheme.color }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              AI 승인 가능성 예측
            </Typography>
            <Typography variant="body2" color="text.secondary">
              연구 비자 합격 사례 분석 기반
            </Typography>
          </Box>
          <Chip label="E-3 고도화 평가" size="small" color="info" variant="outlined" />
        </Box>

        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(scheme.bg, 0.3),
            border: `1px dashed ${scheme.color}`,
          }}
        >
          <Typography variant="h1" sx={{ fontSize: 64, fontWeight: 'bold', color: scheme.color }}>
            {prediction.percentage}%
          </Typography>
          <Typography
            variant="h5"
            sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          >
            <span style={{ fontSize: 32 }}>{scheme.icon}</span>
            {prediction.description}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={prediction.percentage}
          sx={{
            mt: 3,
            height: 12,
            borderRadius: 6,
            bgcolor: alpha(scheme.bg, 0.3),
            '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: scheme.color },
          }}
        />
      </CardContent>
    </Card>
  );
};

const E3ResearchField = ({ details }) => {
  const theme = useTheme();
  const isHighDemand = details.isHighDemandField;
  const fieldDemand = details.fieldDemand || 1.0;
  
  return (
    <Alert 
      severity={isHighDemand ? 'success' : 'info'} 
      icon={<ScienceIcon />}
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        연구 분야 분석
      </AlertTitle>
      <Typography variant="body2">
        연구 분야: {details.researchField} (수요 지수: {fieldDemand.toFixed(1)})
      </Typography>
      {isHighDemand ? (
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>
          고수요 연구 분야로 비자 승인에 매우 유리합니다.
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ mt: 1 }}>
          일반 연구 분야입니다. 연구 실적과 기관 적합성이 중요합니다.
        </Typography>
      )}
    </Alert>
  );
};

const E3ResearchCapability = ({ details }) => {
  const theme = useTheme();
  const publicationCount = details.publicationCount || 0;
  const projectCount = details.projectCount || 0;
  const hasPatents = details.hasPatents || false;
  
  const getPerformanceLevel = () => {
    if (publicationCount >= 5 && projectCount >= 3) return 'excellent';
    if (publicationCount >= 3 && projectCount >= 2) return 'good';
    if (publicationCount >= 2 || projectCount >= 1) return 'fair';
    return 'poor';
  };
  
  const performanceLevel = getPerformanceLevel();
  const levelColors = {
    excellent: theme.palette.success.main,
    good: theme.palette.info.main,
    fair: theme.palette.warning.main,
    poor: theme.palette.error.main
  };
  
  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${levelColors[performanceLevel]}`,
        bgcolor: alpha(levelColors[performanceLevel], 0.05),
        mb: 2
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ArticleIcon sx={{ color: levelColors[performanceLevel], mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            연구 수행 능력
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: levelColors[performanceLevel] }}>
                {publicationCount}
              </Typography>
              <Typography variant="caption">논문/출판물</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: levelColors[performanceLevel] }}>
                {projectCount}
              </Typography>
              <Typography variant="caption">프로젝트</Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: hasPatents ? theme.palette.success.main : theme.palette.grey[400] }}>
                {hasPatents ? '✓' : '✗'}
              </Typography>
              <Typography variant="caption">특허</Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2 }}>
          <Chip 
            label={
              performanceLevel === 'excellent' ? '우수한 연구 실적' :
              performanceLevel === 'good' ? '양호한 연구 실적' :
              performanceLevel === 'fair' ? '기본 연구 실적' : '연구 실적 부족'
            }
            sx={{ 
              bgcolor: levelColors[performanceLevel],
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const E3InstitutionSuitability = ({ suitability }) => {
  const theme = useTheme();
  
  return (
    <Alert severity={suitability.suitable ? 'success' : 'warning'} icon={<BusinessIcon />} sx={{ mb: 2 }}>
      <AlertTitle>
        {suitability.institutionName} - {suitability.suitable ? '적합' : '검토 필요'}
      </AlertTitle>
      <Typography variant="body2">{suitability.message}</Typography>
      {suitability.recommendation && (
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          추천: {suitability.recommendation}
        </Typography>
      )}
    </Alert>
  );
};

/* -------------------------------------------------------------------------- */
/*                           E-4 고도화 전용 섹션들                            */
/* -------------------------------------------------------------------------- */

const E4ApprovalPrediction = ({ prediction }) => {
  const theme = useTheme();

  const schemes = {
    very_low: { bg: theme.palette.error.light, color: theme.palette.error.dark, icon: '😟' },
    low: { bg: theme.palette.warning.light, color: theme.palette.warning.dark, icon: '😐' },
    medium: { bg: theme.palette.info.light, color: theme.palette.info.dark, icon: '🙂' },
    high: { bg: theme.palette.success.light, color: theme.palette.success.dark, icon: '😊' },
  };
  const scheme = schemes[prediction.chance] || schemes.medium;

  return (
    <Card elevation={0} sx={{ border: `2px solid ${scheme.color}`, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: scheme.bg, width: 48, height: 48, mr: 2 }}>
            <EngineeringIcon sx={{ color: scheme.color }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              AI 승인 가능성 예측
            </Typography>
            <Typography variant="body2" color="text.secondary">
              기술지도 비자 합격 사례 분석 기반
            </Typography>
          </Box>
          <Chip label="E-4 고도화 평가" size="small" color="warning" variant="outlined" />
        </Box>

        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 2,
            bgcolor: alpha(scheme.bg, 0.3),
            border: `1px dashed ${scheme.color}`,
          }}
        >
          <Typography variant="h1" sx={{ fontSize: 64, fontWeight: 'bold', color: scheme.color }}>
            {prediction.percentage}%
          </Typography>
          <Typography
            variant="h5"
            sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          >
            <span style={{ fontSize: 32 }}>{scheme.icon}</span>
            {prediction.description}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={prediction.percentage}
          sx={{
            mt: 3,
            height: 12,
            borderRadius: 6,
            bgcolor: alpha(scheme.bg, 0.3),
            '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: scheme.color },
          }}
        />
      </CardContent>
    </Card>
  );
};

const E4TechnicalQualification = ({ details }) => {
  const theme = useTheme();
  const qualified = details.technicalQualification === '충족';
  
  return (
    <Alert 
      severity={qualified ? 'success' : 'warning'} 
      icon={<SchoolIcon />}
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        기술 자격 요건 {details.technicalQualification}
      </AlertTitle>
      <Typography variant="body2">
        {details.qualificationDetails?.currentQualification}
      </Typography>
      {details.qualificationDetails?.note && (
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          {details.qualificationDetails.note}
        </Typography>
      )}
      {!qualified && details.qualificationDetails?.recommendation && (
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          추천: {details.qualificationDetails.recommendation}
        </Typography>
      )}
    </Alert>
  );
};

const E4GoldCardStatus = ({ details }) => {
  const theme = useTheme();
  const eligible = details.goldCardEligible;
  const hasGoldCard = details.hasGoldCard;
  
  if (!eligible) return null;
  
  return (
    <Alert 
      severity={hasGoldCard ? 'success' : 'info'} 
      icon={<WorkspacePremiumIcon />}
      sx={{ mb: 2 }}
    >
      <AlertTitle>
        GOLD CARD {hasGoldCard ? '보유' : '발급 가능'}
      </AlertTitle>
      <Typography variant="body2">
        {details.technologyFieldDisplay} 분야는 첨단산업 GOLD CARD 발급 대상입니다.
      </Typography>
      {!hasGoldCard && (
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          GOLD CARD 발급 시 비자 절차가 대폭 간소화됩니다.
        </Typography>
      )}
    </Alert>
  );
};

const E4ContractStatus = ({ details }) => {
  const theme = useTheme();
  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                계약 기간
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {details.contractPeriod}개월
            </Typography>
            <Typography variant="body2" color="text.secondary">
              비자 유효기간: {details.visaValidity}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card
          elevation={0}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.success.main, 0.05),
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoneyIcon sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                계약 금액
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {(details.contractValue / 10000).toLocaleString()}만원
            </Typography>
            <Typography variant="body2" color="text.secondary">
              계약 수준: {details.contractValueLevel}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

/* -------------------------------------------------------------------------- */
/*                             ResultDisplay 메인                              */
/* -------------------------------------------------------------------------- */

const ResultDisplay = ({
  result,
  evaluationResult,
  visaType: propVisaType,
  visaInfo,
  isPreview = false,
  onContinue,
  steps,
  isStep2 = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const finalResult = result || evaluationResult;
  if (!finalResult) {
    return (
      <Box textAlign="center" p={3}>
        <Typography color="text.secondary">평가 결과가 없습니다.</Typography>
      </Box>
    );
  }

  const {
    visaType = propVisaType,
    visaName,
    totalScore,
    status,
    passThreshold = 80,
    categoryScores = {},
    weightedScores = {},
    categoryInfo = {},
    issues = [],
    recommendations = [],
    strengths = [],
    weaknesses = [],
  } = finalResult;

  const passing = totalScore >= passThreshold;

  return (
    <Box sx={{ bgcolor: 'background.paper', p: { xs: 2, sm: 3 }, borderRadius: 2, boxShadow: theme.shadows[1] }}>
      {/* 단계 트래커 */}
      {steps && !isPreview && (
        <Box sx={{ mb: 4 }}>
          <ProgressTracker steps={steps} currentStep={2} />
        </Box>
      )}

      {/* 안내 배너 */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">본 평가는 실제 합격 데이터 기반으로 산출되었습니다.</Typography>
      </Alert>

      {/* 점수 요약 */}
      <ScoreSummary
        visaType={visaName || visaType}
        totalScore={totalScore}
        passThreshold={passThreshold}
        isPassing={passing}
        status={status}
        isPreview={isPreview}
      />

      {/* ------------- E-1 전용 고도화 섹션 ------------- */}
      {(visaType === 'E-1' || visaType === 'E1') && (
        <>
          {finalResult.approvalPrediction && (
            <Box sx={{ mb: 4 }}>
              <E1ApprovalPrediction prediction={finalResult.approvalPrediction} />
            </Box>
          )}
          {finalResult.details?.institutionSuitability && (
            <Box sx={{ mb: 4 }}>
              <E1InstitutionSuitability suitability={finalResult.details.institutionSuitability} />
            </Box>
          )}
          {finalResult.details?.qualificationDetails && (
            <Box sx={{ mb: 4 }}>
              <E1QualificationDetails details={finalResult.details.qualificationDetails} />
            </Box>
          )}
          {finalResult.roadmap && (
            <Box sx={{ mb: 4 }}>
              <E1Roadmap roadmap={finalResult.roadmap} />
            </Box>
          )}
        </>
      )}

      {/* ------------- E-2 전용 고도화 섹션 ------------- */}
      {(visaType === 'E-2' || visaType === 'E2') && (
        <>
          {finalResult.approvalPrediction && (
            <Box sx={{ mb: 4 }}>
              <E2ApprovalPrediction prediction={finalResult.approvalPrediction} />
            </Box>
          )}
          
          {finalResult.details && (
            <>
              {(finalResult.details.language && finalResult.details.citizenship) && (
                <Box sx={{ mb: 4 }}>
                  <E2LanguageRequirement details={finalResult.details} />
                </Box>
              )}
              
              {(finalResult.details.backgroundCheckStatus || finalResult.details.healthStatus) && (
                <Box sx={{ mb: 4 }}>
                  <E2BackgroundCheck details={finalResult.details} />
                </Box>
              )}
            </>
          )}
          
          {finalResult.roadmap && (
            <Box sx={{ mb: 4 }}>
              <E1Roadmap roadmap={finalResult.roadmap} />
            </Box>
          )}
        </>
      )}

      {/* ------------- E-3 전용 고도화 섹션 (신규 추가) ------------- */}
      {(visaType === 'E-3' || visaType === 'E3') && (
        <>
          {finalResult.approvalPrediction && (
            <Box sx={{ mb: 4 }}>
              <E3ApprovalPrediction prediction={finalResult.approvalPrediction} />
            </Box>
          )}
          
          {finalResult.details && (
            <>
              {finalResult.details.researchField && (
                <Box sx={{ mb: 4 }}>
                  <E3ResearchField details={finalResult.details} />
                </Box>
              )}
              
              {(finalResult.details.publicationCount !== undefined || finalResult.details.projectCount !== undefined) && (
                <Box sx={{ mb: 4 }}>
                  <E3ResearchCapability details={finalResult.details} />
                </Box>
              )}
              
              {finalResult.details.institutionSuitability && (
                <Box sx={{ mb: 4 }}>
                  <E3InstitutionSuitability suitability={finalResult.details.institutionSuitability} />
                </Box>
              )}
            </>
          )}
          
          {finalResult.roadmap && (
            <Box sx={{ mb: 4 }}>
              <E1Roadmap roadmap={finalResult.roadmap} />
            </Box>
          )}
        </>
      )}

      {/* ------------- E-4 전용 고도화 섹션 ------------- */}
      {(visaType === 'E-4' || visaType === 'E4') && (
        <>
          {finalResult.approvalPrediction && (
            <Box sx={{ mb: 4 }}>
              <E4ApprovalPrediction prediction={finalResult.approvalPrediction} />
            </Box>
          )}
          
          {finalResult.details && (
            <>
              {finalResult.details.technicalQualification && (
                <Box sx={{ mb: 4 }}>
                  <E4TechnicalQualification details={finalResult.details} />
                </Box>
              )}
              
              {finalResult.details.goldCardEligible !== undefined && (
                <Box sx={{ mb: 4 }}>
                  <E4GoldCardStatus details={finalResult.details} />
                </Box>
              )}
              
              {(finalResult.details.contractPeriod || finalResult.details.contractValue) && (
                <Box sx={{ mb: 4 }}>
                  <E4ContractStatus details={finalResult.details} />
                </Box>
              )}
            </>
          )}
          
          {finalResult.roadmap && (
            <Box sx={{ mb: 4 }}>
              <E1Roadmap roadmap={finalResult.roadmap} />
            </Box>
          )}
        </>
      )}

      {/* 입력 요약 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            입력 정보 요약
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <InputSummary
            details={finalResult.details || {}}
            visaInfo={visaInfo}
            visaType={visaType}
            categoryInfo={categoryInfo}
            inputData={finalResult.inputData}
          />
        </CardContent>
      </Card>

      {/* 점수 분석 */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            비자 점수 상세 분석
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <ScoreAnalysis
            categoryScores={categoryScores}
            categoryInfo={categoryInfo}
            passThreshold={passThreshold}
            weightedScores={weightedScores}
            visaType={visaType}
            details={finalResult.details}
            approvalPrediction={finalResult.approvalPrediction}
            roadmap={finalResult.roadmap}
            issues={issues}
            recommendations={recommendations}
          />
        </CardContent>
      </Card>

      {/* 강점/약점 */}
      {!isPreview && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              강점 및 보완점
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <StrengthWeakness
              categoryScores={categoryScores}
              categoryInfo={categoryInfo}
              recommendations={recommendations}
              issues={issues}
              weightedScores={weightedScores}
              strengths={strengths}
              weaknesses={weaknesses}
              showTitle={false}
              visaType={visaType}
              roadmap={finalResult.roadmap}
              details={finalResult.details}
              approvalPrediction={finalResult.approvalPrediction}
            />
          </CardContent>
        </Card>
      )}

      {/* 다음 단계 버튼 */}
      {!isPreview && onContinue && isStep2 && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />} onClick={onContinue}>
            다음 단계로 진행
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ResultDisplay;