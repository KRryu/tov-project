import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Divider,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  CircularProgress,
  Avatar,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  Cancel,
  Warning,
  Info,
  TrendingUp,
  TrendingDown,
  School,
  Business,
  Work,
  AttachMoney,
  Star,
  Psychology,
  Speed,
  Save,
  Share,
  Download,
  Feedback,
  Compare,
  Lightbulb,
  Timeline,
  Assessment,
  Insights
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

// Chart components (recharts 사용)
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

/**
 * 평가 상태별 색상 매핑
 */
const STATUS_COLORS = {
  'HIGHLY_LIKELY': { color: 'success', bg: '#e8f5e8', text: '#2e7d32' },
  'LIKELY': { color: 'info', bg: '#e3f2fd', text: '#1976d2' },
  'UNCERTAIN': { color: 'warning', bg: '#fff3e0', text: '#f57c00' },
  'UNLIKELY': { color: 'error', bg: '#ffebee', text: '#d32f2f' },
  'HIGHLY_UNLIKELY': { color: 'error', bg: '#ffebee', text: '#d32f2f' }
};

/**
 * 점수별 색상 계산
 */
const getScoreColor = (score) => {
  if (score >= 80) return '#4caf50';
  if (score >= 70) return '#8bc34a';
  if (score >= 60) return '#ffc107';
  if (score >= 40) return '#ff9800';
  return '#f44336';
};

/**
 * 평가 결과 메인 표시 컴포넌트
 */
