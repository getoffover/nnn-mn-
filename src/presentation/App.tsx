import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '../router/router';
import { ThemeProvider } from '../styles/semanticTokens';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { FallbackUI } from '../components/shared/FallbackUI';

/**
 * Main application component.
 * Wraps the router with theme, error boundary, and fallback UI.
 */
export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary fallback={<FallbackUI />}> 
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ThemeProvider>
  );
};
