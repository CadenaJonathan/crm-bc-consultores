import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalDocuments: 0,
    approvedDocuments: 0,
    pendingDocuments: 0,
    expiredDocuments: 0,
    documentsExpiringSoon: 0,
    loading: true,
    error: null
  });

  const [recentActivity, setRecentActivity] = useState([]);
  
  // Referencias para evitar múltiples llamadas
  const isFetchingRef = useRef(false);
  const lastFetchRef = useRef(0);
  const abortControllerRef = useRef(null);
  
  // Caché simple en memoria
  const cacheRef = useRef(null);
  const CACHE_DURATION = 30000; // 30 segundos
  const THROTTLE_TIME = 1000; // REDUCIDO a 1 segundo (era 2000)

  const fetchDashboardStats = useCallback(async (forceRefresh = false) => {
    // Verificar caché si no es forzado
    if (!forceRefresh && cacheRef.current) {
      const cacheAge = Date.now() - cacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        console.log('📦 Usando datos en caché');
        setStats(cacheRef.current.stats);
        setRecentActivity(cacheRef.current.activity);
        return;
      }
    }

    // Evitar llamadas múltiples
    if (isFetchingRef.current) {
      console.log('⚠️ Ya hay una consulta en proceso, saltando...');
      return;
    }

    // Throttling REDUCIDO - evitar llamadas muy frecuentes
    const now = Date.now();
    if (now - lastFetchRef.current < THROTTLE_TIME && !forceRefresh) {
      console.log('⚠️ Consulta muy frecuente, saltando... (esperando', THROTTLE_TIME, 'ms)');
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchRef.current = now;
      
      console.log('📊 Iniciando carga de estadísticas...', { forceRefresh });
      
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Cancelar request anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Verificar conexión primero
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error('Sesión inválida. Recarga la página.');
      }

      // CONSULTAS OPTIMIZADAS CON ABORT SIGNAL Y TIMEOUT MÁS CORTO
      const queryPromise = Promise.all([
        supabase
          .from('clients')
          .select('id, status, created_at, name', { count: 'exact' })
          .limit(50)
          .abortSignal(signal),
        
        supabase
          .from('documents')
          .select('id, status, created_at, name, valid_until', { count: 'exact' })
          .limit(50)
          .abortSignal(signal)
      ]);

      // Timeout MÁS CORTO - 6 segundos (era 8)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de consulta (6s)')), 6000);
      });

      const [clientsResult, documentsResult] = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      // Verificar si fue cancelado
      if (signal.aborted) {
        console.log('🚫 Consulta cancelada');
        return;
      }

      if (clientsResult.error) throw new Error(`Clientes: ${clientsResult.error.message}`);
      if (documentsResult.error) throw new Error(`Documentos: ${documentsResult.error.message}`);

      const clientsData = clientsResult.data || [];
      const documentsData = documentsResult.data || [];

      console.log('✅ Datos obtenidos:', {
        clientes: clientsData.length,
        documentos: documentsData.length
      });

      // Calcular estadísticas
      const totalClients = clientsData.length;
      const activeClients = clientsData.filter(c => c.status === 'active').length;
      const totalDocuments = documentsData.length;
      const approvedDocuments = documentsData.filter(d => d.status === 'approved').length;
      const pendingDocuments = documentsData.filter(d => d.status === 'pending').length;
      
      // Calcular documentos que vencen pronto (próximos 30 días)
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);
      
      const documentsExpiringSoon = documentsData.filter(d => {
        if (!d.valid_until || d.status !== 'approved') return false;
        const validUntil = new Date(d.valid_until);
        return validUntil >= today && validUntil <= in30Days;
      }).length;

      const expiredDocuments = documentsData.filter(d => {
        if (!d.valid_until) return false;
        return new Date(d.valid_until) < today;
      }).length;

      const newStats = {
        totalClients,
        activeClients,
        totalDocuments,
        approvedDocuments,
        pendingDocuments,
        expiredDocuments,
        documentsExpiringSoon,
        loading: false,
        error: null
      };

      // Actividad reciente mejorada
      const activity = [
        ...clientsData.slice(0, 2).map(client => ({
          id: `client-${client.id}`,
          message: `Cliente "${client.name}" registrado`,
          time: formatTimeAgo(client.created_at),
          color: 'blue'
        })),
        ...documentsData.slice(0, 2).map(doc => ({
          id: `doc-${doc.id}`,
          message: `Documento "${doc.name}" ${doc.status === 'approved' ? 'aprobado' : 'pendiente'}`,
          time: formatTimeAgo(doc.created_at),
          color: doc.status === 'approved' ? 'green' : 'yellow'
        }))
      ].slice(0, 5);

      // Guardar en caché
      cacheRef.current = {
        stats: newStats,
        activity,
        timestamp: Date.now()
      };

      setStats(newStats);
      setRecentActivity(activity);

      console.log('✅ Estadísticas actualizadas exitosamente');

    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log('🚫 Consulta cancelada por el usuario');
        return;
      }

      console.error('❌ Error obteniendo estadísticas:', error);
      
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      
      // Si hay datos en caché, mostrarlos como fallback
      if (cacheRef.current) {
        console.log('📦 Usando caché como fallback por error');
        setStats(cacheRef.current.stats);
        setRecentActivity(cacheRef.current.activity);
      }
    } finally {
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  // Función para formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Ahora mismo';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffDays < 7) return `Hace ${diffDays}d`;
      return 'Hace más de una semana';
    } catch {
      return 'Recientemente';
    }
  };

  // Función de refresco manual - RESET del throttling
  const refreshStats = useCallback(() => {
    console.log('🔄 Refresco manual solicitado - reseteando throttling');
    lastFetchRef.current = 0; // RESET del throttling para refresh manual
    fetchDashboardStats(true);
  }, [fetchDashboardStats]);

  // Manejar visibilidad de página - RESET del throttling cuando se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Página visible de nuevo, refrescando datos...');
        // RESET del throttling cuando se vuelve visible la página
        setTimeout(() => {
          if (cacheRef.current) {
            const cacheAge = Date.now() - cacheRef.current.timestamp;
            if (cacheAge > CACHE_DURATION) {
              lastFetchRef.current = 0; // RESET throttling
              fetchDashboardStats(true);
            }
          }
        }, 500); // Pequeño delay para evitar conflictos
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchDashboardStats]);

  // Efecto principal - SOLO se ejecuta una vez al montar
  useEffect(() => {
    console.log('🚀 useDashboardStats montado');
    
    // Delay inicial para evitar conflictos con otros hooks
    const initTimeout = setTimeout(() => {
      fetchDashboardStats(false);
    }, 100);

    // Cleanup al desmontar
    return () => {
      console.log('🧹 useDashboardStats limpiando...');
      clearTimeout(initTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isFetchingRef.current = false;
    };
  }, []); // DEPENDENCIAS VACÍAS - solo se ejecuta al montar

  return {
    ...stats,
    recentActivity,
    refreshStats
  };
};