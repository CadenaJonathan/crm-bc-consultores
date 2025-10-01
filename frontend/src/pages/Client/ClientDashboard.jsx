// ClientDashboard.jsx - VERSIÓN CORREGIDA Y FUNCIONAL

import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { ClientLayout } from '../../components/layouts/ClientLayout'
import { ClientDocuments } from '../../components/client/ClientDocuments'
import { ClientEstablishments } from '../../components/client/ClientEstablishments'
import { ClientProfile } from '../../components/client/ClientProfile'
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
  InformationCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

// Función auxiliar para formatear fechas
const formatDate = (date) => {
  if (!date) return 'No definida'
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Hook simplificado para datos del cliente
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
    loading: true,
    error: null,
    clientExists: null
  })
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true

    const fetchClientData = async () => {
      // Detectar email del usuario
      let userEmail
      if (typeof user === 'string') {
        userEmail = user
      } else if (user?.email) {
        userEmail = user.email
      } else {
        console.log('❌ No hay user válido')
        return
      }

      console.log('🔍 Cargando datos para:', userEmail)

      try {
        // 1. Buscar cliente
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('email', userEmail)
          .single()

        if (!isMounted) return

        if (clientError?.code === 'PGRST116') {
          console.log('✅ Cliente no existe - estado vacío')
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
            loading: false,
            error: null,
            clientExists: false
          })
          return
        }

        if (clientError) {
          throw new Error(`Error: ${clientError.message}`)
        }

        console.log('✅ Cliente encontrado:', clientData.id)

        // 2. Cargar documentos
        const { data: docsData, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false })

        if (!isMounted) return

        const documents = docsData || []
        console.log('📄 Documentos:', documents.length)

        // 3. Cargar establecimientos
        const { data: estData } = await supabase
          .from('establishments')
          .select('*')
          .eq('client_id', clientData.id)

        if (!isMounted) return

        const establishments = estData || []

        // 4. Calcular estadísticas
        const today = new Date()
        const in30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))

        const activeDocuments = documents.filter(d => 
          ['pending', 'approved'].includes(d.status)
        ).length

        const approvedDocuments = documents.filter(d => 
          d.status === 'approved'
        ).length

        const expiringDocuments = documents.filter(d => 
          d.status === 'approved' && 
          d.valid_until && 
          new Date(d.valid_until) <= in30Days && 
          new Date(d.valid_until) > today
        ).length

        const totalRequired = 5
        const compliancePercentage = totalRequired > 0 
          ? Math.round((approvedDocuments / totalRequired) * 100) 
          : 0

        setData({
          stats: {
            activeDocuments,
            approvedDocuments,
            expiringDocuments,
            totalEstablishments: establishments.length,
            compliancePercentage
          },
          documents,
          establishments,
          loading: false,
          error: null,
          clientExists: true
        })

        console.log('✅ Datos cargados exitosamente')

      } catch (error) {
        console.error('❌ Error:', error)
        if (isMounted) {
          setData(prev => ({
            ...prev,
            loading: false,
            error: error.message
          }))
        }
      }
    }

    fetchClientData()

    return () => {
      isMounted = false
    }
  }, [user])

  return data
}

