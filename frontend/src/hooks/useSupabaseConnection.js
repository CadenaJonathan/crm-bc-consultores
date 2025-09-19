import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useSupabaseConnection = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const lastPingRef = useRef(Date.now());
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  const PING_INTERVAL = 30000; // 30 segundos
  const RECONNECT_DELAY = 2000; // 2 segundos

  // Función para verificar conexión
  const pingConnection = useCallback(async () => {
    try {
      console.log('🏓 Verificando conexión Supabase...');
      
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .limit(1)
        .single();

      // Si no hay error O hay un error que no es de conexión
      if (!error || error.code === 'PGRST116') { // PGRST116 = no rows found (pero conectado)
        if (!isConnected) {
          console.log('✅ Conexión Supabase restaurada');
          setIsConnected(true);
          setConnectionError(null);
          setIsReconnecting(false);
          reconnectAttemptsRef.current = 0;
          toast.success('Conexión restaurada', { duration: 2000 });
        }
        lastPingRef.current = Date.now();
        return true;
      } else {
        throw error;
      }
    } catch (error) {
      console.error('❌ Error en ping de conexión:', error);
      
      if (isConnected) {
        console.log('🔴 Conexión perdida');
        setIsConnected(false);
        setConnectionError(error.message);
        toast.error('Conexión perdida', { duration: 3000 });
      }
      
      return false;
    }
  }, [isConnected]);

  // Función para intentar reconectar
  const attemptReconnect = useCallback(async () => {
    if (isReconnecting || reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    setIsReconnecting(true);
    reconnectAttemptsRef.current += 1;

    console.log(`🔄 Intento de reconexión ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);

    try {
      // Intentar refrescar la sesión
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.log('⚠️ Error refrescando sesión:', refreshError);
      }

      // Verificar conexión
      const connected = await pingConnection();
      
      if (!connected) {
        // Si aún no está conectado, programar siguiente intento
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1); // Backoff exponencial
          console.log(`⏱️ Siguiente intento en ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            attemptReconnect();
          }, delay);
        } else {
          console.log('🚫 Máximo número de intentos alcanzado');
          setIsReconnecting(false);
          toast.error('No se pudo restaurar la conexión. Recarga la página.', { 
            duration: 5000 
          });
        }
      }
    } catch (error) {
      console.error('❌ Error en reconexión:', error);
      setIsReconnecting(false);
      
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        toast.error('Error de conexión. Recarga la página.', { duration: 5000 });
      }
    }
  }, [isReconnecting, pingConnection]);

  // Función para reiniciar el estado de conexión
  const resetConnection = useCallback(() => {
    console.log('🔄 Reiniciando estado de conexión');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    reconnectAttemptsRef.current = 0;
    setIsReconnecting(false);
    setConnectionError(null);
    setIsConnected(true);
    
    // Ping inmediato
    pingConnection();
  }, [pingConnection]);

  // Función para forzar verificación manual
  const checkConnection = useCallback(() => {
    console.log('🔍 Verificación manual de conexión');
    pingConnection();
  }, [pingConnection]);

  // Manejar cambios de visibilidad
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Página visible, verificando conexión...');
        
        // Si han pasado más de 1 minuto desde el último ping, verificar
        const timeSinceLastPing = Date.now() - lastPingRef.current;
        if (timeSinceLastPing > 60000) {
          setTimeout(checkConnection, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkConnection]);

  // Manejar eventos de red
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Navegador reporta: ONLINE');
      setTimeout(resetConnection, 1000);
    };

    const handleOffline = () => {
      console.log('📴 Navegador reporta: OFFLINE');
      setIsConnected(false);
      setConnectionError('Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [resetConnection]);

  // Ping periódico cuando está activo
  useEffect(() => {
    let pingInterval;

    const startPinging = () => {
      pingInterval = setInterval(() => {
        if (!document.hidden && isConnected) {
          pingConnection();
        }
      }, PING_INTERVAL);
    };

    // Iniciar ping inicial después de 5 segundos
    const initialDelay = setTimeout(() => {
      pingConnection();
      startPinging();
    }, 5000);

    return () => {
      clearTimeout(initialDelay);
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };
  }, [pingConnection, isConnected]);

  // Iniciar reconexión automática cuando se pierde conexión
  useEffect(() => {
    if (!isConnected && !isReconnecting) {
      console.log('🔄 Iniciando proceso de reconexión automática');
      setTimeout(attemptReconnect, 1000);
    }
  }, [isConnected, isReconnecting, attemptReconnect]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 Limpiando useSupabaseConnection...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    isReconnecting,
    connectionError,
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    checkConnection,
    resetConnection,
    pingConnection
  };
};