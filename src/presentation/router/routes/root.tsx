import { createRootRoute } from '@tanstack/router';
import { RootLayout } from 'presentation/Root';

/**
 * root.tsx defines the root route and layout wrapper for the application.
 * It provides the top-level context and layout structure for all routes.
 */
export const rootRoute = createRootRoute({
  component: RootLayout,
});

export default rootRoute;