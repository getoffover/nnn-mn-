import React from 'react';

/**
 * FallbackUI component renders a user-friendly fallback interface when an error occurs
 * or when critical resources are unavailable. It is designed to be resilient and
 * non-blocking, ensuring graceful degradation of the overlay experience.
 */
export const FallbackUI: React.FC<{ error?: Error; retry?: () => void }> = ({ error, retry }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
      <div className="max-w-md rounded-lg border border-red-500/30 bg-gray-900 p-6 shadow-2xl">
        <h2 className="mb-2 text-xl font-bold text-red-400">Overlay Unavailable</h2>
        <p className="mb-4 text-sm text-gray-300">
          {error
            ? `Error: ${error.message}`
            : 'The overlay is currently unavailable. Please check your connection and try again.'}
        </p>
        {retry && (
          <button
            onClick={retry}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Retry
          </button>
        )}
        {!retry && (
          <p className="text-xs text-gray-400">
            Restart the application or contact support if the issue persists.
          </p>
        )}
      </div>
    </div>
  );
};

export default FallbackUI;