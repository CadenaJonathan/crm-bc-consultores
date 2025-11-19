// src/components/client/NotificationsPanel.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  BellIcon,
  DocumentTextIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const notificationConfig = {
  document_approved: {
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    title: 'Documento Aprobado'
  },
  document_rejected: {
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    title: 'Documento Rechazado'
  },
  document_expiring: {
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    title: 'Documento por Vencer'
  },
  document_expired: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    title: 'Documento Vencido'
  },
  document_uploaded: {
    icon: DocumentTextIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    title: 'Documento Subido'
  },
  system_message: {
    icon: InformationCircleIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    title: 'Mensaje del Sistema'
  },
  reminder: {
    icon: BellIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    title: 'Recordatorio'
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
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays}d`
  
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
  const subscriptionRef = useRef(null)

  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications()
      subscriptionRef.current = subscribeToNotifications()
      
      return () => {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
        }
      }
    }
  }, [isOpen, user])

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
      
      if (!user?.id) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    if (!user?.id) return null

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Nueva notificación:', payload.new)
          setNotifications(prev => [payload.new, ...prev].slice(0, 20))
          showBrowserNotification(payload.new)
          playNotificationSound()
        }
      )
      .subscribe()

    return channel
  }

  const showBrowserNotification = (notification) => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      createNotification(notification)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          createNotification(notification)
        }
      })
    }
  }

  const createNotification = (notification) => {
    const config = notificationConfig[notification.type] || notificationConfig.system_message
    
    const browserNotif = new Notification(config.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id,
      requireInteraction: false,
      silent: false
    })

    browserNotif.onclick = () => {
      window.focus()
      markAsRead(notification.id)
      browserNotif.close()
    }

    setTimeout(() => browserNotif.close(), 5000)
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('No se pudo reproducir sonido')
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marcando como leída:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      if (!user?.id) return

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      )
    } catch (error) {
      console.error('Error marcando todas como leídas:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-96 max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-primary-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Marcar todas
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              No hay notificaciones
            </p>
            <p className="text-xs text-gray-500">
              Te notificaremos cuando haya novedades
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
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-9 h-9 ${config.bgColor} rounded-lg flex items-center justify-center mt-0.5`}>
                      <IconComponent className={`w-5 h-5 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-400">
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

      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-center text-gray-500">
            Mostrando las últimas {notifications.length} notificaciones
          </p>
        </div>
      )}
    </div>
  )
}

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount()
      const subscription = subscribeToCount()
      
      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [user])

  const loadUnreadCount = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) return

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error cargando contador:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToCount = () => {
    const subscription = supabase
      .channel('notifications-count')
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

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  return { 
    unreadCount, 
    loading,
    refresh: loadUnreadCount,
    requestNotificationPermission
  }
}