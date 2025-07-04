import { useEffect, useRef } from 'react';
import { measurePerformance, collectMetrics } from '../utils/monitoring';

export const usePerformanceMonitoring = (componentName) => {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;

    return () => {
      if (process.env.NODE_ENV === 'development') {
        const unmountTime = Date.now();
        const lifetimeDuration = unmountTime - mountTime.current;

        console.debug(`Component ${componentName} metrics:`, {
          lifetimeDuration,
          renderCount: renderCount.current,
        });

        const metrics = collectMetrics();
        if (metrics) {
          console.debug(`Performance metrics for ${componentName}:`, metrics);
        }
      }
    };
  }, [componentName]);

  // 개발 환경에서만 성능 측정
  const logPerformance = (operationName, operation) => {
    if (process.env.NODE_ENV === 'development') {
      return measurePerformance(`${componentName}_${operationName}`, operation);
    }
    return operation();
  };

  return { logPerformance };
}; 