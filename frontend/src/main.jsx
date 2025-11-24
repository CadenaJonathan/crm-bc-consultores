import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('🚀 [Main] Inicializando aplicación...');

// Registrar Service Worker INMEDIATAMENTE
if ('serviceWorker' in navigator) {
  console.log('✅ [Main] Service Worker disponible, registrando...');
  
  navigator.serviceWorker
    .register('/sw.js', { 
      scope: '/',
      updateViaCache: 'none' 
    })
    .then((registration) => {
      console.log('✅ [Main] Service Worker registrado');
      console.log('   Scope:', registration.scope);
      
      // Verificar estado
      if (registration.active) {
        console.log('   Estado: Activo');
      } else if (registration.installing) {
        console.log('   Estado: Instalando...');
      } else if (registration.waiting) {
        console.log('   Estado: Esperando...');
      }
      
      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🆕 [Main] Nueva versión del SW detectada');
        
        newWorker.addEventListener('statechange', () => {
          console.log('🔄 [Main] SW state:', newWorker.state);
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('💡 [Main] Nueva versión disponible - Recarga para actualizar');
          }
        });
      });
    })
    .catch((error) => {
      console.error('❌ [Main] Error registrando Service Worker:', error);
      console.error('   Mensaje:', error.message);
    });
} else {
  console.warn('⚠️ [Main] Service Workers no soportados');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)