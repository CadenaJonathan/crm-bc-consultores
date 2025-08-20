import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Building, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/common/Loading'

// Schema de validación
const registerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
  companyName: z
    .string()
    .min(2, 'El nombre de la empresa es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .regex(/^[0-9+\-\s()]+$/, 'Formato de teléfono inválido'),
  terms: z
    .boolean()
    .refine(val => val === true, 'Debes aceptar los términos y condiciones')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

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
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      phone: '',
      terms: false
    }
  })

  const password = watch('password')

  const onSubmit = async (data) => {
    try {
      const userData = {
        first_name: data.firstName,
        last_name: data.lastName,
        company_name: data.companyName,
        phone: data.phone,
        full_name: `${data.firstName} ${data.lastName}`
      }

      const { user, error } = await signUp(data.email, data.password, userData)
      
      if (error) {
        setError('root', { message: error })
        return
      }

      if (user) {
        // Redirigir a página de confirmación o dashboard
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error en registro:', error)
      setError('root', { message: 'Error inesperado. Intenta de nuevo.' })
    }
  }

  // Validador de fortaleza de contraseña
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    }
    
    strength = Object.values(checks).filter(Boolean).length
    
    if (strength <= 2) return { strength, label: 'Débil', color: 'bg-danger-500' }
    if (strength <= 3) return { strength, label: 'Media', color: 'bg-warning-500' }
    if (strength <= 4) return { strength, label: 'Fuerte', color: 'bg-success-500' }
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
                  <p className="text-sm text-primary-100">Genera y gestiona documentos FEII con códigos QR únicos</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3 mt-2"></div>
                <div>
                  <p className="font-medium">Alertas inteligentes</p>
                  <p className="text-sm text-primary-100">Recibe notificaciones antes del vencimiento</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3 mt-2"></div>
                <div>
                  <p className="font-medium">Cumplimiento garantizado</p>
                  <p className="text-sm text-primary-100">Configuración automática por municipio y tipo de negocio</p>
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

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    className={`input-field pl-10 ${errors.firstName ? 'input-error' : ''}`}
                    placeholder="Juan"
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-danger-600 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  id="lastName"
                  className={`input-field ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Pérez"
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="text-danger-600 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="juan@empresa.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-danger-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Empresa y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('companyName')}
                    type="text"
                    id="companyName"
                    className={`input-field pl-10 ${errors.companyName ? 'input-error' : ''}`}
                    placeholder="Mi Empresa S.A."
                    autoComplete="organization"
                  />
                </div>
                {errors.companyName && (
                  <p className="text-danger-600 text-sm mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className={`input-field ${errors.phone ? 'input-error' : ''}`}
                  placeholder="442 123 4567"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="text-danger-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Indicador de fortaleza */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Fortaleza de contraseña</span>
                    <span className={`text-xs font-medium ${passwordStrength.strength >= 3 ? 'text-success-600' : passwordStrength.strength >= 2 ? 'text-warning-600' : 'text-danger-600'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-danger-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-danger-600 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Términos y condiciones */}
            <div className="flex items-start">
              <input
                {...register('terms')}
                type="checkbox"
                id="terms"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                Acepto los{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                  términos y condiciones
                </Link>
                {' '}y la{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                  política de privacidad
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-danger-600 text-sm">{errors.terms.message}</p>
            )}

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
                  <LoadingSpinner size="sm" className="mr-2" />
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