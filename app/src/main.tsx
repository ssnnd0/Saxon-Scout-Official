// @ts-nocheck
import * as Inferno from 'inferno';
import { render } from 'inferno';
import App from './views/App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';

// Create a simple loading component
const LoadingScreen = () => (
  <div className="loading-screen">
    <img src="/app/assets/Logo+611+Black+Name.webp" alt="Saxon Scout" style={{ height: 56 }} />
    <h1 className="loading-title">Saxon Scout</h1>
    <p className="muted-small">Initializing scouting system…</p>
  </div>
);

// Add loading screen styles
const style = document.createElement('style');
style.textContent = `
  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f8f9fa;
    font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  .loading-title {
    color: #007bff;
    font-size: 2.5rem;
    margin-bottom: 2rem;
  }
  .loading-dots {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }
  .dot {
    width: 0.75rem;
    height: 0.75rem;
    background-color: #007bff;
    border-radius: 50%;
    animation: bounce 0.8s infinite;
  }
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-0.75rem); }
  }
`;
document.head.appendChild(style);

console.log('Starting Saxon Scout application...');

// First render the loading screen
const root = document.getElementById('root');
console.log('Root element:', root);

if (root) {
  render(<LoadingScreen />, root);
}

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

// Initialize the application with a slight delay to ensure loading screen is visible
setTimeout(() => {
  try {
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Root element not found');
    }

  render(<div className="app-shell"><App /></div>, root);
    
    // Signal that the app mounted successfully
    try { 
      window.__saxon_app_ready = true;
      console.log('App rendered successfully');
    } catch (e) { /* ignore */ }

  } catch (err) {
    console.error('App render failed:', err);
    try {
      const payload = { 
        message: String(err?.message || err),
        stack: err?.stack ? String(err.stack) : null 
      };
      window.__saxon_app_error = payload;
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.innerHTML = `
        <h3>Application Failed to Start</h3>
        <pre>${payload.message}\n${payload.stack || ''}</pre>
        <p>Please check your browser console (F12) for more details.</p>
        <button onclick="location.reload()" class="btn btn-primary mt-3">Reload Application</button>
      `;
      
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = '';
        root.appendChild(errorDiv);
      }
    } catch (e) {
      console.error('Failed to show error screen:', e);
    }
  }
}, 500); // Small delay to ensure loading screen is visible
