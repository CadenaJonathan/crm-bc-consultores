// src/hooks/useClientData.js
// ESTE ES DIFERENTE A useClients.js
// Este hook es para el CLIENTE INDIVIDUAL (no para admin)

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

// Hook para estadísticas del cliente
export const useClientStats = () => {
  const [stats, setStats] = useState({
    activeDocuments: 0,
    approvedDocuments: 0,
    expiringDocuments: 0,
    totalEstablishments: 0,
    compliancePercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        
        // Obtener información del cliente actual
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (clientError && clientError.code !== 'PGRST116') throw clientError
        if (!clientData) {
          setStats({
            activeDocuments: 0,
            approvedDocuments: 0,
            expiringDocuments: 0,
            totalEstablishments: 0,
            compliancePercentage: 0
          })
          setLoading(false)
          return
        }

        // Obtener documentos del cliente
        const { data: documents, error: docsError } = await supabase
          .from('documents')
          .select('status, valid_until')
          .eq('client_id', clientData.id)

        if (docsError) console.error('Error fetching documents:', docsError)

        // Obtener establecimientos
        const { data: establishments, error: estError } = await supabase
          .from('establishments')
          .select('id')
          .eq('client_id', clientData.id)

        if (estError) console.error('Error fetching establishments:', estError)

        // Calcular estadísticas
        const documentsList = documents || []
        const establishmentsList = establishments || []
        
        const activeDocuments = documentsList.filter(doc => 
          ['pending', 'approved'].includes(doc.status)
        ).length

        const approvedDocuments = documentsList.filter(doc => 
          doc.status === 'approved'
        ).length

        const today = new Date()
        const in30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
        
        const expiringDocuments = documentsList.filter(doc => 
          doc.status === 'approved' && 
          doc.valid_until && 
          new Date(doc.valid_until) <= in30Days && 
          new Date(doc.valid_until) > today
        ).length

        // Calcular porcentaje de cumplimiento básico
        let compliancePercentage = 0
        try {
          // Intentar usar la función de compliance si existe
          const { data: complianceData, error: complianceError } = await supabase
            .rpc('generate_compliance_report', { p_client_id: clientData.id })

          if (!complianceError && complianceData) {
            compliancePercentage = complianceData.compliance_percentage || 0
          }
        } catch (err) {
          console.log('Compliance function not available, using basic calculation')
          // Cálculo básico si la función no está disponible
          const totalRequired = 5 // Estimación básica
          compliancePercentage = totalRequired > 0 ? (approvedDocuments / totalRequired) * 100 : 0
        }

        setStats({
          activeDocuments,
          approvedDocuments,
          expiringDocuments,
          totalEstablishments: establishmentsList.length,
          compliancePercentage: Math.round(compliancePercentage)
        })

      } catch (error) {
        console.error('Error fetching client stats:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  const refetch = () => {
    setError(null)
    fetchStats()
  }

  return { stats, loading, error, refetch }
}

// Hook para documentos del cliente
export const useClientDocuments = (limit = 10) => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchDocuments = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Obtener ID del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (clientError && clientError.code !== 'PGRST116') throw clientError
      if (!clientData) {
        setDocuments([])
        setLoading(false)
        return
      }

      // Obtener documentos con información del tipo de documento
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_types (
            name,
            description,
            required_fields
          )
        `)
        .eq('client_id', clientData.id)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [user?.id, limit])

  return { documents, loading, error, refetch: fetchDocuments }
}

// Hook para establecimientos del cliente
export const useClientEstablishments = () => {
  const [establishments, setEstablishments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchEstablishments = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Obtener ID del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (clientError && clientError.code !== 'PGRST116') throw clientError
      if (!clientData) {
        setEstablishments([])
        setLoading(false)
        return
      }

      // Obtener establecimientos
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setEstablishments(data || [])
    } catch (error) {
      console.error('Error fetching establishments:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstablishments()
  }, [user?.id])

  return { establishments, loading, error, refetch: fetchEstablishments }
}

// Hook para notificaciones del cliente  
export const useClientNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchNotifications = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Obtener ID del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (clientError && clientError.code !== 'PGRST116') throw clientError
      if (!clientData) {
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        return
      }

      // Obtener notificaciones
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          documents (
            name,
            document_types (
              name
            )
          )
        `)
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const notificationsList = data || []
      setNotifications(notificationsList)
      setUnreadCount(notificationsList.filter(n => !n.read).length)

    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user?.id])

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!clientData) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('client_id', clientData.id)
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  return { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead,
    refetch: fetchNotifications
  }
}

// Hook para el perfil del cliente
export const useClientProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchProfile = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user?.id])

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      toast.success('Perfil actualizado correctamente')
      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar el perfil')
      return { data: null, error: error.message }
    }
  }

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}