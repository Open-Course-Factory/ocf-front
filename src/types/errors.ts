/**
 * Error types and interfaces for standardized error handling
 */

/**
 * HTTP status codes commonly used in the application
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Backend error response structure
 */
export interface BackendErrorResponse {
  error_message?: string;
  message?: string;
  error?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}

/**
 * Standardized application error
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly originalError: any;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    statusCode: number,
    userMessage: string,
    originalError?: any,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>
  ) {
    super(userMessage);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.originalError = originalError;
    this.severity = severity;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(): boolean {
    return this.statusCode === 0 || this.statusCode >= 500;
  }

  /**
   * Check if error is authentication-related
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * Check if error is validation-related
   */
  isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  /**
   * Get a JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

/**
 * Validation error for form inputs
 */
export class ValidationError extends ApiError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(
    userMessage: string,
    fieldErrors: Record<string, string[]>,
    originalError?: any
  ) {
    super(
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      userMessage,
      originalError,
      ErrorSeverity.WARNING
    );
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(field: string): string[] {
    return this.fieldErrors[field] || [];
  }

  /**
   * Check if a field has errors
   */
  hasFieldErrors(field: string): boolean {
    return field in this.fieldErrors && this.fieldErrors[field].length > 0;
  }
}

/**
 * Network/connection error
 */
export class NetworkError extends ApiError {
  constructor(userMessage: string, originalError?: any) {
    super(0, userMessage, originalError, ErrorSeverity.ERROR);
    this.name = 'NetworkError';
  }
}

/**
 * Authentication/authorization error
 */
export class AuthError extends ApiError {
  constructor(userMessage: string, statusCode: number = 401, originalError?: any) {
    super(statusCode, userMessage, originalError, ErrorSeverity.WARNING);
    this.name = 'AuthError';
  }
}
