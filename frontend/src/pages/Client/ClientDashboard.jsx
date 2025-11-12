// ClientDashboard.jsx - DASHBOARD COMPLETO PARA CLIENTES
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Home, 
  FileText, 
  Building2,
  User, 
  Bell, 
  Search, 
  LogOut,
  ChevronDown,
  Menu,
  X,
  Shield,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Filter,
  Download,
  Calendar,
  MapPin,
  AlertCircle,
  Eye,
  Activity,
  PieChart,
  Upload,
  RotateCcw,
  XCircle,
  FileCheck,
  Key,
  Mail,
  Phone,
  Info,
  History,
  Plus,
  Edit2,
  Save,
  Percent,
  Target,
  Zap
} from 'lucide-react';

// ========================================
// ESTADO GLOBAL Y FUNCIONES DE CARGA
// ========================================

let clientData = {
  stats: {
    totalDocuments: 0,
    approvedDocuments: 0,
    pendingDocuments: 0,
    rejectedDocuments: 0,
    expiredDocuments: 0,
    documentsExpiringSoon: 0,
    complianceRate: 0,
    loading: true,
    error: null
  },
  documents: [],
  establishments: [],
  notifications: [],
  clientInfo: null,
  lastUpdate: 0,
  isLoading: false,
  loadPromise: null
};

