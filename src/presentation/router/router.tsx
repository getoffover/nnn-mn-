import { createRouter } from '@tanstack/router';
import { rootRoute } from './routes/root';
import { dashboardRoute } from './routes/dashboard';

/**
 * router.tsx defines the application's routing configuration using TanStack Router.
 * It establishes the route tree and exports a configured router instance.
 */
const routeTree = rootRoute.addChildren([dashboardRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: () => <div>Not Found</div>,
});

// Register router type for TypeScript
declare module '@tanstack/router' {
  interface Register {
    router: typeof router;
  }
}

export default router;