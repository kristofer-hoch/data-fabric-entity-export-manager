import { useEffect, useState } from 'react';
import { ChevronDown, Loader2, PlugZap } from 'lucide-react';
import { ConnectionManager } from '@/components/ConnectionManager';
import { EntityBrowser } from '@/components/EntityBrowser';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';

export function HomePage() {
  const { isAuthenticated, isInitializing, login, error, activeAuthConfig } = useAuth();
  const [isConnectionManagerOpen, setIsConnectionManagerOpen] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setIsConnectionManagerOpen(false);
    }
  }, [isAuthenticated]);

  if (isInitializing) {
    return (
      <AppLayout container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Preparing your UiPath workspace...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout container>
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
          <section className="w-full space-y-6 rounded-[2rem] border border-[#182126]/10 bg-white/95 p-8 shadow-soft backdrop-blur sm:p-10">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fa4616]">Authentication</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[#182126]">Sign in to continue</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Choose an organization, a tenant, and a non-confidential external application config to access Data Fabric entities and export data.
              </p>
            </div>

            <ConnectionManager />

            {error ? <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}

            {!activeAuthConfig ? (
              <p className="text-sm text-muted-foreground">
                Complete the connection selections above to enable authentication.
              </p>
            ) : null}

            <Button onClick={login} className="w-full sm:w-auto" disabled={!activeAuthConfig}>
              Sign in
            </Button>
          </section>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-[#182126]/10 bg-white/90 shadow-soft backdrop-blur">
            <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fa4616]">UiPath Data Fabric</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-[#182126] sm:text-4xl">
                  Review entities with confidence, then export the right records faster.
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  This workspace keeps connection setup, entity review, and CSV export in one place so teams can move quickly without losing accuracy.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-[#182126]/10 bg-[#f4fbfd] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0ba2b3]">Focused workflow</p>
                  <p className="mt-2 text-sm text-[#182126]">Connection settings stay close by, but out of the way once you are signed in.</p>
                </div>
                <div className="rounded-3xl border border-[#182126]/10 bg-[#fff4ef] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fa4616]">Export ready</p>
                  <p className="mt-2 text-sm text-[#182126]">Tables, previews, and export actions are tuned for quick scanning and fewer mistakes.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Collapsible open={isConnectionManagerOpen} onOpenChange={setIsConnectionManagerOpen}>
            <div className="overflow-hidden rounded-[1.5rem] border border-[#182126]/10 bg-white/90 shadow-soft backdrop-blur">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f4fbfd]"
                >
                  <div className="flex items-center gap-2">
                    <PlugZap className="h-4 w-4 text-[#0ba2b3]" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Connection settings</p>
                      <p className="text-xs text-muted-foreground">
                        Review or change the selected organization, tenant, and auth config.
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isConnectionManagerOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-[#182126]/10 px-5 py-5">
                  <ConnectionManager />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
        <EntityBrowser />
      </div>
    </AppLayout>
  );
}
