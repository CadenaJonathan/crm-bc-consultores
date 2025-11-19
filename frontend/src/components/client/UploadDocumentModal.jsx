// src/components/client/UploadDocumentModal.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  XMarkIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'

const UploadDocumentModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth()
  
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [documentTypes, setDocumentTypes] = useState([])
  const [establishments, setEstablishments] = useState([])
  
  const [formData, setFormData] = useState({
    documentTypeId: '',
    establishmentId: '',
    validFrom: '',
    validUntil: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen, user])

  const loadInitialData = async () => {
    try {
      if (!user?.id) return

      // Obtener client_id desde client_users
      const { data: clientUserData } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!clientUserData) return

      // Cargar tipos de documentos
      const { data: types } = await supabase
        .from('document_types')
        .select('id, code, name, description')
        .order('code')

      setDocumentTypes(types || [])

      // Cargar establecimientos del cliente
      const { data: ests } = await supabase
        .from('establishments')
        .select('id, name, address')
        .eq('client_id', clientUserData.client_id)

      setEstablishments(ests || [])

    } catch (err) {
      console.error('Error cargando datos:', err)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no debe superar 10MB')
        return
      }
      
      // Validar tipo
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        setError('Solo se permiten archivos PDF o imágenes (JPG, PNG)')
        return
      }
      
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError('Debes seleccionar un archivo')
      return
    }

    if (!formData.documentTypeId) {
      setError('Debes seleccionar un tipo de documento')
      return
    }

    setUploading(true)
    setError(null)
    setStep(2)

    try {
      if (!user?.id) throw new Error('Usuario no autenticado')

      // Obtener client_id desde client_users
      const { data: clientUserData, error: clientError } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('auth_user_id', user.id)
        .single()

      if (clientError) throw new Error('Error obteniendo datos del cliente')

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const fileName = `${clientUserData.client_id}/${timestamp}_${selectedFile.name}`

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      // Crear registro en la tabla client_documents
      const { data: docData, error: docError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientUserData.client_id,
          establishment_id: formData.establishmentId || null,
          document_type_id: formData.documentTypeId,
          name: selectedFile.name,
          file_url: publicUrl,
          file_path: fileName,
          file_size: selectedFile.size,
          status: 'pending',
          valid_from: formData.validFrom || null,
          valid_until: formData.validUntil || null,
          notes: formData.notes || null,
          version: 1
        })
        .select()
        .single()

      if (docError) throw docError

      console.log('Documento subido exitosamente:', docData)
      
      setStep(3)
      
      setTimeout(() => {
        onSuccess?.()
        handleClose()
      }, 2000)

    } catch (err) {
      console.error('Error subiendo documento:', err)
      setError(err.message || 'Error al subir el documento')
      setStep(1)
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setStep(1)
      setSelectedFile(null)
      setError(null)
      setFormData({
        documentTypeId: '',
        establishmentId: '',
        validFrom: '',
        validUntil: '',
        notes: ''
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 1 && 'Subir Documento'}
            {step === 2 && 'Subiendo Documento...'}
            {step === 3 && '¡Documento Subido!'}
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Formulario */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selector de archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <DocumentIcon className="w-8 h-8 text-primary-600" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Haz clic para seleccionar o arrastra un archivo aquí
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG (máx. 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Tipo de documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.documentTypeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentTypeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.code} - {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Establecimiento (opcional) */}
              {establishments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Establecimiento (opcional)
                  </label>
                  <select
                    value={formData.establishmentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, establishmentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Ninguno</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.id}>
                        {est.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fechas de validez */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Válido Desde
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Válido Hasta
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Información adicional sobre el documento..."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || !formData.documentTypeId}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Subir Documento
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Subiendo */}
          {step === 2 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Subiendo documento...</p>
            </div>
          )}

          {/* Step 3: Éxito */}
          {step === 3 && (
            <div className="text-center py-12">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Documento subido exitosamente!
              </h3>
              <p className="text-gray-600">
                Tu documento está siendo procesado y será revisado pronto.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadDocumentModal