import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

// Register the app shell for installability and offline loading on supported browsers.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/flyash/sw.js', { scope: '/flyash/' }).catch((error) => {
      console.error('FlyAsh service worker registration failed:', error);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
