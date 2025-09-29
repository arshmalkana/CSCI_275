import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PWAWrapper from './components/PWAWrapper.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PWAWrapper>
      <App />
    </PWAWrapper>
  </StrictMode>,
)
