// src/components/client/NotificationPermissionBanner.jsx
import { useState, useEffect } from 'react'
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNotifications } from './NotificationsPanel'

export const NotificationPermissionBanner = () => {
  const [show, setShow] = useState(false)
  const { requestNotificationPermission } = useNotifications()

  useEffect(() => {
    // Mostrar banner si no se han aceptado las notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      // Esperar 3 segundos después de cargar
      setTimeout(() => setShow(true), 3000)
    }
  }, [])

  const handleAccept = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      setShow(false)
      localStorage.setItem('notification_permission_asked', 'true')
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('notification_permission_asked', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <BellIcon className="w-6 h-6 text-primary-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Activa las notificaciones
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Recibe alertas importantes sobre tus documentos y vencimientos directamente en tu navegador
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Activar
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}