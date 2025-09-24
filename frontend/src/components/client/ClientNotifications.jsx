// src/components/client/ClientNotifications.jsx
// CREAR ESTE ARCHIVO FALTANTE

import { useState } from 'react'
import { useClientNotifications } from '../../hooks/useClientData'
import { 
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const notificationTypeConfig = {
  'document_expiring': {
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  'document_expired': {
    icon: XMarkIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  'document_approved': {
    icon: CheckIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  'document_rejected': {
    icon: XMarkIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  'document_uploaded': {
    icon: DocumentTextIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  'general': {
    icon: InformationCircleIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
}

const formatDate = (date) => {
  const now = new Date()
  const notificationDate = new Date(date)
  const diffTime = Math.abs(now - notificationDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semana${Math.ceil(diffDays / 7) > 1 ? 's' : ''}`
  
  return notificationDate.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const ClientNotifications = () => {
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useClientNotifications()
  const [filter, setFilter] = useState('all') // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all')

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    const matchesReadStatus = filter === 'all' || 
                            (filter === 'unread' && !notification.read) ||
                            (filter === 'read' && notification.read)
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    
    return matchesReadStatus && matchesType
  })

  // Obtener tipos únicos de notificaciones
  const availableTypes = [...new Set(notifications.map(n => n.type))]

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar notificaciones</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BellIcon className="w-8 h-8" />
            Notificaciones
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {unreadCount} sin leer
              </span>
            )}
          </h1>
          <p className="text-gray-600 mt-1">
            Mantente al día con el estado de tus documentos y actualizaciones importantes
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors gap-2"
          >
            <CheckIcon className="w-5 h-5" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Todas</option>
              <option value="unread">Sin leer ({unreadCount})</option>
              <option value="read">Leídas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="all">Todos los tipos</option>
              {availableTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'document_expiring' ? 'Documentos por vencer' :
                   type === 'document_expired' ? 'Documentos vencidos' :
                   type === 'document_approved' ? 'Documentos aprobados' :
                   type === 'document_rejected' ? 'Documentos rechazados' :
                   type === 'document_uploaded' ? 'Documentos subidos' :
                   'General'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' :
               filter === 'read' ? 'No hay notificaciones leídas' :
               'No tienes notificaciones'}
            </h3>
            <p className="text-gray-600">
              {notifications.length === 0 
                ? 'Te notificaremos cuando haya actualizaciones importantes'
                : 'Intenta ajustar los filtros para ver otras notificaciones'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => {
              const config = notificationTypeConfig[notification.type] || notificationTypeConfig.general
              const IconComponent = config.icon

              return (
                <div
                  key={notification.id}
                  className={`p-6 transition-colors ${
                    notification.read ? 'hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icono */}
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${config.color}`} />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`text-sm font-medium ${
                              notification.read ? 'text-gray-900' : 'text-blue-900'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className={`text-sm ${
                            notification.read ? 'text-gray-600' : 'text-blue-800'
                          }`}>
                            {notification.message}
                          </p>
                          
                          {/* Información adicional del documento */}
                          {notification.documents && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600">
                                <strong>Documento:</strong> {notification.documents.name}
                                {notification.documents.document_types && (
                                  <span className="ml-2">
                                    ({notification.documents.document_types.name})
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {formatDate(notification.created_at)}
                            </div>
                            
                            {notification.scheduled_for && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                Programada para: {formatDate(notification.scheduled_for)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Botones de acción */}
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors gap-1"
                              title="Marcar como leída"
                            >
                              <CheckIcon className="w-3 h-3" />
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Notificaciones</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {notifications.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {unreadCount}
              </div>
              <div className="text-sm text-gray-600">Sin leer</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {notifications.filter(n => n.type === 'document_expiring').length}
              </div>
              <div className="text-sm text-gray-600">Vencimientos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'document_approved').length}
              </div>
              <div className="text-sm text-gray-600">Aprobaciones</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}