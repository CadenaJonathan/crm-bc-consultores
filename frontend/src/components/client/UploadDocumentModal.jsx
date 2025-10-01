// src/components/client/UploadDocumentModal.jsx
import { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export const UploadDocumentModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1) // 1: selección, 2: subiendo, 3: éxito
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [formData, setFormData] = useState({
    documentTypeId: '',
    establishmentId: '',
    validFrom: '',
    validUntil: '',
    notes: ''
  })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [documentTypes, setDocumentTypes] = useState([])
  const [establishments, setEstablishments] = useState([])
  
  const fileInputRef = useRef(null)
  const { user } = useAuth()

  // Cargar tipos de documentos y establecimientos al abrir
  useState(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  const loadInitialData = async () => {
    try {
      // Obtener email del usuario
      const userEmail = typeof user === 'string' ? user : user?.email

      // Obtener ID del cliente
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (!clientData) return

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
        .eq('client_id', clientData.id)

      setEstablishments(ests || [])

    } catch (err) {
      console.error('Error cargando datos:', err)
    }
  }

  // Manejo de drag and drop
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF')
      return
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El archivo no debe superar 10MB')
      return
    }

    setError(null)
    setSelectedFile(file)
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
      // Obtener email del usuario
      const userEmail = typeof user === 'string' ? user : user?.email

      // Obtener ID del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (clientError) throw new Error('Error obteniendo datos del cliente')

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const fileName = `${clientData.id}/${timestamp}_${selectedFile.name}`

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

      // Crear registro en la tabla documents
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          client_id: clientData.id,
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
      
      // Llamar callback de éxito después de 2 segundos
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
    setStep(1)
    setSelectedFile(null)
    setFormData({
      documentTypeId: '',
      establishmentId: '',
      validFrom: '',
      validUntil: '',
      notes: ''
    })
    setError(null)
    setUploading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={step !== 2 ? handleClose : undefined}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <CloudArrowUpIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Subir Documento
                  </h3>
                  <p className="text-sm text-primary-100">
                    {step === 1 && 'Selecciona el archivo y completa la información'}
                    {step === 2 && 'Procesando tu documento...'}
                    {step === 3 && '¡Documento subido exitosamente!'}
                  </p>
                </div>
              </div>
              {step !== 2 && (
                <button
                  onClick={handleClose}
                  className="text-white hover:text-primary-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6">
              
              {/* Paso 1: Selección de archivo */}
              {step === 1 && (
                <div className="space-y-6">
                  
                  {/* Zona de drag and drop */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-primary-500 bg-primary-50' 
                        : selectedFile
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileInput}
                    />
                    
                    {!selectedFile ? (
                      <>
                        <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Arrastra tu archivo PDF aquí
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          o haz clic para seleccionar
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          Seleccionar archivo
                        </button>
                        <p className="text-xs text-gray-400 mt-4">
                          Tamaño máximo: 10MB | Formato: PDF
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <DocumentTextIcon className="w-12 h-12 text-green-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Información del documento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Tipo de documento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Documento *
                      </label>
                      <select
                        required
                        value={formData.documentTypeId}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          documentTypeId: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Selecciona un tipo</option>
                        {documentTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.code} - {type.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Establecimiento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Establecimiento (opcional)
                      </label>
                      <select
                        value={formData.establishmentId}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          establishmentId: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Sin establecimiento específico</option>
                        {establishments.map(est => (
                          <option key={est.id} value={est.id}>
                            {est.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha válido desde */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Válido desde
                      </label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          validFrom: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    {/* Fecha válido hasta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Válido hasta
                      </label>
                      <input
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          validUntil: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        notes: e.target.value 
                      }))}
                      placeholder="Agrega cualquier información relevante sobre este documento..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Información importante */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Información importante:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>Tu documento será revisado por nuestro equipo</li>
                          <li>Recibirás una notificación cuando sea aprobado</li>
                          <li>El proceso de revisión toma entre 24-48 horas</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 2: Subiendo */}
              {step === 2 && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Subiendo documento...
                  </h3>
                  <p className="text-gray-600">
                    Por favor espera mientras procesamos tu archivo
                  </p>
                </div>
              )}

              {/* Paso 3: Éxito */}
              {step === 3 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ¡Documento subido exitosamente!
                  </h3>
                  <p className="text-gray-600">
                    Tu documento está en revisión. Te notificaremos cuando sea aprobado.
                  </p>
                </div>
              )}

            </div>

            {/* Footer con botones */}
            {step === 1 && (
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Subir Documento
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}