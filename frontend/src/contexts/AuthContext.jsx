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
        console.log('🔐 Inicializando autenticación...')
        const currentUser = await getCurrentUser()
        console.log('👤 Usuario actual:', currentUser?.email || 'No autenticado')
        
        setUser(currentUser)
        
        if (currentUser) {
          console.log('🔍 Obteniendo rol de usuario...')
          const role = await getUserRole(currentUser.id)
          console.log('👔 Rol obtenido:', role)
          setUserRole(role)
        }
      } catch (error) {
        console.error('❌ Error inicializando auth:', error)
      } finally {
        setLoading(false)
        setInitialized(true)
        console.log('✅ Autenticación inicializada')
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth event:', event, session?.user?.email || 'No session')
        
        if (session?.user) {
          setUser(session.user)
          try {
            const role = await getUserRole(session.user.id)
            setUserRole(role)
            console.log('✅ Usuario autenticado:', session.user.email, 'Rol:', role)
          } catch (error) {
            console.error('❌ Error obteniendo rol:', error)
            setUserRole('cliente') // rol por defecto
          }
        } else {
          setUser(null)
          setUserRole(null)
          console.log('🚪 Usuario desautenticado')
        }
        
        if (initialized) {
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('🧹 Limpiando subscription de auth')
      subscription?.unsubscribe()
    }
  }, [initialized])

  // Función de login
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      console.log('🔐 Intentando login para:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        console.error('❌ Error de login:', error)
        throw error
      }

      console.log('✅ Login exitoso:', data.user.email)
      toast.success('¡Bienvenido de vuelta!')
      return { user: data.user, error: null }
    } catch (error) {
      console.error('❌ Login falló:', error)
      let message = 'Error al iniciar sesión'
      
      if (error.message === 'Invalid login credentials') {
        message = 'Credenciales incorrectas'
      } else if (error.message === 'Email not confirmed') {
        message = 'Por favor confirma tu email'
      } else if (error.message) {
        message = error.message
      }
      
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
      console.log('📝 Intentando registro para:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        console.error('❌ Error de registro:', error)
        throw error
      }

      console.log('✅ Registro exitoso:', data.user?.email)
      
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Revisa tu email para confirmar tu cuenta')
      } else {
        toast.success('¡Cuenta creada exitosamente!')
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('❌ Registro falló:', error)
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
      console.log('🚪 Cerrando sesión...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Error cerrando sesión:', error)
        throw error
      }

      setUser(null)
      setUserRole(null)
      console.log('✅ Sesión cerrada exitosamente')
      toast.success('Sesión cerrada')
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error)
      toast.error('Error al cerrar sesión')
    } finally {
      setLoading(false)
    }
  }

  // Función para resetear password
  const resetPassword = async (email) => {
    try {
      console.log('🔐 Enviando reset de password para:', email)
      
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
      console.error('❌ Error reset password:', error)
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
    hasPermission,
    isAdmin,
    isAuthenticated: !!user,
  }

  console.log('🎛️ AuthContext state:', {
    user: user?.email || 'No user',
    userRole,
    loading,
    isAuthenticated: !!user
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}