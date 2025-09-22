import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ClerkProvider from './components/auth/ClerkProvider.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
