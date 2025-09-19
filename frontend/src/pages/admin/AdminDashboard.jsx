// IMPORTS CORREGIDOS PARA AdminDashboard.jsx
// Reemplaza los imports al inicio del archivo

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase'; // ← IMPORTANTE: Agregar este import
import { toast } from 'react-hot-toast';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useClients } from '../../hooks/useClients';
import { 
  Home, 
  Users, 
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
  BarChart3,
  UserPlus,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

// Componentes de páginas del dashboard admin
const AdminDashboardHome = () => {
  const { 
    totalClients,
    activeClients,
    totalDocuments,
    approvedDocuments,
    pendingDocuments,
    expiredDocuments,
    documentsExpiringSoon,
    recentActivity,
    loading,
    error,
    refreshStats
  } = useDashboardStats();

  const { userRole } = useAuth();

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-50 rounded-lg p-6">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-900">Error al cargar estadísticas</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <button 
            onClick={refreshStats}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de actualizar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Panel de Administración
            </h2>
            <p className="text-gray-600">
              Gestiona el sistema CRM de Protección Civil
            </p>
          </div>
          <button
            onClick={refreshStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
        
        {/* Estadísticas principales CON DATOS REALES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Clientes</p>
                <p className="text-2xl font-bold text-blue-900">{totalClients}</p>
                <p className="text-xs text-blue-500">
                  {activeClients} activos de {totalClients} total
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Docs. Aprobados</p>
                <p className="text-2xl font-bold text-green-900">{approvedDocuments}</p>
                <p className="text-xs text-green-500">
                  De {totalDocuments} documentos totales
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingDocuments}</p>
                <p className="text-xs text-yellow-500">Requieren revisión</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Por Vencer</p>
                <p className="text-2xl font-bold text-red-900">{documentsExpiringSoon}</p>
                <p className="text-xs text-red-500">Próximos 30 días</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        {expiredDocuments > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">
                ⚠️ {expiredDocuments} documentos vencidos requieren atención inmediata
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Acciones rápidas y Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <UserPlus className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Crear nuevo cliente</span>
              </div>
              <span className="text-xs text-gray-500">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <Upload className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Subir documentos</span>
              </div>
              <span className="text-xs text-gray-500">→</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-700">Ver reportes</span>
              </div>
              <span className="text-xs text-gray-500">→</span>
            </button>

            {pendingDocuments > 0 && (
              <button className="w-full flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-600 mr-3" />
                  <span className="text-sm font-medium text-orange-700">
                    Revisar {pendingDocuments} pendientes
                  </span>
                </div>
                <span className="text-xs text-orange-500">→</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Actividad Reciente
            {recentActivity.length === 0 && (
              <span className="text-sm text-gray-500 font-normal ml-2">(No hay actividad)</span>
            )}
          </h3>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.color === 'green' ? 'bg-green-400' :
                    activity.color === 'blue' ? 'bg-blue-400' :
                    activity.color === 'yellow' ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay actividad reciente</p>
              <p className="text-sm text-gray-400 mt-1">
                La actividad aparecerá aquí cuando haya clientes y documentos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GestionClientes = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros SIN persistencia por ahora
  const [filters, setFilters] = useState({
    municipality: '',
    status: '',
    riskLevel: '',
    search: ''
  });

  // Cargar clientes al montar - SIN FILTROS INICIALMENTE
  useEffect(() => {
    fetchClients();
  }, []);

  // Función de carga SIMPLIFICADA
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Iniciando carga simple de clientes...');

      // Verificar conexión primero
      const { error: connectionError } = await supabase.auth.getSession();
      if (connectionError) {
        console.error('❌ Error de conexión:', connectionError);
        throw new Error('Error de conexión. Recarga la página.');
      }

      // Query más simple
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, rfc, municipality, business_type, risk_level, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50); // Limitar resultados

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw new Error(`Error: ${error.message}`);
      }

      console.log('✅ Clientes cargados:', data?.length || 0);
      setClients(data || []);

    } catch (error) {
      console.error('❌ Error en fetchClients:', error);
      setError(error.message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros EN EL FRONTEND (no en la base de datos)
  const filteredClients = clients.filter(client => {
    if (filters.municipality && client.municipality !== filters.municipality) return false;
    if (filters.status && client.status !== filters.status) return false;
    if (filters.riskLevel && client.risk_level !== filters.riskLevel) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = client.name?.toLowerCase().includes(searchLower);
      const rfcMatch = client.rfc?.toLowerCase().includes(searchLower);
      if (!nameMatch && !rfcMatch) return false;
    }
    return true;
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      municipality: '',
      status: '',
      riskLevel: '',
      search: ''
    });
  };

  // Resto de funciones y opciones (mantener las existentes)
  const municipalities = ['San Juan del Río', 'El Marqués', 'Querétaro', 'Tequisquiapan', 'Corregidora'];
  const riskLevels = ['bajo', 'medio', 'alto'];
  const statusOptions = ['active', 'inactive', 'suspended'];

  const formatBusinessType = (type) => {
    const types = {
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
    return types[type] || type;
  };

  const formatRiskLevel = (level) => {
    const levels = {
      'bajo': { text: 'Bajo', color: 'bg-green-100 text-green-800' },
      'medio': { text: 'Medio', color: 'bg-yellow-100 text-yellow-800' },
      'alto': { text: 'Alto', color: 'bg-red-100 text-red-800' }
    };
    return levels[level] || { text: level, color: 'bg-gray-100 text-gray-800' };
  };

  const formatStatus = (status) => {
    const statuses = {
      'active': { text: 'Activo', color: 'bg-green-100 text-green-800' },
      'inactive': { text: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
      'suspended': { text: 'Suspendido', color: 'bg-red-100 text-red-800' }
    };
    return statuses[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const hasActiveFilters = Object.values(filters).some(value => value);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-900">Error al cargar clientes</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <div className="mt-4 flex space-x-2">
            <button 
              onClick={fetchClients}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
            <p className="text-gray-600">
              {filteredClients.length} de {clients.length} clientes
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Filtrado
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={fetchClients}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o RFC..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select 
              value={filters.municipality}
              onChange={(e) => handleFilterChange('municipality', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los municipios</option>
              {municipalities.map(municipality => (
                <option key={municipality} value={municipality}>
                  {municipality}
                </option>
              ))}
            </select>
            
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              {statusOptions.map(status => {
                const formatted = formatStatus(status);
                return (
                  <option key={status} value={status}>
                    {formatted.text}
                  </option>
                );
              })}
            </select>
            
            <select 
              value={filters.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los niveles</option>
              {riskLevels.map(level => {
                const formatted = formatRiskLevel(level);
                return (
                  <option key={level} value={level}>
                    {formatted.text}
                  </option>
                );
              })}
            </select>
            
            <button 
              onClick={clearFilters}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
        
        {/* Tabla */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
              <div>Cliente</div>
              <div>RFC</div>
              <div>Municipio</div>
              <div>Giro</div>
              <div>Riesgo</div>
              <div>Estado</div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="grid grid-cols-6 gap-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters ? 'No hay clientes que coincidan' : 'No hay clientes registrados'}
              </h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters 
                  ? 'Prueba ajustando los filtros de búsqueda' 
                  : 'Los clientes aparecerán aquí una vez que sean agregados'
                }
              </p>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors mr-2"
                >
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
                  <div key={client.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.name}
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-900 font-mono">
                        {client.rfc}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {client.municipality}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {formatBusinessType(client.business_type)}
                      </div>
                      
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
      </div>
    </div>
  );
};

const GestionDocumentos = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Documentos</h2>
          <p className="text-gray-600">Administra todos los documentos del sistema</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Subir Documento
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>
      
      {/* Filtros de documentos */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Todos los clientes</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Todos los tipos</option>
            <option>FEII-01</option>
            <option>FEII-02</option>
            <option>FEII-03</option>
            <option>FEII-04</option>
            <option>FEII-05</option>
            <option>FEII-06</option>
            <option>FEII-07</option>
            <option>FEII-08</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Todos los estados</option>
            <option>Pendiente</option>
            <option>Aprobado</option>
            <option>Rechazado</option>
            <option>Vencido</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Cualquier fecha</option>
            <option>Próximos 30 días</option>
            <option>Próximos 60 días</option>
            <option>Vencidos</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            Filtrar
          </button>
        </div>
      </div>
      
      {/* Tabla de documentos */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-700">
            <div>Documento</div>
            <div>Cliente</div>
            <div>Tipo</div>
            <div>Estado</div>
            <div>Subido</div>
            <div>Vence</div>
            <div>Acciones</div>
          </div>
        </div>
        
        {/* Placeholder para documentos */}
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
          <p className="text-gray-500 mb-4">Los documentos aparecerán aquí una vez que sean subidos</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Subir Primer Documento
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Reportes = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Reportes y Estadísticas</h2>
      <p className="text-gray-600 mb-6">Analiza el rendimiento y cumplimiento del sistema</p>
      
      {/* Tipos de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <BarChart3 className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cumplimiento por Municipio</h3>
          <p className="text-gray-600 text-sm mb-4">Estadísticas de cumplimiento por municipio</p>
          <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Generar Reporte
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <FileText className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Documentos Vencidos</h3>
          <p className="text-gray-600 text-sm mb-4">Lista de documentos próximos a vencer</p>
          <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Generar Reporte
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <Users className="h-8 w-8 text-purple-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Resumen de Clientes</h3>
          <p className="text-gray-600 text-sm mb-4">Estadísticas generales de clientes</p>
          <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  </div>
);

const ConfiguracionSistema = () => {
  const { userRole } = useAuth();
  const isSuperAdmin = userRole === 'superadmin';
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración del Sistema</h2>
        <p className="text-gray-600 mb-6">Administra la configuración global del sistema</p>
        
        {!isSuperAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                Algunas opciones solo están disponibles para super administradores
              </p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuración de usuarios */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gestión de Usuarios</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Crear administrador</span>
                <span className="text-xs text-gray-500">→</span>
              </button>
              
              <button 
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isSuperAdmin 
                    ? 'border-gray-200 hover:bg-gray-50 text-gray-700' 
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isSuperAdmin}
              >
                <span className="text-sm font-medium">Gestionar roles</span>
                <span className="text-xs text-gray-500">→</span>
              </button>
              
              <button 
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isSuperAdmin 
                    ? 'border-gray-200 hover:bg-gray-50 text-gray-700' 
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isSuperAdmin}
              >
                <span className="text-sm font-medium">Configurar permisos</span>
                <span className="text-xs text-gray-500">→</span>
              </button>
            </div>
          </div>
          
          {/* Configuración del sistema */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sistema</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Tipos de documentos</span>
                <span className="text-xs text-gray-500">→</span>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-medium text-gray-700">Configurar municipios</span>
                <span className="text-xs text-gray-500">→</span>
              </button>
              
              <button 
                className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  isSuperAdmin 
                    ? 'border-gray-200 hover:bg-gray-50 text-gray-700' 
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!isSuperAdmin}
              >
                <span className="text-sm font-medium">Configuración avanzada</span>
                <span className="text-xs text-gray-500">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPerfil = () => {
  const { user, userRole } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h2>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-900">Administrador</h3>
              <p className="text-gray-500">{user}</p>
              <span className={`inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full ${
                userRole === 'superadmin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {userRole === 'superadmin' ? 'Super Administrador' : 'Administrador'}
              </span>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{user}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {userRole === 'superadmin' ? 'Super Administrador' : 'Administrador'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Último acceso</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">Hoy</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Activo
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Permisos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Gestionar clientes</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Gestionar documentos</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Ver reportes</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                userRole === 'superadmin' ? 'bg-green-50' : 'bg-gray-100'
              }`}>
                <span className="text-sm text-gray-700">Configuración avanzada</span>
                {userRole === 'superadmin' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Actualizar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cerrar menú de usuario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = async () => {
  // Flag para evitar múltiples ejecuciones
  if (window.isLoggingOut) {
    console.log('⚠️ Logout ya en proceso, ignorando...');
    return;
  }
  
  window.isLoggingOut = true;
  
  try {
    console.log('🔄 Iniciando logout...');
    
    // Cerrar menú inmediatamente
    setUserMenuOpen(false);
    
    // Toast con timeout más corto
    const toastId = toast.loading('Cerrando sesión...', { 
      duration: 3000 // Máximo 3 segundos
    });
    
    // Timeout de seguridad - si no termina en 5 segundos, forzar logout
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout de logout, forzando salida...');
      forceLogout(toastId);
    }, 5000);
    
    // Intentar logout normal
    const result = await Promise.race([
      logout(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 4000)
      )
    ]);
    
    // Limpiar timeout si llegamos aquí
    clearTimeout(timeoutId);
    
    if (result && result.success) {
      console.log('✅ Logout exitoso');
      toast.success('Sesión cerrada', { id: toastId, duration: 1000 });
      
      // Redirección inmediata
      window.location.href = '/login';
    } else {
      throw new Error('Logout falló');
    }
    
  } catch (error) {
    console.error('❌ Error en logout:', error);
    forceLogout();
  } finally {
    window.isLoggingOut = false;
  }
};

// Función auxiliar para forzar logout
const forceLogout = (toastId = null) => {
  console.log('🚨 Ejecutando logout forzado...');
  
  try {
    // Logout directo de Supabase (sin await para evitar colgarse)
    supabase.auth.signOut().catch(e => console.log('Error Supabase:', e));
  } catch (e) {
    console.log('Error en signOut:', e);
  }
  
  // Limpiar todo el storage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.log('Error limpiando storage:', e);
  }
  
  // Toast rápido
  if (toastId) {
    toast.error('Sesión cerrada', { id: toastId, duration: 1000 });
  } else {
    toast.error('Sesión cerrada', { duration: 1000 });
  }
  
  // Redirección inmediata y forzada
  setTimeout(() => {
    window.location.href = '/login';
  }, 500);
};

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard/admin', 
      icon: Home,
      current: location.pathname === '/dashboard/admin' 
    },
    { 
      name: 'Clientes', 
      href: '/dashboard/admin/clientes', 
      icon: Users,
      current: location.pathname === '/dashboard/admin/clientes' 
    },
    { 
      name: 'Documentos', 
      href: '/dashboard/admin/documentos', 
      icon: FileText,
      current: location.pathname === '/dashboard/admin/documentos' 
    },
    { 
      name: 'Reportes', 
      href: '/dashboard/admin/reportes', 
      icon: BarChart3,
      current: location.pathname === '/dashboard/admin/reportes' 
    },
    { 
      name: 'Configuración', 
      href: '/dashboard/admin/configuracion', 
      icon: Settings,
      current: location.pathname === '/dashboard/admin/configuracion' 
    },
    { 
      name: 'Mi Perfil', 
      href: '/dashboard/admin/perfil', 
      icon: User,
      current: location.pathname === '/dashboard/admin/perfil' 
    },
  ];

  const handleNavigation = (href) => {
    console.log('🧭 Navegando a:', href);
    navigate(href);
    setSidebarOpen(false); // Cerrar sidebar en móvil
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'admin': 'Administrador',
      'superadmin': 'Super Administrador'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'admin': 'bg-blue-100 text-blue-800',
      'superadmin': 'bg-purple-100 text-purple-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <AdminSidebarContent navigation={navigation} onNavigate={handleNavigation} userRole={userRole} />
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <AdminSidebarContent navigation={navigation} onNavigate={handleNavigation} userRole={userRole} />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                    placeholder="Buscar clientes, documentos..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Badge de rol */}
              <span className={`px-3 py-1 rounded-full text-xs font-medium mr-4 ${getRoleColor(userRole)}`}>
                {getRoleDisplayName(userRole)}
              </span>

              {/* Notificaciones */}
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">3</span>
                </span>
              </button>

              {/* Menú de usuario */}
              <div className="ml-3 relative user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {userRole === 'superadmin' ? 'S' : 'A'}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-700">{getRoleDisplayName(userRole)}</p>
                      <p className="text-xs text-gray-500">{user}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-900 font-medium">{user}</p>
                        <p className="text-xs text-gray-500">{getRoleDisplayName(userRole)}</p>
                      </div>
                      
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
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleNavigation('/dashboard/admin/configuracion');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Configuración
                      </button>
                      
                      <div className="border-t border-gray-100"></div>
                      
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
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

        {/* Contenido de la página */}
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

// Componente del sidebar admin
const AdminSidebarContent = ({ navigation, onNavigate, userRole }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <Shield className="h-8 w-8 text-blue-600" />
        <div className="ml-3">
          <p className="text-xl font-bold text-gray-900">B&C Consultores</p>
          <p className="text-sm text-gray-500">Panel Administración</p>
        </div>
      </div>
      
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          
          // Verificar si el usuario tiene permisos para esta sección
          const hasPermission = item.name !== 'Configuración' || userRole === 'superadmin' || userRole === 'admin';
          
          return (
            <button
              key={item.name}
              onClick={() => hasPermission && onNavigate(item.href)}
              disabled={!hasPermission}
              className={`${
                item.current
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : hasPermission
                  ? 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
              } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium transition-colors`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
              {item.name === 'Configuración' && userRole !== 'superadmin' && userRole !== 'admin' && (
                <span className="ml-auto text-xs text-gray-400">Solo Admin</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
    
    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          userRole === 'superadmin' ? 'bg-purple-100' : 'bg-blue-100'
        }`}>
          <span className={`text-sm font-medium ${
            userRole === 'superadmin' ? 'text-purple-600' : 'text-blue-600'
          }`}>
            {userRole === 'superadmin' ? 'S' : 'A'}
          </span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700">
            {userRole === 'superadmin' ? 'Super Admin' : 'Administrador'}
          </p>
          <p className="text-xs text-gray-500">Sistema activo</p>
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;