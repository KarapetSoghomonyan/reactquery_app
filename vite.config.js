import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/currency-converter/', // Replace with your repository name
  server: {
    proxy: {
      // Proxy configuration if needed for API
      '/api': {
        target: 'https://v6.exchangerate-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})