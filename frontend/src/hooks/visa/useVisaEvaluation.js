/**
 * 비자 평가 관련 Custom Hook
 * 평가 프로세스 관리 및 상태 처리
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { evaluationService } from '../../api/services/visa';

const useVisaEvaluation = (visaType, applicationType) => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluationHistory, setEvaluationHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState('form'); // form, result, next
  const [error, setError] = useState(null);

  // 평가 실행
  const evaluate = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const evaluationData = {
        visaType,
        applicationType,
        applicantInfo: formData
      };
      
      const response = await evaluationService.evaluate(evaluationData);
      
      if (response.success) {
        setEvaluationResult(response.data);
        setCurrentStep('result');
        
        // 평가 결과 저장 (로컬 스토리지)
        const historyItem = {
          id: response.data.evaluationId,
          visaType,
          applicationType,
          score: response.data.score,
          eligible: response.data.eligible,
          timestamp: new Date().toISOString()
        };
        
        const history = JSON.parse(localStorage.getItem('evaluationHistory') || '[]');
        history.unshift(historyItem);
        localStorage.setItem('evaluationHistory', JSON.stringify(history.slice(0, 10))); // 최근 10개만 저장
        
        // 성공 메시지
        if (response.data.eligible) {
          toast.success('평가가 완료되었습니다. 비자 신청이 가능합니다!');
        } else {
          toast.warning('평가가 완료되었습니다. 자격 요건을 확인해주세요.');
        }
      } else {
        throw new Error(response.message || '평가 실행에 실패했습니다');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err.message || '평가 중 오류가 발생했습니다');
      toast.error(err.message || '평가 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }, [visaType, applicationType]);

  // 빠른 자격 체크
  const quickCheck = useCallback(async (basicInfo) => {
    setLoading(true);
    
    try {
      const response = await evaluationService.quickCheck({
        visaType,
        applicationType,
        ...basicInfo
      });
      
      return response.data;
    } catch (err) {
      console.error('Quick check error:', err);
      toast.error('빠른 체크 중 오류가 발생했습니다');
      return null;
    } finally {
      setLoading(false);
    }
  }, [visaType, applicationType]);

  // 평가 이력 조회
  const loadHistory = useCallback(async () => {
    try {
      // 로컬 스토리지에서 먼저 확인
      const localHistory = JSON.parse(localStorage.getItem('evaluationHistory') || '[]');
      setEvaluationHistory(localHistory);
      
      // 서버에서도 조회 (로그인한 경우)
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await evaluationService.getHistory(userId);
        if (response.success) {
          setEvaluationHistory(response.data);
        }
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  // 평가 결과 다운로드
  const downloadResult = useCallback(async () => {
    if (!evaluationResult?.evaluationId) return;
    
    setLoading(true);
    try {
      await evaluationService.downloadPDF(evaluationResult.evaluationId);
      toast.success('평가 결과가 다운로드되었습니다');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('다운로드에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [evaluationResult]);

  // 평가 결과 공유
  const shareResult = useCallback(async (shareOptions = {}) => {
    if (!evaluationResult?.evaluationId) return;
    
    setLoading(true);
    try {
      const response = await evaluationService.share(
        evaluationResult.evaluationId, 
        shareOptions
      );
      
      if (response.success) {
        // 공유 링크 복사
        await navigator.clipboard.writeText(response.data.shareUrl);
        toast.success('공유 링크가 클립보드에 복사되었습니다');
        return response.data.shareUrl;
      }
    } catch (err) {
      console.error('Share error:', err);
      toast.error('공유에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [evaluationResult]);

  // 다음 단계 진행
  const proceedToNext = useCallback(() => {
    if (!evaluationResult?.eligible) {
      toast.error('자격 요건을 충족하지 못해 진행할 수 없습니다');
      return;
    }
    
    // 평가 결과를 세션 스토리지에 저장
    sessionStorage.setItem('evaluationResult', JSON.stringify(evaluationResult));
    
    // 다음 단계로 이동
    navigate(`/services/visa/application`, {
      state: {
        visaType,
        applicationType,
        evaluationResult
      }
    });
  }, [evaluationResult, visaType, applicationType, navigate]);

  // 재평가
  const reevaluate = useCallback(async (updatedData) => {
    if (!evaluationResult?.evaluationId) return;
    
    setLoading(true);
    try {
      const response = await evaluationService.reevaluate(
        evaluationResult.evaluationId,
        updatedData
      );
      
      if (response.success) {
        setEvaluationResult(response.data);
        toast.success('재평가가 완료되었습니다');
      }
    } catch (err) {
      console.error('Reevaluation error:', err);
      toast.error('재평가에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [evaluationResult]);

  // 평가 초기화
  const resetEvaluation = useCallback(() => {
    setEvaluationResult(null);
    setCurrentStep('form');
    setError(null);
  }, []);

  // 컴포넌트 마운트 시 이력 로드
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    // 상태
    loading,
    evaluationResult,
    evaluationHistory,
    currentStep,
    error,
    
    // 액션
    evaluate,
    quickCheck,
    downloadResult,
    shareResult,
    proceedToNext,
    reevaluate,
    resetEvaluation,
    loadHistory,
    
    // 유틸리티
    isEligible: evaluationResult?.eligible || false,
    score: evaluationResult?.score || 0,
    recommendations: evaluationResult?.recommendations || []
  };
};

export default useVisaEvaluation;