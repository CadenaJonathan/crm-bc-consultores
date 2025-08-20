
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      cacheTime: 1000 * 60 * 10, // 10 minutos
      retry: (failureCount, error) => {
        // No reintentar en errores de autenticación
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Reintentar máximo 2 veces para otros errores
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
})