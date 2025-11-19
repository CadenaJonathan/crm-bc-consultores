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
  ArrowPathIcon,  
  CalendarIcon,      
  ClockIcon 
} from '@heroicons/react/24/outline'

const useClientProfile = () => {
  const [data, setData] = useState({
    clientUser: null,
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

      // ✅ VERIFICAR QUE user.id EXISTE
      if (!user?.id) {
        setData({
          clientUser: null,
          client: null,
          loading: false,
          error: null
        })
        return
      }

      // ✅ USAR auth_user_id CON user.id
      const { data: clientUserData, error: clientUserError } = await supabase
        .from('client_users')
        .select(`
          *,
          clients (*)
        `)
        .eq('auth_user_id', user.id)
        .single()

      if (clientUserError?.code === 'PGRST116') {
        setData({
          clientUser: null,
          client: null,
          loading: false,
          error: null,
          clientExists: false
        })
        return
      }

      if (clientUserError) throw clientUserError

      setData({
        clientUser: clientUserData,
        client: clientUserData.clients,
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
  const { clientUser, client, loading, error, refetch, clientExists } = useClientProfile()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    if (clientUser) {
      setEditedData({
        full_name: clientUser.full_name || '',
        phone: clientUser.phone || '',
        celular: clientUser.celular || '',
        area: clientUser.area || '',
        cargo: clientUser.cargo || ''
      })
    }
  }, [clientUser])

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMessage(null)

      const { error: updateError } = await supabase
        .from('client_users')
        .update(editedData)
        .eq('id', clientUser.id)

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
      full_name: clientUser.full_name || '',
      phone: clientUser.phone || '',
      celular: clientUser.celular || '',
      area: clientUser.area || '',
      cargo: clientUser.cargo || ''
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

      {/* Información del usuario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {clientUser?.full_name || 'Usuario'}
              </h2>
              <p className="text-primary-100 mt-1">{user?.email}</p>
              {clientUser?.cargo && (
                <p className="text-primary-100 text-sm">{clientUser.cargo}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          
          {/* Información de contacto - Editable */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Información Personal</h3>
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
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={editedData.full_name}
                    onChange={(e) => setEditedData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) => setEditedData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="(442) 123 4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular
                    </label>
                    <input
                      type="tel"
                      value={editedData.celular}
                      onChange={(e) => setEditedData(prev => ({ ...prev, celular: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="(442) 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Área
                    </label>
                    <input
                      type="text"
                      value={editedData.area}
                      onChange={(e) => setEditedData(prev => ({ ...prev, area: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Administración"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={editedData.cargo}
                      onChange={(e) => setEditedData(prev => ({ ...prev, cargo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Gerente"
                    />
                  </div>
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
                    <p className="text-xs text-gray-500">Nombre Completo</p>
                    <p className="text-sm font-medium text-gray-900">
                      {clientUser?.full_name || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Correo Electrónico</p>
                    <p className="text-sm font-medium text-gray-900">
                      {clientUser?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900">
                      {clientUser?.phone || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Celular</p>
                    <p className="text-sm font-medium text-gray-900">
                      {clientUser?.celular || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Área</p>
                    <p className="text-sm font-medium text-gray-900">
                      {clientUser?.area || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserCircleIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Cargo</p>
                    <p className="text-sm font-medium text-gray-900">
                      {clientUser?.cargo || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información de la empresa */}
      {client && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Empresa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón Social
              </label>
              <p className="text-gray-900">{client.name || 'No especificado'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Comercial
              </label>
              <p className="text-gray-900">{client.commercial_name || 'No especificado'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RFC
              </label>
              <p className="text-gray-900 font-mono">{client.rfc || 'No especificado'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Municipio
              </label>
              <p className="text-gray-900">{client.municipality || 'No especificado'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Riesgo
              </label>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                client.risk_level === 'alto' ? 'bg-red-100 text-red-800' :
                client.risk_level === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {client.risk_level || 'No especificado'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Negocio
              </label>
              <p className="text-gray-900 capitalize">{client.business_type || 'No especificado'}</p>
            </div>
          </div>
        </div>
      )}

     {/* Seguridad */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <h3 className="text-sm font-semibold text-gray-900 mb-4">Seguridad</h3>
  
  <div className="space-y-4">
    {/* Información de contraseña */}
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-start gap-3 flex-1">
        <KeyIcon className="w-5 h-5 text-gray-400 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Contraseña</p>
          <div className="mt-1 space-y-1">
            <p className="text-xs text-gray-600">
              <strong>Última actualización:</strong>{' '}
              {clientUser?.last_password_change 
                ? new Date(clientUser.last_password_change).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'No disponible'
              }
            </p>
            
            {clientUser?.can_change_password_at && (
              <>
                {new Date(clientUser.can_change_password_at) > new Date() ? (
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>
                      Próximo cambio disponible:{' '}
                      {new Date(clientUser.can_change_password_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3" />
                    <span>Puedes cambiar tu contraseña</span>
                  </p>
                )}
              </>
            )}
            
            {clientUser?.password_change_count > 0 && (
              <p className="text-xs text-gray-500">
                Cambios realizados: {clientUser.password_change_count}
              </p>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => setShowPasswordModal(true)}
        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors flex-shrink-0"
      >
        Cambiar
      </button>
    </div>

    {/* Recomendaciones de seguridad */}
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2">
        <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-2">Recomendaciones de seguridad:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Usa una contraseña única de al menos 8 caracteres</li>
            <li>Combina mayúsculas, minúsculas, números y símbolos</li>
            <li>No compartas tu contraseña con nadie</li>
            <li>Puedes cambiar tu contraseña cada 60 días</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

     {/* Modal de cambio de contraseña */}
{showPasswordModal && (
  <PasswordChangeModal 
    onClose={() => setShowPasswordModal(false)}
    clientUser={clientUser}  // ✅ AGREGAR ESTA PROP
  />
)}
    </div>
  )
}

// Modal para cambio de contraseña CON SISTEMA DE BLOQUEO
const PasswordChangeModal = ({ onClose, clientUser }) => {
  const { user } = useAuth()
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [passwordInfo, setPasswordInfo] = useState(null)
  const [canChange, setCanChange] = useState(false)

  // Cargar información de contraseña
  useEffect(() => {
    loadPasswordInfo()
  }, [])

  const loadPasswordInfo = async () => {
    try {
      if (!user?.id) return

      const { data, error } = await supabase
        .from('client_users')
        .select('last_password_change, can_change_password_at, password_change_count')
        .eq('auth_user_id', user.id)
        .single()

      if (error) throw error

      setPasswordInfo(data)
      
      // Verificar si puede cambiar
      if (data.can_change_password_at) {
        const canChangeDate = new Date(data.can_change_password_at)
        const now = new Date()
        setCanChange(now >= canChangeDate)
      } else {
        setCanChange(true) // Primera vez
      }

    } catch (err) {
      console.error('Error cargando info de contraseña:', err)
    }
  }

  const getDaysRemaining = () => {
    if (!passwordInfo?.can_change_password_at) return 0
    
    const canChangeDate = new Date(passwordInfo.can_change_password_at)
    const now = new Date()
    const diffTime = canChangeDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  const formatDate = (date) => {
    if (!date) return 'No disponible'
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validar que puede cambiar
    if (!canChange) {
      setError(`Debes esperar ${getDaysRemaining()} días más para cambiar tu contraseña`)
      return
    }

    if (passwords.new !== passwords.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (passwords.new.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    // Validar complejidad
    const hasUpperCase = /[A-Z]/.test(passwords.new)
    const hasLowerCase = /[a-z]/.test(passwords.new)
    const hasNumbers = /\d/.test(passwords.new)
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('La contraseña debe contener mayúsculas, minúsculas y números')
      return
    }

    try {
      setLoading(true)

      // 1. Cambiar contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (updateError) throw updateError

      // 2. Registrar el cambio en client_users
      const { error: registerError } = await supabase.rpc(
        'register_password_change',
        { user_id: user.id }
      )

      if (registerError) {
        console.warn('Error registrando cambio:', registerError)
        // No lanzar error, ya que el cambio en Auth sí funcionó
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.reload() // Recargar para actualizar la UI
      }, 2000)

    } catch (error) {
      console.error('Error cambiando contraseña:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const daysRemaining = getDaysRemaining()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                canChange ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                <KeyIcon className={`w-5 h-5 ${canChange ? 'text-primary-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Cambiar Contraseña
                </h3>
                {passwordInfo && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cambios realizados: {passwordInfo.password_change_count || 0}
                  </p>
                )}
              </div>
            </div>

            {/* Información de última actualización */}
            {passwordInfo?.last_password_change && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Última actualización</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDate(passwordInfo.last_password_change)}
                    </p>
                    
                    {!canChange && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-yellow-600" />
                          <p className="text-xs font-medium text-yellow-800">
                            Próximo cambio disponible en: <strong>{daysRemaining} días</strong>
                          </p>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          {formatDate(passwordInfo.can_change_password_at)}
                        </p>
                      </div>
                    )}

                    {canChange && passwordInfo.can_change_password_at && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          <p className="text-xs font-medium text-green-800">
                            ¡Puedes cambiar tu contraseña ahora!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success ? (
              <div className="py-8 text-center">
                <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <p className="text-green-800 font-medium mb-2">
                  ¡Contraseña actualizada correctamente!
                </p>
                <p className="text-sm text-gray-600">
                  Podrás cambiarla nuevamente en 60 días
                </p>
              </div>
            ) : (
              <>
                {!canChange ? (
                  <div className="py-8 text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium mb-2">
                      No puedes cambiar tu contraseña aún
                    </p>
                    <p className="text-sm text-gray-600">
                      Debes esperar <strong>{daysRemaining} días</strong> más
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Disponible: {formatDate(passwordInfo?.can_change_password_at)}
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
                        placeholder="Mínimo 8 caracteres"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Debe contener mayúsculas, minúsculas y números
                      </p>
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
                        placeholder="Repite la contraseña"
                        required
                        minLength={8}
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <XCircleIcon className="w-4 h-4 text-red-600" />
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>Nota:</strong> Después de cambiar tu contraseña, deberás esperar 60 días para poder cambiarla nuevamente.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
                      >
                        {loading ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                            Cambiando...
                          </>
                        ) : (
                          'Cambiar Contraseña'
                        )}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}