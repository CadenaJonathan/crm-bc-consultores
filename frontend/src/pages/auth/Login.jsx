// Login.jsx - Sistema de Autenticación Dual
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Shield, User } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('auto'); // 'auto', 'admin', 'client'
  const navigate = useNavigate();

  /**
   * AUTENTICACIÓN DE ADMINISTRADORES (Supabase Auth)
   */
  const loginAdmin = async (email, password) => { 
    console.log('🔐 Intentando login de ADMIN con Supabase Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (authError) throw authError;

    // Verificar que existe en tabla users (admin/superadmin)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, is_active, full_name')
      .eq('email', email.trim())
      .single();

    if (userError || !userData) {
      throw new Error('Usuario no encontrado en el sistema');
    }

    if (!userData.is_active) {
      await supabase.auth.signOut();
      throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
    }

    return {
      user: authData.user,
      role: userData.role,
      isActive: userData.is_active,
      fullName: userData.full_name,
      source: 'admin'
    };
  };

  /**
   * AUTENTICACIÓN DE CLIENTES (client_users con bcrypt)
   */
  const loginClient = async (email, password) => {
    console.log('🔐 Intentando login de CLIENTE con client_users...');
    
    // Llamar a función de Supabase que valida credenciales
    const { data, error } = await supabase
      .rpc('authenticate_client_user', {
        p_email: email.trim().toLowerCase(),
        p_password: password
      });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Credenciales incorrectas');
    }

    // Crear sesión personalizada (guardamos en localStorage)
    const clientSession = {
      user: {
        id: data.user_id,
        email: data.email,
        user_metadata: {
          full_name: data.full_name,
          client_id: data.client_id,
          area: data.area,
          cargo: data.cargo
        }
      },
      role: 'cliente',
      isActive: data.is_active,
      fullName: data.full_name,
      source: 'client'
    };

    // Guardar sesión en localStorage
    localStorage.setItem('client_session', JSON.stringify(clientSession));
    localStorage.setItem('client_token', data.user_id); // Token simple

    return clientSession;
  };

  /**
   * INTENTAR DETECTAR AUTOMÁTICAMENTE EL TIPO DE USUARIO
   */
  const autoDetectAndLogin = async (email, password) => {
    console.log('🔍 Auto-detectando tipo de usuario...');
    
    // Primero: Verificar si existe en client_users
    const { data: clientCheck } = await supabase
      .from('client_users')
      .select('id, email, is_active')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (clientCheck) {
      console.log('✅ Usuario encontrado en client_users');
      return await loginClient(email, password);
    }

    // Segundo: Verificar si existe en users (admin)
    const { data: adminCheck } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email.trim())
      .maybeSingle();

    if (adminCheck) {
      console.log('✅ Usuario encontrado en users (admin)');
      return await loginAdmin(email, password);
    }

    throw new Error('Usuario no encontrado en el sistema');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor ingresa todos los campos');
      return;
    }

    setLoading(true);

    try {
      let userInfo;

      // Según el tipo seleccionado
      if (userType === 'auto') {
        userInfo = await autoDetectAndLogin(email, password);
      } else if (userType === 'admin') {
        userInfo = await loginAdmin(email, password);
      } else if (userType === 'client') {
        userInfo = await loginClient(email, password);
      }

      console.log('✅ Login exitoso:', userInfo);

      toast.success(`¡Bienvenido ${userInfo.fullName || 'Usuario'}!`);
      
      // Redirección según rol
      if (userInfo.role === 'cliente') {
        navigate('/cliente/dashboard', { replace: true });
      } else if (userInfo.role === 'admin' || userInfo.role === 'superadmin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email no confirmado. Revisa tu correo.';
      } else if (error.message?.includes('desactivada')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Usuario no encontrado')) {
        errorMessage = 'Usuario no registrado en el sistema';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información del sistema */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4">
              <span className="text-blue-600 text-xl font-bold">B&C</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">B&C Consultores</h1>
              <p className="text-blue-200">Sistema de Protección Civil</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mb-6">
            Gestiona tu documentación de Protección Civil
          </h2>
          
          <p className="text-blue-100 mb-8">
            Sistema integral para el manejo de documentos FEII con 
            validación QR y alertas automáticas.
          </p>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Documentos con códigos QR únicos</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Alertas automáticas de vencimiento</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Acceso diferenciado por rol</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Cumplimiento automático por municipio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-2">
                <span className="text-white text-sm font-bold">B&C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">B&C Consultores</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-gray-600 mt-2">
              Accede a tu cuenta para gestionar tus documentos
            </p>
          </div>

          {/* Selector de tipo de usuario */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Usuario
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUserType('auto')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  userType === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setUserType('admin')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  userType === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => setUserType('client')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  userType === 'client'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="h-4 w-4 mr-1" />
                Cliente
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {userType === 'auto' && '✨ Detecta automáticamente tu tipo de cuenta'}
              {userType === 'admin' && '🔐 Login exclusivo para administradores'}
              {userType === 'client' && '👤 Login para clientes del sistema'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="usuario@ejemplo.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Links adicionales */}
          <div className="mt-6 text-center space-y-2">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              ¿Olvidaste tu contraseña?
            </button>
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <span className="font-medium text-gray-700">Contacta al administrador</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;