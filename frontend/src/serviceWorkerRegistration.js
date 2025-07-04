export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          if (config && config.onUpdate) {
            config.onUpdate(registration);
          }
        })
        .catch((error) => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
} 