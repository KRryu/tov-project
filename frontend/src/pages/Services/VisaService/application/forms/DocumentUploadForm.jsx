import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box, List, ListItem, ListItemIcon, ListItemText, Divider, 
  CircularProgress, Alert, AlertTitle, Paper, LinearProgress, Card, CardContent, Grid, Stepper, Step, StepLabel, useTheme, Chip, Tooltip, IconButton } from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import visaService from '../../../../api/services/visaService';
import ResultDisplay from './ResultDisplay';
import ProgressTracker from '../../../../components/common/ProgressTracker';

// visaService로 이름 재지정
const visaServiceDefault = visaService;

// 기본 요구 서류
const baseRequiredDocuments = [
  { id: 'passport', name: '여권', required: true, description: '유효한 여권 스캔본' },
  { id: 'photo', name: '증명사진', required: true, description: '최근 6개월 이내 촬영된 흰색 배경의 증명사진' }
];

// 비자 유형별 추가 요구 서류
const visaTypeDocuments = {
  // A 비자 (외교/공무)
  'A-1': [
    { id: 'diplomatic_note', name: '외교공한', required: true, description: '외교공관에서 발급한 공한' }
  ],
  'A-2': [
    { id: 'assignment_letter', name: '파견명령서', required: true, description: '해당 정부 또는 국제기구에서 발급한 파견명령서' },
    { id: 'official_letter', name: '공식 공문', required: true, description: '해당국 담당기관의 공식 공문' }
  ],
  'A-3': [
    { id: 'agreement_document', name: '협정서류', required: true, description: '한국과의 협정 내용이 명시된 서류' },
    { id: 'official_letter', name: '공식 공문', required: true, description: '해당국 담당기관의 공식 공문' }
  ],
  
  // B 비자 (사증면제)
  'B-1': [
    { id: 'travel_plan', name: '여행계획서', required: true, description: '한국 내 여행 계획서' }
  ],
  'B-2': [
    { id: 'travel_plan', name: '여행계획서', required: true, description: '한국 내 여행 계획서' },
    { id: 'hotel_reservation', name: '숙소예약증', required: false, description: '한국 내 숙소 예약 증명서' },
    { id: 'travel_ticket', name: '왕복항공권', required: false, description: '귀국 또는 제3국행 항공권 사본' }
  ],
  
  // C 비자 (단기체류)
  'C-1': [
    { id: 'press_card', name: '기자증', required: true, description: '본국 언론사에서 발급한 기자증' },
    { id: 'assignment_letter', name: '파견명령서', required: true, description: '언론사에서 발급한 파견명령서' },
    { id: 'reporting_plan', name: '취재계획서', required: true, description: '한국 내 취재 활동 계획서' }
  ],
  'C-3': [
    { id: 'travel_plan', name: '여행계획서', required: false, description: '한국 내 여행 계획서' },
    { id: 'hotel_reservation', name: '숙소예약증', required: false, description: '숙소 예약 증명서' }
  ],
  'C-4': [
    { id: 'employment_contract', name: '단기고용계약서', required: true, description: '90일 이내의 단기 고용계약서' },
    { id: 'company_invitation', name: '초청장', required: true, description: '한국 내 고용주의 초청장' },
    { id: 'business_registration', name: '사업자등록증', required: true, description: '초청 기업의 사업자등록증' }
  ],
  
  // D 비자 (일반/유학)
  'D-1': [
    { id: 'invitation_letter', name: '초청장', required: true, description: '한국 문화/예술 기관의 초청장' },
    { id: 'activity_plan', name: '활동계획서', required: true, description: '한국에서의 문화/예술 활동 계획서' }
  ],
  'D-2': [
    { id: 'admission_letter', name: '입학허가서', required: true, description: '대학에서 발급한 입학허가서' },
    { id: 'transcript', name: '성적증명서', required: true, description: '이전 학교의 성적증명서' },
    { id: 'bank_statement', name: '은행잔고증명서', required: true, description: '체류기간 동안의 생활비를 증명할 수 있는 은행잔고증명서' }
  ],
  'D-3': [
    { id: 'training_certificate', name: '연수허가서', required: true, description: '연수기관에서 발급한 연수허가서' },
    { id: 'company_registration', name: '회사등록증', required: true, description: '연수 제공 회사의 등록증' }
  ],
  'D-4': [
    { id: 'admission_letter', name: '입학허가서', required: true, description: '어학원/교육기관 입학허가서' },
    { id: 'bank_statement', name: '은행잔고증명서', required: true, description: '체류기간 동안의 생활비 증명' }
  ],
  'D-5': [
    { id: 'press_card', name: '기자증', required: true, description: '본국 언론사에서 발급한 기자증' },
    { id: 'assignment_letter', name: '파견명령서', required: true, description: '언론사에서 발급한 파견명령서' },
    { id: 'reporting_plan', name: '장기취재계획서', required: true, description: '한국 내 장기 취재 활동 계획서' }
  ],
  'D-6': [
    { id: 'invitation_letter', name: '초청장', required: true, description: '한국 종교단체의 초청장' },
    { id: 'religious_certificate', name: '종교단체증명서', required: true, description: '해당 종교단체의 등록증 또는 설립인가증' },
    { id: 'religious_activity_plan', name: '종교활동계획서', required: true, description: '한국 내 종교활동 계획서' }
  ],
  'D-7': [
    { id: 'assignment_letter', name: '파견명령서', required: true, description: '본사에서 발급한 파견명령서' },
    { id: 'employment_certificate', name: '재직증명서', required: true, description: '본사 재직증명서' },
    { id: 'company_registration', name: '본사등록증', required: true, description: '해외 본사의 법인등록증' },
    { id: 'branch_registration', name: '지사등록증', required: true, description: '한국 지사의 사업자등록증' }
  ],
  'D-8': [
    { id: 'investment_certificate', name: '투자증명서', required: true, description: '외국인투자기업 등록증' },
    { id: 'business_plan', name: '사업계획서', required: true, description: '한국 내 사업 계획서' },
    { id: 'company_registration', name: '회사등록증', required: true, description: '한국 회사의 사업자등록증' },
    { id: 'investment_proof', name: '투자금입금증명', required: true, description: '투자금 입금 증명 서류' }
  ],
  'D-9': [
    { id: 'employment_certificate', name: '재직증명서', required: true, description: '본사 재직증명서' },
    { id: 'assignment_letter', name: '파견명령서', required: true, description: '해외 본사의 파견명령서' },
    { id: 'branch_registration', name: '지점등록증', required: true, description: '한국 지점의 사업자등록증' },
    { id: 'trade_documents', name: '무역실적증빙', required: true, description: '무역 실적 증빙 서류' }
  ],
  'D-10': [
    { id: 'education_certificate', name: '학력증명서', required: true, description: '학사 이상의 학위 증명서' },
    { id: 'career_certificate', name: '경력증명서', required: false, description: '관련 분야 경력 증명서' },
    { id: 'job_search_plan', name: '구직활동계획서', required: true, description: '한국 내 구직활동 계획서' }
  ],
  
  // E 비자 (전문직)
  'E-1': [
    { id: 'diploma', name: '학위 증명서', required: true, description: '최종 학위 증명서 (박사/석사 학위) - 점수 계산의 핵심 요소' },
    { id: 'career_certificate', name: '경력 증명서', required: true, description: '관련 분야 경력 증명서 - 경력 기간과 직위가 명시되어야 함' },
    { id: 'publication_list', name: '논문/저서 목록', required: false, description: '발표한 논문이나 저서 목록 - 논문 실적 점수에 반영됨' },
    { id: 'employment_contract', name: '고용계약서', required: true, description: '한국 초청 기관과의 고용 계약서 - 연봉 정보 포함' },
    { id: 'institution_certificate', name: '기관 증명서', required: true, description: '초청 기관의 등록증 또는 증명서 - 기관 유형 확인용' }
  ],
  'E-2': [
    { id: 'diploma', name: '학위 증명서', required: true, description: '최종 학위 증명서 (학사 이상)' },
    { id: 'teaching_certificate', name: '교원 자격증', required: false, description: '교원 자격증 또는 관련 자격증' },
    { id: 'employment_contract', name: '고용 계약서', required: true, description: '한국 교육 기관과의 고용 계약서' },
    { id: 'criminal_record', name: '범죄경력증명서', required: true, description: '본국에서 발급한 범죄경력증명서' }
  ],
  'E-3': [
    { id: 'diploma', name: '학위 증명서', required: true, description: '최종 학위 증명서 (관련 분야)' },
    { id: 'career_certificate', name: '경력 증명서', required: true, description: '연구 분야 경력 증명서' },
    { id: 'research_plan', name: '연구계획서', required: true, description: '한국에서의 연구 활동 계획서' },
    { id: 'invitation_letter', name: '초청장', required: true, description: '한국 연구기관의 초청장' }
  ],
  'E-4': [
    { id: 'diploma', name: '학위 증명서', required: true, description: '최종 학위 증명서' },
    { id: 'career_certificate', name: '경력 증명서', required: true, description: '기술 분야 경력 증명서' },
    { id: 'employment_contract', name: '고용 계약서', required: true, description: '한국 기업과의 기술지도 계약서' }
  ],
  'E-5': [
    { id: 'professional_license', name: '전문자격증', required: true, description: '해당 분야 전문자격증' },
    { id: 'career_certificate', name: '경력 증명서', required: true, description: '관련 분야 경력 증명서' },
    { id: 'employment_contract', name: '고용 계약서', required: true, description: '한국 고용주와의 계약서' }
  ],
  'E-6': [
    { id: 'career_certificate', name: '경력 증명서', required: true, description: '예술/공연 분야 경력 증명서' },
    { id: 'performance_contract', name: '공연 계약서', required: true, description: '한국에서의 공연/활동 계약서' },
    { id: 'sponsor_letter', name: '스폰서 레터', required: true, description: '한국 내 공연/활동 주최측의 초청장' }
  ],
  'E-7': [
    { id: 'employment_contract', name: '고용계약서', required: true, description: '한국 회사와의 고용계약서' },
    { id: 'business_registration', name: '사업자등록증', required: true, description: '고용회사의 사업자등록증' },
    { id: 'resume', name: '이력서', required: true, description: '영문 이력서' },
    { id: 'diploma', name: '학위증명서', required: true, description: '최종 학위 증명서' }
  ],
  'E-8': [
    { id: 'employment_contract', name: '고용계약서', required: true, description: '계절근로 고용계약서' },
    { id: 'local_government_approval', name: '지자체추천서', required: true, description: '지방자치단체장의 추천서' },
    { id: 'work_plan', name: '근로계획서', required: true, description: '계절적 근로활동 계획서' }
  ],
  'E-9': [
    { id: 'employment_contract', name: '고용허가서', required: true, description: '고용허가제에 따른 고용허가서' },
    { id: 'medical_certificate', name: '건강진단서', required: true, description: '지정병원 발급 건강진단서' }
  ],
  'E-10': [
    { id: 'employment_contract', name: '선원고용계약서', required: true, description: '선박회사와의 고용계약서' },
    { id: 'seaman_book', name: '선원수첩', required: true, description: '본국에서 발급한 선원수첩' }
  ],
  
  // F 비자 (장기체류)
  'F-1': [
    { id: 'family_relation', name: '가족관계증명서', required: true, description: '한국인 가족과의 관계 증명서류' },
    { id: 'invitation_letter', name: '초청장', required: true, description: '한국인 가족의 초청장' }
  ],
  'F-2': [
    { id: 'point_calculation', name: '점수계산표', required: true, description: '거주자격 점수계산표' },
    { id: 'income_proof', name: '소득증명서', required: true, description: '한국 내 소득 증명서류' }
  ],
  'F-3': [
    { id: 'marriage_certificate', name: '결혼증명서', required: true, description: '배우자 관계 증명 서류' },
    { id: 'main_visa_copy', name: '주비자 사본', required: true, description: '주 비자 소지자의 비자 사본' }
  ],
  'F-4': [
    { id: 'family_relation', name: '가족관계증명서', required: true, description: '한국 국적자와의 가족관계를 증명하는 서류' },
    { id: 'birth_certificate', name: '출생증명서', required: true, description: '출생증명서' }
  ],
  'F-5': [
    { id: 'residence_proof', name: '체류증명서', required: true, description: '한국 내 장기체류 증명서류' },
    { id: 'income_proof', name: '소득증명서', required: true, description: '안정적인 소득 증명 서류' }
  ],
  'F-6': [
    { id: 'marriage_certificate', name: '혼인관계증명서', required: true, description: '혼인관계증명서' },
    { id: 'spouse_id', name: '배우자 신분증', required: true, description: '한국인 배우자의 신분증 사본' },
    { id: 'financial_proof', name: '재정능력 증명서류', required: true, description: '재정능력을 증명할 수 있는 서류' }
  ],
  
  // G, H 비자
  'G-1': [
    { id: 'support_document', name: '특수상황 증빙서류', required: true, description: '해당 특수상황을 증명하는 서류' }
  ],
  'H-1': [
    { id: 'working_holiday_agreement', name: '워킹홀리데이 동의서', required: true, description: '워킹홀리데이 협정 동의서' },
    { id: 'bank_statement', name: '은행잔고증명서', required: true, description: '체류기간 동안의 생활비 증명' }
  ],
  'H-2': [
    { id: 'family_relation', name: '가족관계증명서', required: true, description: '한국계 외국인임을 증명하는 서류' },
    { id: 'invitation_letter', name: '초청장', required: false, description: '한국 내 초청자의 초청장' },
    { id: 'work_plan', name: '취업활동계획서', required: true, description: '한국 내 취업활동 계획서' }
  ],
  
  // 외국인 등록증 관련 서류
  '외국인등록증': [
    { id: 'alien_card_application', name: '외국인등록 신청서', required: true, description: '외국인등록 신청서' },
    { id: 'passport_copy', name: '여권 사본', required: true, description: '유효한 여권 사본' },
    { id: 'residence_proof', name: '거주지 증명서류', required: true, description: '한국 내 거주지 증명 서류' },
    { id: 'visa_document', name: '체류자격 증명서류', required: true, description: '해당 체류자격을 증명하는 서류' }
  ]
};

