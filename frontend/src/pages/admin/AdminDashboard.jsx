  // AdminDashboard.jsx - DASHBOARD MEJORADO CON HERRAMIENTAS AVANZADAS
  import React, { useState, useEffect, useRef } from 'react';
  import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '../../contexts/AuthContext';
  import { supabase } from '../../lib/supabase';
  import { toast } from 'react-hot-toast';
  import { 
    Home, 
    Users, 
    FileText, 
    User, 
    Bell, 
    Search, 
    LogOut,
    ChevronDown,
    Menu,
    X,
    Shield,
    Settings,
    BarChart3,
    Plus,
    CheckCircle,
    AlertTriangle,
    Clock,
    Wifi,
    WifiOff,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    Calendar,
    MapPin,
    Building,
    AlertCircle,
    Eye,
    Activity,
    PieChart,
    Target,
    Upload,        // ← Agregar este
    RotateCcw,     // ← Y este
    XCircle,       // ← Y este
    FileCheck      // ← Y este
  } from 'lucide-react';
  import NuevoClienteForm from '../../components/admin/NuevoClienteForm';
  // Estado global persistente (mantener igual)
  let appData = {
    stats: {
      totalClients: 0,
      activeClients: 0,
      totalDocuments: 0,
      approvedDocuments: 0,
      pendingDocuments: 0,
      loading: true,
      error: null
    },
    clients: [],
    lastUpdate: 0,
    isLoading: false,
    loadPromise: null
  };

  // Función de carga mejorada con más datos
  const loadAppData = async (forceRefresh = false) => {
    if (appData.loadPromise && !forceRefresh) {
      console.log('⏳ Esperando carga en curso...');
      try {
        return await appData.loadPromise;
      } catch (error) {
        console.log('❌ Error en carga anterior, reintentando...');
      }
    }

    const dataAge = Date.now() - appData.lastUpdate;
    const needsUpdate = forceRefresh || dataAge > 300000 || appData.stats.loading;

    if (!needsUpdate) {
      console.log('📦 Usando datos en caché (actualizado hace', Math.round(dataAge / 1000), 'segundos)');
      return appData;
    }

    appData.loadPromise = (async () => {
      try {
        appData.isLoading = true;
        console.log('📊 Cargando datos del servidor...');

        const { error: connectionError } = await supabase.auth.getSession();
        if (connectionError) {
          throw new Error('Error de conexión: ' + connectionError.message);
        }

        // Consultas mejoradas con más información
        const clientsPromise = supabase
          .from('clients')
          .select('*')
          .limit(200)
          .then(result => {
            if (result.error) throw new Error('Error clientes: ' + result.error.message);
            return result.data || [];
          });

        const documentsPromise = supabase
          .from('documents')
          .select('*')
          .limit(200)
          .then(result => {
            if (result.error) {
              console.warn('⚠️ Error cargando documentos:', result.error.message);
              return [];
            }
            return result.data || [];
          });

        // Cargar datos adicionales para métricas avanzadas
        const notificationsPromise = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
          .then(result => result.data || []);

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: Consulta tardó más de 15 segundos')), 15000);
        });

        const [clients, documents, notifications] = await Promise.race([
          Promise.all([clientsPromise, documentsPromise, notificationsPromise]),
          timeoutPromise
        ]);

        console.log('✅ Datos obtenidos - Clientes:', clients.length, 'Documentos:', documents.length);

        // Calcular estadísticas avanzadas
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const expiringSoon = documents.filter(d => {
          if (!d.valid_until || d.status !== 'approved') return false;
          const validUntil = new Date(d.valid_until);
          const daysUntilExpiry = Math.ceil((validUntil - today) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        });

        const newClientsThisMonth = clients.filter(c => 
          new Date(c.created_at) >= thirtyDaysAgo
        );

        const stats = {
          totalClients: clients.length,
          activeClients: clients.filter(c => c.status === 'active').length,
          totalDocuments: documents.length,
          approvedDocuments: documents.filter(d => d.status === 'approved').length,
          pendingDocuments: documents.filter(d => d.status === 'pending').length,
          expiredDocuments: documents.filter(d => {
            if (!d.valid_until) return false;
            return new Date(d.valid_until) < today;
          }).length,
          documentsExpiringSoon: expiringSoon.length,
          newClientsThisMonth: newClientsThisMonth.length,
          complianceRate: documents.length > 0 ? Math.round((documents.filter(d => d.status === 'approved').length / documents.length) * 100) : 0,
          loading: false,
          error: null
        };

        // Estadísticas por municipio, giro y riesgo
        const byMunicipality = clients.reduce((acc, client) => {
          acc[client.municipality] = (acc[client.municipality] || 0) + 1;
          return acc;
        }, {});

        const byBusinessType = clients.reduce((acc, client) => {
          acc[client.business_type] = (acc[client.business_type] || 0) + 1;
          return acc;
        }, {});

        const byRiskLevel = clients.reduce((acc, client) => {
          acc[client.risk_level] = (acc[client.risk_level] || 0) + 1;
          return acc;
        }, {});

        appData = {
          stats,
          clients,
          documents,
          notifications,
          analytics: {
            byMunicipality,
            byBusinessType,
            byRiskLevel,
            expiringSoon,
            newClientsThisMonth
          },
          lastUpdate: Date.now(),
          isLoading: false,
          loadPromise: null
        };

        console.log('Datos actualizados exitosamente:', stats);
        return appData;

      } catch (error) {
        console.error('Error cargando datos:', error);
        appData.stats = {
          ...appData.stats,
          loading: false,
          error: error.message
        };
        appData.isLoading = false;
        appData.loadPromise = null;
        throw error;
      }
    })();

    return appData.loadPromise;
  };

  // Hook mejorado
  const useAppData = () => {
    const [data, setData] = useState(appData);
    const [error, setError] = useState(null);
    const initRef = useRef(false);
    const { user } = useAuth();

    const refresh = async (force = false) => {
      try {
        setError(null);
        setData(prev => ({ ...prev, stats: { ...prev.stats, loading: true, error: null } }));
        const newData = await loadAppData(force);
        setData({ ...newData });
      } catch (err) {
        setError(err.message);
        setData(prev => ({ ...prev, stats: { ...prev.stats, loading: false, error: err.message } }));
      }
    };

    useEffect(() => {
      if (initRef.current) return;
      initRef.current = true;
      console.log('🚀 Inicializando useAppData...');
      if (user) {
        refresh(false);
      }
    }, [user]);

    return { data, error, refresh };
  };

  // Componente Home mejorado con dashboard avanzado
  const AdminDashboardHome = () => {
    const { data, error, refresh } = useAppData();
    const { stats, analytics = {} } = data;

    if (stats.loading) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-gray-50 rounded-lg p-6">
                  <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error || stats.error) {
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-red-900">Error al cargar datos</h3>
            </div>
            <p className="text-red-700 mt-2">{error || stats.error}</p>
            <div className="mt-4 flex space-x-2">
              <button onClick={() => refresh(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                Reintentar
              </button>
              <button onClick={() => window.location.reload()} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                Recargar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header mejorado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrativo</h2>
              <p className="text-gray-600 flex items-center">
                Sistema CRM de Protección Civil - Gestión Integral
                <span className="ml-4 flex items-center text-green-600">
                  <Activity className="h-4 w-4 mr-1" />
                  <span className="text-xs">Sistema Activo</span>
                </span>
              </p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => refresh(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Actualizar
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
          
          {/* Métricas principales mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Clientes</p>
                  <p className="text-3xl font-bold">{stats.totalClients}</p>
                  <p className="text-blue-200 text-xs mt-1">
                    +{stats.newClientsThisMonth} este mes
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Docs. Aprobados</p>
                  <p className="text-3xl font-bold">{stats.approvedDocuments}</p>
                  <p className="text-green-200 text-xs mt-1">
                    {stats.complianceRate}% de cumplimiento
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pendientes</p>
                  <p className="text-3xl font-bold">{stats.pendingDocuments}</p>
                  <p className="text-yellow-200 text-xs mt-1">
                    Requieren revisión
                  </p>
                </div>
                <Clock className="h-10 w-10 text-yellow-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Por Vencer</p>
                  <p className="text-3xl font-bold">{stats.documentsExpiringSoon}</p>
                  <p className="text-red-200 text-xs mt-1">
                    Próximos 30 días
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-200" />
              </div>
            </div>
          </div>

          {/* Alertas críticas */}
          {(stats.expiredDocuments > 0 || stats.pendingDocuments > 10) && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Atención Requerida</h3>
                  <div className="mt-1 text-sm text-red-700">
                    {stats.expiredDocuments > 0 && (
                      <p>• {stats.expiredDocuments} documentos vencidos requieren renovación inmediata</p>
                    )}
                    {stats.pendingDocuments > 10 && (
                      <p>• {stats.pendingDocuments} documentos pendientes requieren revisión</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analytics mejorados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribución por Municipio */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Por Municipio</h3>
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {Object.entries(analytics.byMunicipality || {})
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([municipality, count]) => (
                  <div key={municipality} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate">{municipality}</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full" 
                          style={{ width: `${(count / stats.totalClients) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Distribución por Giro */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Por Giro de Negocio</h3>
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {Object.entries(analytics.byBusinessType || {})
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => {
                  const typeNames = {
                    'educativo': 'Educativo',
                    'industrial': 'Industrial',
                    'turistico_hospedaje_alimentos': 'Turístico',
                    'comercial': 'Comercial',
                    'hidrocarburos': 'Hidrocarburos',
                    'medico_hospitalario': 'Médico',
                    'rehabilitacion_adicciones': 'Rehabilitación',
                    'construccion': 'Construcción',
                    'servicios_generales': 'Servicios'
                  };
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">{typeNames[type] || type}</span>
                      <div className="flex items-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ width: `${(count / stats.totalClients) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Distribución por Nivel de Riesgo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Por Nivel de Riesgo</h3>
              <Target className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {['alto', 'medio', 'bajo'].map(level => {
                const count = analytics.byRiskLevel?.[level] || 0;
                const percentage = stats.totalClients > 0 ? (count / stats.totalClients) * 100 : 0;
                const colors = {
                  'alto': 'bg-red-500',
                  'medio': 'bg-yellow-500',
                  'bajo': 'bg-green-500'
                };
                const labels = {
                  'alto': 'Alto Riesgo',
                  'medio': 'Riesgo Medio',
                  'bajo': 'Bajo Riesgo'
                };
                return (
                  <div key={level} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{labels[level]}</span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                        <div 
                          className={`h-2 rounded-full ${colors[level]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actividad reciente y documentos próximos a vencer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Documentos por Vencer</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            
            {analytics.expiringSoon?.length > 0 ? (
              <div className="space-y-3">
                {analytics.expiringSoon.slice(0, 5).map((doc, index) => {
                  const daysLeft = Math.ceil((new Date(doc.valid_until) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={doc.id || index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.name || 'Documento sin nombre'}</p>
                        <p className="text-xs text-gray-500">ID: {doc.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {daysLeft} días
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay documentos próximos a vencer</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Plus className="h-5 w-5 text-blue-600 mb-2" />
                <div className="text-sm font-medium text-gray-900">Nuevo Cliente</div>
                <div className="text-xs text-gray-500">Registrar empresa</div>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <FileText className="h-5 w-5 text-green-600 mb-2" />
                <div className="text-sm font-medium text-gray-900">Subir Docs</div>
                <div className="text-xs text-gray-500">Procesar archivos</div>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <PieChart className="h-5 w-5 text-purple-600 mb-2" />
                <div className="text-sm font-medium text-gray-900">Reportes</div>
                <div className="text-xs text-gray-500">Generar análisis</div>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <Eye className="h-5 w-5 text-indigo-600 mb-2" />
                <div className="text-sm font-medium text-gray-900">Auditoría</div>
                <div className="text-xs text-gray-500">Ver actividad</div>
              </button>
            </div>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex space-x-6">
              <span>Última actualización: {appData.lastUpdate ? new Date(appData.lastUpdate).toLocaleString() : 'Nunca'}</span>
              <span>Clientes en memoria: {data.clients.length}</span>
              <span>Documentos: {data.documents?.length || 0}</span>
            </div>
            <div className="flex items-center text-green-600">
              <Activity className="h-4 w-4 mr-1" />
              <span>Sistema Operativo</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente Clientes con filtros mejorados por giro y riesgo
  const GestionClientes = () => {
    const { data, error, refresh } = useAppData();
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const { user } = useAuth();
    const [search, setSearch] = useState(''); 
    const [municipalityFilter, setMunicipalityFilter] = useState('');
    const [businessTypeFilter, setBusinessTypeFilter] = useState('');
    const [riskLevelFilter, setRiskLevelFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const filteredClients = data.clients.filter(client => {
      const matchesSearch = !search || 
        client.name?.toLowerCase().includes(search.toLowerCase()) ||
        client.rfc?.toLowerCase().includes(search.toLowerCase()) ||
        client.commercial_name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesMunicipality = !municipalityFilter || client.municipality === municipalityFilter;
      const matchesBusinessType = !businessTypeFilter || client.business_type === businessTypeFilter;
      const matchesRiskLevel = !riskLevelFilter || client.risk_level === riskLevelFilter;
      const matchesStatus = !statusFilter || client.status === statusFilter;

      return matchesSearch && matchesMunicipality && matchesBusinessType && matchesRiskLevel && matchesStatus;
    });

    const clearAllFilters = () => {
      setSearch('');
      setMunicipalityFilter('');
      setBusinessTypeFilter('');
      setRiskLevelFilter('');
      setStatusFilter('');
    };

    const hasActiveFilters = search || municipalityFilter || businessTypeFilter || riskLevelFilter || statusFilter;

    if (data.stats.loading) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error || data.stats.error) {
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-red-900">Error al cargar clientes</h3>
            </div>
            <p className="text-red-700 mt-2">{error || data.stats.error}</p>
            <button onClick={() => refresh(true)} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    const municipalities = ['San Juan del Río', 'El Marqués', 'Querétaro', 'Tequisquiapan', 'Corregidora'];
    
    const businessTypes = [
      { value: 'educativo', label: 'Educativo' },
      { value: 'industrial', label: 'Industrial' },
      { value: 'turistico_hospedaje_alimentos', label: 'Turístico' },
      { value: 'comercial', label: 'Comercial' },
      { value: 'hidrocarburos', label: 'Hidrocarburos' },
      { value: 'medico_hospitalario', label: 'Médico' },
      { value: 'rehabilitacion_adicciones', label: 'Rehabilitación' },
      { value: 'construccion', label: 'Construcción' },
      { value: 'servicios_generales', label: 'Servicios' }
    ];

    const riskLevels = [
      { value: 'bajo', label: 'Bajo Riesgo', color: 'text-green-800 bg-green-100' },
      { value: 'medio', label: 'Riesgo Medio', color: 'text-yellow-800 bg-yellow-100' },
      { value: 'alto', label: 'Alto Riesgo', color: 'text-red-800 bg-red-100' }
    ];

    const statusOptions = [
      { value: 'active', label: 'Activo', color: 'text-green-800 bg-green-100' },
      { value: 'inactive', label: 'Inactivo', color: 'text-gray-800 bg-gray-100' },
      { value: 'suspended', label: 'Suspendido', color: 'text-red-800 bg-red-100' }
    ];

    const formatBusinessType = (type) => {
      const found = businessTypes.find(bt => bt.value === type);
      return found ? found.label : type;
    };

    const formatRiskLevel = (level) => {
      const found = riskLevels.find(rl => rl.value === level);
      return found ? { text: found.label, color: found.color } : { text: level, color: 'text-gray-800 bg-gray-100' };
    };

    const formatStatus = (status) => {
      const found = statusOptions.find(so => so.value === status);
      return found ? { text: found.label, color: found.color } : { text: status, color: 'text-gray-800 bg-gray-100' };
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
              
              <p className="text-gray-600">
                {filteredClients.length} de {data.clients.length} clientes
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Filtrado
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border flex items-center ${
                  hasActiveFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                } hover:bg-blue-100`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros {hasActiveFilters && `(${[search, municipalityFilter, businessTypeFilter, riskLevelFilter, statusFilter].filter(Boolean).length})`}
              </button>
              <button onClick={() => refresh(true)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Actualizar
              </button>
                <button 
                  onClick={() => setShowNewClientModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                   Nuevo Cliente
                </button>
            </div>
          </div>
          
          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Nombre, RFC o razón social..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                  <select 
                    value={municipalityFilter}
                    onChange={(e) => setMunicipalityFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los municipios</option>
                    {municipalities.map(municipality => (
                      <option key={municipality} value={municipality}>{municipality}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giro de Negocio</label>
                  <select 
                    value={businessTypeFilter}
                    onChange={(e) => setBusinessTypeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los giros</option>
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Riesgo</label>
                  <select 
                    value={riskLevelFilter}
                    onChange={(e) => setRiskLevelFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los niveles</option>
                    {riskLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Todos los estados</option>
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button 
                    onClick={clearAllFilters}
                    disabled={!hasActiveFilters}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>

              {/* Filtros activos */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {search && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Búsqueda: "{search}"
                      <button onClick={() => setSearch('')} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                    </span>
                  )}
                  {municipalityFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Municipio: {municipalityFilter}
                      <button onClick={() => setMunicipalityFilter('')} className="ml-1 text-green-600 hover:text-green-800">×</button>
                    </span>
                  )}
                  {businessTypeFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Giro: {formatBusinessType(businessTypeFilter)}
                      <button onClick={() => setBusinessTypeFilter('')} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                    </span>
                  )}
                  {riskLevelFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Riesgo: {formatRiskLevel(riskLevelFilter).text}
                      <button onClick={() => setRiskLevelFilter('')} className="ml-1 text-yellow-600 hover:text-yellow-800">×</button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Estado: {formatStatus(statusFilter).text}
                      <button onClick={() => setStatusFilter('')} className="ml-1 text-gray-600 hover:text-gray-800">×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Tabla mejorada */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                <div>Cliente</div>
                <div>RFC</div>
                <div>Municipio</div>
                <div>Giro de Negocio</div>
                <div>Nivel de Riesgo</div>
                <div>Estado</div>
              </div>
            </div>
            
            {filteredClients.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {data.clients.length === 0 ? 'No hay clientes registrados' : 'No hay clientes que coincidan con los filtros'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {data.clients.length === 0 
                    ? 'Los clientes aparecerán aquí una vez que sean agregados'
                    : 'Prueba ajustando o limpiando los filtros de búsqueda'
                  }
                </p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Limpiar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredClients.map(client => {
                  const riskFormatted = formatRiskLevel(client.risk_level);
                  const statusFormatted = formatStatus(client.status);
                  
                  return (
                    <div key={client.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.name || 'Sin nombre'}</p>
                          {client.commercial_name && (
                            <p className="text-xs text-gray-500">{client.commercial_name}</p>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-900 font-mono">{client.rfc || 'Sin RFC'}</div>
                        
                        <div className="text-sm text-gray-500">{client.municipality || 'Sin municipio'}</div>
                        
                        <div className="text-sm text-gray-500">{formatBusinessType(client.business_type)}</div>
                        
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${riskFormatted.color}`}>
                            {riskFormatted.text}
                          </span>
                        </div>
                        
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusFormatted.color}`}>
                            {statusFormatted.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen de filtros */}
          {filteredClients.length > 0 && (
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span>Mostrando {filteredClients.length} de {data.clients.length} clientes</span>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-blue-600 hover:text-blue-800">
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          )}
        </div>
         {showNewClientModal && (
        <NuevoClienteForm
          onClose={() => setShowNewClientModal(false)}
          onSuccess={(result) => {
            setShowNewClientModal(false);
            refresh(true);
            toast.success(
              <div>
                <p className="font-medium">¡Cliente creado exitosamente!</p>
                <p className="text-sm mt-1">Código: <strong>{result.clientCode}</strong></p>
                <p className="text-xs text-gray-600 mt-1">
                  {result.documentsAssigned} documentos asignados
                </p>
              </div>,
              { duration: 5000 }
            );
          }}
        />
      )}
      </div>
    );
  };

  ///////////////////////////////////////////////

  // Estado global para documentos
  let documentsData = {
    documents: [],
    documentTypes: [],
    clients: [],
    lastUpdate: 0,
    isLoading: false,
    loadPromise: null
  };

  // Función para cargar datos de documentos
  const loadDocumentsData = async (forceRefresh = false) => {
    if (documentsData.loadPromise && !forceRefresh) {
      try {
        return await documentsData.loadPromise;
      } catch (error) {
        console.log('Error en carga anterior, reintentando...');
      }
    }

    const dataAge = Date.now() - documentsData.lastUpdate;
    const needsUpdate = forceRefresh || dataAge > 180000 || documentsData.documents.length === 0; // 3 minutos

    if (!needsUpdate) {
      console.log('📄 Usando documentos en caché');
      return documentsData;
    }

    documentsData.loadPromise = (async () => {
      try {
        documentsData.isLoading = true;
        console.log('📄 Cargando datos de documentos...');

        const { error: connectionError } = await supabase.auth.getSession();
        if (connectionError) {
          throw new Error('Error de conexión: ' + connectionError.message);
        }

        // Consultas en paralelo
        const [documentsResult, documentTypesResult, clientsResult] = await Promise.all([
          supabase
            .from('documents')
            .select(`
              *,
              clients!inner(id, name, rfc, municipality, business_type, risk_level),
              document_types!inner(id, name, code, category),
              reviewed_by_user:users!reviewed_by(email)
            `)
            .order('created_at', { ascending: false })
            .limit(200),
          
          supabase
            .from('document_types')
            .select('*')
            .order('code'),
          
          supabase
            .from('clients')
            .select('id, name, rfc, municipality, business_type, risk_level, status')
            .eq('status', 'active')
            .order('name')
        ]);

        if (documentsResult.error) throw new Error('Error documentos: ' + documentsResult.error.message);
        if (documentTypesResult.error) throw new Error('Error tipos: ' + documentTypesResult.error.message);
        if (clientsResult.error) throw new Error('Error clientes: ' + clientsResult.error.message);

        documentsData = {
          documents: documentsResult.data || [],
          documentTypes: documentTypesResult.data || [],
          clients: clientsResult.data || [],
          lastUpdate: Date.now(),
          isLoading: false,
          loadPromise: null
        };

        console.log('✅ Documentos cargados:', documentsData.documents.length);
        return documentsData;

      } catch (error) {
        console.error('❌ Error cargando documentos:', error);
        documentsData.isLoading = false;
        documentsData.loadPromise = null;
        throw error;
      }
    })();

    return documentsData.loadPromise;
  };

  // Hook para gestión de documentos
  const useDocuments = () => {
    const [data, setData] = useState(documentsData);
    const [error, setError] = useState(null);
    const initRef = useRef(false);
    const { user } = useAuth();

    const refresh = async (force = false) => {
      try {
        setError(null);
        const newData = await loadDocumentsData(force);
        setData({ ...newData });
      } catch (err) {
        setError(err.message);
      }
    };

    useEffect(() => {
      if (initRef.current) return;
      initRef.current = true;
      if (user) {
        refresh(false);
      }
    }, [user]);

    return { data, error, refresh };
  };

  // Componente principal de gestión de documentos
  const GestionDocumentos = () => {
    const { data, error, refresh } = useDocuments();
    const { userRole } = useAuth();
    const [filters, setFilters] = useState({
      search: '',
      status: '',
      client: '',
      documentType: '',
      dateRange: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Aplicar filtros
    const filteredDocuments = data.documents.filter(doc => {
      const matchesSearch = !filters.search || 
        doc.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.clients?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        doc.clients?.rfc?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || doc.status === filters.status;
      const matchesClient = !filters.client || doc.client_id === filters.client;
      const matchesType = !filters.documentType || doc.document_type_id === filters.documentType;

      return matchesSearch && matchesStatus && matchesClient && matchesType;
    });

    const clearFilters = () => {
      setFilters({
        search: '',
        status: '',
        client: '',
        documentType: '',
        dateRange: ''
      });
    };

    const hasActiveFilters = Object.values(filters).some(value => value);

    // Estadísticas rápidas
    const stats = {
      total: data.documents.length,
      pending: data.documents.filter(d => d.status === 'pending').length,
      approved: data.documents.filter(d => d.status === 'approved').length,
      rejected: data.documents.filter(d => d.status === 'rejected').length,
      expired: data.documents.filter(d => d.status === 'expired').length
    };

    if (error) {
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-red-900">Error al cargar documentos</h3>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <button onClick={() => refresh(true)} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Documentos</h2>
              <p className="text-gray-600">
                {filteredDocuments.length} de {data.documents.length} documentos
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Filtrado
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border flex items-center ${
                  hasActiveFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                } hover:bg-blue-100`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
              </button>
              
              <button onClick={() => refresh(true)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
                <RotateCcw className="h-4 w-4 mr-2" />
                Actualizar
              </button>
              
              <button 
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </button>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <FileText className="h-6 w-6 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
              <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
              <div className="text-sm text-yellow-600">Pendientes</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
              <div className="text-sm text-green-600">Aprobados</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
              <div className="text-sm text-red-600">Rechazados</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">{stats.expired}</div>
              <div className="text-sm text-orange-600">Vencidos</div>
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre, cliente, RFC..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="under_review">En Revisión</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                  <option value="expired">Vencido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select 
                  value={filters.client}
                  onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos los clientes</option>
                  {data.clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.rfc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                <select 
                  value={filters.documentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos los tipos</option>
                  {data.documentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.code} - {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-1 flex items-end">
                <button 
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Filtros activos */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Búsqueda: "{filters.search}"
                    <button onClick={() => setFilters(prev => ({ ...prev, search: '' }))} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Estado: {filters.status}
                    <button onClick={() => setFilters(prev => ({ ...prev, status: '' }))} className="ml-1 text-yellow-600 hover:text-yellow-800">×</button>
                  </span>
                )}
                {filters.client && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Cliente: {data.clients.find(c => c.id === filters.client)?.name}
                    <button onClick={() => setFilters(prev => ({ ...prev, client: '' }))} className="ml-1 text-green-600 hover:text-green-800">×</button>
                  </span>
                )}
                {filters.documentType && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Tipo: {data.documentTypes.find(t => t.id === filters.documentType)?.code}
                    <button onClick={() => setFilters(prev => ({ ...prev, documentType: '' }))} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lista de documentos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {data.documents.length === 0 ? 'No hay documentos registrados' : 'No hay documentos que coincidan'}
              </h3>
              <p className="text-gray-500 mb-4">
                {data.documents.length === 0 
                  ? 'Los documentos aparecerán aquí una vez que sean subidos'
                  : 'Prueba ajustando los filtros de búsqueda'
                }
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Limpiar Filtros
                </button>
              ) : (
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Subir Primer Documento
                </button>
              )}
            </div>
          ) : (
            <DocumentsTable 
              documents={filteredDocuments}
              documentTypes={data.documentTypes}
              onDocumentSelect={setSelectedDocument}
              userRole={userRole}
              refresh={refresh}
            />
          )}
        </div>

        {/* Modal de subida de documentos */}
        {showUploadModal && (
          <UploadDocumentModal 
            clients={data.clients}
            documentTypes={data.documentTypes}
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              refresh(true);
            }}
          />
        )}

        {/* Modal de detalles del documento */}
        {selectedDocument && (
          <DocumentDetailsModal 
            document={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onUpdate={() => {
              setSelectedDocument(null);
              refresh(true);
            }}
            userRole={userRole}
          />
        )}
      </div>
    );
  };

  // Componente de tabla de documentos
  const DocumentsTable = ({ documents, documentTypes, onDocumentSelect, userRole, refresh }) => {
    const formatStatus = (status) => {
      const statusConfig = {
        'pending': { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        'under_review': { text: 'En Revisión', color: 'bg-blue-100 text-blue-800', icon: Eye },
        'approved': { text: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
        'rejected': { text: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle },
        'expired': { text: 'Vencido', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
      };
      return statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800', icon: FileText };
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getDaysUntilExpiry = (validUntil) => {
      if (!validUntil) return null;
      const today = new Date();
      const expiryDate = new Date(validUntil);
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    return (
      <div>
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
            <div>Documento</div>
            <div>Cliente</div>
            <div>Tipo</div>
            <div>Estado</div>
            <div>Subido</div>
            <div>Vigencia</div>
            <div>Acciones</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {documents.map(doc => {
            const statusInfo = formatStatus(doc.status);
            const StatusIcon = statusInfo.icon;
            const daysUntilExpiry = getDaysUntilExpiry(doc.valid_until);
            const docType = documentTypes.find(t => t.id === doc.document_type_id);
            
            return (
              <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-7 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      v{doc.version} • {formatFileSize(doc.file_size || 0)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.clients?.name}</p>
                    <p className="text-xs text-gray-500">{doc.clients?.rfc}</p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {docType?.code || 'N/A'}
                  </div>
                  
                  <div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.text}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                  
                  <div>
                    {doc.valid_until ? (
                      <div className="text-sm">
                        {daysUntilExpiry !== null && (
                          <span className={`font-medium ${
                            daysUntilExpiry < 0 ? 'text-red-600' :
                            daysUntilExpiry <= 15 ? 'text-orange-600' :
                            daysUntilExpiry <= 30 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {daysUntilExpiry < 0 ? `Vencido hace ${Math.abs(daysUntilExpiry)} días` :
                            daysUntilExpiry === 0 ? 'Vence hoy' :
                            `${daysUntilExpiry} días restantes`
                            }
                          </span>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(doc.valid_until).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin vigencia</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onDocumentSelect(doc)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {doc.file_url && (
                      <button
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="text-green-600 hover:text-green-800 p-1 rounded"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    
                    {userRole !== 'cliente' && doc.status === 'pending' && (
                      <button
                        className="text-orange-600 hover:text-orange-800 p-1 rounded"
                        title="Revisar"
                      >
                        <FileCheck className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Modal de subida de documentos
  const UploadDocumentModal = ({ clients, documentTypes, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
      name: '',
      clientId: '',
      documentTypeId: '',
      validFrom: '',
      validUntil: ''
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!file || !formData.clientId || !formData.documentTypeId) {
        toast.error('Por favor completa todos los campos requeridos');
        return;
      }

      setUploading(true);
      try {
        // Validar archivo
        if (file.type !== 'application/pdf') {
          throw new Error('Solo se permiten archivos PDF');
        }
        
        if (file.size > 100 * 1024 * 1024) { // 100MB
          throw new Error('El archivo no puede ser mayor a 100MB');
        }

        // Subir archivo a Supabase Storage
        const fileExt = 'pdf';
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `documents/${formData.clientId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error('Error subiendo archivo: ' + uploadError.message);
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Crear registro en base de datos
        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert([{
            name: formData.name || file.name,
            client_id: formData.clientId,
            document_type_id: formData.documentTypeId,
            file_url: publicUrl,
            file_size: file.size,
            status: 'pending',
            valid_from: formData.validFrom || null,
            valid_until: formData.validUntil || null,
            version: 1
          }])
          .select()
          .single();

        if (docError) {
          throw new Error('Error guardando documento: ' + docError.message);
        }

        toast.success('Documento subido exitosamente');
        onSuccess();

      } catch (error) {
        console.error('Error subiendo documento:', error);
        toast.error(error.message);
      } finally {
        setUploading(false);
      }
    };

    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
        if (!formData.name) {
          setFormData(prev => ({
            ...prev,
            name: selectedFile.name.replace('.pdf', '')
          }));
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Subir Nuevo Documento</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo PDF <span className="text-red-500">*</span>
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer"
              >
                {file ? (
                  <div>
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Haz clic para seleccionar un archivo PDF</p>
                    <p className="text-xs text-gray-500">Máximo 100MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Documento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre descriptivo del documento"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.rfc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.documentTypeId}
                onChange={(e) => setFormData(prev => ({ ...prev, documentTypeId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccionar tipo</option>
                {documentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.code} - {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Válido Desde
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Válido Hasta
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading || !file}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Documento
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Modal de detalles del documento
  const DocumentDetailsModal = ({ document, onClose, onUpdate, userRole }) => {
    const [reviewData, setReviewData] = useState({
      status: document.status,
      comments: document.review_comments || ''
    });
    const [updating, setUpdating] = useState(false);

    const handleStatusUpdate = async () => {
      if (userRole === 'cliente') {
        toast.error('No tienes permisos para cambiar el estado del documento');
        return;
      }

      setUpdating(true);
      try {
        const { error } = await supabase
          .from('documents')
          .update({
            status: reviewData.status,
            review_comments: reviewData.comments,
            reviewed_by: (await supabase.auth.getUser()).data.user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', document.id);

        if (error) throw error;

        toast.success('Estado del documento actualizado');
        onUpdate();
      } catch (error) {
        console.error('Error actualizando documento:', error);
        toast.error('Error al actualizar el documento');
      } finally {
        setUpdating(false);
      }
    };

    const formatStatus = (status) => {
      const statusConfig = {
        'pending': { text: 'Pendiente', color: 'text-yellow-800 bg-yellow-100', icon: Clock },
        'under_review': { text: 'En Revisión', color: 'text-blue-800 bg-blue-100', icon: Eye },
        'approved': { text: 'Aprobado', color: 'text-green-800 bg-green-100', icon: CheckCircle },
        'rejected': { text: 'Rechazado', color: 'text-red-800 bg-red-100', icon: XCircle },
        'expired': { text: 'Vencido', color: 'text-orange-800 bg-orange-100', icon: AlertTriangle }
      };
      return statusConfig[status] || { text: status, color: 'text-gray-800 bg-gray-100', icon: FileText };
    };

    const statusInfo = formatStatus(document.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{document.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Versión {document.version}</span>
                  <span>•</span>
                  <span>Subido el {new Date(document.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Cliente</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="font-medium">{document.clients?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">RFC:</span>
                    <span className="font-mono">{document.clients?.rfc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Municipio:</span>
                    <span>{document.clients?.municipality}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Estado Actual</h4>
                <div className="space-y-3">
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-4 w-4 mr-2" />
                      {statusInfo.text}
                    </span>
                  </div>
                  
                  {document.valid_from && (
                    <div className="text-sm">
                      <span className="text-gray-500">Vigencia:</span>
                      <div className="font-medium">
                        {new Date(document.valid_from).toLocaleDateString()} - {document.valid_until ? new Date(document.valid_until).toLocaleDateString() : 'Indefinido'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Archivo */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Archivo</h4>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-sm text-gray-500">
                        {document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : 'Tamaño desconocido'}
                      </p>
                    </div>
                  </div>
                  
                  {document.file_url && (
                    <button
                      onClick={() => window.open(document.file_url, '_blank')}
                      className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de revisión (solo para admins) */}
            {userRole !== 'cliente' && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Revisión del Documento</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={reviewData.status}
                      onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="under_review">En Revisión</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios de Revisión</label>
                    <textarea
                      value={reviewData.comments}
                      onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Agregar comentarios sobre el documento..."
                    />
                  </div>

                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating || reviewData.status === document.status}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Actualizar Estado
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Comentarios existentes */}
            {document.review_comments && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Comentarios</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{document.review_comments}</p>
                  {document.reviewed_by_user && (
                    <p className="text-xs text-gray-500 mt-2">
                      Por: {document.reviewed_by_user.email}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };


  const Reportes = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reportes y Estadísticas</h2>
        <p className="text-gray-600">Módulo en desarrollo</p>
      </div>
    </div>
  );

  const ConfiguracionSistema = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración del Sistema</h2>
        <p className="text-gray-600">Módulo en desarrollo</p>
      </div>
    </div>
  );

  const AdminPerfil = () => {
    const { user, userRole } = useAuth();
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h2>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Administrador</h3>
              <p className="text-gray-500">{user}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente principal (sin cambios)
  const AdminDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
      try {
        setUserMenuOpen(false);
        toast.loading('Cerrando sesión...', { duration: 2000 });
        await logout();
        toast.success('Sesión cerrada');
        navigate('/login');
      } catch (error) {
        console.error('Error en logout:', error);
        localStorage.clear();
        window.location.href = '/login';
      }
    };

    const navigation = [
      { name: 'Dashboard', href: '/dashboard/admin', icon: Home, current: location.pathname === '/dashboard/admin' },
      { name: 'Clientes', href: '/dashboard/admin/clientes', icon: Users, current: location.pathname === '/dashboard/admin/clientes' },
      { name: 'Documentos', href: '/dashboard/admin/documentos', icon: FileText, current: location.pathname === '/dashboard/admin/documentos' },
      { name: 'Reportes', href: '/dashboard/admin/reportes', icon: BarChart3, current: location.pathname === '/dashboard/admin/reportes' },
      { name: 'Configuración', href: '/dashboard/admin/configuracion', icon: Settings, current: location.pathname === '/dashboard/admin/configuracion' },
      { name: 'Mi Perfil', href: '/dashboard/admin/perfil', icon: User, current: location.pathname === '/dashboard/admin/perfil' },
    ];

    const handleNavigation = (href) => {
      navigate(href);
      setSidebarOpen(false);
    };

    return (
      <div className="h-screen flex overflow-hidden bg-gray-100">
        {/* Sidebar móvil */}
        {sidebarOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button onClick={() => setSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none">
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <AdminSidebar navigation={navigation} onNavigate={handleNavigation} />
            </div>
          </div>
        )}

        {/* Sidebar desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <AdminSidebar navigation={navigation} onNavigate={handleNavigation} />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Header */}
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
            <button onClick={() => setSidebarOpen(true)} className="px-4 border-r border-gray-200 text-gray-500 md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex">
                <div className="w-full flex md:ml-0">
                  <div className="relative w-full text-gray-400">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" />
                    <input
                      className="block w-full h-full pl-10 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none"
                      placeholder="Buscar..."
                      type="search"
                    />
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex items-center md:ml-6">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-4">
                  {userRole}
                </span>

                <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 relative mr-3">
                  <Bell className="h-6 w-6" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center text-sm rounded-full focus:outline-none"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">A</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleNavigation('/dashboard/admin/perfil');
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 mr-3" />
                          Mi Perfil
                        </button>
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Routes>
                  <Route path="/" element={<AdminDashboardHome />} />
                  <Route path="/clientes" element={<GestionClientes />} />
                  <Route path="/documentos" element={<GestionDocumentos />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/configuracion" element={<ConfiguracionSistema />} />
                  <Route path="/perfil" element={<AdminPerfil />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };

  // Sidebar (sin cambios)
  const AdminSidebar = ({ navigation, onNavigate }) => (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <Shield className="h-8 w-8 text-blue-600" />
          <div className="ml-3">
            <p className="text-lg font-bold text-gray-900">B&C Consultores</p>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
        </div>
        
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => onNavigate(item.href)}
                className={`${
                  item.current
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Administrador</p>
            <p className="text-xs text-gray-500">Sistema activo</p>
          </div>
        </div>
      </div>
    </div>
  );

  export default AdminDashboard;