import React from 'react';
import Link from 'next/link';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string;
  showDetails?: boolean;
  actionText?: string;
  actionHref?: string;
  onRetry?: () => void;
}

/**
 * A reusable error display component that provides a consistent way to show errors
 * throughout the application with optional retry or navigation actions.
 */
export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'We encountered an error while processing your request.',
  error,
  showDetails = false,
  actionText,
  actionHref,
  onRetry,
}: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="rounded-md bg-red-50 p-4 my-4 border border-red-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
            {showDetails && errorMessage && <p className="mt-2 font-mono text-xs bg-red-100 p-2 rounded">{errorMessage}</p>}
          </div>
          <div className="mt-4">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mr-3 inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                Try again
              </button>
            )}
            {actionHref && actionText && (
              <Link
                href={actionHref}
                className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
              >
                {actionText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorDisplay;