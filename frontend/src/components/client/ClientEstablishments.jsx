// src/components/client/ClientEstablishments.jsx
import { useState } from 'react'
import { useClientEstablishments } from '../../hooks/useClientData'
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

const businessTypeLabels = {
  'comercial': 'Comercial',
  'industrial': 'Industrial', 
  'servicios': 'Servicios',
  'educativo': 'Educativo',
  'salud': 'Salud',
  'hoteleria': 'Hotelería',
  'entretenimiento': 'Entretenimiento',
  'gubernamental': 'Gubernamental',
  'religioso': 'Religioso'
}

const riskLevelLabels = {
  'bajo': { label: 'Bajo', color: 'bg-green-100 text-green-800' },
  'medio': { label: 'Medio', color: 'bg-yellow-100 text-yellow-800' },
  'alto': { label: 'Alto', color: 'bg-red-100 text-red-800' }
}

const formatAddress = (establishment) => {
  const parts = []
  if (establishment.address) parts.push(establishment.address)
  if (establishment.municipality) parts.push(establishment.municipality)
  return parts.join(', ')
}

export const ClientEstablishments = () => {
  const { establishments, loading, error, refetch } = useClientEstablishments()
  const [showModal, setShowModal] = useState(false)
  const [selectedEstablishment, setSelectedEstablishment] = useState(null)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
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
            className="btn-primary"
          >
            Reintentar
          </button>
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
            Gestiona las ubicaciones de tus negocios y propiedades
          </p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Registrar Establecimiento
        </button>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Información sobre establecimientos
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Cada establecimiento requiere documentación específica según su giro comercial, 
              ubicación y nivel de riesgo. Asegúrate de mantener actualizada la información 
              para un procesamiento correcto de tus documentos.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de establecimientos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {establishments.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes establecimientos registrados
            </h3>
            <p className="text-gray-600 mb-6">
              Registra tu primer establecimiento para comenzar con la gestión de documentos
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Registrar Primer Establecimiento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {establishments.map((establishment) => {
              const riskLevel = riskLevelLabels[establishment.risk_level] || { label: 'No definido', color: 'bg-gray-100 text-gray-800' }
              
              return (
                <div key={establishment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {establishment.business_name || 'Establecimiento sin nombre'}
                            </h3>
                            
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskLevel.color}`}>
                              Riesgo {riskLevel.label}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="w-4 h-4" />
                              <span>{formatAddress(establishment) || 'Dirección no especificada'}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <span className="font-medium">Giro:</span>{' '}
                                {businessTypeLabels[establishment.business_type] || establishment.business_type || 'No especificado'}
                              </div>
                              
                              {establishment.business_subtype && (
                                <div>
                                  <span className="font-medium">Subtipo:</span>{' '}
                                  {establishment.business_subtype}
                                </div>
                              )}
                              
                              {establishment.floor_area && (
                                <div>
                                  <span className="font-medium">Área:</span>{' '}
                                  {establishment.floor_area} m²
                                </div>
                              )}
                            </div>
                            
                            {establishment.contact_person && (
                              <div>
                                <span className="font-medium">Contacto:</span>{' '}
                                {establishment.contact_person}
                                {establishment.contact_phone && (
                                  <span className="ml-2">• {establishment.contact_phone}</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {establishment.description && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Descripción:</strong> {establishment.description}
                              </p>
                            </div>
                          )}
                          
                          {/* Información adicional de coordenadas */}
                          {(establishment.latitude && establishment.longitude) && (
                            <div className="mt-2 text-xs text-gray-500">
                              Coordenadas: {establishment.latitude}, {establishment.longitude}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        className="btn-secondary-sm flex items-center gap-2"
                        onClick={() => {
                          setSelectedEstablishment(establishment)
                          setShowModal(true)
                        }}
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Ver
                      </button>
                      
                      <button 
                        className="btn-secondary-sm flex items-center gap-2"
                        onClick={() => {
                          setSelectedEstablishment(establishment)
                          // Aquí iría la lógica para editar
                        }}
                        title="Editar establecimiento"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Resumen de establecimientos */}
      {establishments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {establishments.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {establishments.filter(e => e.risk_level === 'alto').length}
              </div>
              <div className="text-sm text-gray-600">Alto Riesgo</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {establishments.filter(e => e.risk_level === 'medio').length}
              </div>
              <div className="text-sm text-gray-600">Medio Riesgo</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {establishments.filter(e => e.risk_level === 'bajo').length}
              </div>
              <div className="text-sm text-gray-600">Bajo Riesgo</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal placeholder (se implementaría después) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedEstablishment ? 'Detalles del Establecimiento' : 'Nuevo Establecimiento'}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedEstablishment 
                ? 'Visualización detallada del establecimiento seleccionado.'
                : 'Formulario para registrar un nuevo establecimiento estará disponible próximamente.'
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedEstablishment(null)
                }}
                className="btn-secondary"
              >
                Cerrar
              </button>
              {!selectedEstablishment && (
                <button className="btn-primary">
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}