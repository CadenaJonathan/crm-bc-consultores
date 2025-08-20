import { Routes, Route } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AdminLayout } from '../../components/layouts/AdminLayout'

// Páginas temporales - las crearemos después
const AdminDashboardHome = () => {
  const { user, userRole } = useAuth()

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Administración
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, {user?.user_metadata?.first_name || 'Administrador'}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-800">
              {userRole}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de estadísticas administrativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="p-2 bg-warning-100 rounded-lg">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes Revisión</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones administrativas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Administrativas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-primary-100 rounded-lg mr-4">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Revisar Documentos</p>
              <p className="text-sm text-gray-600">Aprobar/Rechazar</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-success-100 rounded-lg mr-4">
              <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Gestionar Clientes</p>
              <p className="text-sm text-gray-600">Ver, editar, crear</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-warning-100 rounded-lg mr-4">
              <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Reportes</p>
              <p className="text-sm text-gray-600">Analytics y métricas</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-gray-100 rounded-lg mr-4">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Configuración</p>
              <p className="text-sm text-gray-600">Sistema y usuarios</p>
            </div>
          </button>
        </div>
      </div>

      {/* Documentos pendientes de revisión */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Documentos Pendientes de Revisión</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos
          </button>
        </div>
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600">No hay documentos pendientes de revisión</p>
          <p className="text-sm text-gray-500 mt-1">Todos los documentos están al día</p>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">No hay actividad reciente</p>
        </div>
      </div>
    </div>
  )
}

const AdminClients = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Clientes</h1>
    <div className="text-center py-12">
      <p className="text-gray-600">Sección de gestión de clientes en desarrollo...</p>
    </div>
  </div>
)

const AdminDocuments = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Revisión de Documentos</h1>
    <div className="text-center py-12">
      <p className="text-gray-600">Sección de revisión de documentos en desarrollo...</p>
    </div>
  </div>
)

const AdminReports = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Reportes y Analytics</h1>
    <div className="text-center py-12">
      <p className="text-gray-600">Sección de reportes en desarrollo...</p>
    </div>
  </div>
)

const AdminSettings = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Configuración del Sistema</h1>
    <div className="text-center py-12">
      <p className="text-gray-600">Sección de configuración en desarrollo...</p>
    </div>
  </div>
)

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboardHome />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="documents" element={<AdminDocuments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<AdminDashboardHome />} />
      </Routes>
    </AdminLayout>
  )
}

export default AdminDashboard