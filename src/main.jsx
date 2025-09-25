import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppMultiStage from './AppMultiStage.jsx';
import { logInfo, logError, logDebug } from './utils/logger.js';

const mountApplication = () => {
  const container = document.getElementById('root');

  if (!container) {
    logError('[main] Root element not found; aborting mount');
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: system-ui;">
        <h1 style="color: #9b1c1c;">Application failed to load</h1>
        <p>Please refresh the page or contact support.</p>
      </div>
    `;
    return;
  }

  logInfo('[main] Bootstrapping Sentia multi-stage orchestrator');
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <AppMultiStage />
    </StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    logDebug('[main] DOMContentLoaded event received');
    mountApplication();
  });
} else {
  mountApplication();
}

window.addEventListener('error', (event) => {
  logError('[main] Global error event', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  logError('[main] Unhandled promise rejection', event.reason);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
          .then(() => logDebug('[main] Unregistered service worker', registration.scope))
          .catch(() => {});
      });
    })
    .catch(() => {});
}
