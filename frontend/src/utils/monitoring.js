import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// 성능 측정을 위한 유틸리티
export const measurePerformance = (name, callback) => {
  if (!window.performance || !window.performance.mark) return callback();

  const startMark = `${name}_start`;
  const endMark = `${name}_end`;
  
  try {
    performance.mark(startMark);
    const result = callback();
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    return result;
  } catch (error) {
    console.error(`Performance measurement failed for ${name}:`, error);
    return callback();
  }
};

// Sentry 초기화
export const initializeMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.2,
      environment: process.env.REACT_APP_ENVIRONMENT,
      beforeSend(event) {
        // PII(개인식별정보) 필터링
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });
  }
};

// 커스텀 에러 바운더리
export const ErrorBoundary = Sentry.ErrorBoundary;

// 성능 메트릭 수집
export const collectMetrics = () => {
  if (!window.performance || !window.performance.getEntriesByType) return null;

  const metrics = {
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    fid: 0, // First Input Delay
    cls: 0, // Cumulative Layout Shift
  };

  // FCP
  const paint = performance.getEntriesByType('paint');
  const fcpEntry = paint.find(entry => entry.name === 'first-contentful-paint');
  if (fcpEntry) metrics.fcp = fcpEntry.startTime;

  // Web Vitals 수집
  if ('web-vital' in window) {
    window.webVitals.getFID(metric => metrics.fid = metric.value);
    window.webVitals.getLCP(metric => metrics.lcp = metric.value);
    window.webVitals.getCLS(metric => metrics.cls = metric.value);
  }

  return metrics;
}; 