import { createFileRoute } from '@tanstack/router';
import { Dashboard } from 'presentation/components/Dashboard/Dashboard';

/**
 * dashboard.tsx defines the dashboard route component using TanStack Router.
 * It serves as the entry point for the application's configuration and analytics UI.
 */
export const dashboardRoute = createFileRoute('/dashboard')({
  component: Dashboard,
});

export default dashboardRoute;