const EvaluationResultDisplay = ({ 
  result, 
  onSave, 
  onShare, 
  onDownload, 
  onSubmitFeedback, 
  onCompare,
  showActions = true 
}) => {
  const theme = useTheme();
  const [expandedSection, setExpandedSection] = useState('summary');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if (!result) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              평가 결과가 없습니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_COLORS[result.status] || STATUS_COLORS['UNCERTAIN'];

  /**
   * 평가 점수 차트 데이터 준비
   */
  const radarData = result.scores ? Object.entries(result.scores).map(([key, value]) => ({
    subject: key,
    score: value,
    fullMark: 100
  })) : [];

  const barData = result.categoryScores ? Object.entries(result.categoryScores).map(([category, score]) => ({
    category,
    score,
    color: getScoreColor(score)
  })) : [];

  return (
    <Box>
      {/* 요약 헤더 */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${statusConfig.bg} 0%, ${alpha(statusConfig.bg, 0.3)} 100%)` }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* 전체 점수 */}
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Box position="relative" display="inline-flex" mb={2}>
                  <CircularProgress
                    variant="determinate"
                    value={result.totalScore || 0}
                    size={120}
                    thickness={4}
                    sx={{ color: getScoreColor(result.totalScore || 0) }}
                  />
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                  >
                    <Typography variant="h4" fontWeight="bold" color={statusConfig.text}>
                      {result.totalScore || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      / 100점
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" color={statusConfig.text}>
                  {result.statusInfo?.message || '평가 완료'}
                </Typography>
              </Box>
            </Grid>

            {/* 주요 정보 */}
            <Grid item xs={12} md={5}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    비자 유형
                  </Typography>
                  <Typography variant="h6">
                    {result.visaType} - {result.visaName || 'E-1 교육 활동'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    승인 가능성
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={result.status}
                      color={statusConfig.color}
                      variant="filled"
                      icon={
                        result.status.includes('LIKELY') ? <CheckCircle /> :
                        result.status === 'UNCERTAIN' ? <Warning /> : <Cancel />
                      }
                    />
                    {result.confidence && (
                      <Typography variant="body2" color="text.secondary">
                        신뢰도: {result.confidence}%
                      </Typography>
                    )}
                  </Box>
                </Box>

                {result.estimatedProcessingTime && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      예상 처리 기간
                    </Typography>
                    <Typography variant="body1">
                      {result.estimatedProcessingTime}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>

            {/* 액션 버튼 */}
            {showActions && (
              <Grid item xs={12} md={3}>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={onSave}
                    fullWidth
                  >
                    결과 저장
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={onShare}
                    fullWidth
                  >
                    공유하기
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={onDownload}
                    fullWidth
                  >
                    PDF 다운로드
                  </Button>
                </Stack>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* 상세 분석 섹션들 */}
      <Stack spacing={3}>
        {/* 점수 분석 */}
        <Accordion 
          expanded={expandedSection === 'scores'} 
          onChange={(e, expanded) => setExpandedSection(expanded ? 'scores' : '')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Assessment color="primary" />
              <Typography variant="h6">점수 분석</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* 레이더 차트 */}
              {radarData.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    영역별 점수
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="점수"
                        dataKey="score"
                        stroke={theme.palette.primary.main}
                        fill={theme.palette.primary.main}
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Grid>
              )}

              {/* 바 차트 */}
              {barData.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    카테고리별 점수
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip />
                      <Bar dataKey="score" fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              )}
            </Grid>

            {/* 점수 상세 테이블 */}
            {result.detailedScores && (
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  상세 점수표
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>평가 항목</TableCell>
                        <TableCell align="center">점수</TableCell>
                        <TableCell align="center">가중치</TableCell>
                        <TableCell align="center">기여도</TableCell>
                        <TableCell>비고</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(result.detailedScores).map(([item, data]) => (
                        <TableRow key={item}>
                          <TableCell>{item}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={data.score}
                              size="small"
                              style={{ backgroundColor: getScoreColor(data.score), color: 'white' }}
                            />
                          </TableCell>
                          <TableCell align="center">{data.weight}%</TableCell>
                          <TableCell align="center">{data.contribution}</TableCell>
                          <TableCell>
                            {data.note && (
                              <Typography variant="caption" color="text.secondary">
                                {data.note}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* 강점 및 약점 분석 */}
        <Accordion 
          expanded={expandedSection === 'analysis'} 
          onChange={(e, expanded) => setExpandedSection(expanded ? 'analysis' : '')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Insights color="primary" />
              <Typography variant="h6">강점 및 약점 분석</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* 강점 */}
              {result.strengths && result.strengths.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <TrendingUp color="success" />
                        <Typography variant="h6" color="success.main">
                          강점
                        </Typography>
                      </Box>
                      <List dense>
                        {result.strengths.map((strength, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <CheckCircle color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={strength.text || strength}
                              secondary={strength.impact && `영향도: ${strength.impact}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* 약점 */}
              {result.weaknesses && result.weaknesses.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <TrendingDown color="error" />
                        <Typography variant="h6" color="error.main">
                          개선 필요사항
                        </Typography>
                      </Box>
                      <List dense>
                        {result.weaknesses.map((weakness, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Warning color="warning" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={weakness.text || weakness}
                              secondary={weakness.suggestion && (
                                <Typography variant="caption" color="text.secondary">
                                  💡 {weakness.suggestion}
                                </Typography>
                              )}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* 개선 로드맵 */}
        {result.roadmap && (
          <Accordion 
            expanded={expandedSection === 'roadmap'} 
            onChange={(e, expanded) => setExpandedSection(expanded ? 'roadmap' : '')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Timeline color="primary" />
                <Typography variant="h6">개선 로드맵</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                {result.roadmap.steps?.map((step, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {index + 1}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {step.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            예상 기간: {step.timeframe} | 우선순위: {step.priority}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" paragraph>
                        {step.description}
                      </Typography>
                      
                      {step.actions && step.actions.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            구체적 액션
                          </Typography>
                          <List dense>
                            {step.actions.map((action, actionIndex) => (
                              <ListItem key={actionIndex} sx={{ px: 0 }}>
                                <ListItemIcon>
                                  <Lightbulb fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={action} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      
                      {step.expectedImprovement && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>예상 개선 효과:</strong> {step.expectedImprovement}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {/* 추천사항 및 다음 단계 */}
        {(result.recommendations || result.nextSteps) && (
          <Accordion 
            expanded={expandedSection === 'recommendations'} 
            onChange={(e, expanded) => setExpandedSection(expanded ? 'recommendations' : '')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Lightbulb color="primary" />
                <Typography variant="h6">추천사항 및 다음 단계</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* 추천사항 */}
                {result.recommendations && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      전문가 추천사항
                    </Typography>
                    <List>
                      {result.recommendations.map((rec, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Star color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={rec.title || rec}
                            secondary={rec.description}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}

                {/* 다음 단계 */}
                {result.nextSteps && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      다음 단계
                    </Typography>
                    <List>
                      {result.nextSteps.map((step, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 24, height: 24 }}>
                              <Typography variant="caption">
                                {index + 1}
                              </Typography>
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText 
                            primary={step.action || step}
                            secondary={step.timeline && `예상 소요시간: ${step.timeline}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* 대안 비자 */}
        {result.alternativeVisas && result.alternativeVisas.length > 0 && (
          <Accordion 
            expanded={expandedSection === 'alternatives'} 
            onChange={(e, expanded) => setExpandedSection(expanded ? 'alternatives' : '')}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Compare color="primary" />
                <Typography variant="h6">대안 비자 유형</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {result.alternativeVisas.map((visa, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {visa.type} - {visa.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {visa.description}
                        </Typography>
                        
                        {visa.matchScore && (
                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary">
                              적합도
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={visa.matchScore} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">
                              {visa.matchScore}%
                            </Typography>
                          </Box>
                        )}
                        
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => onCompare && onCompare(visa.type)}
                        >
                          자세히 보기
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* 메타데이터 및 시스템 정보 */}
        {result._metadata && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Info color="primary" />
                <Typography variant="h6">평가 정보</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    평가 일시
                  </Typography>
                  <Typography variant="body2">
                    {new Date(result.evaluatedAt || result._metadata.processedAt).toLocaleString('ko-KR')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    평가 버전
                  </Typography>
                  <Typography variant="body2">
                    {result._metadata.serviceVersion || '2.0'}
                    {result.isSmartEvaluation && (
                      <Chip label="지능형" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </Grid>
                
                {result._metadata.evaluationMethod && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      평가 방법
                    </Typography>
                    <Typography variant="body2">
                      {result._metadata.evaluationMethod === 'ruleEngine' ? '규칙 엔진' : '전통적 방식'}
                    </Typography>
                  </Grid>
                )}
                
                {result.v2Metadata?.processingTime && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      처리 시간
                    </Typography>
                    <Typography variant="body2">
                      {result.v2Metadata.processingTime}ms
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Stack>

      {/* 액션 버튼들 (하단) */}
      {showActions && (
        <Box mt={4} display="flex" justifyContent="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Feedback />}
            onClick={() => setFeedbackOpen(true)}
          >
            피드백 제출
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Compare />}
            onClick={onCompare}
          >
            다른 평가와 비교
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EvaluationResultDisplay; 