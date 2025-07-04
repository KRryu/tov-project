import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCredentials } from '../redux/slices/authSlice';

export const useErrorHandler = (error, isLoading) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (error && !isLoading) {
      const errorMessage = error.data?.message || '오류가 발생했습니다.';
      
      switch (error.status) {
        case 401:
          toast.error('로그인이 필요합니다.');
          dispatch(clearCredentials());
          navigate('/login');
          break;
        case 403:
          toast.error('권한이 없습니다.');
          navigate('/dashboard');
          break;
        case 404:
          toast.error('요청하신 정보를 찾을 수 없습니다.');
          navigate('/');
          break;
        case 429:
          toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          toast.error(errorMessage);
      }
    }
  }, [error, isLoading, navigate, dispatch]);

  return null;
}; 