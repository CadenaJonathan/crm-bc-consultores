// Login.jsx - Versión Optimizada Sin Scroll
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Shield, Lock, Mail, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getUserRole = async (userEmail) => {
    console.log('🔍 Buscando rol para:', userEmail);
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role, email')
      .eq('email', userEmail)
      .maybeSingle();

    if (adminUser) {
      console.log('✅ Usuario encontrado en public.users:', adminUser);
      return {
        role: adminUser.role,
        isActive: true,
        source: 'public'
      };
    }

    console.log('❌ No encontrado en public.users, buscando en auth.users...');

    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (!authError && authUser.user && authUser.user.email === userEmail) {
      console.log('✅ Usuario encontrado en auth.users:', authUser.user.email);
      
      const isActive = authUser.user.email_confirmed_at !== null;
      
      return {
        role: 'cliente',
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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error('❌ Error de autenticación:', authError);
        throw authError;
      }

      console.log('✅ Autenticación exitosa para:', authData.user.email);

      const userInfo = await getUserRole(email.trim());
      
      console.log('✅ Información del usuario:', userInfo);

      if (!userInfo.isActive) {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
      }

      const validRoles = ['cliente', 'admin', 'superadmin'];
      if (!validRoles.includes(userInfo.role)) {
        await supabase.auth.signOut();
        throw new Error('Usuario sin permisos válidos');
      }

      toast.success(`¡Bienvenido! Rol: ${userInfo.role}`);
      
      console.log(`🎯 Redirigiendo usuario con rol: ${userInfo.role} desde ${userInfo.source}`);
      
      if (userInfo.role === 'cliente') {
        navigate('/dashboard/cliente', { replace: true });
      } else if (userInfo.role === 'admin' || userInfo.role === 'superadmin') {
        navigate('/dashboard/admin', { replace: true });
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
    <div className="h-screen flex overflow-hidden">
      {/* Panel izquierdo - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradiente de fondo animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          {/* Patrón decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
          </div>
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-8 text-white max-w-xl mx-auto">
          {/* Logo y título */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-105 transition-transform">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2 leading-tight">
              B&C Consultores
            </h1>
            <p className="text-xl text-blue-100 font-light">
              Sistema de Protección Civil
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">
                Gestión Integral de Documentos
              </h2>
              <p className="text-base text-blue-100 leading-relaxed">
                Plataforma especializada en el manejo y validación de documentación 
                para cumplimiento de normativas de Protección Civil.
              </p>
            </div>

            {/* Características */}
            <div className="space-y-3">
              {[
                'Códigos QR únicos para cada documento',
                'Alertas automáticas de vencimiento',
                'Validación sin autenticación'
              ].map((feature, index) => (
                <div key={index} className="flex items-center group">
                  <div className="w-7 h-7 rounded-full bg-blue-500 bg-opacity-30 flex items-center justify-center mr-3 group-hover:bg-opacity-50 transition-all">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-base">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badge de seguridad */}
          <div className="mt-8 inline-flex items-center px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-full border border-white border-opacity-20">
            <Lock className="w-4 h-4 mr-2" />
            <span className="text-sm">Plataforma segura y certificada</span>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Logo móvil */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Card del formulario */}
          <div className="bg-white rounded-3xl shadow-2xl p-7 md:p-8">
            {/* Encabezado */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-gray-600 text-sm">
                Accede a tu cuenta de forma segura
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center group mt-6"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 pt-5 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <span className="font-semibold text-gray-900">
                  Contacta al administrador
                </span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            © 2025 B&C Consultores. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;