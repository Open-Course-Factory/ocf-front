/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

// Read version from VERSION file
const version = fs.readFileSync(path.resolve(__dirname, 'VERSION'), 'utf-8').trim()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(version)
  },
  server: {
    allowedHosts: true,
    proxy: {
      // Proxy Incus UI iframe requests through the dev server so cookies
      // and iframe requests stay same-origin (avoids cross-origin issues
      // between localhost:4000 and localhost:8080 in development).
      '/api/v1/incus-ui': {
        target: `http://${process.env.VITE_API_URL || 'localhost:8080'}`,
        changeOrigin: true,
        ws: true
      }
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    }
  }
})
