import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import { queryClient } from './lib/queryClient'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PageLoading } from './components/common/Loading'

// Importaciones de páginas
import Login from './pages/auth/Login.jsx'
import ClientDashboard from '../src/pages/Client/ClientDashboard.jsx'
import AdminDashboard from './pages/admin/AdminDashboard'

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, userRole, loading, hasPermission } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    // Redirigir según el rol del usuario si no tiene permisos para la ruta solicitada
    if (userRole === 'cliente') {
      return <Navigate to="/dashboard/cliente" replace />
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      return <Navigate to="/dashboard/admin" replace />
    } else {
      return <Navigate to="/login" replace />
    }
  }

  return children
}

// Componente para rutas públicas (solo accesibles sin autenticación)
const PublicRoute = ({ children }) => {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  if (user) {
    // Redirigir según el rol del usuario autenticado
    if (userRole === 'cliente') {
      return <Navigate to="/dashboard/cliente" replace />
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      return <Navigate to="/dashboard/admin" replace />
    } else {
      return <Navigate to="/dashboard/cliente" replace />
    }
  }

  return children
}

// Componente de redirección inteligente para /dashboard
const DashboardRedirect = () => {
  const { userRole, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  // Redirigir según el rol
  if (userRole === 'cliente') {
    return <Navigate to="/dashboard/cliente" replace />
  } else if (userRole === 'admin' || userRole === 'superadmin') {
    return <Navigate to="/dashboard/admin" replace />
  } else {
    // Si no hay rol definido, ir al login
    return <Navigate to="/login" replace />
  }
}

// Componente principal de rutas
const AppRoutes = () => {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  return (
    <Routes>
      {/* Ruta de login */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Ruta de dashboard genérico - redirige según rol */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        } 
      />

      {/* Dashboard para clientes */}
      <Route 
        path="/dashboard/cliente/*" 
        element={
          <ProtectedRoute requiredRole="cliente">
            <ClientDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Dashboard para administradores (admin y superadmin) */}
      <Route 
        path="/dashboard/admin/*" 
        element={
          <ProtectedRoute requiredRole={['admin', 'superadmin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Ruta raíz - redirige a dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Rutas legacy/alternativas para compatibilidad */}
      <Route path="/client/*" element={<Navigate to="/dashboard/cliente" replace />} />
      <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
      
      {/* Ruta 404 */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
              <div className="space-x-4">
                <button 
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Volver atrás
                </button>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Ir al Dashboard
                </button>
              </div>
            </div>
          </div>
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <AppRoutes />
            
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </AuthProvider>
      </Router>
      
      {/* React Query DevTools - solo en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

export default App