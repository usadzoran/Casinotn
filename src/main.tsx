import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function initializeApp() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('[5LION CASINO] Critical Error: Target DOM element #root was not found in index.html.');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('[5LION CASINO] Fatal Error during React root initialization:', error);
  }
}

// Ensure execution happens after the DOM is fully interactive
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
  initializeApp();
}