// Función de carga de datos del cliente
const loadClientData = async (forceRefresh = false) => {
  if (clientData.loadPromise && !forceRefresh) {
    try {
      return await clientData.loadPromise;
    } catch (error) {
      console.log('❌ Error en carga anterior, reintentando...');
    }
  }

  const dataAge = Date.now() - clientData.lastUpdate;
  const needsUpdate = forceRefresh || dataAge > 300000 || clientData.stats.loading;

  if (!needsUpdate) {
    console.log('📦 Usando datos en caché (actualizado hace', Math.round(dataAge / 1000), 'segundos)');
    return clientData;
  }

  clientData.loadPromise = (async () => {
    try {
      clientData.isLoading = true;
      console.log('📊 Cargando datos del cliente...');

      // PASO 1: Obtener usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error('Error de autenticación: ' + authError.message);
      if (!user) throw new Error('No hay usuario autenticado');

      console.log('✅ Usuario autenticado:', user.email, 'ID:', user.id);

      // PASO 2: Buscar en client_users usando auth_user_id
      const { data: clientUser, error: clientUserError } = await supabase
        .from('client_users')
        .select(`
          *,
          clients (
            id,
            name,
            commercial_name,
            rfc,
            client_code,
            municipality,
            business_type,
            risk_level,
            status
          )
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (clientUserError) {
        console.error('❌ Error obteniendo client_user:', clientUserError);
        throw new Error('Error obteniendo usuario del sistema: ' + clientUserError.message);
      }

      if (!clientUser) {
        console.error('❌ No se encontró client_user para auth_user_id:', user.id);
        throw new Error('Usuario no vinculado a ningún cliente');
      }

      console.log('✅ Client user encontrado:', clientUser.email, 'Client ID:', clientUser.client_id);

      const clientId = clientUser.client_id;

      // PASO 3: Cargar documentos del cliente
      const { data: documents, error: docsError } = await supabase
        .from('client_documents')
        .select(`
          *,
          document_types (
            id,
            code,
            name,
            category
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.warn('⚠️ Error cargando documentos:', docsError.message);
      }

      console.log('✅ Documentos cargados:', documents?.length || 0);

      // PASO 4: Cargar notificaciones del usuario
      const { data: notifications, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notifsError) {
        console.warn('⚠️ Error cargando notificaciones:', notifsError.message);
      }

      console.log('✅ Notificaciones cargadas:', notifications?.length || 0);

      // PASO 5: Calcular estadísticas
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const docs = documents || [];
      const expiringSoon = docs.filter(d => {
        if (!d.valid_until || d.status !== 'approved') return false;
        const validUntil = new Date(d.valid_until);
        return validUntil > today && validUntil <= thirtyDaysFromNow;
      });

      const expired = docs.filter(d => {
        if (!d.valid_until) return false;
        return new Date(d.valid_until) < today;
      });

      const stats = {
        totalDocuments: docs.length,
        approvedDocuments: docs.filter(d => d.status === 'approved').length,
        pendingDocuments: docs.filter(d => d.status === 'pending').length,
        rejectedDocuments: docs.filter(d => d.status === 'rejected').length,
        expiredDocuments: expired.length,
        documentsExpiringSoon: expiringSoon.length,
        complianceRate: docs.length > 0 ? Math.round((docs.filter(d => d.status === 'approved').length / docs.length) * 100) : 0,
        loading: false,
        error: null
      };

      console.log('✅ Estadísticas calculadas:', stats);

      // PASO 6: Actualizar estado global
      clientData = {
        stats,
        documents: docs,
        establishments: [],
        notifications: notifications || [],
        clientInfo: clientUser.clients,
        clientUser,
        lastUpdate: Date.now(),
        isLoading: false,
        loadPromise: null
      };

      console.log('✅ Datos del cliente cargados exitosamente');
      return clientData;

    } catch (error) {
      console.error('❌ Error cargando datos del cliente:', error);
      console.error('Stack:', error.stack);
      
      clientData.stats = {
        totalDocuments: 0,
        approvedDocuments: 0,
        pendingDocuments: 0,
        rejectedDocuments: 0,
        expiredDocuments: 0,
        documentsExpiringSoon: 0,
        complianceRate: 0,
        loading: false,
        error: error.message
      };
      clientData.isLoading = false;
      clientData.loadPromise = null;
      throw error;
    }
  })();

  return clientData.loadPromise;
};

// Hook para usar datos del cliente
const useClientData = () => {
  const [data, setData] = useState(clientData);
  const [error, setError] = useState(null);
  const initRef = useRef(false);
  const { user } = useAuth();

  const refresh = async (force = false) => {
    try {
      setError(null);
      setData(prev => ({ ...prev, stats: { ...prev.stats, loading: true, error: null } }));
      const newData = await loadClientData(force);
      setData({ ...newData });
    } catch (err) {
      setError(err.message);
      setData(prev => ({ ...prev, stats: { ...prev.stats, loading: false, error: err.message } }));
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

// ========================================
// COMPONENTE: HOME DEL CLIENTE
// ========================================

const ClientDashboardHome = () => {
  const { data, error, refresh } = useClientData();
  const { stats, clientInfo } = data;

  if (stats.loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-gray-100 rounded"></div>
              ))}
            </div>
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
          <button onClick={() => refresh(true)} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {clientInfo?.name || 'Cliente'}!
            </h1>
            <p className="text-blue-100 mb-4">
              {clientInfo?.commercial_name || 'Sistema de Gestión de Documentos'}
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                <span>{clientInfo?.municipality || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-1" />
                <span className="capitalize">{clientInfo?.risk_level || 'N/A'} Riesgo</span>
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                <span>Sistema Activo</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <button onClick={() => refresh(true)} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center">
              <RotateCcw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Alertas críticas */}
      {(stats.expiredDocuments > 0 || stats.documentsExpiringSoon > 0 || stats.rejectedDocuments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.expiredDocuments > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Documentos Vencidos</h3>
                  <p className="text-2xl font-bold text-red-900">{stats.expiredDocuments}</p>
                  <p className="text-xs text-red-600">Requieren renovación inmediata</p>
                </div>
              </div>
            </div>
          )}
          
          {stats.documentsExpiringSoon > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Por Vencer</h3>
                  <p className="text-2xl font-bold text-yellow-900">{stats.documentsExpiringSoon}</p>
                  <p className="text-xs text-yellow-600">Próximos 30 días</p>
                </div>
              </div>
            </div>
          )}
          
          {stats.rejectedDocuments > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-orange-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Rechazados</h3>
                  <p className="text-2xl font-bold text-orange-900">{stats.rejectedDocuments}</p>
                  <p className="text-xs text-orange-600">Requieren corrección</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Documentos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
              <p className="text-xs text-gray-500 mt-1">Registrados en el sistema</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Aprobados</p>
              <p className="text-3xl font-bold text-green-600">{stats.approvedDocuments}</p>
              <p className="text-xs text-gray-500 mt-1">Cumpliendo normativa</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">En Revisión</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingDocuments}</p>
              <p className="text-xs text-gray-500 mt-1">Pendientes de aprobar</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Cumplimiento</p>
              <p className="text-3xl font-bold text-purple-600">{stats.complianceRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Nivel de conformidad</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Percent className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso de cumplimiento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Progreso de Cumplimiento</h3>
            <p className="text-sm text-gray-600">
              {stats.approvedDocuments} de {stats.totalDocuments} documentos aprobados
            </p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold ${
              stats.complianceRate >= 80 ? 'text-green-600' :
              stats.complianceRate >= 50 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stats.complianceRate}%
            </span>
          </div>
        </div>
        
        <div className="relative">
          <div className="overflow-hidden h-4 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${stats.complianceRate}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                stats.complianceRate >= 80 ? 'bg-green-500' :
                stats.complianceRate >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
            ></div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">Excelente</p>
            <p className="text-2xl font-bold text-green-700">80%+</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600 font-medium">Aceptable</p>
            <p className="text-2xl font-bold text-yellow-700">50-79%</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 font-medium">Crítico</p>
            <p className="text-2xl font-bold text-red-700">&lt;50%</p>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
            <Upload className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900">Subir Documento</div>
            <div className="text-xs text-gray-500">Nuevo archivo FEII</div>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
            <FileCheck className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900">Ver Aprobados</div>
            <div className="text-xs text-gray-500">Documentos vigentes</div>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
            <Calendar className="h-6 w-6 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900">Vencimientos</div>
            <div className="text-xs text-gray-500">Próximos a renovar</div>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
            <Bell className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-medium text-gray-900">Notificaciones</div>
            <div className="text-xs text-gray-500">Ver todas</div>
          </button>
        </div>
      </div>

      {/* Notificaciones recientes */}
      {data.notifications && data.notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notificaciones Recientes</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {data.notifications.slice(0, 5).map((notification, index) => (
              <div key={notification.id || index} className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Bell className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información del sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex space-x-6">
            <span>RFC: {clientInfo?.rfc || 'N/A'}</span>
            <span>Código Cliente: {clientInfo?.client_code || 'N/A'}</span>
            <span>Última actualización: {new Date(data.lastUpdate).toLocaleString()}</span>
          </div>
          <div className="flex items-center text-green-600">
            <Activity className="h-4 w-4 mr-1" />
            <span>Sistema Activo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE: MIS DOCUMENTOS
// ========================================

const MisDocumentos = () => {
  const { data, error, refresh } = useClientData();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    documentType: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredDocuments = data.documents.filter(doc => {
    const matchesSearch = !filters.search || 
      doc.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      doc.document_types?.name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || doc.status === filters.status;
    const matchesType = !filters.documentType || doc.document_type_id === filters.documentType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const clearFilters = () => {
    setFilters({ search: '', status: '', documentType: '' });
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  // Agrupar tipos de documentos únicos
  const documentTypes = [...new Set(data.documents.map(d => d.document_type_id))]
    .map(typeId => {
      const doc = data.documents.find(d => d.document_type_id === typeId);
      return doc?.document_types;
    })
    .filter(Boolean);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Documentos</h2>
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
            <div className="text-2xl font-bold text-gray-900">{data.stats.totalDocuments}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
            <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-900">{data.stats.pendingDocuments}</div>
            <div className="text-sm text-yellow-600">Pendientes</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">{data.stats.approvedDocuments}</div>
            <div className="text-sm text-green-600">Aprobados</div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
            <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-900">{data.stats.rejectedDocuments}</div>
            <div className="text-sm text-red-600">Rechazados</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
            <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">{data.stats.expiredDocuments}</div>
            <div className="text-sm text-orange-600">Vencidos</div>
          </div>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre del documento..."
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
              <select 
                value={filters.documentType}
                onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Todos los tipos</option>
                {documentTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.code} - {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-2">
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
              {filters.documentType && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Tipo seleccionado
                  <button onClick={() => setFilters(prev => ({ ...prev, documentType: '' }))} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                </span>
              )}
            </div>

            <button 
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {data.documents.length === 0 ? 'No tienes documentos aún' : 'No hay documentos que coincidan'}
            </h3>
            <p className="text-gray-500 mb-4">
              {data.documents.length === 0 
                ? 'Comienza subiendo tu primer documento'
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
            onDocumentSelect={setSelectedDocument}
            refresh={refresh}
          />
        )}
      </div>

      {/* Modal de subida */}
      {showUploadModal && (
        <UploadDocumentModal 
          clientInfo={data.clientInfo}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            refresh(true);
            toast.success('Documento subido exitosamente');
          }}
        />
      )}

      {/* Modal de detalles */}
      {selectedDocument && (
        <DocumentDetailsModal 
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onUpdate={() => {
            setSelectedDocument(null);
            refresh(true);
          }}
        />
      )}
    </div>
  );
};

// Tabla de documentos
const DocumentsTable = ({ documents, onDocumentSelect, refresh }) => {
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
        <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
          <div className="col-span-2">Documento</div>
          <div>Tipo</div>
          <div>Estado</div>
          <div>Vigencia</div>
          <div>Acciones</div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {documents.map(doc => {
          const statusInfo = formatStatus(doc.status);
          const StatusIcon = statusInfo.icon;
          const daysUntilExpiry = getDaysUntilExpiry(doc.valid_until);
          
          return (
            <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">
                    Versión {doc.version} • Subido {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-sm text-gray-600">
                  {doc.document_types?.code || 'N/A'}
                </div>
                
                <div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.text}
                  </span>
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
                          {daysUntilExpiry < 0 ? `Vencido` :
                          daysUntilExpiry === 0 ? 'Vence hoy' :
                          `${daysUntilExpiry}d`
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
const UploadDocumentModal = ({ clientInfo, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    documentTypeId: '',
    validFrom: '',
    validUntil: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [availableTypes, setAvailableTypes] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAvailableDocumentTypes();
  }, []);

  const loadAvailableDocumentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('code');

      if (error) throw error;
      setAvailableTypes(data || []);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
      toast.error('Error cargando tipos de documento');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !formData.documentTypeId) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setUploading(true);
    try {
      // Validar archivo
      if (file.type !== 'application/pdf') {
        throw new Error('Solo se permiten archivos PDF');
      }
      
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('El archivo no puede ser mayor a 100MB');
      }

      // Subir archivo
      const fileExt = 'pdf';
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `client_documents/${clientInfo.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw new Error('Error subiendo archivo: ' + uploadError.message);

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Crear registro
      const { error: docError } = await supabase
        .from('client_documents')
        .insert([{
          name: formData.name || file.name,
          client_id: clientInfo.id,
          document_type_id: formData.documentTypeId,
          file_url: publicUrl,
          file_size: file.size,
          status: 'pending',
          valid_from: formData.validFrom || null,
          valid_until: formData.validUntil || null,
          version: 1
        }]);

      if (docError) throw new Error('Error guardando documento: ' + docError.message);

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
              <X className="h-6 w-6" />
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
              Tipo de Documento <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.documentTypeId}
              onChange={(e) => setFormData(prev => ({ ...prev, documentTypeId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar tipo</option>
              {availableTypes.map(type => (
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
const DocumentDetailsModal = ({ document, onClose, onUpdate }) => {
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
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Documento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo:</span>
                  <span className="font-medium">{document.document_types?.code || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Categoría:</span>
                  <span className="font-medium">{document.document_types?.category || 'N/A'}</span>
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

          {document.file_url && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Archivo</h4>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-sm text-gray-500">
                        {document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : 'PDF'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => window.open(document.file_url, '_blank')}
                    className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          )}

          {document.review_comments && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Comentarios de Revisión</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{document.review_comments}</p>
                {document.reviewed_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Revisado el {new Date(document.reviewed_at).toLocaleString()}
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

// ========================================
// COMPONENTE: MI PERFIL
// ========================================

const MiPerfil = () => {
  const { user } = useAuth();
  const { data, refresh } = useClientData();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data.clientUser) {
      setFormData({
        nombre: data.clientUser.nombre || '',
        telefono: data.clientUser.telefono || '',
        celular: data.clientUser.celular || '',
        area: data.clientUser.area || '',
        cargo: data.clientUser.cargo || ''
      });
    }
  }, [data.clientUser]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('client_users')
        .update(formData)
        .eq('id', data.clientUser.id);

      if (error) throw error;

      toast.success('Perfil actualizado correctamente');
      setEditing(false);
      refresh(true);
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Contraseña cambiada correctamente');
      setChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Información del usuario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            {editing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </>
            )}
          </button>
        </div>

        <div className="flex items-start space-x-6 mb-6 pb-6 border-b border-gray-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-medium text-gray-900">{data.clientUser?.nombre || 'Usuario'}</h3>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Cliente
              </span>
              <span className="text-sm text-gray-500">
                {data.clientUser?.cargo || 'Sin cargo'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.clientUser?.nombre || 'No especificado'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <p className="text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-1">No se puede modificar</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            {editing ? (
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.clientUser?.telefono || 'No especificado'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Celular
            </label>
            {editing ? (
              <input
                type="tel"
                value={formData.celular}
                onChange={(e) => setFormData(prev => ({ ...prev, celular: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.clientUser?.celular || 'No especificado'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Área
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.clientUser?.area || 'No especificado'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.clientUser?.cargo || 'No especificado'}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-6 flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Información de la empresa */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón Social
            </label>
            <p className="text-gray-900">{data.clientInfo?.name || 'No especificado'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Comercial
            </label>
            <p className="text-gray-900">{data.clientInfo?.commercial_name || 'No especificado'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RFC
            </label>
            <p className="text-gray-900 font-mono">{data.clientInfo?.rfc || 'No especificado'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Cliente
            </label>
            <p className="text-gray-900 font-mono">{data.clientInfo?.client_code || 'No especificado'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Municipio
            </label>
            <p className="text-gray-900">{data.clientInfo?.municipality || 'No especificado'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Riesgo
            </label>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              data.clientInfo?.risk_level === 'alto' ? 'bg-red-100 text-red-800' :
              data.clientInfo?.risk_level === 'medio' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {data.clientInfo?.risk_level || 'No especificado'}
            </span>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Seguridad</h3>
            <p className="text-sm text-gray-600">Gestiona tu contraseña de acceso</p>
          </div>
          {!changingPassword && (
            <button
              onClick={() => setChangingPassword(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <Key className="h-4 w-4 mr-2" />
              Cambiar Contraseña
            </button>
          )}
        </div>

        {changingPassword && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setChangingPassword(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// COMPONENTE PRINCIPAL: CLIENT DASHBOARD
// ========================================

const ClientDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, userRole, logout } = useAuth();
  const { data } = useClientData();
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
    { name: 'Dashboard', href: '/dashboard/client', icon: Home, current: location.pathname === '/dashboard/client' },
    { name: 'Mis Documentos', href: '/dashboard/client/documents', icon: FileText, current: location.pathname === '/dashboard/client/documents' },
    { name: 'Mi Perfil', href: '/dashboard/client/profile', icon: User, current: location.pathname === '/dashboard/client/profile' },
  ];

  const handleNavigation = (href) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const unreadNotifications = data.notifications?.filter(n => !n.read).length || 0;

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
            <ClientSidebar navigation={navigation} onNavigate={handleNavigation} clientInfo={data.clientInfo} />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <ClientSidebar navigation={navigation} onNavigate={handleNavigation} clientInfo={data.clientInfo} />
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
                    placeholder="Buscar documentos..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-4">
                {userRole}
              </span>

              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 relative mr-3"
              >
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {data.clientUser?.nombre?.charAt(0) || 'C'}
                      </span>
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
                          handleNavigation('/dashboard/client/profile');
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
                <Route path="/" element={<ClientDashboardHome />} />
                <Route path="/documents" element={<MisDocumentos />} />
                <Route path="/profile" element={<MiPerfil />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar del cliente
const ClientSidebar = ({ navigation, onNavigate, clientInfo }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4 mb-8">
        <Shield className="h-8 w-8 text-blue-600" />
        <div className="ml-3">
          <p className="text-lg font-bold text-gray-900">B&C Consultores</p>
          <p className="text-sm text-gray-500">Portal Cliente</p>
        </div>
      </div>
      
      {clientInfo && (
        <div className="px-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs font-medium text-blue-600 mb-1">Tu empresa</p>
            <p className="text-sm font-medium text-gray-900 truncate">{clientInfo.name}</p>
            <p className="text-xs text-gray-600 mt-1">RFC: {clientInfo.rfc}</p>
          </div>
        </div>
      )}
      
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
          <Activity className="h-4 w-4 text-blue-600" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700">Sistema activo</p>
          <p className="text-xs text-gray-500">Protección Civil</p>
        </div>
      </div>
    </div>
  </div>
);

export default ClientDashboard;