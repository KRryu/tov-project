import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';  // persistor 추가
import './index.css';
import { getCLS, getFID, getLCP } from 'web-vitals';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// 성능 메트릭 수집 및 보고
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getLCP(onPerfEntry);
  }
};

reportWebVitals(metric => {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 환경에서 메트릭 전송
    console.debug('Web Vital:', metric);
    
    // 분석 서비스로 메트릭 전송
    navigator.sendBeacon('/analytics', JSON.stringify(metric));
  } else {
    // 개발 환경에서는 콘솔에 출력
    console.debug('Web Vital:', metric);
  }
});

// PWA 지원을 위한 서비스 워커 등록
serviceWorkerRegistration.register({
  onUpdate: registration => {
    // 새 버전이 있을 때 사용자에게 알림
    const waitingServiceWorker = registration.waiting;
    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener('statechange', event => {
        if (event.target.state === 'activated') {
          window.location.reload();
        }
      });
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }
}); 