import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // FILTROS SIN useEffect AUTOMÁTICO
  const [filters, setFilters] = useState({
    municipality: '',
    status: '',
    riskLevel: '',
    search: ''
  });

  // Referencias para control de estado
  const isFetchingRef = useRef(false);
  const lastFetchRef = useRef(0);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(null);
  
  const CACHE_DURATION = 60000; // 1 minuto
  const THROTTLE_TIME = 1000; // REDUCIDO a 1 segundo (era 3000)

  // Función principal de carga - SIN dependencias de filtros
  const fetchClients = useCallback(async (forceRefresh = false) => {
    // Verificar caché
    if (!forceRefresh && cacheRef.current) {
      const cacheAge = Date.now() - cacheRef.current.timestamp;
      if (cacheAge < CACHE_DURATION) {
        console.log('📦 Usando clientes en caché');
        setClients(cacheRef.current.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Evitar múltiples llamadas
    if (isFetchingRef.current) {
      console.log('⚠️ Ya hay carga de clientes en proceso');
      return;
    }

    // Throttling REDUCIDO
    const now = Date.now();
    if (now - lastFetchRef.current < THROTTLE_TIME && !forceRefresh) {
      console.log('⚠️ Carga de clientes muy frecuente, saltando... (esperando', THROTTLE_TIME, 'ms)');
      return;
    }

    try {
      isFetchingRef.current = true;
      lastFetchRef.current = now;
      
      setLoading(true);
      setError(null);
      console.log('📊 Cargando clientes...');

      // Cancelar request anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Verificar sesión
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error('Sesión inválida. Recarga la página.');
      }

      // Query simple SIN filtros aplicados en la base de datos
      const queryPromise = supabase
        .from('clients')
        .select(`
          id,
          name,
          commercial_name,
          rfc,
          email,
          phone,
          physical_address,
          municipality,
          business_type,
          business_subtype,
          risk_level,
          status,
          client_code,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(200) // Limitar para mejor performance
        .abortSignal(signal);

      // Timeout MÁS CORTO - 5 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de carga de clientes (5s)')), 5000);
      });

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      if (signal.aborted) {
        console.log('🚫 Carga de clientes cancelada');
        return;
      }

      if (error) throw error;

      console.log('✅ Clientes cargados:', data?.length || 0);
      
      // Guardar en caché
      cacheRef.current = {
        data: data || [],
        timestamp: Date.now()
      };

      setClients(data || []);
      setError(null);

    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log('🚫 Carga cancelada');
        return;
      }

      console.error('❌ Error cargando clientes:', error);
      setError(error.message);
      
      // Fallback a caché si existe
      if (cacheRef.current) {
        console.log('📦 Usando caché como fallback');
        setClients(cacheRef.current.data);
      } else {
        setClients([]);
      }
      
      toast.error(`Error al cargar clientes: ${error.message}`);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, []); // SIN DEPENDENCIAS

  // Aplicar filtros EN EL FRONTEND (no nueva query)
  const filteredClients = clients.filter(client => {
    if (filters.municipality && client.municipality !== filters.municipality) return false;
    if (filters.status && client.status !== filters.status) return false;
    if (filters.riskLevel && client.risk_level !== filters.riskLevel) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = client.name?.toLowerCase().includes(searchLower);
      const commercialNameMatch = client.commercial_name?.toLowerCase().includes(searchLower);
      const rfcMatch = client.rfc?.toLowerCase().includes(searchLower);
      if (!nameMatch && !commercialNameMatch && !rfcMatch) return false;
    }
    return true;
  });

  // CRUD Operations
  const createClient = async (clientData) => {
    try {
      console.log('➕ Creando cliente:', clientData);

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setClients(prev => [data, ...prev]);
      
      // Actualizar caché
      if (cacheRef.current) {
        cacheRef.current.data = [data, ...cacheRef.current.data];
        cacheRef.current.timestamp = Date.now(); // Actualizar timestamp
      }
      
      toast.success(`Cliente "${data.name}" creado exitosamente`);
      console.log('✅ Cliente creado:', data);
      
      return { success: true, data };

    } catch (error) {
      console.error('❌ Error creando cliente:', error);
      toast.error(`Error al crear cliente: ${error.message}`);
      return { success: false, error };
    }
  };

  const updateClient = async (clientId, clientData) => {
    try {
      console.log('✏️ Actualizando cliente:', clientId, clientData);

      const { data, error } = await supabase
        .from('clients')
        .update({
          ...clientData,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setClients(prev => prev.map(client => 
        client.id === clientId ? data : client
      ));

      // Actualizar caché
      if (cacheRef.current) {
        cacheRef.current.data = cacheRef.current.data.map(client =>
          client.id === clientId ? data : client
        );
        cacheRef.current.timestamp = Date.now(); // Actualizar timestamp
      }

      toast.success(`Cliente "${data.name}" actualizado exitosamente`);
      console.log('✅ Cliente actualizado:', data);
      
      return { success: true, data };

    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
      toast.error(`Error al actualizar cliente: ${error.message}`);
      return { success: false, error };
    }
  };

  const deleteClient = async (clientId) => {
    try {
      console.log('🗑️ Eliminando cliente:', clientId);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      // Actualizar estado local
      setClients(prev => prev.filter(client => client.id !== clientId));

      // Actualizar caché
      if (cacheRef.current) {
        cacheRef.current.data = cacheRef.current.data.filter(
          client => client.id !== clientId
        );
        cacheRef.current.timestamp = Date.now(); // Actualizar timestamp
      }

      toast.success('Cliente eliminado exitosamente');
      console.log('✅ Cliente eliminado:', clientId);
      
      return { success: true };

    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      toast.error(`Error al eliminar cliente: ${error.message}`);
      return { success: false, error };
    }
  };

  // Funciones de filtro - NO triggean nueva consulta
  const updateFilters = useCallback((newFilters) => {
    console.log('🔍 Actualizando filtros:', newFilters);
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const clearFilters = useCallback(() => {
    console.log('🧹 Limpiando filtros');
    setFilters({
      municipality: '',
      status: '',
      riskLevel: '',
      search: ''
    });
  }, []);

  // Función de refresco manual - RESET del throttling
  const refreshClients = useCallback(() => {
    console.log('🔄 Refresco manual de clientes - reseteando throttling');
    lastFetchRef.current = 0; // RESET del throttling
    fetchClients(true);
  }, [fetchClients]);

  // Manejar visibilidad de página - RESET del throttling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && cacheRef.current) {
        const cacheAge = Date.now() - cacheRef.current.timestamp;
        if (cacheAge > CACHE_DURATION) {
          console.log('👁️ Página visible, refrescando clientes...');
          setTimeout(() => {
            lastFetchRef.current = 0; // RESET throttling
            fetchClients(true);
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchClients]);

  // Efecto principal - SOLO al montar
  useEffect(() => {
    console.log('🚀 useClients montado');
    
    // Delay inicial para evitar conflictos
    const initTimeout = setTimeout(() => {
      fetchClients(false);
    }, 200); // Delay más largo que useDashboardStats

    // Cleanup
    return () => {
      console.log('🧹 useClients limpiando...');
      clearTimeout(initTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isFetchingRef.current = false;
    };
  }, []); // SIN DEPENDENCIAS

  // Opciones para filtros
  const municipalities = [
    'San Juan del Río',
    'El Marqués', 
    'Querétaro',
    'Tequisquiapan',
    'Corregidora',
    'Cadereyta de Montes',
    'Colón',
    'Ezequiel Montes',
    'Pedro Escobedo',
    'Amealco de Bonfil',
    'Arroyo Seco',
    'Huimilpan',
    'Jalpan de Serra',
    'Landa de Matamoros',
    'Peñamiller',
    'Pinal de Amoles',
    'San Joaquín',
    'Tolimán'
  ];

  const businessTypes = [
    'educativo',
    'industrial', 
    'turistico_hospedaje_alimentos',
    'comercial',
    'hidrocarburos',
    'medico_hospitalario',
    'rehabilitacion_adicciones',
    'construccion',
    'servicios_generales'
  ];

  const riskLevels = ['bajo', 'medio', 'alto'];
  const statusOptions = ['active', 'inactive', 'suspended'];

  return {
    clients: filteredClients, // Ya filtrados en el frontend
    allClients: clients, // Todos los clientes sin filtrar
    loading,
    error,
    filters,
    municipalities,
    businessTypes,
    riskLevels,
    statusOptions,
    createClient,
    updateClient,
    deleteClient,
    updateFilters,
    clearFilters,
    refreshClients,
    totalClients: clients.length,
    filteredCount: filteredClients.length
  };
};