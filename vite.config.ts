/// <reference types="vitest" />
import { defineConfig, defaultAllowedOrigins } from 'vite'
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
    // A machine's Debian mirror can be asked cross-origin, as production asks
    // its own hostname (VITE_LOCAL_MACHINE_MIRROR_URL=http://127.0.0.1:<port>
    // while the app runs on localhost): the tab reads these back.
    cors: {
      origin: defaultAllowedOrigins,
      exposedHeaders: ['Content-Range', 'Content-Length', 'Content-Encoding', 'ETag', 'Last-Modified', 'Accept-Ranges']
    },
    // As nginx.conf: a cross-origin isolated page, so a machine in the
    // learner's browser can run on several CPUs (shared memory).
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    },
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
      },
      // Debian packages for a machine in the learner's browser, as nginx.conf
      // serves them in production: ocf-core says first whether that machine
      // may (its run open, its tab connected with that key, the switch on). No cache here.
      '/local-machine/apt': {
        target: 'http://deb.debian.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local-machine\/apt\/[^/]+\/[^/]+/, ''),
        bypass: async (req, res) => {
          const [, machine, key] = /^\/local-machine\/apt\/(local-[0-9a-f-]+)\/([0-9a-f-]{36})\/debian(-security)?\/[A-Za-z0-9._~+/-]+$/.exec(req.url || '') ?? []
          const core = process.env.VITE_E2E_PROXY_TARGET || 'http://localhost:8080'
          const access = machine
            ? await fetch(`${core}/api/v1/local-machines/mirror-access`, { headers: { 'X-Local-Machine': machine, 'X-Local-Machine-Key': key } }).catch(() => null)
            : null
          if (access?.status === 204) return undefined
          res!.statusCode = 403
          res!.end()
          return false
        }
      },
      // General API proxy so the dev server can serve the app same-origin
      // (VITE_API_URL pointing at the dev server itself). Unused in the
      // default setup, where the app calls ocf-core's absolute URL directly;
      // E2E runs on a secondary port rely on it to sidestep ocf-core's CORS
      // allowlist. VITE_E2E_PROXY_TARGET names the real backend.
      '/api/v1': {
        target: process.env.VITE_E2E_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        // ocf-core's WebSocket upgrader (terminal console) checks the Origin
        // header against its FRONTEND allowlist (localhost:4000 in dev);
        // changeOrigin only rewrites Host. Rewrite Origin on the upgrade
        // request to an allowlisted frontend origin, or the console handshake
        // is rejected with 403 from any non-allowlisted port.
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq) => {
            proxyReq.setHeader(
              'origin',
              process.env.VITE_E2E_WS_ORIGIN || 'http://localhost:4000'
            )
          })
        }
      }
    }
  },
  test: {
    environment: 'happy-dom',
    // Worker threads start cheaper than forked processes (~10% less CPU here).
    pool: 'threads',
    // Console output of passing tests is noise (~450 KB per CI log); failures keep theirs.
    silent: 'passed-only',
    // Unmounts every wrapper after its test — see tests/setup.ts for why.
    setupFiles: ['tests/setup.ts'],
    // CSS is stubbed to '' in tests; the design system audit page reads its token list from this file.
    css: { include: [/variables\.css/] },
    // Spread into every vi.useFakeTimers() call. vitest does not fake
    // `performance` by default, so vue-i18n's message compiler compared a
    // faked Date against a real performance.now(), derived a negative
    // timestamp and threw inside every t() — useTranslations' wrapT then
    // returned the key, which looked like a missing translation. The list is
    // vitest's own default (everything but nextTick and queueMicrotask) plus
    // `performance`, so no test loses a timer it relied on.
    fakeTimers: {
      toFake: [
        'setTimeout', 'clearTimeout', 'setImmediate', 'clearImmediate',
        'setInterval', 'clearInterval', 'Date', 'performance', 'hrtime',
        'requestAnimationFrame', 'cancelAnimationFrame',
        'requestIdleCallback', 'cancelIdleCallback',
      ],
    },
    include: ['tests/**/*.test.ts'],
    // The CI runner host is shared with several dind stacks; a mocked-axios
    // test that takes 5 ms locally has timed out at vitest's 5 s default there.
    testTimeout: 15_000,
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
