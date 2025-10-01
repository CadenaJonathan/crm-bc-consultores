// src/components/client/DocumentViewerModal.jsx
import { useState } from 'react'
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  under_review: { label: 'En Revisión', color: 'bg-blue-100 text-blue-800', icon: DocumentTextIcon },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  expired: { label: 'Vencido', color: 'bg-gray-100 text-gray-800', icon: ExclamationTriangleIcon }
}

const formatDate = (date) => {
  if (!date) return 'No definida'
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const DocumentViewerModal = ({ isOpen, onClose, document }) => {
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!isOpen || !document) return null

  const status = statusConfig[document.status] || statusConfig.pending
  const StatusIcon = status.icon

  const handleDownload = () => {
    window.open(document.file_url, '_blank')
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className={`relative bg-white rounded-lg shadow-xl transform transition-all ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh] m-4'
        }`}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {document.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </span>
                    {document.document_types && (
                      <span className="text-sm text-primary-100">
                        {document.document_types.code} - {document.document_types.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Controles del header */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Alejar"
                >
                  <MagnifyingGlassMinusIcon className="w-5 h-5" />
                </button>
                
                <span className="text-white text-sm font-medium min-w-[4rem] text-center">
                  {zoom}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Acercar"
                >
                  <MagnifyingGlassPlusIcon className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-white bg-opacity-30 mx-2"></div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={handleDownload}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Descargar"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  title="Cerrar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Información del documento */}
          {!isFullscreen && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Subido: {formatDate(document.created_at)}</span>
                </div>
                
                {document.valid_from && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Válido desde: {formatDate(document.valid_from)}</span>
                  </div>
                )}
                
                {document.valid_until && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Vence: {formatDate(document.valid_until)}</span>
                  </div>
                )}
              </div>
              
              {document.review_comments && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Comentarios del revisor:</span> {document.review_comments}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Visor de PDF */}
          <div className="relative bg-gray-100" style={{ 
            height: isFullscreen ? 'calc(100vh - 80px)' : 'calc(90vh - 180px)' 
          }}>
            <div className="absolute inset-0 overflow-auto">
              <div className="flex items-center justify-center min-h-full p-4">
                {document.file_url ? (
                  <iframe
                    src={`${document.file_url}#toolbar=0&navpanes=0&scrollbar=0&zoom=${zoom}`}
                    className="bg-white shadow-2xl"
                    style={{
                      width: `${zoom}%`,
                      height: '100%',
                      minHeight: '600px',
                      border: 'none'
                    }}
                    title={document.name}
                  />
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No se pudo cargar el documento</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer con información adicional */}
          {!isFullscreen && document.notes && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Notas:</span> {document.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}