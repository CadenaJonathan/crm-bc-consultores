import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import { queryClient } from './lib/queryClient'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { PageLoading } from './components/common/Loading'

// Importaciones de páginas (las crearemos en los siguientes pasos)
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import ClientDashboard from './pages/client/ClientDashboard'
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
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Componente para rutas públicas (solo accesibles sin autenticación)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Componente principal de rutas
const AppRoutes = () => {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return <PageLoading />
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Rutas protegidas */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />

      {/* Dashboard específico por rol */}
      <Route 
        path="/client/*" 
        element={
          <ProtectedRoute requiredRole="cliente">
            <ClientDashboard />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Ruta por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Ruta 404 */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
              <button 
                onClick={() => window.history.back()}
                className="btn-primary"
              >
                Volver atrás
              </button>
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