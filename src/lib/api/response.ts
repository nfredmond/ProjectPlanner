import { NextResponse } from 'next/server';

type ApiResponseData<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
};

/**
 * Creates a standardized successful API response
 */
export function apiSuccess<T>(data: T, meta?: ApiResponseData<T>['meta'], status = 200) {
  return NextResponse.json<ApiResponseData<T>>(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

/**
 * Creates a standardized error API response
 */
export function apiError(
  message: string,
  code = 'INTERNAL_SERVER_ERROR',
  details?: any,
  status = 500
) {
  return NextResponse.json<ApiResponseData<null>>(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Common error response helpers
 */
export const apiErrors = {
  badRequest: (message = 'Bad request', details?: any) =>
    apiError(message, 'BAD_REQUEST', details, 400),
  
  unauthorized: (message = 'Unauthorized', details?: any) =>
    apiError(message, 'UNAUTHORIZED', details, 401),
  
  forbidden: (message = 'Forbidden', details?: any) =>
    apiError(message, 'FORBIDDEN', details, 403),
  
  notFound: (message = 'Resource not found', details?: any) =>
    apiError(message, 'NOT_FOUND', details, 404),
  
  methodNotAllowed: (message = 'Method not allowed', details?: any) =>
    apiError(message, 'METHOD_NOT_ALLOWED', details, 405),
  
  conflict: (message = 'Resource conflict', details?: any) =>
    apiError(message, 'CONFLICT', details, 409),
  
  validationError: (message = 'Validation failed', details?: any) =>
    apiError(message, 'VALIDATION_ERROR', details, 422),
  
  tooManyRequests: (message = 'Too many requests', details?: any) =>
    apiError(message, 'TOO_MANY_REQUESTS', details, 429),
  
  serverError: (message = 'Internal server error', details?: any) =>
    apiError(message, 'INTERNAL_SERVER_ERROR', details, 500),
};

const apiResponses = {
  success: apiSuccess,
  error: apiError,
  errors: apiErrors,
};

export default apiResponses; 