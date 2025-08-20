import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, User, Building, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      phone: ''
    }
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    // Validar que las contraseñas coincidan
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { message: 'Las contraseñas no coinciden' })
      return
    }

    try {
      console.log('📝 Intentando registro para:', data.email)
      
      const userData = {
        first_name: data.firstName,
        last_name: data.lastName,
        company_name: data.companyName,
        phone: data.phone,
        full_name: `${data.firstName} ${data.lastName}`
      }

      const { user, error } = await signUp(data.email, data.password, userData)
      
      if (error) {
        console.error('❌ Error en registro:', error)
        setError('root', { message: error })
        return
      }

      if (user) {
        console.log('✅ Registro exitoso:', user.email)
        toast.success('¡Cuenta creada! Revisa tu email para confirmar.')
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Error inesperado en registro:', error)
      setError('root', { message: 'Error inesperado. Intenta de nuevo.' })
    }
  }

  // Validador de fortaleza de contraseña
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    const checks = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password)
    }
    
    strength = Object.values(checks).filter(Boolean).length
    
    if (strength <= 1) return { strength, label: 'Débil', color: 'bg-danger-500' }
    if (strength <= 2) return { strength, label: 'Media', color: 'bg-warning-500' }
    if (strength <= 3) return { strength, label: 'Fuerte', color: 'bg-success-500' }
    return { strength, label: 'Muy fuerte', color: 'bg-success-600' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Shield className="w-12 h-12 mr-4" />
              <div>
                <h1 className="text-3xl font-bold">B&C Consultores</h1>
                <p className="text-primary-100">CRM Protección Civil</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Únete a nuestra plataforma
              </h2>
              <p className="text-primary-100 text-lg">
                Gestiona todos tus documentos de Protección Civil de manera eficiente y segura.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3 mt-2"></div>
                <div>
                  <p className="font-medium">Documentación automatizada</p>
                  <p className="text-sm text-primary-100">Genera y gestiona documentos FEII</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3 mt-2"></div>
                <div>
                  <p className="font-medium">Alertas inteligentes</p>
                  <p className="text-sm text-primary-100">Notificaciones antes del vencimiento</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3 mt-2"></div>
                <div>
                  <p className="font-medium">Cumplimiento garantizado</p>
                  <p className="text-sm text-primary-100">Configuración automática por municipio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de Registro */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center px-8 lg:px-12 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Header móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">B&C Consultores</h1>
                <p className="text-gray-600">CRM Protección Civil</p>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Crear Cuenta
            </h2>
            <p className="text-gray-600">
              Completa tus datos para comenzar
            </p>
          </div>

          {/* Indicador de estado */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                🚀 <strong>Registro funcionando</strong> - Se creará cuenta real en Supabase
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('firstName', {
                      required: 'El nombre es requerido',
                      minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                    })}
                    type="text"
                    id="firstName"
                    className={`input-field pl-10 py-2 ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="Juan"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-danger-600 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  {...register('lastName', {
                    required: 'El apellido es requerido',
                    minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                  })}
                  type="text"
                  id="lastName"
                  className={`input-field py-2 ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Pérez"
                />
                {errors.lastName && (
                  <p className="text-danger-600 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  id="email"
                  className={`input-field pl-10 py-2 ${errors.email ? 'input-error' : ''}`}
                  placeholder="juan@empresa.com"
                />
              </div>
              {errors.email && (
                <p className="text-danger-600 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Empresa y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    {...register('companyName', {
                      required: 'La empresa es requerida'
                    })}
                    type="text"
                    id="companyName"
                    className={`input-field pl-10 py-2 ${errors.companyName ? 'input-error' : ''}`}
                    placeholder="Mi Empresa S.A."
                  />
                </div>
                {errors.companyName && (
                  <p className="text-danger-600 text-xs mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  {...register('phone', {
                    required: 'El teléfono es requerido',
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Formato inválido'
                    }
                  })}
                  type="tel"
                  id="phone"
                  className={`input-field py-2 ${errors.phone ? 'input-error' : ''}`}
                  placeholder="442 123 4567"
                />
                {errors.phone && (
                  <p className="text-danger-600 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`input-field pl-10 pr-10 py-2 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Indicador de fortaleza */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Fortaleza</span>
                    <span className={`text-xs font-medium ${passwordStrength.strength >= 3 ? 'text-success-600' : passwordStrength.strength >= 2 ? 'text-warning-600' : 'text-danger-600'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-danger-600 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Confirma tu contraseña'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`input-field pl-10 pr-10 py-2 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-danger-600 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Error general */}
            {errors.root && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full btn-primary flex items-center justify-center py-3"
            >
              {(isSubmitting || loading) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {/* Link a Login */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register