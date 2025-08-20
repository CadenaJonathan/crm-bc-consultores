import { Loader2 } from 'lucide-react'

export const Loading = ({ size = 'md', text = 'Cargando...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 mb-2`} />
      {text && (
        <p className="text-gray-600 text-sm">{text}</p>
      )}
    </div>
  )
}

export const LoadingSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />
  )
}

export const PageLoading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Cargando aplicación
        </h3>
        <p className="text-gray-600">
          Un momento por favor...
        </p>
      </div>
    </div>
  )
}