import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

import authReducer from './slices/authSlice';
import portfolioReducer from './slices/portfolioSlice';
import visaEvaluationReducer from './slices/visaEvaluationSlice';
import { tovsparkApi } from '../api/services/tovsparkService';
import { authApi } from '../api/services/authService';
import { communityApi } from '../api/services/communityService';

// 디버깅을 위한 로그 미들웨어
const logger = store => next => action => {
  console.log('디버깅: 액션 발생 -', action.type);
  console.log('디버깅: 이전 상태 -', store.getState());
  const result = next(action);
  console.log('디버깅: 다음 상태 -', store.getState());
  return result;
};

// 루트 리듀서 설정
const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [tovsparkApi.reducerPath]: tovsparkApi.reducer,
  [communityApi.reducerPath]: communityApi.reducer,
  auth: authReducer,
  portfolio: portfolioReducer,
  visaEvaluation: visaEvaluationReducer,
});

// 전체 리듀서에 대한 Persist 설정
const persistConfig = {
  key: 'root',
  storage,
  debug: true
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store 생성 - default export 대신 named export로 변경
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(tovsparkApi.middleware, authApi.middleware, communityApi.middleware, logger), // 로깅 미들웨어 추가
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);
setupListeners(store.dispatch);

// 하위 호환성을 위해 default export도 유지
export default store;