const DocumentUploadForm = ({ 
  visaType, 
  initialData = {}, 
  onPrevious, 
  onComplete,
  applicationId,
  evaluationResult,
  currentStep,
  steps
}) => {
  const theme = useTheme();
  const [uploadedDocuments, setUploadedDocuments] = useState(initialData.documents || {});
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const fileInputRefs = useRef({});

  // 필요 서류 목록 불러오기 - 하드코딩된 목록만 사용하도록 단순화
  const loadRequiredDocuments = () => {
    try {
      console.log(`필요 서류 목록 로드 중... 비자유형: ${visaType}`);
      
      // 기본 공통 서류
      let documents = [...baseRequiredDocuments];
      
      // 비자 유형에 맞는 추가 서류
      const normalizedVisaType = visaType?.replace(/\s+/g, ''); // 공백 제거
      
      if (normalizedVisaType && visaTypeDocuments[normalizedVisaType]) {
        console.log(`${normalizedVisaType} 비자 유형에 대한 추가 서류 로드`);
        documents = [...documents, ...visaTypeDocuments[normalizedVisaType]];
      } else {
        console.log(`${normalizedVisaType} 비자 유형에 대한 특정 서류 정보가 없음, 기본 서류만 사용`);
      }
      
      // 각 문서 항목에 표준 구조 적용
      const standardizedDocs = documents.map(doc => ({
        type: doc.id || doc.type,
        name: doc.name,
        description: doc.description || '',
        required: doc.required === undefined ? true : doc.required,
        acceptedFormats: doc.acceptedFormats || ['jpg', 'png', 'pdf']
      }));
      
      console.log('로드된 문서 목록:', standardizedDocs);
      setRequiredDocuments(standardizedDocs);
    } catch (error) {
      console.error('필요 서류 설정 중 오류:', error);
      toast.error('필요 서류 목록을 설정하는 중 오류가 발생했습니다.');
      // 오류 발생 시 기본 서류만 설정
      setRequiredDocuments(baseRequiredDocuments.map(doc => ({
        type: doc.id || doc.type,
        name: doc.name,
        description: doc.description || '',
        required: true,
        acceptedFormats: ['jpg', 'png', 'pdf']
      })));
    }
  };

  // 파일 업로드 처리 - 완전 단순화
  const handleFileUpload = (event, docType) => {
    const file = event.target.files[0];
    
    // 파일 선택 취소된 경우
    if (!file) return;
    
    try {
      console.log(`파일 선택됨: ${docType} - ${file.name}`);
      
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      
      // 바로 성공 처리 (실제로는 여기서 API 호출이 필요함)
      setUploadedDocuments(prev => ({
        ...prev,
        [docType]: {
          id: 'local-' + Date.now(),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date()
        }
      }));
      
      toast.success(`${getDocumentName(docType)} 업로드 완료`);
      
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      toast.error('파일 처리 중 오류가 발생했습니다.');
    } finally {
      // 입력 필드 초기화
      event.target.value = '';
    }
  };

  // 파일 삭제 처리 - 단순화
  const handleDeleteFile = (docType) => {
    try {
      console.log(`파일 삭제: ${docType}`);
      
      // 해당 문서 타입의 업로드 정보가 없으면 아무것도 하지 않음
      if (!uploadedDocuments[docType]) return;
      
      // 로컬 상태에서 해당 문서 정보 제거
      setUploadedDocuments(prev => {
        const newDocs = { ...prev };
        delete newDocs[docType];
        return newDocs;
      });
      
      toast.success(`${getDocumentName(docType)} 삭제 완료`);
      
    } catch (error) {
      console.error('파일 삭제 중 오류:', error);
      toast.error('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  // 필요한 문서 이름 가져오기
  const getDocumentName = (docType) => {
    const doc = requiredDocuments.find(d => d.type === docType);
    return doc ? doc.name : '알 수 없는 문서';
  };

  // 필수 문서가 모두 업로드되었는지 확인
  const checkRequiredDocuments = () => {
    // 필수 문서 목록이 비어있으면 통과 처리
    if (requiredDocuments.length === 0) {
      return true;
    }
    
    // 업로드된 문서 타입 목록
    const uploadedTypes = Object.keys(uploadedDocuments);
    
    // 필수 문서 목록
    const requiredTypes = requiredDocuments
      .filter(doc => doc.required)
      .map(doc => doc.type);
    
    console.log('필수 문서 확인:', { 
      필수문서: requiredTypes, 
      업로드됨: uploadedTypes
    });
    
    // 모든 필수 문서가 업로드되었는지 확인
    return requiredTypes.every(type => uploadedTypes.includes(type));
  };

  // 누락된 필수 문서 목록 가져오기
  const getMissingRequiredDocuments = () => {
    if (requiredDocuments.length === 0) {
      return [];
    }
    
    const uploadedTypes = Object.keys(uploadedDocuments);
    const requiredTypes = requiredDocuments
      .filter(doc => doc.required)
      .map(doc => doc.type);
    
    return requiredTypes.filter(type => !uploadedTypes.includes(type))
      .map(type => {
        const doc = requiredDocuments.find(d => d.type === type);
        return doc ? doc.name : type;
      });
  };

  // 신청 완료 처리 - 단순화
  const handleComplete = () => {
    try {
      // 필수 서류 확인
      const allRequiredUploaded = checkRequiredDocuments();
      if (!allRequiredUploaded) {
        const missingDocs = getMissingRequiredDocuments();
        toast.error(`다음 필수 서류가 누락되었습니다: ${missingDocs.join(', ')}`);
        return;
      }
      
      // 완료 표시
      setIsCompleting(true);
      
      // 업로드된 서류 데이터 준비
      const uploadedDocs = { ...uploadedDocuments };
      
      console.log('서류 업로드 완료, 다음 단계로 이동 데이터:', uploadedDocs);
      
      // 토스트 메시지
      toast.success('서류 업로드가 완료되었습니다. 결과 확인 단계로 이동합니다.');
      
      // 페이지 최상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 부모 컴포넌트에 완료 알림
      if (typeof onComplete === 'function') {
        // 결과 데이터와 함께 서류 업로드 정보 전달
        onComplete({ 
          documents: uploadedDocs,
          applicationId: applicationId,
          evaluationResult: evaluationResult,
          redirectToResult: true  // 결과 페이지로 리디렉션하도록 플래그 추가
        });
        
        setTimeout(() => {
          setIsCompleting(false);
        }, 500);
      } else {
        console.error('onComplete 함수가 제공되지 않았습니다');
        setIsCompleting(false);
      }
    } catch (error) {
      console.error('서류 업로드 완료 처리 중 오류:', error);
      toast.error('서류 업로드 완료 처리 중 오류가 발생했습니다.');
      setIsCompleting(false);
    }
  };

  // 초기화 - 필요 서류 목록 및 기존 업로드 정보 가져오기
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        console.log('DocumentUploadForm 초기화 - visaType:', visaType, 'applicationId:', applicationId);
        
        // visaType이 없으면 기본 서류 목록만 표시
        if (!visaType) {
          toast.warning('비자 유형이 선택되지 않았습니다. 이전 단계에서 비자 유형을 선택해주세요.');
          setRequiredDocuments(baseRequiredDocuments.map(doc => ({
            type: doc.id || doc.type,
            name: doc.name,
            description: doc.description || '',
            required: true,
            acceptedFormats: ['jpg', 'png', 'pdf']
          })));
          setIsLoading(false);
          return;
        }
        
        // 필요 서류 목록 로드 - 하드코딩된 목록 사용
        loadRequiredDocuments();
        
        // 기존 업로드 정보 확인
        if (applicationId) {
          try {
            const applicationDetails = await visaService.getApplicationDetails(applicationId);
            
            if (applicationDetails && applicationDetails.documents && applicationDetails.documents.length > 0) {
              // 기존 업로드된 문서 정보 매핑
              const existingDocs = {};
              applicationDetails.documents.forEach(doc => {
                existingDocs[doc.documentType] = {
                  id: doc._id,
                  name: doc.originalName,
                  type: doc.fileType,
                  uploadedAt: doc.uploadDate
                };
              });
              
              setUploadedDocuments(existingDocs);
            }
          } catch (error) {
            console.error('기존 신청서 정보 로드 중 오류:', error);
          }
        } else {
          console.warn('applicationId가 제공되지 않아 기존 문서를 로드할 수 없습니다.');
        }
      } catch (error) {
        console.error('초기화 중 오류:', error);
        toast.error('필요 서류 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // visaType이 있으면 초기화 진행
    if (visaType) {
      initialize();
    }
  }, [visaType, applicationId]);

  return (
    <Box>
      {/* 단계 표시 - 서류 준비 단계 (3단계) */}
      {steps && (
        <Box sx={{ mb: 4 }}>
          <ProgressTracker 
            key={`progress-tracker-${currentStep || 3}`}
            steps={steps} 
            currentStep={currentStep || 3}
            sx={{ 
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              borderRadius: '12px',
              p: { xs: 2, md: 3 }
            }} 
          />
        </Box>
      )}
    
      <Typography variant="h5" color="primary" gutterBottom>
        필요 서류 제출
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        {visaType} 비자 신청에 필요한 서류를 업로드해주세요. <strong>*</strong> 표시는 필수 서류입니다.
      </Typography>
      
      {/* 필요 서류 목록 */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
        필요 서류 목록
      </Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Card variant="outlined" sx={{ mb: 4, borderRadius: '8px', bgcolor: 'background.paper' }}>
          <List>
            {requiredDocuments.map((doc) => (
              <ListItem 
                key={doc.type}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:last-child': {
                    borderBottom: 'none'
                  },
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon>
                  {uploadedDocuments[doc.type] ? (
                    <CheckCircleIcon color="success" />
                  ) : doc.required ? (
                    <ArticleIcon color="primary" />
                  ) : (
                    <ArticleIcon color="action" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                        {doc.name}
                      </Typography>
                      {doc.required && (
                        <Chip 
                          label="필수" 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={doc.description}
                />
                <Box>
                  {uploadedDocuments[doc.type] ? (
                    <Tooltip title="문서 삭제">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteFile(doc.type)}
                        disabled={isCompleting}
                        sx={{ '&:hover': { bgcolor: 'error.lighter' } }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      startIcon={<UploadFileIcon />}
                      disabled={isCompleting}
                      sx={{ ml: 2 }}
                    >
                      업로드
                      <input
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileUpload(e, doc.type)}
                      />
                    </Button>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
      
      {/* 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => {
            // 페이지 최상단으로 스크롤
            window.scrollTo({ top: 0, behavior: 'smooth' });
            onPrevious();
          }}
          disabled={isCompleting}
          startIcon={<ArrowBackIcon />}
        >
          이전으로
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleComplete}
          disabled={isCompleting || !checkRequiredDocuments()}
        >
          {isCompleting ? <CircularProgress size={24} /> : '다음 단계로'}
        </Button>
      </Box>
    </Box>
  );
};

export default DocumentUploadForm; 