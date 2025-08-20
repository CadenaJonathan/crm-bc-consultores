import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Authentication will not work.')
  console.log('Expected:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✅ Found' : '❌ Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ Found' : '❌ Missing'
  })
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Helper para manejar errores de Supabase
export const handleSupabaseError = (error) => {
  if (error?.message) {
    console.error('Supabase Error:', error.message)
    return error.message
  }
  return 'Ha ocurrido un error inesperado'
}

// Helper para validar sesión
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper para obtener el rol del usuario
export const getUserRole = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data?.role || 'cliente'
  } catch (error) {
    console.error('Error getting user role:', error)
    return 'cliente'
  }
}