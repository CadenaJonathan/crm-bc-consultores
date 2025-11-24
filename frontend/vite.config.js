import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Asegurar una sola instancia de React
    dedupe: ['react', 'react-dom', '@tanstack/react-query']
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Optimizar chunks
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'recharts'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
    historyApiFallback: true,
  },
  // Optimizaciones para evitar duplicación de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
    ],
  },
})