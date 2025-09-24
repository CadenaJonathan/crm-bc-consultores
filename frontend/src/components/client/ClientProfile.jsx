// src/components/client/ClientProfile.jsx
import { useState } from 'react'
import { useClientProfile } from '../../hooks/useClientData'
import { useAuth } from '../../contexts/AuthContext'
import { 
  UserCircleIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

const municipalityOptions = [
  'Amealco de Bonfil', 'Pinal de Amoles', 'Arroyo Seco', 'Cadereyta de Montes',
  'Colón', 'Corregidora', 'El Marqués', 'Ezequiel Montes', 'Huimilpan',
  'Jalpan de Serra', 'Landa de Matamoros', 'Pedro Escobedo', 'Peñamiller',
  'Querétaro', 'San Joaquín', 'San Juan del Río', 'Tequisquiapan', 'Tolimán'
]

const businessTypeOptions = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'educativo', label: 'Educativo' },
  { value: 'salud', label: 'Salud' },
  { value: 'hoteleria', label: 'Hotelería' },
  { value: 'entretenimiento', label: 'Entretenimiento' },
  { value: 'gubernamental', label: 'Gubernamental' },
  { value: 'religioso', label: 'Religioso' }
]

const riskLevelLabels = {
  'bajo': { label: 'Bajo', color: 'bg-green-100 text-green-800', description: 'Riesgo mínimo' },
  'medio': { label: 'Medio', color: 'bg-yellow-100 text-yellow-800', description: 'Riesgo moderado' },
  'alto': { label: 'Alto', color: 'bg-red-100 text-red-800', description: 'Riesgo elevado' }
}

export const ClientProfile = () => {
  const { user } = useAuth()
  const { profile, loading, error, updateProfile } = useClientProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  // Inicializar formulario cuando se carga el perfil o se activa edición
  useState(() => {
    if (profile && isEditing && Object.keys(editForm).length === 0) {
      setEditForm({ ...profile })
    }
  }, [profile, isEditing])

  const handleEdit = () => {
    setEditForm({ ...profile })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditForm({})
    setIsEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await updateProfile(editForm)
      
      if (error) {
        toast.error('Error al actualizar el perfil: ' + error)
      } else {
        toast.success('Perfil actualizado correctamente')
        setIsEditing(false)
        setEditForm({})
      }
    } catch (error) {
      toast.error('Error inesperado al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
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
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar perfil</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu información personal y empresarial
          </p>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={handleEdit}
            className="btn-primary flex items-center gap-2"
          >
            <PencilIcon className="w-5 h-5" />
            Editar Perfil
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={handleCancel}
              className="btn-secondary flex items-center gap-2"
              disabled={saving}
            >
              <XMarkIcon className="w-5 h-5" />
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="btn-primary flex items-center gap-2"
              disabled={saving}
            >
              <CheckIcon className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Información de la cuenta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.user_metadata?.first_name || 'Usuario'} {user?.user_metadata?.last_name || ''}
            </h2>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500">
              Cliente • Registrado: {new Date(user?.created_at).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>

        {profile?.client_code && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Código de Cliente</h3>
                <p className="text-sm text-gray-600">Identificador único en el sistema</p>
              </div>
              <code className="bg-white px-3 py-1 rounded border text-sm font-mono">
                {profile.client_code}
              </code>
            </div>
          </div>
        )}
      </div>

      {!profile ? (
        /* Perfil no completado */
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <InformationCircleIcon className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Completa tu perfil
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Para poder gestionar documentos y establecimientos, necesitas completar 
                la información de tu perfil empresarial.
              </p>
              <button 
                onClick={handleEdit}
                className="mt-3 btn-primary"
              >
                Completar Perfil
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Información empresarial */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Información Empresarial</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información básica */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre / Razón Social
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input-primary w-full"
                    placeholder="Nombre completo o razón social"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                    {profile.name || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-primary w-full"
                    placeholder="correo@ejemplo.com"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                    {profile.email || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input-primary w-full"
                    placeholder="442 123 4567"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                    {profile.phone || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RFC
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.rfc || ''}
                    onChange={(e) => handleInputChange('rfc', e.target.value.toUpperCase())}
                    className="input-primary w-full"
                    placeholder="XXXX000000XXX"
                    maxLength="13"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 font-mono">
                    {profile.rfc || 'No especificado'}
                  </p>
                )}
              </div>
            </div>

            {/* Información de ubicación y negocio */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="input-primary w-full"
                    rows="3"
                    placeholder="Calle, número, colonia..."
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                    {profile.address || 'No especificada'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio
                </label>
                {isEditing ? (
                  <select
                    value={editForm.municipality || ''}
                    onChange={(e) => handleInputChange('municipality', e.target.value)}
                    className="input-primary w-full"
                  >
                    <option value="">Selecciona un municipio</option>
                    {municipalityOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                    {profile.municipality || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio
                </label>
                {isEditing ? (
                  <select
                    value={editForm.business_type || ''}
                    onChange={(e) => handleInputChange('business_type', e.target.value)}
                    className="input-primary w-full"
                  >
                    <option value="">Selecciona un tipo</option>
                    {businessTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                    {businessTypeOptions.find(b => b.value === profile.business_type)?.label || 'No especificado'}
                  </p>
                )}
              </div>

              {profile.risk_level && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Riesgo
                  </label>
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${riskLevelLabels[profile.risk_level]?.color || 'bg-gray-100 text-gray-800'}`}>
                    {riskLevelLabels[profile.risk_level]?.label || profile.risk_level}
                    <span className="ml-2 text-xs">
                      ({riskLevelLabels[profile.risk_level]?.description})
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Calculado automáticamente según el tipo de negocio y ubicación
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas del cliente */}
      {profile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Cuenta</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {new Date(profile.created_at).toLocaleDateString('es-MX')}
              </div>
              <div className="text-sm text-gray-600">Fecha de Registro</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('es-MX') : 'Nunca'}
              </div>
              <div className="text-sm text-gray-600">Última Actualización</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${profile.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                {profile.status === 'active' ? 'Activo' : 'Inactivo'}
              </div>
              <div className="text-sm text-gray-600">Estado de la Cuenta</div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Información importante sobre tu perfil
            </h3>
            <div className="text-sm text-blue-700 mt-2 space-y-1">
              <p>• Tu información personal se mantiene segura y privada</p>
              <p>• Los cambios en el tipo de negocio pueden afectar los documentos requeridos</p>
              <p>• El nivel de riesgo se calcula automáticamente y determina la documentación necesaria</p>
              <p>• Para cambios en datos críticos (RFC, razón social), contacta con soporte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}