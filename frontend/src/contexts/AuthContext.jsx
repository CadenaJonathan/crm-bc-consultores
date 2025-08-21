// contexts/AuthContext.jsx - ACTUALIZADO
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Función para obtener el rol del usuario desde ambas tablas
const getUserRole = async (userEmail) => {
  console.log('🔍 Buscando rol para:', userEmail);
  
  try {
    // 1. PRIMERO: Buscar en tabla public.users (admins/superadmins)
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role, email')
      .eq('email', userEmail)
      .single();

    if (!adminError && adminUser) {
      console.log('✅ Usuario admin encontrado:', adminUser);
      return {
        role: adminUser.role,
        isActive: true,
        source: 'public'
      };
    }

    console.log('❌ No encontrado en public.users, es cliente por defecto');

    // 2. Si no está en public.users, es cliente por defecto
    return {
      role: 'cliente',
      isActive: true,
      source: 'auth'
    };

  } catch (error) {
    console.error('❌ Error obteniendo rol:', error);
    return {
      role: 'cliente',
      isActive: true,
      source: 'auth'
    };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para verificar permisos
  const hasPermission = (requiredRole) => {
    if (!userRole) return false;
    
    // Si requiredRole es un array, verificar si el userRole está incluido
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    // Lógica de permisos jerárquicos
    const roleHierarchy = {
      'cliente': ['cliente'],
      'admin': ['cliente', 'admin'],
      'superadmin': ['cliente', 'admin', 'superadmin']
    };
    
    const userPermissions = roleHierarchy[userRole] || [];
    return userPermissions.includes(requiredRole);
  };

  // Verificar sesión actual
  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error obteniendo sesión:', error);
          setUser(null);
          setUserRole(null);
          return;
        }

        if (session?.user) {
          console.log('✅ Sesión activa para:', session.user.email);
          
          // Obtener rol del usuario
          const userInfo = await getUserRole(session.user.email);
          
          setUser(session.user.email);
          setUserRole(userInfo.role);
          
          console.log('✅ Usuario autenticado:', {
            email: session.user.email,
            role: userInfo.role,
            source: userInfo.source
          });
        } else {
          console.log('❌ No hay sesión activa');
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ Error en getSession:', error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Cambio de auth state:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuario conectado:', session.user.email);
          
          const userInfo = await getUserRole(session.user.email);
          
          setUser(session.user.email);
          setUserRole(userInfo.role);
          
          console.log('✅ Rol asignado:', userInfo.role);
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ Usuario desconectado');
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // FUNCIÓN DE LOGOUT MEJORADA EN AuthContext.jsx


const logout = async () => {
  try {
    console.log('🔄 AuthContext: Iniciando logout...');
    
    // Promesa con timeout
    const logoutPromise = supabase.auth.signOut();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Logout timeout')), 3000)
    );
    
    // Race entre logout y timeout
    await Promise.race([logoutPromise, timeoutPromise]);
    
    console.log('✅ AuthContext: Logout de Supabase exitoso');
    
    // Limpiar estado local inmediatamente
    setUser(null);
    setUserRole(null);
    
    // Limpiar storage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('✅ AuthContext: Estado limpiado');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ AuthContext: Error en logout:', error);
    
    // Aunque falle Supabase, limpiar estado local
    setUser(null);
    setUserRole(null);
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('🚨 AuthContext: Logout forzado por error');
    
    // Aún retornar success porque el usuario quedará deslogueado
    return { success: true, error };
  }
};

  const value = {
    user,
    userRole,
    loading,
    isAuthenticated: !!user,
    hasPermission,
    logout
  };

  // Debug: Mostrar estado actual
  console.log('🎛️ AuthContext state:', {
    user,
    userRole,
    loading,
    isAuthenticated: !!user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};