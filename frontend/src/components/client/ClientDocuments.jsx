// src/components/client/ClientDocuments.jsx
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import UploadDocumentModal from './UploadDocumentModal'
import { DocumentViewerModal } from './DocumentViewerModal'
import { 
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

// Configuración de estados
const statusConfig = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
    description: 'En espera de revisión'
  },
  under_review: {
    label: 'En Revisión',
    color: 'bg-blue-100 text-blue-800',
    icon: EyeIcon,
    description: 'Siendo revisado por el equipo'
  },
  approved: {
    label: 'Aprobado',
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircleIcon,
    description: 'Documento válido y aprobado'
  },
  rejected: {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
    description: 'Documento rechazado, requiere correcciones'
  },
  expired: {
    label: 'Vencido',
    color: 'bg-gray-100 text-gray-800',
    icon: ExclamationTriangleIcon,
    description: 'Documento vencido, requiere renovación'
  }
}

// Utilidades
const formatDate = (date) => {
  if (!date) return 'No definida'
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getDaysRemaining = (date) => {
  if (!date) return null
  const today = new Date()
  const expiryDate = new Date(date)
  const diffTime = expiryDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const getExpiryStatus = (validUntil, currentStatus) => {
  if (currentStatus !== 'approved' || !validUntil) return null
  
  const daysRemaining = getDaysRemaining(validUntil)
  if (daysRemaining <= 0) return 'expired'
  if (daysRemaining <= 15) return 'critical'
  if (daysRemaining <= 30) return 'warning'
  return 'good'
}

// Hook optimizado
const useOptimizedClientDocuments = () => {
  const [data, setData] = useState({
    documents: [],
    documentTypes: [],
    loading: true,
    error: null,
    lastFetch: null
  })
  
  const { user } = useAuth()

  const fetchDocuments = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    if (!forceRefresh && data.lastFetch && (now - data.lastFetch) < 5000) {
      return
    }

    // ✅ VERIFICAR QUE user.id EXISTE
    if (!user?.id) {
      setData(prev => ({ ...prev, loading: false, error: null, documents: [] }))
      return
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))
      
      // ✅ USAR auth_user_id CON user.id
      const { data: clientUserData, error: clientUserError } = await supabase
        .from('client_users')
        .select('client_id, clients(*)')
        .eq('auth_user_id', user.id)
        .single()

      if (clientUserError?.code === 'PGRST116') {
        setData({
          documents: [],
          documentTypes: [],
          loading: false,
          error: null,
          lastFetch: now,
          clientExists: false
        })
        return
      }

      if (clientUserError) throw new Error(`Error: ${clientUserError.message}`)

      const clientId = clientUserData.client_id

      const [docsResponse, typesResponse] = await Promise.all([
        supabase
          .from('client_documents')
          .select(`
            *,
            document_types (
              id,
              name,
              code,
              description,
              category
            )
          `)
          .eq('client_id', clientId)
          .order('updated_at', { ascending: false }),
        
        supabase
          .from('document_types')
          .select('*')
          .order('code')
      ])

      if (docsResponse.error) throw new Error(`Error: ${docsResponse.error.message}`)

      setData({
        documents: docsResponse.data || [],
        documentTypes: typesResponse.data || [],
        loading: false,
        error: null,
        lastFetch: now,
        clientExists: true
      })

    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        lastFetch: now
      }))
    }
  }, [user, data.lastFetch])

  useEffect(() => {
    if (user?.id && !data.lastFetch) {
      fetchDocuments()
    }
  }, [user])

  const refetch = useCallback(() => {
    fetchDocuments(true)
  }, [fetchDocuments])

  return { 
    ...data, 
    refetch,
    hasData: data.documents.length > 0
  }
}

