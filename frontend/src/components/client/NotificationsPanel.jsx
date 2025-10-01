// src/components/client/NotificationsPanel.jsx
// VERSIÓN MINIMALISTA Y AMIGABLE

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const notificationConfig = {
  document_approved: {
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  document_rejected: {
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  document_expiring: {
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  document_expired: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  system_message: {
    icon: InformationCircleIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  reminder: {
    icon: ClockIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const notifDate = new Date(date)
  const diffMs = now - notifDate
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return notifDate.toLocaleDateString('es-MX', { 
    day: 'numeric', 
    month: 'short' 
  })
}

export const NotificationsPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const panelRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
      const subscription = subscribeToNotifications()
      
      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [isOpen, user])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      const userEmail = typeof user === 'string' ? user : user?.email
      if (!userEmail) return

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (!clientData) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    const userEmail = typeof user === 'string' ? user : user?.email
    if (!userEmail) return null

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    return subscription
  }

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marcando como leída:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const userEmail = typeof user === 'string' ? user : user?.email
      if (!userEmail) return

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (!clientData) return

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('client_id', clientData.id)
        .eq('read', false)

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
    } catch (error) {
      console.error('Error marcando todas como leídas:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-96 max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 z-50"
    >
      {/* Header compacto */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Notificaciones
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Marcar todas
            </button>
          )}
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              No hay notificaciones
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const config = notificationConfig[notification.type] || notificationConfig.system_message
              const IconComponent = config.icon

              return (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icono pequeño */}
                    <div className={`flex-shrink-0 w-8 h-8 ${config.bgColor} rounded-lg flex items-center justify-center mt-0.5`}>
                      <IconComponent className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer simple */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-center text-gray-500">
            Últimas {notifications.length} notificaciones
          </p>
        </div>
      )}
    </div>
  )
}

// Hook simplificado
export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    loadUnreadCount()
    const subscription = subscribeToCount()
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [user])

  const loadUnreadCount = async () => {
    try {
      const userEmail = typeof user === 'string' ? user : user?.email
      if (!userEmail) return

      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (!clientData) return

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientData.id)
        .eq('read', false)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error cargando contador:', error)
    }
  }

  const subscribeToCount = () => {
    const subscription = supabase
      .channel('notifications_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          loadUnreadCount()
        }
      )
      .subscribe()

    return subscription
  }

  return { unreadCount, refresh: loadUnreadCount }
}