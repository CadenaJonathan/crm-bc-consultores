// pages/Client/ClientDashboard.jsx - COMPLETAMENTE FUNCIONAL
import React, { useState, useEffect } from 'react';
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
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';

// Componentes de páginas del dashboard
const DashboardHome = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido, Cliente!</h2>
      <p className="text-gray-600 mb-6">
        Gestiona tus documentos de Protección Civil desde tu panel de control
      </p>
      
      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Documentos Activos</p>
              <p className="text-2xl font-bold text-blue-900">-</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Aprobados</p>
              <p className="text-2xl font-bold text-green-900">-</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Por Vencer</p>
              <p className="text-2xl font-bold text-yellow-900">-</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Establecimientos</p>
              <p className="text-2xl font-bold text-purple-900">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MisDocumentos = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Mis Documentos</h2>
      <p className="text-gray-600 mb-6">
        Aquí aparecerán todos tus documentos de Protección Civil
      </p>
      
      {/* Placeholder para documentos */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
        <p className="text-gray-500 mb-4">
          Tus documentos aparecerán aquí una vez que sean agregados por el administrador
        </p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Solicitar Documentos
        </button>
      </div>
    </div>
  </div>
);

const Establecimientos = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Establecimientos</h2>
      <p className="text-gray-600 mb-6">
        Gestiona la información de tus establecimientos
      </p>
      
      {/* Placeholder para establecimientos */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay establecimientos registrados</h3>
        <p className="text-gray-500 mb-4">
          Contacta al administrador para registrar tus establecimientos
        </p>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Agregar Establecimiento
        </button>
      </div>
    </div>
  </div>
);

const MiPerfil = () => {
  const { user, userRole } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Mi Perfil</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Usuario Cliente</h3>
              <p className="text-gray-500">{user}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <span className="mt-1 inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Actualizar Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientDashboard = () => {
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
      href: '/dashboard/cliente', 
      icon: Home,
      current: location.pathname === '/dashboard/cliente' 
    },
    { 
      name: 'Mis Documentos', 
      href: '/dashboard/cliente/documentos', 
      icon: FileText,
      current: location.pathname === '/dashboard/cliente/documentos' 
    },
    { 
      name: 'Establecimientos', 
      href: '/dashboard/cliente/establecimientos', 
      icon: Building2,
      current: location.pathname === '/dashboard/cliente/establecimientos' 
    },
    { 
      name: 'Mi Perfil', 
      href: '/dashboard/cliente/perfil', 
      icon: User,
      current: location.pathname === '/dashboard/cliente/perfil' 
    },
  ];

  const handleNavigation = (href) => {
    console.log('🧭 Navegando a:', href);
    navigate(href);
    setSidebarOpen(false); // Cerrar sidebar en móvil
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
            <SidebarContent navigation={navigation} onNavigate={handleNavigation} />
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent navigation={navigation} onNavigate={handleNavigation} />
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
                    placeholder="Buscar documentos..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notificaciones */}
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Bell className="h-6 w-6" />
              </button>

              {/* Menú de usuario */}
              <div className="ml-3 relative user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">U</span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-700">Usuario</p>
                      <p className="text-xs text-gray-500">{userRole}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm text-gray-900 font-medium">{user}</p>
                        <p className="text-xs text-gray-500">{userRole}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleNavigation('/dashboard/cliente/perfil');
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Mi Perfil
                      </button>
                      
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
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
                <Route path="/" element={<DashboardHome />} />
                <Route path="/documentos" element={<MisDocumentos />} />
                <Route path="/establecimientos" element={<Establecimientos />} />
                <Route path="/perfil" element={<MiPerfil />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Componente del sidebar reutilizable
const SidebarContent = ({ navigation, onNavigate }) => (
  <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <Shield className="h-8 w-8 text-blue-600" />
        <div className="ml-3">
          <p className="text-xl font-bold text-gray-900">B&C Consultores</p>
          <p className="text-sm text-gray-500">Panel Cliente</p>
        </div>
      </div>
      
      <nav className="mt-8 flex-1 px-2 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => onNavigate(item.href)}
              className={`${
                item.current
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700">Usuario</p>
          <p className="text-xs text-gray-500">cliente</p>
        </div>
      </div>
    </div>
  </div>
);

export default ClientDashboard;