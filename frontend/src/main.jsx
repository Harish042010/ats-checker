import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: { background: '#1f2937', color: '#f3f4f6', borderRadius: '12px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#f3f4f6' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f3f4f6' } },
          }} />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
