import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const isEmbedMode = new URLSearchParams(window.location.search).get('embed') === '1'
document.documentElement.classList.toggle('embed-mode', isEmbedMode)
document.body.classList.toggle('embed-mode', isEmbedMode)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
