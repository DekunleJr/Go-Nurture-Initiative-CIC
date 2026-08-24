/**
 * Centralized error handling utilities
 * Provides consistent error codes, formatting, and error boundary support
 */

export enum AppErrorCode {
  // Client errors (400s)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // Server errors (500s)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // Custom errors
  AUTH_FAILED = "AUTH_FAILED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  UNKNOWN = "UNKNOWN",
}

export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    public message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
  }

  static fromResponse(response: any, statusCode: number): AppError {
    const message =
      response?.message ||
      response?.detail ||
      response?.error ||
      "An error occurred";

    let code = AppErrorCode.INTERNAL_SERVER_ERROR;

    switch (statusCode) {
      case 400:
        code = AppErrorCode.BAD_REQUEST;
        break;
      case 401:
        code = AppErrorCode.UNAUTHORIZED;
        break;
      case 403:
        code = AppErrorCode.FORBIDDEN;
        break;
      case 404:
        code = AppErrorCode.NOT_FOUND;
        break;
      case 409:
        code = AppErrorCode.CONFLICT;
        break;
      case 422:
        code = AppErrorCode.VALIDATION_ERROR;
        break;
      case 500:
        code = AppErrorCode.INTERNAL_SERVER_ERROR;
        break;
      case 503:
        code = AppErrorCode.SERVICE_UNAVAILABLE;
        break;
    }

    return new AppError(code, message, statusCode);
  }

  static fromNetworkError(error: Error): AppError {
    if (error.message.includes("timeout")) {
      return new AppError(
        AppErrorCode.TIMEOUT,
        "Request timed out. Please try again.",
        undefined,
        error
      );
    }

    return new AppError(
      AppErrorCode.NETWORK_ERROR,
      "Network error. Please check your connection.",
      undefined,
      error
    );
  }
}

/**
 * Format error for display to user
 */
export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
};

/**
 * Log error for debugging
 */
export const logError = (
  error: unknown,
  context?: string
): void => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : "";

  if (error instanceof AppError) {
    console.error(
      `${timestamp} ${contextStr} AppError:`,
      error.code,
      error.message,
      error.originalError
    );
  } else if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} Error:`, error.message, error);
  } else {
    console.error(`${timestamp} ${contextStr} Unknown error:`, error);
  }
};
