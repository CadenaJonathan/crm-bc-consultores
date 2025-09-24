// REEMPLAZAR COMPLETAMENTE tu ClientDashboard.jsx con este código actualizado

import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ClientLayout } from '../../components/layouts/ClientLayout'
import { ClientDocuments } from '../../components/client/ClientDocuments' // Importar el componente completo
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  PlusIcon,
  BellIcon,
  CalendarIcon,
  ClockIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

// Hook simplificado SOLO para el cliente actual
const useSimpleClientData = () => {
  const [data, setData] = useState({
    stats: {
      activeDocuments: 0,
      approvedDocuments: 0,
      expiringDocuments: 0,
      totalEstablishments: 0,
      compliancePercentage: 0
    },
    documents: [],
    establishments: [],
    notifications: [],
    loading: true,
    error: null
  })
  const { user } = useAuth()

  useEffect(() => {
    const fetchClientData = async () => {
      console.log('🔍 useSimpleClientData - Iniciando con user:', user)
      
      // Detectar si user es string (email) u objeto
      let userEmail;
      let userId;
      
      if (typeof user === 'string') {
        console.log('📧 User es string (email):', user)
        userEmail = user;
        userId = null;
      } else if (user?.id) {
        console.log('👤 User es objeto con ID:', user.id)
        userEmail = user.email;
        userId = user.id;
      } else {
        console.log('❌ No hay user válido, esperando...')
        return
      }

      console.log('✅ Procediendo con email:', userEmail, 'y userId:', userId)
      
      try {
        console.log('📊 Iniciando carga de datos del cliente...')
        setData(prev => ({ ...prev, loading: true, error: null }))

        // 1. Buscar el ID del cliente en la tabla clients usando solo email
        console.log('🔍 Buscando cliente en tabla clients por email:', userEmail)
        
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', userEmail)
          .single()

        console.log('📋 Resultado consulta clients:', { clientData, clientError })

        if (clientError) {
          console.log('⚠️ Cliente no encontrado en la tabla clients:', clientError.message)
          console.log('📝 Código de error:', clientError.code)
          
          // Si el error es que no existe (PGRST116), no es un error real
          if (clientError.code === 'PGRST116') {
            console.log('✅ Cliente simplemente no existe aún - creando estado vacío')
            setData({
              stats: {
                activeDocuments: 0,
                approvedDocuments: 0,
                expiringDocuments: 0,
                totalEstablishments: 0,
                compliancePercentage: 0
              },
              documents: [],
              establishments: [],
              notifications: [],
              loading: false,
              error: null,
              clientExists: false
            })
            return
          } else {
            // Error real de permisos o conectividad
            throw new Error(`Error consultando clients: ${clientError.message}`)
          }
        }

        console.log('✅ Cliente encontrado en clients:', clientData.id)

        // 2. Obtener documentos si existe el cliente
        let documents = []
        let establishments = []
        
        if (clientData) {
          console.log('📄 Cargando documentos para client_id:', clientData.id)
          
          // Documentos
          try {
            const { data: docsData, error: docsError } = await supabase
              .from('documents')
              .select('*')
              .eq('client_id', clientData.id)
              .order('created_at', { ascending: false })

            console.log('📄 Resultado documentos:', { 
              count: docsData?.length || 0, 
              error: docsError?.message || 'none' 
            })

            if (!docsError) {
              documents = docsData || []
            }
          } catch (err) {
            console.log('❌ Error cargando documentos:', err.message)
          }

          console.log('🏢 Cargando establecimientos para client_id:', clientData.id)
          
          // Establecimientos
          try {
            const { data: estData, error: estError } = await supabase
              .from('establishments')
              .select('*')
              .eq('client_id', clientData.id)

            console.log('🏢 Resultado establecimientos:', { 
              count: estData?.length || 0, 
              error: estError?.message || 'none' 
            })

            if (!estError) {
              establishments = estData || []
            }
          } catch (err) {
            console.log('❌ Error cargando establecimientos:', err.message)
          }
        }

        console.log('🧮 Calculando estadísticas...')
        
        // 3. Calcular estadísticas básicas
        const today = new Date()
        const in30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
        
        const activeDocuments = documents.filter(doc => 
          ['pending', 'approved'].includes(doc.status)
        ).length

        const approvedDocuments = documents.filter(doc => 
          doc.status === 'approved'
        ).length

        const expiringDocuments = documents.filter(doc => 
          doc.status === 'approved' && 
          doc.valid_until && 
          new Date(doc.valid_until) <= in30Days && 
          new Date(doc.valid_until) > today
        ).length

        // Calcular compliance básico
        const totalRequired = 5 // Estimación
        const compliancePercentage = totalRequired > 0 ? Math.round((approvedDocuments / totalRequired) * 100) : 0

        const finalStats = {
          activeDocuments,
          approvedDocuments,
          expiringDocuments,
          totalEstablishments: establishments.length,
          compliancePercentage
        }

        console.log('📊 Estadísticas calculadas:', finalStats)

        setData({
          stats: finalStats,
          documents,
          establishments,
          notifications: [], // Por ahora vacío
          loading: false,
          error: null,
          clientExists: true
        })

        console.log('✅ Datos cargados exitosamente')

      } catch (error) {
        console.error('❌ Error general cargando datos del cliente:', error)
        console.error('Stack trace:', error.stack)
        
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
    }

    fetchClientData()
  }, [user?.id])

  return data
}

// Página principal simplificada
const ClientDashboardHome = () => {
  const { user, userRole } = useAuth()
  const data = useSimpleClientData()

  if (data.loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-900">Error al cargar datos</h3>
          </div>
          <p className="text-red-700 mt-2">{data.error}</p>
        </div>
      </div>
    )
  }

  // Si el cliente no existe en la tabla clients
  if (!data.clientExists) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Bienvenido, {user?.user_metadata?.first_name || 'Cliente'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Tu perfil está siendo configurado por nuestro equipo
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

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Perfil en proceso
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Nuestro equipo está configurando tu perfil empresarial. 
                Una vez completado, podrás gestionar tus documentos y establecimientos aquí.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Mientras tanto, puedes:</strong><br />
                • Explorar las diferentes secciones del panel<br />
                • Contactar con soporte si tienes dudas<br />
                • Preparar tu documentación
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Cliente existe - mostrar dashboard completo
  const upcomingExpiry = data.documents.filter(doc => {
    if (doc.status !== 'approved' || !doc.valid_until) return false
    const daysRemaining = Math.ceil((new Date(doc.valid_until) - new Date()) / (1000 * 60 * 60 * 24))
    return daysRemaining > 0 && daysRemaining <= 30
  })

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

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Documentos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.activeDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aprobados</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.approvedDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Por Vencer</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.expiringDocuments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Establecimientos</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.totalEstablishments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Porcentaje de cumplimiento */}
      {data.stats.compliancePercentage > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Estado de Cumplimiento</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              data.stats.compliancePercentage >= 80 
                ? 'bg-green-100 text-green-800'
                : data.stats.compliancePercentage >= 60
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {data.stats.compliancePercentage}% Completo
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                data.stats.compliancePercentage >= 80 
                  ? 'bg-green-500'
                  : data.stats.compliancePercentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${data.stats.compliancePercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Alertas de vencimientos próximos */}
      {upcomingExpiry.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Documentos próximos a vencer
              </h3>
              <div className="mt-2 space-y-1">
                {upcomingExpiry.slice(0, 3).map(doc => {
                  const daysRemaining = Math.ceil((new Date(doc.valid_until) - new Date()) / (1000 * 60 * 60 * 24))
                  return (
                    <p key={doc.id} className="text-sm text-yellow-700">
                      • {doc.name} vence en {daysRemaining} día{daysRemaining !== 1 ? 's' : ''}
                    </p>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="p-2 bg-primary-100 rounded-lg mr-4">
              <PlusIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Subir Documento</p>
              <p className="text-sm text-gray-600">Nuevo documento FEII</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="p-2 bg-success-100 rounded-lg mr-4">
              <BuildingOfficeIcon className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Ver Establecimientos</p>
              <p className="text-sm text-gray-600">Gestionar ubicaciones</p>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="p-2 bg-warning-100 rounded-lg mr-4">
               <ClockIcon className="w-5 h-5 text-warning-600" />
            </div>
           <div>
           <p className="font-medium text-gray-900">Ver Vencimientos</p>
            <p className="text-sm text-gray-600">Documentos por renovar</p>
           </div>
          </button>
          
        </div>
      </div>

      {/* Documentos recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Documentos Recientes</h2>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Ver todos
          </button>
        </div>
        
        {data.documents.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tienes documentos aún</p>
            <p className="text-sm text-gray-500 mt-1">Sube tu primer documento para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.documents.slice(0, 5).map(doc => (
              <div key={doc.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  doc.status === 'approved' ? 'bg-green-100' :
                  doc.status === 'pending' ? 'bg-yellow-100' :
                  doc.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <DocumentTextIcon className={`w-5 h-5 ${
                    doc.status === 'approved' ? 'text-green-600' :
                    doc.status === 'pending' ? 'text-yellow-600' :
                    doc.status === 'rejected' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                  doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  doc.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {doc.status === 'approved' ? 'Aprobado' :
                   doc.status === 'pending' ? 'Pendiente' :
                   doc.status === 'rejected' ? 'Rechazado' : 'Vencido'
                  }
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componentes simplificados para otras rutas
const SimpleClientEstablishments = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Mis Establecimientos</h1>
    <div className="text-center py-12">
      <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">Sección de establecimientos simplificada</p>
      <p className="text-sm text-gray-500 mt-2">Funcionalidad completa disponible próximamente</p>
    </div>
  </div>
)

const SimpleClientProfile = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h1>
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-primary-600">👤</span>
      </div>
      <p className="text-gray-600">Sección de perfil simplificada</p>
      <p className="text-sm text-gray-500 mt-2">Funcionalidad completa disponible próximamente</p>
    </div>
  </div>
)

// Componente principal con routing actualizado
const ClientDashboard = () => {
  return (
    <ClientLayout>
      <Routes>
        <Route index element={<ClientDashboardHome />} />
        {/* Usar el componente completo de ClientDocuments */}
        <Route path="documents" element={<ClientDocuments />} />
        <Route path="establishments" element={<SimpleClientEstablishments />} />
        <Route path="profile" element={<SimpleClientProfile />} />
        <Route path="*" element={<ClientDashboardHome />} />
      </Routes>
    </ClientLayout>
  )
}

export default ClientDashboard