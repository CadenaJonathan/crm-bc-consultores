// src/components/client/ClientProfile.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const useClientProfile = () => {
  const [data, setData] = useState({
    client: null,
    loading: true,
    error: null
  })
  const { user } = useAuth()

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      const userEmail = typeof user === 'string' ? user : user?.email
      if (!userEmail) return

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', userEmail)
        .single()

      if (clientError?.code === 'PGRST116') {
        setData({
          client: null,
          loading: false,
          error: null,
          clientExists: false
        })
        return
      }

      if (clientError) throw clientError

      setData({
        client: clientData,
        loading: false,
        error: null,
        clientExists: true
      })

    } catch (error) {
      console.error('Error cargando perfil:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }))
    }
  }

  return { ...data, refetch: fetchProfile }
}

export const ClientProfile = () => {
  const { client, loading, error, refetch, clientExists } = useClientProfile()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    if (client) {
      setEditedData({
        contact_name: client.contact_name || '',
        contact_phone: client.contact_phone || '',
        contact_email: client.contact_email || client.email || ''
      })
    }
  }, [client])

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMessage(null)

      const { error: updateError } = await supabase
        .from('clients')
        .update(editedData)
        .eq('id', client.id)

      if (updateError) throw updateError

      setSaveMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
      setIsEditing(false)
      refetch()

      setTimeout(() => setSaveMessage(null), 5000)

    } catch (error) {
      console.error('Error actualizando perfil:', error)
      setSaveMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData({
      contact_name: client.contact_name || '',
      contact_phone: client.contact_phone || '',
      contact_email: client.contact_email || client.email || ''
    })
    setIsEditing(false)
    setSaveMessage(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar perfil</h3>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h1>
        <div className="text-center py-12">
          <UserCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu información y preferencias
          </p>
        </div>
      </div>

      {/* Mensaje de éxito/error */}
      {saveMessage && (
        <div className={`rounded-lg p-4 ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            {saveMessage.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
            )}
            <p className={`text-sm font-medium ${
              saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {saveMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* Información de la empresa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {client.business_name || 'Empresa'}
              </h2>
              {client.rfc && (
                <p className="text-primary-100 mt-1">RFC: {client.rfc}</p>
              )}
              {client.client_code && (
                <p className="text-primary-100">Código: {client.client_code}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          
          {/* Información no editable */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Información de la Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Razón Social</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.business_name || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Dirección Fiscal</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.address || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email Principal</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.email}
                  </p>
                </div>
              </div>

              {client.municipality && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Municipio</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.municipality}, Querétaro
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de contacto - Editable */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Información de Contacto</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Contacto
                  </label>
                  <input
                    type="text"
                    value={editedData.contact_name}
                    onChange={(e) => setEditedData(prev => ({ ...prev, contact_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={editedData.contact_phone}
                    onChange={(e) => setEditedData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="(442) 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={editedData.contact_email}
                    onChange={(e) => setEditedData(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
                  >
                    {saving ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <UserCircleIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Contacto</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.contact_name || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.contact_phone || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Email de Contacto</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.contact_email || client.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Seguridad</h3>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <KeyIcon className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Contraseña</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Última actualización: {new Date().toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cambiar
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Recomendaciones de seguridad:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-blue-700">
                <li>Usa una contraseña única de al menos 8 caracteres</li>
                <li>Combina mayúsculas, minúsculas, números y símbolos</li>
                <li>No compartas tu contraseña con nadie</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  )
}

// Modal para cambio de contraseña
const PasswordChangeModal = ({ onClose }) => {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (passwords.new !== passwords.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (passwords.new.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      setLoading(true)

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error cambiando contraseña:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                <KeyIcon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cambiar Contraseña
              </h3>
            </div>

            {success ? (
              <div className="py-8 text-center">
                <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-green-800 font-medium">
                  Contraseña actualizada correctamente
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}