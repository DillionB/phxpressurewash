// src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './state/AuthContext.jsx'   // <-- add this

import './styles/theme.css'
import './styles/components.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>                    {/* <-- wrap the whole app */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
