import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser, getUserRole } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Verificar usuario inicial
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          const role = await getUserRole(currentUser.id)
          setUserRole(role)
        }
      } catch (error) {
        console.error('Error inicializando auth:', error)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email)
        
        if (session?.user) {
          setUser(session.user)
          try {
            const role = await getUserRole(session.user.id)
            setUserRole(role)
          } catch (error) {
            console.error('Error obteniendo rol:', error)
            setUserRole('cliente') // rol por defecto
          }
        } else {
          setUser(null)
          setUserRole(null)
        }
        
        if (initialized) {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [initialized])

  // Función de login
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        throw error
      }

      toast.success('¡Bienvenido de vuelta!')
      return { user: data.user, error: null }
    } catch (error) {
      const message = error.message === 'Invalid login credentials' 
        ? 'Credenciales incorrectas'
        : error.message
      toast.error(message)
      return { user: null, error: message }
    } finally {
      setLoading(false)
    }
  }

  // Función de registro
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        throw error
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Revisa tu email para confirmar tu cuenta')
      } else {
        toast.success('¡Cuenta creada exitosamente!')
      }

      return { user: data.user, error: null }
    } catch (error) {
      toast.error(error.message)
      return { user: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Función de logout
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      setUser(null)
      setUserRole(null)
      toast.success('Sesión cerrada')
    } catch (error) {
      toast.error('Error al cerrar sesión')
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para resetear password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )

      if (error) {
        throw error
      }

      toast.success('Revisa tu email para resetear tu contraseña')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error: error.message }
    }
  }

  // Función para actualizar password
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      toast.success('Contraseña actualizada exitosamente')
      return { error: null }
    } catch (error) {
      toast.error(error.message)
      return { error: error.message }
    }
  }

  // Verificar permisos por rol
  const hasPermission = (requiredRole) => {
    if (!userRole) return false
    
    const roleHierarchy = {
      'superadmin': 3,
      'admin': 2,
      'cliente': 1
    }
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  // Verificar si es admin o superadmin
  const isAdmin = () => {
    return userRole === 'admin' || userRole === 'superadmin'
  }

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    hasPermission,
    isAdmin,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}