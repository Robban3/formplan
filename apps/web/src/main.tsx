import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App'
import './index.css'

// I native-appen (Capacitor) är man redan i den installerade appen — undertryck
// webbläsarens "Lägg till på hemskärmen"-banner. På webben lämnas den orörd.
if (Capacitor.isNativePlatform()) {
  window.addEventListener('beforeinstallprompt', (e) => e.preventDefault())
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister()))
    )
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
