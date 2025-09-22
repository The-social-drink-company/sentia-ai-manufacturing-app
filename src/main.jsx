import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { validateFrontendEnvironment } from './utils/env-validator.js'

// TASK-002: Validate frontend environment variables on startup
const envValid = validateFrontendEnvironment();

if (!envValid) {
  // Show user-friendly error message instead of crashing
  const root = createRoot(document.getElementById('root'));
  root.render(
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>Configuration Error</h1>
      <p>Required environment variables are missing. Please check the console for details.</p>
      <p>Contact your administrator to configure the application properly.</p>
    </div>
  );
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
