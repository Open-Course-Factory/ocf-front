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
      // Proxy Incus UI iframe requests to ocf-core so cookies and iframe
      // requests stay same-origin. VITE_INCUS_PROXY_TARGET allows using
      // a K8s-internal URL (e.g., http://ocf-core:8080) in production
      // instead of going through the public load balancer.
      '/api/v1/incus-ui': {
        target: process.env.VITE_INCUS_PROXY_TARGET
          || `http://${process.env.VITE_API_URL || 'localhost:8080'}`,
        changeOrigin: true,
        ws: true
      }
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    // Emit a JUnit XML report so GitLab CI can parse it via
    // `artifacts.reports.junit` and surface results in the pipeline Test tab.
    // The default reporter is kept for human-readable console output.
    // `addFileAttribute: true` adds `<testcase file="...">` which GitLab uses
    // to group tests by file in the pipeline Test tab.
    reporters: [
      'default',
      ['junit', { outputFile: 'reports/junit.xml', addFileAttribute: true }],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    }
  }
})
