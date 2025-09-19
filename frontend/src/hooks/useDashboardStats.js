// Hook corregido para estadísticas del dashboard admin


import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('📊 Obteniendo estadísticas del dashboard...');
      
      // 1. ESTADÍSTICAS DE CLIENTES (usando campos reales)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, status, risk_level, created_at, municipality, business_type, name')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Error obteniendo clientes:', clientsError);
        throw clientsError;
      }

      console.log('✅ Clientes obtenidos:', clientsData?.length || 0);

      // 2. ESTADÍSTICAS DE DOCUMENTOS (usando campos reales)
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, status, valid_until, created_at, client_id, name')
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error obteniendo documentos:', documentsError);
        throw documentsError;
      }

      console.log('✅ Documentos obtenidos:', documentsData?.length || 0);

      // 3. CALCULAR ESTADÍSTICAS
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      // Estadísticas de clientes
      const totalClients = clientsData?.length || 0;
      const activeClients = clientsData?.filter(c => c.status === 'active').length || 0;

      // Estadísticas de documentos
      const totalDocuments = documentsData?.length || 0;
      const approvedDocuments = documentsData?.filter(d => d.status === 'approved').length || 0;
      const pendingDocuments = documentsData?.filter(d => d.status === 'pending').length || 0;
      
      // Documentos vencidos
      const expiredDocuments = documentsData?.filter(d => {
        if (!d.valid_until) return false;
        return new Date(d.valid_until) < now;
      }).length || 0;

      // Documentos que vencen pronto
      const documentsExpiringSoon = documentsData?.filter(d => {
        if (!d.valid_until) return false;
        const expiryDate = new Date(d.valid_until);
        return expiryDate > now && expiryDate <= thirtyDaysFromNow;
      }).length || 0;

      // 4. ACTIVIDAD RECIENTE
      const recentClients = clientsData?.slice(0, 3) || [];
      const recentDocuments = documentsData?.slice(0, 3) || [];
      
      const activity = [
        ...recentClients.map(client => ({
          id: `client-${client.id}`,
          type: 'client_created',
          message: `Cliente "${client.name}" registrado`,
          time: formatRelativeTime(client.created_at),
          icon: 'user',
          color: 'blue'
        })),
        ...recentDocuments.map(doc => ({
          id: `document-${doc.id}`,
          type: 'document_uploaded',
          message: `Documento "${doc.name}" ${doc.status === 'approved' ? 'aprobado' : 'subido'}`,
          time: formatRelativeTime(doc.created_at),
          icon: doc.status === 'approved' ? 'check' : 'upload',
          color: doc.status === 'approved' ? 'green' : 'yellow'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

      // 5. ACTUALIZAR ESTADO
      setStats({
        totalClients,
        activeClients,
        totalDocuments,
        approvedDocuments,
        pendingDocuments,
        expiredDocuments,
        documentsExpiringSoon,
        loading: false,
        error: null
      });

      setRecentActivity(activity);

      console.log('✅ Estadísticas calculadas:', {
        totalClients,
        activeClients,
        totalDocuments,
        approvedDocuments,
        pendingDocuments,
        expiredDocuments,
        documentsExpiringSoon
      });

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error desconocido'
      }));
    }
  };

  // Función auxiliar para formatear tiempo relativo
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Hace un momento';
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Hace ${diffInHours} horas`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `Hace ${diffInDays} días`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  return {
    ...stats,
    recentActivity,
    refreshStats: fetchDashboardStats
  };
};