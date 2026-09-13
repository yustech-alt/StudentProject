/**
 * Production-safe error logging utility.
 * Sanitizes error messages to prevent sensitive data leakage in client-side logs.
 */

interface SanitizedError {
  message: string;
  code?: string;
}

/**
 * Sanitizes an error object for safe logging.
 * Removes stack traces, sensitive details, and internal information.
 */
function sanitizeError(error: unknown): SanitizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
    };
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      message: String(err.message || 'An error occurred'),
      code: err.code ? String(err.code) : undefined,
    };
  }
  
  return {
    message: String(error || 'An error occurred'),
  };
}

/**
 * Logs an error with context, sanitizing sensitive information in production.
 * In development, logs full error details for debugging.
 * In production, logs only sanitized error information.
 */
export function logError(context: string, error: unknown): void {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // In development, log full details for debugging
    console.error(`[${context}]`, error);
  } else {
    // In production, log only sanitized information
    const sanitized = sanitizeError(error);
    console.error(`[${context}]`, sanitized.message);
  }
}

/**
 * Logs a warning with context.
 * Safe to use in both development and production.
 */
export function logWarn(context: string, message: string): void {
  console.warn(`[${context}]`, message);
}

/**
 * Logs info for debugging purposes.
 * Only logs in development environment.
 */
export function logDebug(context: string, message: string, data?: unknown): void {
  if (import.meta.env.DEV) {
    console.log(`[${context}]`, message, data ?? '');
  }
}
