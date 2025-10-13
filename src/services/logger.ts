/**
 * Centralized logging service
 * Provides consistent, structured logging across the application
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogContext {
  [key: string]: any;
}

/**
 * Logger service for consistent application logging
 */
export class LoggerService {
  private static instance: LoggerService;
  private currentLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LoggerService {
    if (!this.instance) {
      this.instance = new LoggerService();
    }
    return this.instance;
  }

  /**
   * Set minimum log level (logs below this level will be suppressed)
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Debug log - for detailed diagnostic information
   * Only shown in development mode
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('debug', '🔍 DEBUG', message, context);
    }
  }

  /**
   * Info log - for general informational messages
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('log', 'ℹ️ INFO', message, context);
    }
  }

  /**
   * Warning log - for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log('warn', '⚠️ WARN', message, context);
    }
  }

  /**
   * Error log - for error events
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error ? { error: this.serializeError(error), ...context } : context;
      this.log('error', '❌ ERROR', message, errorContext);
    }
  }

  /**
   * Demo mode log - for demo-related actions
   */
  demo(action: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('log', '🎭 DEMO', action, data ? { data } : undefined);
    }
  }

  /**
   * Feature flag log - for feature flag operations
   */
  feature(flag: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('log', '🏴 FEATURE', `[${flag}] ${message}`, data ? { data } : undefined);
    }
  }

  /**
   * API log - for API request/response logging
   */
  api(method: string, url: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('log', '🌐 API', `${method.toUpperCase()} ${url}`, context);
    }
  }

  /**
   * Performance log - for performance measurements
   */
  performance(label: string, duration: number, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('log', '⏱️ PERF', `${label}: ${duration.toFixed(2)}ms`, context);
    }
  }

  /**
   * Check if log level should be shown
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  /**
   * Internal log method
   */
  private log(
    method: 'log' | 'debug' | 'warn' | 'error',
    prefix: string,
    message: string,
    context?: LogContext
  ): void {
    const timestamp = new Date().toISOString();

    if (context) {
      console[method](`[${timestamp}] ${prefix}:`, message, context);
    } else {
      console[method](`[${timestamp}] ${prefix}:`, message);
    }
  }

  /**
   * Serialize error for logging
   */
  private serializeError(error: Error | any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any), // Include custom properties
      };
    }
    return error;
  }

  /**
   * Create a child logger with prefixed messages
   */
  createChild(prefix: string): ChildLogger {
    return new ChildLogger(this, prefix);
  }
}

/**
 * Child logger with automatic message prefixing
 */
export class ChildLogger {
  constructor(private parent: LoggerService, private prefix: string) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(`[${this.prefix}] ${message}`, context);
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(`[${this.prefix}] ${message}`, context);
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(`[${this.prefix}] ${message}`, context);
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    this.parent.error(`[${this.prefix}] ${message}`, error, context);
  }
}

/**
 * Singleton instance for easy import
 */
export const logger = LoggerService.getInstance();

/**
 * Utility: Measure and log function execution time
 *
 * @example
 * const result = await measurePerformance('loadData', async () => {
 *   return await fetchData()
 * })
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.performance(label, duration, context);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.performance(`${label} (failed)`, duration, context);
    throw error;
  }
}

/**
 * Utility: Create a scoped logger for a specific module
 *
 * @example
 * const log = createModuleLogger('UserStore')
 * log.info('Loading users')  // [UserStore] Loading users
 */
export function createModuleLogger(moduleName: string): ChildLogger {
  return logger.createChild(moduleName);
}
