// components/Header.jsx - Componente de header con logout funcional
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { LogOut, User, ChevronDown } from 'lucide-react';

const Header = ({ userRole, userEmail }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (loggingOut) return;
    
    setLoggingOut(true);
    
    try {
      console.log('🔄 Iniciando logout...');
      
      // 1. Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error en logout:', error);
        throw error;
      }

      console.log('✅ Logout exitoso');

      // 2. Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Mostrar mensaje de éxito
      toast.success('Sesión cerrada correctamente');

      // 4. Redirigir al login
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('❌ Error durante logout:', error);
      
      // Si hay error, forzar logout manual
      localStorage.clear();
      sessionStorage.clear();
      
      toast.error('Error al cerrar sesión, redirigiendo...');
      
      // Forzar redirección
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'cliente': 'Cliente',
      'admin': 'Administrador',
      'superadmin': 'Super Administrador'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'cliente': 'bg-blue-100 text-blue-800',
      'admin': 'bg-green-100 text-green-800',
      'superadmin': 'bg-purple-100 text-purple-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                B&C Consultores
              </h1>
              <p className="text-xs text-gray-500">CRM Protección Civil</p>
            </div>
          </div>

          {/* Perfil de usuario */}
          <div className="relative">
            <div className="flex items-center">
              {/* Badge de rol */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium mr-3 ${getRoleColor(userRole)}`}>
                {getRoleDisplayName(userRole)}
              </span>

              {/* Dropdown del usuario */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loggingOut}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="ml-2 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {userEmail || 'Usuario'}
                    </div>
                  </div>
                  <ChevronDown className="ml-1 w-4 h-4 text-gray-500" />
                </div>
              </button>
            </div>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  {/* Información del usuario */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-900 font-medium">
                      {userEmail}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplayName(userRole)}
                    </p>
                  </div>

                  {/* Opción de perfil (opcional) */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      // Navegar a perfil si existe
                      toast.info('Función de perfil próximamente');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </button>

                  {/* Botón de logout */}
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    disabled={loggingOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para cerrar dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;