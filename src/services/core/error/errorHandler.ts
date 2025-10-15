/**
 * Centralized error handling service
 * Provides consistent error transformation and user-friendly messaging
 */

import { AxiosError } from 'axios';
import {
  ApiError,
  ValidationError,
  NetworkError,
  AuthError,
  HttpStatusCode,
  ErrorSeverity,
  BackendErrorResponse,
} from '../../../types/errors';

/**
 * Options for error handling
 */
export interface ErrorHandlerOptions {
  fallbackKey?: string;
  context?: Record<string, any>;
  showNotification?: boolean;
  logToConsole?: boolean;
}

/**
 * Error handler service for consistent error processing
 */
export class ErrorHandlerService {
  private static instance: ErrorHandlerService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorHandlerService {
    if (!this.instance) {
      this.instance = new ErrorHandlerService();
    }
    return this.instance;
  }

  /**
   * Handle an error from any source (Axios, native Error, etc.)
   *
   * @param error - The error to handle
   * @param options - Error handling options
   * @returns Standardized ApiError
   *
   * @example
   * try {
   *   await axios.post('/endpoint', data)
   * } catch (err) {
   *   const apiError = errorHandler.handleError(err, {
   *     fallbackKey: 'myDomain.genericError',
   *     context: { userId: '123' }
   *   })
   *   store.error.value = apiError.userMessage
   * }
   */
  handleError(error: any, options: ErrorHandlerOptions = {}): ApiError {
    const {
      fallbackKey = 'errors.generic',
      context = {},
      logToConsole = true,
    } = options;

    // Already an ApiError - return as is
    if (error instanceof ApiError) {
      if (logToConsole) {
        this.logError(error);
      }
      return error;
    }

    // Handle Axios errors
    if (this.isAxiosError(error)) {
      return this.handleAxiosError(error, fallbackKey, context, logToConsole);
    }

    // Handle native JavaScript errors
    if (error instanceof Error) {
      const apiError = new ApiError(
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        error.message || fallbackKey,
        error,
        ErrorSeverity.ERROR,
        context
      );
      if (logToConsole) {
        this.logError(apiError);
      }
      return apiError;
    }

    // Unknown error type
    const apiError = new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      fallbackKey,
      error,
      ErrorSeverity.ERROR,
      context
    );
    if (logToConsole) {
      this.logError(apiError);
    }
    return apiError;
  }

  /**
   * Handle Axios-specific errors
   */
  private handleAxiosError(
    error: AxiosError,
    fallbackKey: string,
    context: Record<string, any>,
    logToConsole: boolean
  ): ApiError {
    const response = error.response;
    const statusCode = response?.status || 0;

    // Network error (no response)
    if (!response) {
      const networkError = new NetworkError(
        'Network error - please check your connection',
        error
      );
      if (logToConsole) {
        this.logError(networkError);
      }
      return networkError;
    }

    // Extract error message from backend
    const backendData = response.data as BackendErrorResponse;
    const userMessage = this.extractErrorMessage(backendData, fallbackKey);

    // Authentication/Authorization errors
    if (statusCode === HttpStatusCode.UNAUTHORIZED || statusCode === HttpStatusCode.FORBIDDEN) {
      const authError = new AuthError(userMessage, statusCode, error);
      if (logToConsole) {
        this.logError(authError);
      }
      return authError;
    }

    // Validation errors
    if (statusCode === HttpStatusCode.UNPROCESSABLE_ENTITY && backendData.errors) {
      const validationError = new ValidationError(
        userMessage,
        backendData.errors,
        error
      );
      if (logToConsole) {
        this.logError(validationError);
      }
      return validationError;
    }

    // Generic API error
    const severity = this.determineSeverity(statusCode);
    const apiError = new ApiError(statusCode, userMessage, error, severity, context);
    if (logToConsole) {
      this.logError(apiError);
    }
    return apiError;
  }

  /**
   * Extract user-friendly error message from backend response
   * Priority: error_message > message > error > detail > fallback
   */
  private extractErrorMessage(data: BackendErrorResponse, fallback: string): string {
    return (
      data.error_message ||
      data.message ||
      data.error ||
      data.detail ||
      fallback
    );
  }

  /**
   * Determine error severity based on HTTP status code
   */
  private determineSeverity(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) return ErrorSeverity.CRITICAL;
    if (statusCode >= 400 && statusCode < 500) return ErrorSeverity.WARNING;
    return ErrorSeverity.ERROR;
  }

  /**
   * Check if error is an Axios error
   */
  private isAxiosError(error: any): error is AxiosError {
    return error?.isAxiosError === true;
  }

  /**
   * Log error to console with appropriate level
   */
  private logError(error: ApiError): void {
    const logData = {
      message: error.userMessage,
      statusCode: error.statusCode,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🔴 CRITICAL ERROR:', logData, error.originalError);
        break;
      case ErrorSeverity.ERROR:
        console.error('❌ ERROR:', logData, error.originalError);
        break;
      case ErrorSeverity.WARNING:
        console.warn('⚠️ WARNING:', logData, error.originalError);
        break;
      case ErrorSeverity.INFO:
        console.info('ℹ️ INFO:', logData);
        break;
    }
  }

  /**
   * Utility: Get user-friendly message for common HTTP status codes
   */
  getStatusMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      [HttpStatusCode.BAD_REQUEST]: 'Invalid request',
      [HttpStatusCode.UNAUTHORIZED]: 'Authentication required',
      [HttpStatusCode.FORBIDDEN]: 'Access denied',
      [HttpStatusCode.NOT_FOUND]: 'Resource not found',
      [HttpStatusCode.CONFLICT]: 'Conflict - resource already exists',
      [HttpStatusCode.UNPROCESSABLE_ENTITY]: 'Validation failed',
      [HttpStatusCode.INTERNAL_SERVER_ERROR]: 'Server error',
      [HttpStatusCode.BAD_GATEWAY]: 'Service unavailable',
      [HttpStatusCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
    };

    return messages[statusCode] || 'An error occurred';
  }
}

/**
 * Singleton instance for easy import
 */
export const errorHandler = ErrorHandlerService.getInstance();

/**
 * Helper function for quick error handling in stores
 *
 * @example
 * import { handleStoreError } from '../services/errorHandler'
 *
 * try {
 *   const response = await axios.get('/endpoint')
 * } catch (err) {
 *   store.error.value = handleStoreError(err, 'myDomain.loadError')
 *   throw err
 * }
 */
export function handleStoreError(error: any, fallbackKey: string): string {
  const apiError = errorHandler.handleError(error, { fallbackKey });
  return apiError.userMessage;
}

/**
 * Async wrapper for store operations with automatic error handling
 *
 * @example
 * const loadData = wrapAsyncStoreCall(
 *   base.isLoading,
 *   base.error,
 *   async () => {
 *     const response = await axios.get('/endpoint')
 *     return response.data
 *   },
 *   'myDomain.loadError'
 * )
 */
export async function wrapAsyncStoreCall<T>(
  loadingRef: { value: boolean },
  errorRef: { value: string },
  operation: () => Promise<T>,
  fallbackKey: string
): Promise<T> {
  loadingRef.value = true;
  errorRef.value = '';

  try {
    const result = await operation();
    return result;
  } catch (err: any) {
    errorRef.value = handleStoreError(err, fallbackKey);
    throw err;
  } finally {
    loadingRef.value = false;
  }
}
