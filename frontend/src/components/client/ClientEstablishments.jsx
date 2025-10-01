// src/components/client/ClientEstablishments.jsx
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XCircleIcon,
  ClockIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// Configuración de niveles de riesgo
const riskLevelConfig = {
  bajo: {
    label: 'Bajo',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon
  },
  medio: {
    label: 'Medio',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ExclamationTriangleIcon
  },
  alto: {
    label: 'Alto',
    color: 'bg-red-100 text-red-800',
    icon: ExclamationTriangleIcon
  }
}

const useEstablishments = () => {
  const [data, setData] = useState({
    establishments: [],
    loading: true,
    error: null
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchEstablishments()
  }, [user])

  const fetchEstablishments = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      const userEmail = typeof user === 'string' ? user : user?.email
      if (!userEmail) return

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (clientError?.code === 'PGRST116') {
        setData({
          establishments: [],
          loading: false,
          error: null,
          clientExists: false
        })
        return
      }

      if (clientError) throw clientError

      const { data: establishments, error: estError } = await supabase
        .from('establishments')
        .select(`
          *,
          documents (
            id,
            name,
            status,
            valid_until
          )
        `)
        .eq('client_id', clientData.id)
        .order('name')

      if (estError) throw estError

      setData({
        establishments: establishments || [],
        loading: false,
        error: null,
        clientExists: true
      })

    } catch (error) {
      console.error('Error cargando establecimientos:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  return { ...data, refetch: fetchEstablishments }
}

export const ClientEstablishments = () => {
  const { establishments, loading, error, refetch, clientExists } = useEstablishments()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstablishment, setSelectedEstablishment] = useState(null)

  const filteredEstablishments = useMemo(() => {
    return establishments.filter(est =>
      est.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [establishments, searchTerm])

  const stats = useMemo(() => {
    return {
      total: establishments.length,
      alto: establishments.filter(e => e.risk_level === 'alto').length,
      medio: establishments.filter(e => e.risk_level === 'medio').length,
      bajo: establishments.filter(e => e.risk_level === 'bajo').length,
      withDocuments: establishments.filter(e => e.documents?.length > 0).length
    }
  }, [establishments])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar establecimientos</h3>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mis Establecimientos</h1>
        <div className="text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Perfil en configuración</h3>
          <p className="text-gray-600">Tu perfil está siendo configurado por nuestro equipo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Establecimientos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus ubicaciones y documentos asociados
          </p>
        </div>
        
        <button 
          onClick={refetch}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <BuildingOfficeIcon className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-900">{stats.alto}</div>
          <div className="text-sm text-red-600">Alto Riesgo</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 text-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-900">{stats.medio}</div>
          <div className="text-sm text-yellow-600">Medio</div>
        </div>
        
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <CheckCircleIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-900">{stats.bajo}</div>
          <div className="text-sm text-green-600">Bajo</div>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 text-center">
          <DocumentTextIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-900">{stats.withDocuments}</div>
          <div className="text-sm text-blue-600">Con Docs</div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar establecimientos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de establecimientos */}
      {filteredEstablishments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {establishments.length === 0 ? 'No tienes establecimientos' : 'No hay resultados'}
            </h3>
            <p className="text-gray-600">
              {establishments.length === 0 
                ? 'Contacta a tu asesor para registrar tus establecimientos'
                : 'Intenta con otros términos de búsqueda'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEstablishments.map((establishment) => {
            const riskConfig = riskLevelConfig[establishment.risk_level] || riskLevelConfig.bajo
            const RiskIcon = riskConfig.icon
            const approvedDocs = establishment.documents?.filter(d => d.status === 'approved').length || 0
            const totalDocs = establishment.documents?.length || 0

            return (
              <div
                key={establishment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header del card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {establishment.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskConfig.color}`}>
                      <RiskIcon className="w-3 h-3 mr-1" />
                      Riesgo {riskConfig.label}
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>

                {/* Información */}
                <div className="space-y-2 mb-4">
                  {establishment.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{establishment.address}</span>
                    </div>
                  )}
                  
                  {establishment.municipality && (
                    <div className="text-sm text-gray-600">
                      {establishment.municipality}, Querétaro
                    </div>
                  )}

                  {establishment.contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4" />
                      <span>{establishment.contact_phone}</span>
                    </div>
                  )}
                </div>

                {/* Documentos */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Documentos</span>
                    <span className="text-sm text-gray-600">
                      {approvedDocs}/{totalDocs} aprobados
                    </span>
                  </div>
                  
                  {totalDocs > 0 ? (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(approvedDocs / totalDocs) * 100}%` }}
                      ></div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Sin documentos</p>
                  )}
                </div>

                {/* Botón ver detalles */}
                <button
                  onClick={() => setSelectedEstablishment(establishment)}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Ver Detalles
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedEstablishment && (
        <EstablishmentDetailsModal
          establishment={selectedEstablishment}
          onClose={() => setSelectedEstablishment(null)}
        />
      )}
    </div>
  )
}

// Modal de detalles del establecimiento
const EstablishmentDetailsModal = ({ establishment, onClose }) => {
  const riskConfig = riskLevelConfig[establishment.risk_level] || riskLevelConfig.bajo
  const RiskIcon = riskConfig.icon

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {establishment.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${riskConfig.color}`}>
                    <RiskIcon className="w-3 h-3 mr-1" />
                    Riesgo {riskConfig.label}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="px-6 py-6 space-y-6">
            
            {/* Información general */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Información General</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">{establishment.address}</span>
                </div>
                <div className="text-gray-600 ml-6">
                  {establishment.municipality}, Querétaro
                </div>
                {establishment.contact_phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{establishment.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Documentos asociados */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Documentos Asociados</h4>
              {establishment.documents && establishment.documents.length > 0 ? (
                <div className="space-y-2">
                  {establishment.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          {doc.valid_until && (
                            <p className="text-xs text-gray-500">
                              Vence: {new Date(doc.valid_until).toLocaleDateString('es-MX')}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {doc.status === 'approved' ? 'Aprobado' :
                         doc.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay documentos asociados</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}