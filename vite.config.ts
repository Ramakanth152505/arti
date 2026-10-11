import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow the container's proxied preview hosts to reach the dev server.
    allowedHosts: true,
  },
})
