// contexts/AuthContext.jsx - CORREGIDO SIN LOOPS
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Cache para roles - evitar consultas repetidas
let roleCache = new Map();
let lastCacheClean = Date.now();

// Función para obtener el rol del usuario - CON CACHE
const getUserRole = async (userEmail) => {
  // Limpiar cache cada 10 minutos
  if (Date.now() - lastCacheClean > 600000) {
    roleCache.clear();
    lastCacheClean = Date.now();
  }

  // Verificar cache primero
  if (roleCache.has(userEmail)) {
    console.log('📦 Usando rol en cache para:', userEmail);
    return roleCache.get(userEmail);
  }

  console.log('🔍 Buscando rol para:', userEmail);
  
  try {
    // 1. PRIMERO: Buscar en tabla public.users (admins/superadmins)
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role, email')
      .eq('email', userEmail)
      .single();

    let userInfo;

    if (!adminError && adminUser) {
      console.log('✅ Usuario admin encontrado:', adminUser);
      userInfo = {
        role: adminUser.role,
        isActive: true,
        source: 'public'
      };
    } else {
      console.log('❌ No encontrado en public.users, es cliente por defecto');
      userInfo = {
        role: 'cliente',
        isActive: true,
        source: 'auth'
      };
    }

    // Guardar en cache
    roleCache.set(userEmail, userInfo);
    return userInfo;

  } catch (error) {
    console.error('❌ Error obteniendo rol:', error);
    const fallbackInfo = {
      role: 'cliente',
      isActive: true,
      source: 'auth'
    };
    roleCache.set(userEmail, fallbackInfo);
    return fallbackInfo;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Referencias para evitar loops
  const initRef = useRef(false);
  const processingAuthRef = useRef(false);
  const currentUserRef = useRef(null);

  // Función para verificar permisos
  const hasPermission = (requiredRole) => {
    if (!userRole) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    const roleHierarchy = {
      'cliente': ['cliente'],
      'admin': ['cliente', 'admin'],
      'superadmin': ['cliente', 'admin', 'superadmin']
    };
    
    const userPermissions = roleHierarchy[userRole] || [];
    return userPermissions.includes(requiredRole);
  };

  // Función para procesar usuario autenticado
  const processAuthenticatedUser = async (userEmail) => {
    // Evitar procesamiento múltiple del mismo usuario
    if (processingAuthRef.current || currentUserRef.current === userEmail) {
      console.log('⚠️ Ya procesando usuario o usuario ya procesado:', userEmail);
      return;
    }

    try {
      processingAuthRef.current = true;
      console.log('🔄 Procesando usuario autenticado:', userEmail);

      const userInfo = await getUserRole(userEmail);
      
      setUser(userEmail);
      setUserRole(userInfo.role);
      currentUserRef.current = userEmail;
      
      console.log('✅ Usuario procesado:', {
        email: userEmail,
        role: userInfo.role,
        source: userInfo.source
      });

    } catch (error) {
      console.error('❌ Error procesando usuario:', error);
      setUser(null);
      setUserRole(null);
      currentUserRef.current = null;
    } finally {
      processingAuthRef.current = false;
    }
  };

  // Función para limpiar usuario
  const clearUser = () => {
    console.log('🧹 Limpiando usuario');
    setUser(null);
    setUserRole(null);
    currentUserRef.current = null;
    processingAuthRef.current = false;
  };

  // Verificar sesión inicial - SOLO UNA VEZ
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando AuthContext...');
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión inicial:', error);
          clearUser();
          return;
        }

        if (session?.user?.email) {
          console.log('✅ Sesión inicial encontrada para:', session.user.email);
          await processAuthenticatedUser(session.user.email);
        } else {
          console.log('❌ No hay sesión inicial activa');
          clearUser();
        }

      } catch (error) {
        console.error('❌ Error en inicialización:', error);
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Escuchar cambios de autenticación - CON FILTROS PARA EVITAR LOOPS
  useEffect(() => {
    if (!initRef.current) return;

    console.log('👂 Configurando listener de auth state changes...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
        
        // FILTRAR eventos que pueden causar loops
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refresh ignorado para evitar loops');
          return;
        }

        // Procesar solo eventos importantes
        if (event === 'SIGNED_IN' && session?.user?.email) {
          // Solo procesar si es diferente al usuario actual
          if (currentUserRef.current !== session.user.email) {
            console.log('✅ Nuevo usuario conectado:', session.user.email);
            await processAuthenticatedUser(session.user.email);
          } else {
            console.log('👤 Usuario ya procesado, ignorando SIGNED_IN');
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ Usuario desconectado');
          clearUser();
          roleCache.clear(); // Limpiar cache al logout
        }
      }
    );

    return () => {
      console.log('🧹 Limpiando subscription de auth');
      subscription?.unsubscribe();
    };
  }, []); // Sin dependencias para evitar re-creación

  // Función de logout mejorada
  const logout = async () => {
    try {
      console.log('🔄 AuthContext: Iniciando logout...');
      
      // Limpiar estado local primero
      clearUser();
      roleCache.clear();
      
      // Logout de Supabase con timeout
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout timeout')), 3000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      
      console.log('✅ AuthContext: Logout exitoso');
      
      // Limpiar storage
      localStorage.clear();
      sessionStorage.clear();
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ AuthContext: Error en logout:', error);
      
      // Aún limpiar todo localmente
      clearUser();
      roleCache.clear();
      localStorage.clear();
      sessionStorage.clear();
      
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

  // Debug state - SOLO en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🎛️ AuthContext state:', {
      user,
      userRole,
      loading,
      isAuthenticated: !!user,
      isProcessing: processingAuthRef.current,
      currentUser: currentUserRef.current
    });
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};