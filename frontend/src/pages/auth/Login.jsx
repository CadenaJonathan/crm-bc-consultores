// Login.jsx - VERSIÓN CORREGIDA PARA DOS TABLAS DE USUARIOS
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getUserRole = async (userEmail) => {
    console.log('🔍 Buscando rol para:', userEmail);
    
    // 1. PRIMERO: Buscar en tabla public.users (admins/superadmins)
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role, email')
      .eq('email', userEmail)
      .single();

    if (!adminError && adminUser) {
      console.log('✅ Usuario encontrado en public.users:', adminUser);
      return {
        role: adminUser.role,
        isActive: true, // Los de public.users están activos por defecto
        source: 'public'
      };
    }

    console.log('❌ No encontrado en public.users, buscando en auth.users...');

    // 2. SEGUNDO: Buscar en auth.users (clientes)
    // Los usuarios de auth.users son clientes por defecto
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (!authError && authUser.user && authUser.user.email === userEmail) {
      console.log('✅ Usuario encontrado en auth.users:', authUser.user.email);
      
      // Verificar si el usuario está confirmado
      const isActive = authUser.user.email_confirmed_at !== null;
      
      return {
        role: 'cliente', // Los usuarios de auth.users son clientes
        isActive: isActive,
        source: 'auth'
      };
    }

    console.log('❌ Usuario no encontrado en ninguna tabla');
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
      console.log('🚀 Iniciando login para:', email);

      // 1. AUTENTICACIÓN CON SUPABASE
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error('❌ Error de autenticación:', authError);
        throw authError;
      }

      console.log('✅ Autenticación exitosa para:', authData.user.email);

      // 2. OBTENER ROL DEL USUARIO (desde ambas tablas)
      const userInfo = await getUserRole(email.trim());
      
      console.log('✅ Información del usuario:', userInfo);

      // 3. VERIFICAR QUE LA CUENTA ESTÉ ACTIVA
      if (!userInfo.isActive) {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
      }

      // 4. VALIDAR ROL
      const validRoles = ['cliente', 'admin', 'superadmin'];
      if (!validRoles.includes(userInfo.role)) {
        await supabase.auth.signOut();
        throw new Error('Usuario sin permisos válidos');
      }

      // 5. MOSTRAR MENSAJE DE ÉXITO
      toast.success(`¡Bienvenido! Rol: ${userInfo.role} (${userInfo.source})`);
      
      console.log(`🎯 Redirigiendo usuario con rol: ${userInfo.role} desde ${userInfo.source}`);
      
      // 6. REDIRECCIÓN SEGÚN ROL
      if (userInfo.role === 'cliente') {
        navigate('/dashboard/cliente', { replace: true });
      } else if (userInfo.role === 'admin' || userInfo.role === 'superadmin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Mensajes de error específicos
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Email no confirmado. Revisa tu correo.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Intenta más tarde.';
      } else if (error.message?.includes('User not found') || error.message?.includes('Usuario no encontrado')) {
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
              <p className="text-blue-200">CRM Protección Civil</p>
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
              <span>Validación externa sin autenticación</span>
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Información para nuevos usuarios */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>¿Necesitas una cuenta?</p>
            <p className="mt-1 font-medium text-gray-700">
              Contacta al administrador del sistema
            </p>
          </div>

          {/* Credenciales de prueba - Desarrollo */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <div className="font-medium text-blue-800 mb-2">🔧 Cuentas disponibles:</div>
              <div><strong>Admin:</strong> admin@bcconsultores.com</div>
              <div><strong>Superadmin:</strong> admin@test.com</div>
              <div><strong>Cliente:</strong> cliente@123.com</div>
              <div className="text-blue-600 mt-2 text-xs">
                (Sistema detecta automáticamente el rol)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;