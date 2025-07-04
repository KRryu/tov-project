import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import visaEvaluationService from '../../api/services/visa/evaluationService';

// === 🚀 비동기 액션 생성 (백엔드 V2 API 매핑) ===

/**
 * 지원 비자 타입 조회
 */
export const fetchSupportedTypes = createAsyncThunk(
  'visaEvaluation/fetchSupportedTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.getSupportedTypes();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 표준 비자 평가
 */
export const evaluateVisa = createAsyncThunk(
  'visaEvaluation/evaluate',
  async ({ visaType, applicantData, options = {} }, { dispatch, rejectWithValue }) => {
    try {
      // 진행상황 추적 시작
      if (options.trackProgress) {
        dispatch(setEvaluationProgress({ step: 0, progress: 0, message: '평가 시작' }));
      }

      const response = await visaEvaluationService.evaluate(
        visaType, 
        applicantData, 
        options.trackProgress ? (progress) => {
          dispatch(setEvaluationProgress(progress));
        } : null
      );

      return {
        ...response,
        visaType,
        evaluatedAt: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 지능형 비자 평가 (스마트 평가)
 */
export const evaluateVisaSmart = createAsyncThunk(
  'visaEvaluation/evaluateSmart',
  async ({ visaType, applicantData, options = {} }, { dispatch, rejectWithValue }) => {
    try {
      // 진행상황 추적 시작
      if (options.trackProgress) {
        dispatch(setEvaluationProgress({ step: 0, progress: 0, message: '지능형 평가 시작' }));
      }

      const response = await visaEvaluationService.evaluateSmart(
        visaType, 
        applicantData, 
        options.trackProgress ? (progress) => {
          dispatch(setEvaluationProgress(progress));
        } : null
      );

      return {
        ...response,
        visaType,
        evaluatedAt: new Date().toISOString(),
        isSmartEvaluation: true
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 빠른 예비 평가
 */
export const quickEvaluate = createAsyncThunk(
  'visaEvaluation/quickEvaluate',
  async ({ visaType, basicData }, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.quickEvaluate(visaType, basicData);
      return {
        ...response,
        visaType,
        isQuickEvaluation: true
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 비자 추천
 */
export const recommendVisa = createAsyncThunk(
  'visaEvaluation/recommend',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.recommendVisa(profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 평가 이력 조회
 */
export const fetchEvaluationHistory = createAsyncThunk(
  'visaEvaluation/fetchHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.getEvaluationHistory(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 평가 상세 조회
 */
export const fetchEvaluationDetail = createAsyncThunk(
  'visaEvaluation/fetchDetail',
  async (evaluationId, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.getEvaluationDetail(evaluationId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 평가 비교
 */
export const compareEvaluations = createAsyncThunk(
  'visaEvaluation/compare',
  async (evaluationIds, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.compareEvaluations(evaluationIds);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 평가 통계 및 분석
 */
export const fetchAnalytics = createAsyncThunk(
  'visaEvaluation/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.getAnalytics();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * 평가 피드백 제출
 */
export const submitFeedback = createAsyncThunk(
  'visaEvaluation/submitFeedback',
  async ({ evaluationId, feedback }, { rejectWithValue }) => {
    try {
      const response = await visaEvaluationService.submitFeedback(evaluationId, feedback);
      return { evaluationId, feedback, submittedAt: new Date().toISOString() };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// === 🏗️ 초기 상태 정의 ===
const initialState = {
  // 지원 비자 타입
  supportedTypes: [],
  
  // 현재 평가 상태
  currentEvaluation: {
    isEvaluating: false,
    result: null,
    progress: {
      step: 0,
      progress: 0,
      message: '',
      steps: []
    },
    error: null
  },
  
  // 빠른 평가 결과
  quickEvaluation: {
    isEvaluating: false,
    result: null,
    error: null
  },
  
  // 비자 추천
  recommendations: {
    isLoading: false,
    data: null,
    error: null
  },
  
  // 평가 이력
  history: {
    isLoading: false,
    evaluations: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    },
    error: null
  },
  
  // 평가 상세
  evaluationDetail: {
    isLoading: false,
    data: null,
    error: null
  },
  
  // 평가 비교
  comparison: {
    isLoading: false,
    data: null,
    error: null
  },
  
  // 분석 및 통계
  analytics: {
    isLoading: false,
    data: null,
    error: null,
    lastUpdated: null
  },
  
  // UI 상태
  ui: {
    selectedVisaType: null,
    evaluationStep: 0,
    showQuickEvaluation: false,
    showComparison: false,
    selectedEvaluations: [],
    filters: {
      visaType: null,
      dateRange: null,
      status: null
    }
  }
};

// === 🔧 Redux Slice 생성 ===
const visaEvaluationSlice = createSlice({
  name: 'visaEvaluation',
  initialState,
  reducers: {
    // UI 상태 관리
    setSelectedVisaType: (state, action) => {
      state.ui.selectedVisaType = action.payload;
    },
    
    setEvaluationStep: (state, action) => {
      state.ui.evaluationStep = action.payload;
    },
    
    setEvaluationProgress: (state, action) => {
      state.currentEvaluation.progress = {
        ...state.currentEvaluation.progress,
        ...action.payload
      };
    },
    
    clearCurrentEvaluation: (state) => {
      state.currentEvaluation.result = null;
      state.currentEvaluation.error = null;
      state.currentEvaluation.progress = {
        step: 0,
        progress: 0,
        message: '',
        steps: []
      };
    },
    
    clearQuickEvaluation: (state) => {
      state.quickEvaluation.result = null;
      state.quickEvaluation.error = null;
    },
    
    toggleQuickEvaluation: (state) => {
      state.ui.showQuickEvaluation = !state.ui.showQuickEvaluation;
    },
    
    toggleComparison: (state) => {
      state.ui.showComparison = !state.ui.showComparison;
    },
    
    selectEvaluationForComparison: (state, action) => {
      const evaluationId = action.payload;
      const selected = state.ui.selectedEvaluations;
      
      if (selected.includes(evaluationId)) {
        state.ui.selectedEvaluations = selected.filter(id => id !== evaluationId);
      } else if (selected.length < 5) { // 최대 5개까지 비교
        state.ui.selectedEvaluations.push(evaluationId);
      }
    },
    
    clearSelectedEvaluations: (state) => {
      state.ui.selectedEvaluations = [];
    },
    
    setHistoryFilters: (state, action) => {
      state.ui.filters = {
        ...state.ui.filters,
        ...action.payload
      };
    },
    
    clearHistoryFilters: (state) => {
      state.ui.filters = {
        visaType: null,
        dateRange: null,
        status: null
      };
    },
    
    // 에러 상태 클리어
    clearErrors: (state) => {
      state.currentEvaluation.error = null;
      state.quickEvaluation.error = null;
      state.recommendations.error = null;
      state.history.error = null;
      state.evaluationDetail.error = null;
      state.comparison.error = null;
      state.analytics.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // === 지원 비자 타입 조회 ===
      .addCase(fetchSupportedTypes.fulfilled, (state, action) => {
        state.supportedTypes = action.payload;
      })
      
      // === 표준 비자 평가 ===
      .addCase(evaluateVisa.pending, (state) => {
        state.currentEvaluation.isEvaluating = true;
        state.currentEvaluation.error = null;
      })
      .addCase(evaluateVisa.fulfilled, (state, action) => {
        state.currentEvaluation.isEvaluating = false;
        state.currentEvaluation.result = action.payload;
        state.currentEvaluation.progress.progress = 100;
        state.currentEvaluation.progress.message = '평가 완료';
      })
      .addCase(evaluateVisa.rejected, (state, action) => {
        state.currentEvaluation.isEvaluating = false;
        state.currentEvaluation.error = action.payload;
        state.currentEvaluation.progress.message = '평가 실패';
      })
      
      // === 지능형 비자 평가 ===
      .addCase(evaluateVisaSmart.pending, (state) => {
        state.currentEvaluation.isEvaluating = true;
        state.currentEvaluation.error = null;
      })
      .addCase(evaluateVisaSmart.fulfilled, (state, action) => {
        state.currentEvaluation.isEvaluating = false;
        state.currentEvaluation.result = action.payload;
        state.currentEvaluation.progress.progress = 100;
        state.currentEvaluation.progress.message = '지능형 평가 완료';
      })
      .addCase(evaluateVisaSmart.rejected, (state, action) => {
        state.currentEvaluation.isEvaluating = false;
        state.currentEvaluation.error = action.payload;
        state.currentEvaluation.progress.message = '지능형 평가 실패';
      })
      
      // === 빠른 예비 평가 ===
      .addCase(quickEvaluate.pending, (state) => {
        state.quickEvaluation.isEvaluating = true;
        state.quickEvaluation.error = null;
      })
      .addCase(quickEvaluate.fulfilled, (state, action) => {
        state.quickEvaluation.isEvaluating = false;
        state.quickEvaluation.result = action.payload;
      })
      .addCase(quickEvaluate.rejected, (state, action) => {
        state.quickEvaluation.isEvaluating = false;
        state.quickEvaluation.error = action.payload;
      })
      
      // === 비자 추천 ===
      .addCase(recommendVisa.pending, (state) => {
        state.recommendations.isLoading = true;
        state.recommendations.error = null;
      })
      .addCase(recommendVisa.fulfilled, (state, action) => {
        state.recommendations.isLoading = false;
        state.recommendations.data = action.payload;
      })
      .addCase(recommendVisa.rejected, (state, action) => {
        state.recommendations.isLoading = false;
        state.recommendations.error = action.payload;
      })
      
      // === 평가 이력 조회 ===
      .addCase(fetchEvaluationHistory.pending, (state) => {
        state.history.isLoading = true;
        state.history.error = null;
      })
      .addCase(fetchEvaluationHistory.fulfilled, (state, action) => {
        state.history.isLoading = false;
        const { evaluations, pagination } = action.payload;
        
        if (pagination?.page === 1) {
          // 첫 페이지는 덮어쓰기
          state.history.evaluations = evaluations || [];
        } else {
          // 다음 페이지는 추가
          state.history.evaluations = [
            ...state.history.evaluations,
            ...(evaluations || [])
          ];
        }
        
        if (pagination) {
          state.history.pagination = pagination;
        }
      })
      .addCase(fetchEvaluationHistory.rejected, (state, action) => {
        state.history.isLoading = false;
        state.history.error = action.payload;
      })
      
      // === 평가 상세 조회 ===
      .addCase(fetchEvaluationDetail.pending, (state) => {
        state.evaluationDetail.isLoading = true;
        state.evaluationDetail.error = null;
      })
      .addCase(fetchEvaluationDetail.fulfilled, (state, action) => {
        state.evaluationDetail.isLoading = false;
        state.evaluationDetail.data = action.payload;
      })
      .addCase(fetchEvaluationDetail.rejected, (state, action) => {
        state.evaluationDetail.isLoading = false;
        state.evaluationDetail.error = action.payload;
      })
      
      // === 평가 비교 ===
      .addCase(compareEvaluations.pending, (state) => {
        state.comparison.isLoading = true;
        state.comparison.error = null;
      })
      .addCase(compareEvaluations.fulfilled, (state, action) => {
        state.comparison.isLoading = false;
        state.comparison.data = action.payload;
      })
      .addCase(compareEvaluations.rejected, (state, action) => {
        state.comparison.isLoading = false;
        state.comparison.error = action.payload;
      })
      
      // === 분석 통계 ===
      .addCase(fetchAnalytics.pending, (state) => {
        state.analytics.isLoading = true;
        state.analytics.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics.isLoading = false;
        state.analytics.data = action.payload;
        state.analytics.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.analytics.isLoading = false;
        state.analytics.error = action.payload;
      })
      
      // === 피드백 제출 ===
      .addCase(submitFeedback.fulfilled, (state, action) => {
        // 평가 상세 데이터에 피드백 정보 업데이트
        if (state.evaluationDetail.data && 
            state.evaluationDetail.data.evaluation?._id === action.payload.evaluationId) {
          if (!state.evaluationDetail.data.evaluation.metadata) {
            state.evaluationDetail.data.evaluation.metadata = {};
          }
          if (!state.evaluationDetail.data.evaluation.metadata.feedback) {
            state.evaluationDetail.data.evaluation.metadata.feedback = [];
          }
          state.evaluationDetail.data.evaluation.metadata.feedback.push(action.payload.feedback);
        }
      });
  }
});

// === 📤 액션 및 셀렉터 내보내기 ===
export const {
  setSelectedVisaType,
  setEvaluationStep,
  setEvaluationProgress,
  clearCurrentEvaluation,
  clearQuickEvaluation,
  toggleQuickEvaluation,
  toggleComparison,
  selectEvaluationForComparison,
  clearSelectedEvaluations,
  setHistoryFilters,
  clearHistoryFilters,
  clearErrors
} = visaEvaluationSlice.actions;

// === 🔍 셀렉터 정의 ===
export const selectSupportedTypes = (state) => state.visaEvaluation.supportedTypes;
export const selectCurrentEvaluation = (state) => state.visaEvaluation.currentEvaluation;
export const selectQuickEvaluation = (state) => state.visaEvaluation.quickEvaluation;
export const selectRecommendations = (state) => state.visaEvaluation.recommendations;
export const selectEvaluationHistory = (state) => state.visaEvaluation.history;
export const selectEvaluationDetail = (state) => state.visaEvaluation.evaluationDetail;
export const selectComparison = (state) => state.visaEvaluation.comparison;
export const selectAnalytics = (state) => state.visaEvaluation.analytics;
export const selectUIState = (state) => state.visaEvaluation.ui;

// 복합 셀렉터
export const selectIsAnyLoading = (state) => {
  const { currentEvaluation, quickEvaluation, recommendations, history, evaluationDetail, comparison, analytics } = state.visaEvaluation;
  return currentEvaluation.isEvaluating || 
         quickEvaluation.isEvaluating || 
         recommendations.isLoading || 
         history.isLoading || 
         evaluationDetail.isLoading || 
         comparison.isLoading || 
         analytics.isLoading;
};

export const selectHasAnyError = (state) => {
  const { currentEvaluation, quickEvaluation, recommendations, history, evaluationDetail, comparison, analytics } = state.visaEvaluation;
  return !!(currentEvaluation.error || 
            quickEvaluation.error || 
            recommendations.error || 
            history.error || 
            evaluationDetail.error || 
            comparison.error || 
            analytics.error);
};

export const selectSelectedEvaluationsData = (state) => {
  const { selectedEvaluations } = state.visaEvaluation.ui;
  const { evaluations } = state.visaEvaluation.history;
  
  return selectedEvaluations.map(id => 
    evaluations.find(evaluation => evaluation._id === id)
  ).filter(Boolean);
};

export default visaEvaluationSlice.reducer; 