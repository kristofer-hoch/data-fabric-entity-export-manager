import { AppLayout } from '@/components/layout/AppLayout';
import { EntityBrowser } from '@/components/EntityBrowser';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
export function HomePage() {
  const { isAuthenticated, isInitializing, login } = useAuth();
  if (isInitializing) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500">Initializing...</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  if (!isAuthenticated) {
    return (
      <AppLayout container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">Authentication Required</h1>
              <p className="text-sm text-gray-600">
                Please sign in to access Data Fabric entities and export data.
              </p>
            </div>
            <button
              onClick={login}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <EntityBrowser />
    </AppLayout>
  );
}