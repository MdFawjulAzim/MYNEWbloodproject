import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/v1': {
        // <-- CHANGED
        target: 'http://localhost:2020', // Change 5000 to your backend's port
        changeOrigin: true,
        secure: false, // This is fine, doesn't matter for http
      }
    }
  }
})