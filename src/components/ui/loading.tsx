import React, { useEffect, useState } from 'react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'medium' | 'large';
  timeout?: number;
}

/**
 * A reusable loading component that provides a consistent way to show loading states
 * throughout the application.
 */
export function Loading({
  message = 'Loading...',
  fullScreen = false,
  size = 'medium',
  timeout = 15000,
}: LoadingProps) {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    // Set a timeout to show fallback message if loading takes too long
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  // Calculate spinner size
  const spinnerSizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  // Calculate container classes
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50'
    : 'flex flex-col items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <svg
          className={`animate-spin ${spinnerSizeClasses[size]} text-rtpa-blue-600`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
        
        {showTimeout && (
          <div className="mt-4 max-w-md text-center">
            <p className="text-sm text-red-600 font-medium">Loading is taking longer than expected.</p>
            <p className="text-xs text-gray-500 mt-1">
              This could be due to network issues or configuration problems. 
              Please check your connection and environment settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Loading; 