// Página principal del dashboard
const ClientDashboardHome = () => {
  const { user, userRole } = useAuth()
  const data = useSimpleClientData()

  console.log('🎨 Renderizando ClientDashboardHome', { loading: data.loading, clientExists: data.clientExists })

  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
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

  if (data.clientExists === false) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, {user?.user_metadata?.first_name || 'Cliente'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Tu perfil está siendo configurado por nuestro equipo
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Perfil en proceso</h3>
              <p className="text-sm text-blue-700 mt-1">
                Una vez completado, podrás gestionar tus documentos aquí.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calcular documentos por vencer
  const upcomingExpiry = data.documents.filter(doc => {
    if (doc.status !== 'approved' || !doc.valid_until) return false
    const daysRemaining = Math.ceil(
      (new Date(doc.valid_until) - new Date()) / (1000 * 60 * 60 * 24)
    )
    return daysRemaining > 0 && daysRemaining <= 30
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Cliente</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-600">Sistema CRM de Protección Civil - Gestión Integral</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></span>
              Sistema Activo
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Documentos */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">Total Documentos</p>
            <p className="text-4xl font-bold mb-2">{data.stats.activeDocuments}</p>
            <p className="text-blue-100 text-sm">Documentos activos</p>
          </div>
          <DocumentTextIcon className="absolute right-4 bottom-4 w-20 h-20 text-blue-400 opacity-20" />
        </div>

        {/* Aprobados */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-green-100 text-sm font-medium mb-1">Docs. Aprobados</p>
            <p className="text-4xl font-bold mb-2">{data.stats.approvedDocuments}</p>
            <p className="text-green-100 text-sm">{data.stats.compliancePercentage}% de cumplimiento</p>
          </div>
          <CheckCircleIcon className="absolute right-4 bottom-4 w-20 h-20 text-green-400 opacity-20" />
        </div>

        {/* Pendientes */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-yellow-100 text-sm font-medium mb-1">Pendientes</p>
            <p className="text-4xl font-bold mb-2">
              {data.documents.filter(d => d.status === 'pending').length}
            </p>
            <p className="text-yellow-100 text-sm">Requieren revisión</p>
          </div>
          <ClockIcon className="absolute right-4 bottom-4 w-20 h-20 text-yellow-400 opacity-20" />
        </div>

        {/* Por Vencer */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-red-100 text-sm font-medium mb-1">Por Vencer</p>
            <p className="text-4xl font-bold mb-2">{data.stats.expiringDocuments}</p>
            <p className="text-red-100 text-sm">Próximos 30 días</p>
          </div>
          <ExclamationTriangleIcon className="absolute right-4 bottom-4 w-20 h-20 text-red-400 opacity-20" />
        </div>
      </div>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Por Estado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Por Estado</h2>
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Aprobados</p>
                  <p className="text-sm text-gray-500">{data.stats.compliancePercentage}%</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {data.stats.approvedDocuments}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pendientes</p>
                  <p className="text-sm text-gray-500">En revisión</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {data.documents.filter(d => d.status === 'pending').length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Rechazados</p>
                  <p className="text-sm text-gray-500">Requiere acción</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {data.documents.filter(d => d.status === 'rejected').length}
              </span>
            </div>
          </div>
        </div>

        {/* Establecimientos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Establecimientos</h2>
            <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          {data.stats.totalEstablishments === 0 ? (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Sin establecimientos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.establishments.slice(0, 3).map((est, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="font-medium text-gray-900 text-sm">
                      Establecimiento {idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cumplimiento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Cumplimiento</h2>
            <CheckCircleIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#E5E7EB"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={
                    data.stats.compliancePercentage >= 80 ? '#10B981' :
                    data.stats.compliancePercentage >= 60 ? '#F59E0B' : '#EF4444'
                  }
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(data.stats.compliancePercentage / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {data.stats.compliancePercentage}%
                  </p>
                </div>
              </div>
            </div>
            
            <p className={`mt-4 text-sm font-medium ${
              data.stats.compliancePercentage >= 80 ? 'text-green-600' :
              data.stats.compliancePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data.stats.compliancePercentage >= 80 ? 'Excelente' :
               data.stats.compliancePercentage >= 60 ? 'Buen avance' : 'Requiere atención'}
            </p>
          </div>
        </div>
      </div>

      {/* Documentos recientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos Recientes</h2>
        
        {data.documents.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tienes documentos aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.documents.slice(0, 5).map(doc => (
              <div key={doc.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  doc.status === 'approved' ? 'bg-green-100' :
                  doc.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <DocumentTextIcon className={`w-5 h-5 ${
                    doc.status === 'approved' ? 'text-green-600' :
                    doc.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                  doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {doc.status === 'approved' ? 'Aprobado' :
                   doc.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente principal
const ClientDashboard = () => {
  console.log('🚀 ClientDashboard montado')
  
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