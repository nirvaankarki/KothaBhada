import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), preact()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001', // Proxy API requests to backend server
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
