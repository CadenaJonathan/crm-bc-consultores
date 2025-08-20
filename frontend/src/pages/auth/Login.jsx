import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Mail, Lock, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    try {
      console.log('Attempting login with:', data.email)
      
      const { user, error } = await signIn(data.email, data.password)
      
      if (error) {
        console.error('Login error:', error)
        setError('root', { message: error })
        return
      }

      if (user) {
        console.log('Login successful:', user.email)
        toast.success('¡Bienvenido!')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Unexpected error in login:', error)
      setError('root', { message: 'Error inesperado. Intenta de nuevo.' })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
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
                Gestiona tu documentación de Protección Civil
              </h2>
              <p className="text-primary-100 text-lg">
                Sistema integral para el manejo de documentos FEII con validación QR y alertas automáticas.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                <span>Documentos con códigos QR únicos</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                <span>Alertas automáticas de vencimiento</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                <span>Validación externa sin autenticación</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-300 rounded-full mr-3"></div>
                <span>Cumplimiento automático por municipio</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-12">
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
              Iniciar Sesión
            </h2>
            <p className="text-gray-600">
              Accede a tu cuenta para gestionar tus documentos
            </p>
          </div>

          {/* Indicador de estado de Supabase */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                🔧 <strong>Modo desarrollo:</strong> {
                  import.meta.env.VITE_SUPABASE_URL 
                    ? '✅ Supabase configurado' 
                    : '⚠️ Supabase no configurado'
                }
              </p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
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
                  className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="ejemplo@correo.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-danger-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Campo Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'Mínimo 6 caracteres'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {errors.password && (
                <p className="text-danger-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Error general */}
            {errors.root && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                {errors.root.message}
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                onClick={() => toast.info('Función próximamente')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full btn-primary flex items-center justify-center py-3"
            >
              {(isSubmitting || loading) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Link a Register */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Crear cuenta
              </Link>
            </p>
          </div>

          {/* Demo credentials en desarrollo */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2 font-medium">💡 Credenciales de prueba:</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Admin:</strong> admin@bcconsultores.com / admin123</p>
                <p><strong>Cliente:</strong> cliente@test.com / cliente123</p>
                <p className="text-xs text-gray-400 mt-2">
                  (Primero necesitas crear estas cuentas o configurar Supabase)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login