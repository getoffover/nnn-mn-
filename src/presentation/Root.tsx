import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { App } from './App';
import { storeHydrationProvider } from '../hooks/useStoreHydration';

/**
 * Root component for the application.
 * Provides context providers: QueryClient, Zustand hydration, etc.
 */
export const Root: React.FC = () => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <storeHydrationProvider>
        <App />
      </storeHydrationProvider>
    </QueryClientProvider>
  );
};
