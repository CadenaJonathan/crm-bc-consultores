// Hook para gestión de clientes - CRUD completo

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    municipality: '',
    status: '',
    riskLevel: '',
    search: ''
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClients();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    fetchClients();
  }, [filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('📊 Cargando clientes con filtros:', filters);

      let query = supabase
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
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.municipality) {
        query = query.eq('municipality', filters.municipality);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }

      // Filtro de búsqueda por texto
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,commercial_name.ilike.%${filters.search}%,rfc.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setClients(data || []);
      setError(null);
      
      console.log('✅ Clientes cargados:', data?.length || 0);

    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
      setError(error.message);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

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

      // Actualizar lista local
      setClients(prev => [data, ...prev]);
      
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

      // Actualizar lista local
      setClients(prev => prev.map(client => 
        client.id === clientId ? data : client
      ));

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

      // Actualizar lista local
      setClients(prev => prev.filter(client => client.id !== clientId));

      toast.success('Cliente eliminado exitosamente');
      console.log('✅ Cliente eliminado:', clientId);
      
      return { success: true };

    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
      toast.error(`Error al eliminar cliente: ${error.message}`);
      return { success: false, error };
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const clearFilters = () => {
    setFilters({
      municipality: '',
      status: '',
      riskLevel: '',
      search: ''
    });
  };

  const refreshClients = () => {
    fetchClients();
  };

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
    clients,
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
    totalClients: clients.length
  };
};