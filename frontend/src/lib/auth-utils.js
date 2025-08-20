// Función para limpiar sesión completamente
export const clearAuthData = () => {
  try {
    // Limpiar localStorage
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key)
      }
    })
    
    // Limpiar sessionStorage
    sessionStorage.clear()
    
    // Recargar página
    window.location.href = '/login'
  } catch (error) {
    console.error('Error clearing auth data:', error)
    window.location.reload()
  }
}