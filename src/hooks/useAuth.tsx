import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { UiPath } from '@uipath/uipath-typescript/core';
import { getAppBase } from '@uipath/uipath-typescript';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript/core';
import {
    addCustomAuthConfig,
    getAuthConfigById,
    getAuthConfigGroupById,
    getAvailableAuthConfigs,
    getSelectedAuthConfigId,
    resetCustomAuthConfigs,
    setSelectedAuthConfigId,
    updateCustomAuthConfig,
    type NewAuthConfigInput,
    type StoredAuthConfig,
    type StoredAuthConfigGroup,
} from '@/config/authConfig';

interface AuthContextType {
    sdk: UiPath | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    error: string | null;
    authConfigs: StoredAuthConfig[];
    activeAuthConfig: StoredAuthConfig | null;
    activeAuthConfigGroup: StoredAuthConfigGroup | null;
    login: () => Promise<void>;
    logout: () => void;
    selectAuthConfig: (configId: string | null) => void;
    addAuthConfig: (config: NewAuthConfigInput) => StoredAuthConfig;
    updateAuthConfig: (groupId: string, config: NewAuthConfigInput, preferredTenant?: string, preferredName?: string) => StoredAuthConfig;
    resetAuthConfigs: () => StoredAuthConfig[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeSdkBaseUrl(baseUrl: string | undefined): string {
    const fallback = 'https://cloud.uipath.com';

    if (!baseUrl) {
        return fallback;
    }

    try {
        const url = new URL(baseUrl);

        switch (url.hostname) {
            case 'api.uipath.com':
                url.hostname = 'cloud.uipath.com';
                break;
            case 'staging.api.uipath.com':
                url.hostname = 'staging.uipath.com';
                break;
            case 'alpha.api.uipath.com':
                url.hostname = 'alpha.uipath.com';
                break;
            default:
                break;
        }

        return url.toString().replace(/\/$/, '');
    } catch {
        return baseUrl;
    }
}

function getConfig(authConfig: StoredAuthConfig): UiPathSDKConfig {
    const redirectUri = authConfig.urlAppRedirect || new URL(getAppBase(), window.location.origin).toString();

    return {
        baseUrl: normalizeSdkBaseUrl(authConfig.urlBase),
        orgName: authConfig.organization || '',
        tenantName: authConfig.tenant || 'DefaultTenant',
        clientId: authConfig.clientId || '',
        redirectUri,
        scope: authConfig.scope || '',
    };
}

function clearOAuthRedirectQueryString(): void {
    const url = new URL(window.location.href);

    if (!url.search) {
        return;
    }

    url.search = '';
    window.history.replaceState({}, '', url.toString());
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [sdk, setSdk] = useState<UiPath | null>(null);
    const [authConfigs, setAuthConfigs] = useState<StoredAuthConfig[]>(() => getAvailableAuthConfigs());
    const [activeAuthConfigId, setActiveAuthConfigId] = useState<string | null>(() => getSelectedAuthConfigId(getAvailableAuthConfigs()));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const activeAuthConfig = authConfigs.find((config) => config.id === activeAuthConfigId) ?? null;
    const activeAuthConfigGroup = activeAuthConfig ? getAuthConfigGroupById(activeAuthConfig.groupId) : null;

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                if (!activeAuthConfig) {
                    if (!cancelled) {
                        setSdk(null);
                        setIsAuthenticated(false);
                        setIsInitializing(false);
                    }
                    return;
                }

                const instance = new UiPath(getConfig(activeAuthConfig));

                if (instance.isInOAuthCallback()) {
                    await instance.completeOAuth();
                    clearOAuthRedirectQueryString();
                    if (!cancelled) {
                        setSdk(instance);
                        setIsAuthenticated(true);
                        setIsInitializing(false);
                    }
                    return;
                }

                if (!cancelled) {
                    setSdk(instance);
                    setIsAuthenticated(instance.isAuthenticated());
                    setIsInitializing(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : String(err));
                    setIsInitializing(false);
                }
            }
        };

        setIsInitializing(true);
        setError(null);
        init();

        return () => {
            cancelled = true;
        };
    }, [activeAuthConfig]);

    const refreshConfigs = useCallback((nextActiveId?: string | null) => {
        const nextConfigs = getAvailableAuthConfigs();
        const selectedId = nextActiveId !== undefined
            ? (nextActiveId && nextConfigs.some((config) => config.id === nextActiveId) ? nextActiveId : null)
            : getSelectedAuthConfigId(nextConfigs);

        setAuthConfigs(nextConfigs);
        setSelectedAuthConfigId(selectedId);
        setActiveAuthConfigId(selectedId);
        setSdk(null);
        setIsAuthenticated(false);
        setError(null);

        return nextConfigs;
    }, []);

    const login = useCallback(async () => {
        if (!sdk) {
            return;
        }

        try {
            setError(null);
            await sdk.initialize();
            setIsAuthenticated(sdk.isAuthenticated());
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [sdk]);

    const logout = useCallback(() => {
        if (!sdk) {
            return;
        }

        sdk.logout();
        setIsAuthenticated(false);
        setError(null);
    }, [sdk]);

    const selectAuthConfig = useCallback((configId: string | null) => {
        refreshConfigs(configId);
    }, [refreshConfigs]);

    const addAuthConfig = useCallback((config: NewAuthConfigInput) => {
        const nextConfig = addCustomAuthConfig(config);
        const nextEntry = getAuthConfigById(nextConfig.id) ?? nextConfig;

        refreshConfigs(nextEntry.id);
        return nextEntry;
    }, [refreshConfigs]);

    const updateAuthConfigHandler = useCallback((groupId: string, config: NewAuthConfigInput, preferredTenant?: string, preferredName?: string) => {
        const nextConfig = updateCustomAuthConfig(groupId, config, preferredTenant, preferredName);
        const nextEntry = getAuthConfigById(nextConfig.id) ?? nextConfig;

        refreshConfigs(nextEntry.id);
        return nextEntry;
    }, [refreshConfigs]);

    const resetAuthConfigsHandler = useCallback(() => {
        const nextConfigs = resetCustomAuthConfigs();
        refreshConfigs(null);
        return nextConfigs;
    }, [refreshConfigs]);

    return (
        <AuthContext.Provider
            value={{
                sdk,
                isAuthenticated,
                isInitializing,
                error,
                authConfigs,
                activeAuthConfig,
                activeAuthConfigGroup,
                login,
                logout,
                selectAuthConfig,
                addAuthConfig,
                updateAuthConfig: updateAuthConfigHandler,
                resetAuthConfigs: resetAuthConfigsHandler,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
