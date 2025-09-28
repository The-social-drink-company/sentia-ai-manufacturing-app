<<<<<<< HEAD
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './providers/AuthProvider.jsx'
import { logInfo, logError, logDebug } from './utils/logger.js'
import { devLog } from './utils/structuredLogger.js'
=======
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"
import "./index.css"
import App from "./App-enterprise.jsx"
>>>>>>> development

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Remove fallback loader once React loads
const fallbackLoader = document.getElementById("fallback-loader")
if (fallbackLoader) {
  fallbackLoader.style.display = "none"
}

console.log("[Clerk] Initializing with publishable key:", PUBLISHABLE_KEY?.substring(0, 20) + "...")

<<<<<<< HEAD
  try {
    devLog.log('[main.jsx] Creating React root...');
    const root = createRoot(rootElement);

    // Try to load the fixed app
    try {
      devLog.log('[main.jsx] Attempting to load App-fixed...');
      const { default: App } = await import('./App-fixed.jsx');

      devLog.log('[main.jsx] App-fixed loaded successfully, rendering...');
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      devLog.log('[main.jsx] React app mounted successfully with fixed app');
    } catch (appError) {
      logError('[main.jsx] Failed to load App-fixed', appError);
      devLog.log('[main.jsx] Falling back to simple app...');

      root.render(
        <StrictMode>
          <FallbackApp />
        </StrictMode>
      );
      devLog.log('[main.jsx] Fallback app mounted successfully');
    }
  } catch (error) {
    logError('[main.jsx] Critical error mounting React app', error);
    rootElement.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Critical Error: ' + error.message + '</div>';
  }
};

// Handle Service Worker errors
window.addEventListener('error', (event) => {
  logError('[main.jsx] Global error', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  logError('[main.jsx] Unhandled promise rejection', { reason: event.reason });
  // Don't prevent the default behavior, just log it
});

// Initialize app
initializeApp();
=======
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => window.location.href = to}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb",
          colorTextOnPrimaryBackground: "#ffffff",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#1f2937",
          fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
          borderRadius: "0.5rem"
        },
        elements: {
          card: {
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            border: "1px solid #e5e7eb"
          },
          headerTitle: {
            fontSize: "1.5rem",
            fontWeight: "600"
          },
          headerSubtitle: {
            color: "#6b7280"
          }
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
>>>>>>> development
