// src/pages/Client/ClientDashboard.jsx
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  Activity
} from 'lucide-react';

// ========================================
// IMPORTAR TUS COMPONENTES EXISTENTES
// ========================================
import { ClientDocuments } from '../../components/client/ClientDocuments';
import { ClientEstablishments } from '../../components/client/ClientEstablishments';
import { ClientProfile } from '../../components/client/ClientProfile';
import { ClientNotifications } from '../../components/client/ClientNotifications';
import { NotificationButton } from '../../components/client/NotificationButton';
import { NotificationPermissionBanner } from '../../components/client/NotificationPermissionBanner';

// ========================================
// COMPONENTE: HOME DEL CLIENTE (Simplificado)
// ========================================
function ClientDashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Bienvenido al Portal de Protección Civil!
        </h1>
        <p className="text-blue-100">
          Gestiona tus documentos, establecimientos y mantente al día con las normativas
        </p>
      </div>

      {/* Cards de acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAccessCard
          title="Mis Documentos"
          description="Gestiona tus documentos FEII"
          icon={FileText}
          color="blue"
          onClick={() => navigate('/dashboard/cliente/documents')} />

        <QuickAccessCard
          title="Establecimientos"
          description="Ver tus ubicaciones"
          icon={Building2}
          color="green"
          onClick={() => navigate('/dashboard/cliente/establishments')} />

        <QuickAccessCard
          title="Mi Perfil"
          description="Información de tu cuenta"
          icon={User}
          color="purple"
          onClick={() => navigate('/dashboard/cliente/profile')} />

        <QuickAccessCard
          title="Notificaciones"
          description="Alertas y actualizaciones"
          icon={Bell}
          color="yellow"
          onClick={() => navigate('/dashboard/cliente/notifications')} />
      </div>

      {/* Información del sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">¿Cómo usar el sistema?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoCard
            step="1"
            title="Sube tus documentos"
            description="Carga los documentos FEII requeridos según tu nivel de riesgo" />
          <InfoCard
            step="2"
            title="Espera la revisión"
            description="Nuestro equipo validará tus documentos en 24-48 horas" />
          <InfoCard
            step="3"
            title="Mantente al día"
            description="Recibe notificaciones sobre vencimientos y actualizaciones" />
        </div>
      </div>
      <NotificationPermissionBanner />
    </div>
  );
}

// Componente de tarjeta de acceso rápido
const QuickAccessCard = ({ title, description, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all text-left group"
    >
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
};

// Componente de tarjeta de información
const InfoCard = ({ step, title, description }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center mb-3">
      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
        {step}
      </div>
      <h4 className="ml-3 font-medium text-gray-900">{title}</h4>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

// ========================================
// COMPONENTE PRINCIPAL: CLIENT DASHBOARD
// ========================================
const ClientDashboard = () => {
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
    { 
      name: 'Dashboard', 
      href: '/dashboard/cliente', 
      icon: Home, 
      current: location.pathname === '/dashboard/cliente' 
    },
    { 
      name: 'Mis Documentos', 
      href: '/dashboard/cliente/documents', 
      icon: FileText, 
      current: location.pathname === '/dashboard/cliente/documents' 
    },
    { 
      name: 'Establecimientos', 
      href: '/dashboard/cliente/establishments', 
      icon: Building2, 
      current: location.pathname === '/dashboard/cliente/establishments' 
    },
    { 
      name: 'Notificaciones', 
      href: '/dashboard/cliente/notifications', 
      icon: Bell, 
      current: location.pathname === '/dashboard/cliente/notifications' 
    },
    { 
      name: 'Mi Perfil', 
      href: '/dashboard/cliente/profile', 
      icon: User, 
      current: location.pathname === '/dashboard/cliente/profile' 
    },
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
            <ClientSidebar navigation={navigation} onNavigate={handleNavigation} />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <ClientSidebar navigation={navigation} onNavigate={handleNavigation} />
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
            
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Cliente
              </span>

              {/* Botón de notificaciones */}
              <NotificationButton />

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleNavigation('/dashboard/cliente/profile');
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

        {/* Contenido - AQUÍ SE CORRIGEN LAS RUTAS */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Routes>
                {/* Ruta principal - Home */}
                <Route index element={<ClientDashboardHome />} />
                
                {/* Rutas de funcionalidad - SIN la barra inicial */}
                <Route path="documents" element={<ClientDocuments />} />
                <Route path="establishments" element={<ClientEstablishments />} />
                <Route path="notifications" element={<ClientNotifications />} />
                <Route path="profile" element={<ClientProfile />} />
                
                {/* Ruta 404 para subrutas no encontradas */}
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                      <button 
                        onClick={() => navigate('/dashboard/cliente')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Volver al Dashboard
                      </button>
                    </div>
                  </div>
                } />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// ========================================
// SIDEBAR DEL CLIENTE
// ========================================
const ClientSidebar = ({ navigation, onNavigate }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4 mb-8">
        <Shield className="h-8 w-8 text-blue-600" />
        <div className="ml-3">
          <p className="text-lg font-bold text-gray-900">B&C Consultores</p>
          <p className="text-sm text-gray-500">Portal Cliente</p>
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
              } group w-full flex items-center pl-2 pr-2 py-2 border-l-4 text-sm font-medium transition-colors`}
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