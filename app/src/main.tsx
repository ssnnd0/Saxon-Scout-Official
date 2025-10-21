import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './views/App';
import { registerServiceWorker, setupInstallPrompt, onOnlineStatusChange } from './lib/pwa-register';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/theme.css';

console.log('Starting Saxon Scout application...');

// Mount the application immediately (no loading screen)
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <div className="app-shell">
      <App />
    </div>
  </React.StrictMode>
);

try { (window as any).__saxon_app_ready = true; } catch (e) {}

// Register PWA Service Worker
console.log('Registering Service Worker...');
registerServiceWorker().catch(err => {
  console.error('Failed to register Service Worker:', err);
});

// Setup install prompt for PWA installation
setupInstallPrompt();

// Monitor online/offline status
onOnlineStatusChange((online) => {
  console.log('Online status changed:', online);
  if (online) {
    console.log('App is back online');
  } else {
    console.log('App is now offline - using cached data');
  }
});

// Global error instrumentation: capture errors and unhandled rejections
try {
  window.__saxon_app_error = null;
} catch (e) {}

window.onerror = function(message, source, lineno, colno, error) {
  try {
    const payload = { message: String(message), source, lineno, colno, stack: error && error.stack ? String(error.stack) : null };
    try { window.__saxon_app_error = payload; } catch (e) {}
    console.error('Global error captured:', payload);
    const root = document.getElementById('root');
    if (root) root.innerHTML = `<div class="error"><h3>JavaScript Error</h3><pre>${String(payload.message)}\n${payload.stack || ''}</pre><p>Open console (F12) for more details.</p></div>`;
  } catch (e) {}
  return false;
};

window.addEventListener('unhandledrejection', function(evt) {
  try {
    const reason = evt && evt.reason ? evt.reason : String(evt);
    const payload = { message: 'UnhandledRejection', reason: String(reason), stack: reason && reason.stack ? String(reason.stack) : null };
    try { window.__saxon_app_error = payload; } catch (e) {}
    console.error('Unhandled rejection:', payload);
    const root = document.getElementById('root');
    if (root) root.innerHTML = `<div class="error"><h3>Unhandled Rejection</h3><pre>${String(payload.reason)}\n${payload.stack || ''}</pre><p>Open console (F12) for more details.</p></div>`;
  } catch (e) {}
});

