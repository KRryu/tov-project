import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../useAuth';
import bridgeService from '../../api/services/bridgeService';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { JOURNEY_LEVELS } from '../../constants/bridge/programs';

export const useBridgeJourney = () => {
  const { isAuthenticated } = useAuth();
  const [userJourney, setUserJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserJourney = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bridgeService.getUserJourney();
      setUserJourney(response.data.data);
      
      // Check for level up
      checkLevelUp(response.data.data);
    } catch (error) {
      setError(error.message);
      console.error('Failed to fetch user journey:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserJourney();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchUserJourney]);

  const checkLevelUp = (journey) => {
    const prevLevel = localStorage.getItem('userLevel');
    if (prevLevel && prevLevel !== journey.level) {
      // Level up animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const levelInfo = Object.values(JOURNEY_LEVELS).find(l => l.name === journey.level);
      toast.success(`🎉 레벨업! ${levelInfo?.title || journey.level}이 되었습니다!`);
    }
    localStorage.setItem('userLevel', journey.level);
  };

  const startProgram = async (programId) => {
    try {
      const response = await bridgeService.startProgram(programId);
      setUserJourney(response.data.data);
      toast.success('프로그램을 시작했습니다!');
      return response.data;
    } catch (error) {
      toast.error('프로그램 시작에 실패했습니다.');
      throw error;
    }
  };

  const completeProgram = async (programId) => {
    try {
      const response = await bridgeService.completeProgram(programId);
      setUserJourney(response.data.data);
      
      // Celebration animation
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 }
      });
      
      toast.success('🎊 프로그램을 완료했습니다!');
      checkLevelUp(response.data.data);
      return response.data;
    } catch (error) {
      toast.error('프로그램 완료 처리에 실패했습니다.');
      throw error;
    }
  };

  const updateProgramProgress = async (programId, progress) => {
    try {
      const response = await bridgeService.updateProgramProgress(programId, progress);
      setUserJourney(response.data.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    }
  };

  const refreshJourney = () => {
    fetchUserJourney();
  };

  return {
    userJourney,
    loading,
    error,
    startProgram,
    completeProgram,
    updateProgramProgress,
    refreshJourney
  };
};