import { Loader2 } from 'lucide-react';
import { ConnectionManager } from '@/components/ConnectionManager';
import { EntityBrowser } from '@/components/EntityBrowser';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const { isAuthenticated, isInitializing, login, error, activeAuthConfig } = useAuth();

  if (isInitializing) {
    return (
      <AppLayout container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Initializing...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout container>
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center">
          <div className="w-full space-y-6 rounded-3xl border bg-white p-8 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Authentication Required</h1>
              <p className="text-sm text-gray-600">
                Select an organization, a tenant, and an auth config before signing in to access Data Fabric entities and export data.
              </p>
            </div>

            <ConnectionManager compact />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {!activeAuthConfig ? (
              <p className="text-sm text-gray-500">
                Complete the three connection selections above to enable authentication.
              </p>
            ) : null}

            <Button onClick={login} className="w-full sm:w-auto" disabled={!activeAuthConfig}>
              Sign In
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <ConnectionManager compact />
        </div>
        <EntityBrowser />
      </div>
    </AppLayout>
  );
}
