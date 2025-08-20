import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../../src/contexts/AuthContext'
import { ClientLayout } from '../../src/components/layouts/ClientLayout'

// Páginas temporales - las crearemos después
const ClientDashboardHome = () => {
  const { user, userRole } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ¡Bienvenido, {user?.user_metadata?.first_name || 'Cliente'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus documentos de Protección Civil desde tu panel de control
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {userRole}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documentos Activos</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprobados</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Establecimientos</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-primary-100 rounded-lg mr-4">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Subir Documento</p>
              <p className="text-sm text-gray-600">Nuevo documento FEII</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-success-100 rounded-lg mr-4">
              <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Nuevo Establecimiento</p>
              <p className="text-sm text-gray-600">Registrar ubicación</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-warning-100 rounded-lg mr-4">
              <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Ver Vencimientos</p>
              <p className="text-sm text-gray-600">Documentos por renovar</p>
            </div>
          </button>
        </div>
      </div>

      {/* Documentos recientes - Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Documentos Recientes</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos
          </button>
        </div>
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">No tienes documentos aún</p>
          <p className="text-sm text-gray-500 mt-1">Sube tu primer documento para comenzar</p>
        </div>
      </div>
    </div>
  )
}

const ClientDocuments = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Mis Documentos</h1>
    <div className="text-center py-12">
      <p className="text-gray-600">Sección de documentos en desarrollo...</p>
    </div>
  </div>
)

const ClientEstablishments = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Mis Establecimientos</h1>
    <div className="text-center py-12">
      <p className="text-gray-600">Sección de establecimientos en desarrollo...</p>
    </div>
  </div>
)

const ClientProfile = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h1>
    <div className="text-center py-12">
      <p className="text-gray-600">Sección de perfil en desarrollo...</p>
    </div>
  </div>
)

const ClientDashboard = () => {
  return (
    <ClientLayout>
      <Routes>
        <Route index element={<ClientDashboardHome />} />
        <Route path="documents" element={<ClientDocuments />} />
        <Route path="establishments" element={<ClientEstablishments />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="*" element={<ClientDashboardHome />} />
      </Routes>
    </ClientLayout>
  )
}

export default ClientDashboard