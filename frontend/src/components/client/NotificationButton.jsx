// src/components/client/NotificationButton.jsx
// VERSIÓN MINIMALISTA

import { useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { NotificationsPanel, useNotifications } from './NotificationsPanel'

export const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
        title="Notificaciones"
      >
        <BellIcon className="w-5 h-5" />
        
        {/* Badge minimalista */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary-600 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <NotificationsPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  )
}