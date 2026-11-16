import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ErrorHandlerService,
  errorHandler,
  handleStoreError
} from '../../src/services/core/error/errorHandler'
import {
  ApiError,
  ValidationError,
  NetworkError,
  AuthError,
  HttpStatusCode,
  ErrorSeverity
} from '../../src/types/errors'

describe('ErrorHandlerService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Suppress console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  describe('getInstance', () => {
    it('returns a singleton instance', () => {
      const instance1 = ErrorHandlerService.getInstance()
      const instance2 = ErrorHandlerService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('handleError', () => {
    it('returns the same ApiError when passed an ApiError', () => {
      const original = new ApiError(404, 'Not found')
      const result = errorHandler.handleError(original)

      expect(result).toBe(original)
      expect(result.statusCode).toBe(404)
      expect(result.userMessage).toBe('Not found')
    })

    it('handles native Error objects', () => {
      const nativeError = new Error('Something went wrong')
      const result = errorHandler.handleError(nativeError)

      expect(result).toBeInstanceOf(ApiError)
      expect(result.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expect(result.userMessage).toBe('Something went wrong')
      expect(result.severity).toBe(ErrorSeverity.ERROR)
    })

    it('handles unknown error types with fallback key', () => {
      const result = errorHandler.handleError('string error', {
        fallbackKey: 'custom.fallback'
      })

      expect(result).toBeInstanceOf(ApiError)
      expect(result.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expect(result.userMessage).toBe('custom.fallback')
    })

    it('uses default fallback key when none provided', () => {
      const result = errorHandler.handleError(null)

      expect(result.userMessage).toBe('errors.generic')
    })

    it('passes context through to the ApiError', () => {
      const result = errorHandler.handleError(new Error('test'), {
        context: { userId: '123' }
      })

      expect(result.context).toEqual({ userId: '123' })
    })

    it('does not log when logToConsole is false', () => {
      errorHandler.handleError(new Error('silent'), { logToConsole: false })

      expect(console.error).not.toHaveBeenCalled()
    })

    describe('Axios errors', () => {
      function makeAxiosError(status: number, data: any = {}) {
        return {
          isAxiosError: true,
          response: {
            status,
            data,
            headers: {},
            statusText: 'Error',
            config: {}
          },
          config: {},
          message: `Request failed with status code ${status}`
        }
      }

      it('handles 401 as AuthError', () => {
        const error = makeAxiosError(401, { message: 'Unauthorized' })
        const result = errorHandler.handleError(error)

        expect(result).toBeInstanceOf(AuthError)
        expect(result.statusCode).toBe(401)
        expect(result.userMessage).toBe('Unauthorized')
      })

      it('handles 403 as AuthError', () => {
        const error = makeAxiosError(403, { error_message: 'Access denied' })
        const result = errorHandler.handleError(error)

        expect(result).toBeInstanceOf(AuthError)
        expect(result.statusCode).toBe(403)
        expect(result.userMessage).toBe('Access denied')
      })

      it('handles 422 with field errors as ValidationError', () => {
        const error = makeAxiosError(422, {
          message: 'Validation failed',
          errors: { email: ['Email is required'] }
        })
        const result = errorHandler.handleError(error)

        expect(result).toBeInstanceOf(ValidationError)
        expect(result.statusCode).toBe(422)
        expect((result as ValidationError).fieldErrors).toEqual({ email: ['Email is required'] })
      })

      it('handles 422 without field errors as generic ApiError', () => {
        const error = makeAxiosError(422, { message: 'Invalid data' })
        const result = errorHandler.handleError(error)

        // No errors field, so not a ValidationError
        expect(result).not.toBeInstanceOf(ValidationError)
        expect(result).toBeInstanceOf(ApiError)
        expect(result.userMessage).toBe('Invalid data')
      })

      it('handles network errors (no response) as NetworkError', () => {
        const error = {
          isAxiosError: true,
          response: undefined,
          config: {},
          message: 'Network Error'
        }
        const result = errorHandler.handleError(error)

        expect(result).toBeInstanceOf(NetworkError)
        expect(result.statusCode).toBe(0)
      })

      it('handles 404 as generic ApiError', () => {
        const error = makeAxiosError(404, { detail: 'Resource not found' })
        const result = errorHandler.handleError(error)

        expect(result).toBeInstanceOf(ApiError)
        expect(result.statusCode).toBe(404)
        expect(result.userMessage).toBe('Resource not found')
      })

      it('handles 500 as CRITICAL severity', () => {
        const error = makeAxiosError(500, { message: 'Internal error' })
        const result = errorHandler.handleError(error)

        expect(result.severity).toBe(ErrorSeverity.CRITICAL)
      })

      it('handles 400 as WARNING severity', () => {
        const error = makeAxiosError(400, { message: 'Bad request' })
        const result = errorHandler.handleError(error)

        expect(result.severity).toBe(ErrorSeverity.WARNING)
      })

      describe('error message extraction priority', () => {
        it('prefers error_message over message', () => {
          const error = makeAxiosError(400, {
            error_message: 'Error message field',
            message: 'Message field'
          })
          const result = errorHandler.handleError(error)
          expect(result.userMessage).toBe('Error message field')
        })

        it('falls back to message when error_message is absent', () => {
          const error = makeAxiosError(400, { message: 'Message field' })
          const result = errorHandler.handleError(error)
          expect(result.userMessage).toBe('Message field')
        })

        it('falls back to error when message is absent', () => {
          const error = makeAxiosError(400, { error: 'Error field' })
          const result = errorHandler.handleError(error)
          expect(result.userMessage).toBe('Error field')
        })

        it('falls back to detail when error is absent', () => {
          const error = makeAxiosError(400, { detail: 'Detail field' })
          const result = errorHandler.handleError(error)
          expect(result.userMessage).toBe('Detail field')
        })

        // Generic entity create/update answers { error: { code, message, details } }.
        it('reads the message nested in a data.error object', () => {
          const error = makeAxiosError(403, {
            error: { code: 'ERR403', message: 'Quota exceeded for this plan', details: {} }
          })
          const result = errorHandler.handleError(error, { fallbackKey: 'my.fallback' })
          expect(result.userMessage).toBe('Quota exceeded for this plan')
        })

        it('uses fallback key when no recognized fields are present', () => {
          const error = makeAxiosError(400, {})
          const result = errorHandler.handleError(error, { fallbackKey: 'my.fallback' })
          expect(result.userMessage).toBe('my.fallback')
        })
      })
    })
  })
})

describe('handleStoreError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('returns the user message from the handled error', () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 400, data: { message: 'Bad input' }, headers: {}, statusText: '', config: {} },
      config: {},
      message: ''
    }

    const result = handleStoreError(axiosError, 'store.loadError')
    expect(result).toBe('Bad input')
  })

  it('returns fallback key when error has no message', () => {
    const result = handleStoreError('unknown', 'store.fallback')
    expect(result).toBe('store.fallback')
  })
})