// Componente principal
export const ClientDocuments = () => {
  const { documents, documentTypes, loading, error, refetch, hasData, clientExists } = useOptimizedClientDocuments()
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
  })
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewingDocument, setViewingDocument] = useState(null)

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !filters.search || 
        doc.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.document_types?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.document_types?.code?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || doc.status === filters.status
      const matchesType = !filters.type || doc.document_type_id === filters.type

      return matchesSearch && matchesStatus && matchesType
    })
  }, [documents, filters])

  const stats = useMemo(() => {
    if (!documents.length) {
      return {
        total: 0, pending: 0, approved: 0, rejected: 0, expired: 0, expiring: 0
      }
    }

    return {
      total: documents.length,
      pending: documents.filter(d => d.status === 'pending').length,
      approved: documents.filter(d => d.status === 'approved').length,
      rejected: documents.filter(d => d.status === 'rejected').length,
      expired: documents.filter(d => d.status === 'expired').length,
      expiring: documents.filter(d => {
        const expiry = getExpiryStatus(d.valid_until, d.status)
        return expiry === 'critical' || expiry === 'warning'
      }).length
    }
  }, [documents])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
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
          <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar documentos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (clientExists === false) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mis Documentos</h1>
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Perfil en configuración</h3>
            <p className="text-gray-600">Tu perfil está siendo configurado por nuestro equipo.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Documentos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y monitorea el estado de tus documentos de Protección Civil
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Subir Documento
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <DocumentTextIcon className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
          <ClockIcon className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
          <div className="text-sm text-yellow-600">Pendientes</div>
        </div>
        
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
          <div className="text-sm text-green-600">Aprobados</div>
        </div>
        
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
          <XCircleIcon className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
          <div className="text-sm text-red-600">Rechazados</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 text-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-900">{stats.expiring}</div>
          <div className="text-sm text-orange-600">Por Vencer</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.expired}</div>
          <div className="text-sm text-gray-600">Vencidos</div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!hasData ? 'No tienes documentos' : 'No hay documentos que coincidan'}
            </h3>
            <p className="text-gray-600 mb-6">
              {!hasData 
                ? 'Sube tu primer documento para comenzar'
                : 'Intenta ajustar la búsqueda'
              }
            </p>
            {!hasData && (
              <button 
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Subir Primer Documento
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((document) => {
              const status = statusConfig[document.status] || statusConfig.pending
              const StatusIcon = status.icon
              const expiryStatus = getExpiryStatus(document.valid_until, document.status)
              const daysRemaining = getDaysRemaining(document.valid_until)

              return (
                <div key={document.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="w-6 h-6 text-primary-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {document.name}
                            </h3>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </span>
                            
                            {expiryStatus && expiryStatus !== 'good' && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                expiryStatus === 'expired' ? 'bg-red-100 text-red-800' :
                                expiryStatus === 'critical' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                {expiryStatus === 'expired' ? 'Vencido' : `${daysRemaining} días`}
                              </span>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Tipo:</span>{' '}
                              {document.document_types?.code} - {document.document_types?.name || 'Tipo no especificado'}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                              <CalendarIcon className="w-4 h-4" />
                              <span>Subido: {formatDate(document.created_at)}</span>
                            </div>
                            
                            {document.valid_until && (
                              <div className={`flex items-center gap-2 ${
                                expiryStatus === 'expired' || expiryStatus === 'critical' 
                                  ? 'text-red-600' 
                                  : expiryStatus === 'warning'
                                  ? 'text-yellow-600'
                                  : 'text-gray-500'
                              }`}>
                                <CalendarIcon className="w-4 h-4" />
                                <span>Vence: {formatDate(document.valid_until)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => setViewingDocument(document)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        Ver
                      </button>
                      
                      {document.file_url && (
                        <button 
                          onClick={() => window.open(document.file_url, '_blank')}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de subida */}
      <UploadDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          refetch()
        }}
      />

      {/* Modal de visualización */}
      <DocumentViewerModal
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
      />

      {/* Resumen */}
      {filteredDocuments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>
              Mostrando {filteredDocuments.length} de {documents.length} documentos
            </span>
          </div>
        </div>
      )}
    </div>
  )
}