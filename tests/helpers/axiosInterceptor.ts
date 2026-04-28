import { vi } from 'vitest'

/**
 * Mocks the modules used by the axios interceptor under test (tokenService,
 * currentUser store, router, axios). Must be called at the top of the test
 * file's module scope so that Vitest hoists the `vi.mock` registrations
 * before any production code is imported.
 *
 * The captured interceptor callbacks live on the returned `harness` object;
 * they are populated when `setupAxiosInterceptors()` runs in the test's
 * `beforeEach`.
 */
export interface AxiosInterceptorHarness {
  requestInterceptor: Function
  requestErrorInterceptor: Function
  responseInterceptor: Function
  responseErrorInterceptor: Function
}

const harness: AxiosInterceptorHarness = {
  requestInterceptor: () => {},
  requestErrorInterceptor: () => {},
  responseInterceptor: () => {},
  responseErrorInterceptor: () => {}
}

vi.mock('../../src/services/auth/tokenService', () => ({
  tokenService: {
    getAccessToken: vi.fn(),
    hasValidToken: vi.fn()
  }
}))

vi.mock('../../src/stores/currentUser', () => ({
  useCurrentUserStore: vi.fn(() => ({
    autoLogout: vi.fn()
  }))
}))

vi.mock('../../src/router', () => ({
  default: {
    push: vi.fn(),
    currentRoute: { value: { name: 'Home', fullPath: '/home' } }
  }
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: '', headers: { common: {} }, timeout: 30000 },
    interceptors: {
      request: {
        use: vi.fn((onFulfilled: Function, onRejected: Function) => {
          harness.requestInterceptor = onFulfilled
          harness.requestErrorInterceptor = onRejected
        }),
        eject: vi.fn()
      },
      response: {
        use: vi.fn((onFulfilled: Function, onRejected: Function) => {
          harness.responseInterceptor = onFulfilled
          harness.responseErrorInterceptor = onRejected
        }),
        eject: vi.fn()
      }
    }
  }
}))

/**
 * Returns the harness object holding the captured interceptor callbacks.
 * Callers must invoke `setupAxiosInterceptors()` (in `beforeEach`) so the
 * mocked axios records the callbacks into this object.
 */
export function getAxiosInterceptorHarness(): AxiosInterceptorHarness {
  return harness
}
