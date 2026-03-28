import authConfigJson from './auth.config.json';

export interface AuthConfigExternalAppInput {
    name: string;
    clientId: string;
    scope: string;
    urlAppRedirect: string;
}

export interface AuthConfigEntry {
    clientId: string;
    organization: string;
    scope: string;
    tenant: string;
    urlApp: string;
    urlAppRedirect: string;
    urlBase: string;
}

export interface AuthConfigGroupInput {
    organization: string;
    tenants: string[];
    urlApp: string;
    urlBase: string;
    externalApps: AuthConfigExternalAppInput[];
}

export interface StoredAuthConfigGroup extends AuthConfigGroupInput {
    id: string;
    source: 'bundled' | 'custom';
}

export interface StoredAuthConfig extends AuthConfigEntry {
    id: string;
    groupId: string;
    name: string;
    source: 'bundled' | 'custom';
    tenants: string[];
}

interface RawExternalAppConfig {
    name?: string;
    clientId: string;
    scope: string;
    urlAppRedirect: string;
}

interface RawOrganizationConfigValue {
    urlBase: string;
    tenants: string[];
    externalApps: RawExternalAppConfig[];
}

interface AuthConfigFile {
    authconfigs: Array<Record<string, Record<string, RawOrganizationConfigValue>>>;
}

type LegacyStoredAuthConfigGroup = AuthConfigEntry & {
    id: string;
    name?: string;
    source?: 'custom';
};

const authConfig = authConfigJson as AuthConfigFile;
const CUSTOM_AUTH_CONFIGS_STORAGE_KEY = 'uipath-custom-auth-configs';
const ACTIVE_AUTH_CONFIG_STORAGE_KEY = 'uipath-active-auth-config-id';
const ENV_KEY_PATTERN = /^VITE_[A-Z0-9_]+$/;

function buildConfigName(config: { organization: string; tenants?: string[]; tenant?: string; clientId: string }): string {
    const tenantLabel = config.tenant || config.tenants?.[0] || '';
    const orgTenant = [config.organization, tenantLabel].filter(Boolean).join(' / ');

    if (orgTenant) {
        return orgTenant;
    }

    if (config.clientId) {
        return `Client ${config.clientId.slice(0, 8)}`;
    }

    return 'Connection';
}

function sanitizeTenants(tenants: string[]): string[] {
    const seen = new Set<string>();

    return tenants
        .map((tenant) => tenant.trim())
        .filter((tenant) => {
            if (!tenant || seen.has(tenant)) {
                return false;
            }

            seen.add(tenant);
            return true;
        });
}

function sanitizeExternalApps(externalApps: AuthConfigExternalAppInput[]): AuthConfigExternalAppInput[] {
    return externalApps
        .map((externalApp) => ({
            name: externalApp.name.trim(),
            clientId: externalApp.clientId.trim(),
            scope: externalApp.scope.trim(),
            urlAppRedirect: externalApp.urlAppRedirect.trim(),
        }))
        .filter((externalApp) => externalApp.clientId);
}

function canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readEnvValue(value: string | undefined): string {
    if (!value) {
        return '';
    }

    if (!ENV_KEY_PATTERN.test(value)) {
        return value;
    }

    const env = import.meta.env as Record<string, string | boolean | undefined>;
    const resolved = env[value];
    return typeof resolved === 'string' ? resolved.trim() : '';
}

function getMappedAuthConfigGroups(source: 'bundled' | 'custom'): StoredAuthConfigGroup[] {
    return authConfig.authconfigs.flatMap((urlAppGroup, appGroupIndex) => {
        return Object.entries(urlAppGroup).flatMap(([urlAppKey, organizationGroup], urlAppIndex) => {
            const urlApp = readEnvValue(urlAppKey);

            return Object.entries(organizationGroup).flatMap(([organizationKey, config], organizationIndex) => {
                const organization = readEnvValue(organizationKey);
                const tenants = sanitizeTenants((config.tenants ?? []).map((tenant) => readEnvValue(tenant)));
                const urlBase = readEnvValue(config.urlBase);
                const externalApps = sanitizeExternalApps(
                    (config.externalApps ?? []).map((externalApp) => ({
                        name: readEnvValue(externalApp.name),
                        clientId: readEnvValue(externalApp.clientId),
                        scope: readEnvValue(externalApp.scope),
                        urlAppRedirect: readEnvValue(externalApp.urlAppRedirect),
                    })),
                );

                if (!urlApp || !organization || !externalApps.length) {
                    return [];
                }

                return [{
                    id: `${source}-${appGroupIndex}-${urlAppIndex}-${organizationIndex}`,
                    source,
                    organization,
                    tenants,
                    urlApp,
                    urlBase,
                    externalApps,
                } satisfies StoredAuthConfigGroup];
            });
        });
    });
}

function normalizeGroup(group: StoredAuthConfigGroup): StoredAuthConfig[] {
    const tenants = sanitizeTenants(group.tenants?.length ? group.tenants : ['']);
    const normalizedTenants = tenants.length ? tenants : [''];
    const externalApps = sanitizeExternalApps(group.externalApps ?? []);

    return externalApps.flatMap((externalApp, appIndex) => {
        return normalizedTenants.map((tenant, tenantIndex) => ({
            id: `${group.id}-${appIndex}-${tenantIndex}`,
            groupId: group.id,
            name: externalApp.name || buildConfigName({ organization: group.organization, tenants: normalizedTenants, clientId: externalApp.clientId }),
            source: group.source,
            tenants: normalizedTenants,
            clientId: externalApp.clientId,
            organization: group.organization,
            scope: externalApp.scope,
            tenant,
            urlApp: group.urlApp,
            urlAppRedirect: externalApp.urlAppRedirect,
            urlBase: group.urlBase,
        }));
    });
}

function normalizeBundledAuthGroups(): StoredAuthConfigGroup[] {
    return getMappedAuthConfigGroups('bundled');
}

function createInitialCustomAuthConfigGroups(): StoredAuthConfigGroup[] {
    if (!canUseStorage()) {
        return [];
    }

    const initialGroups = getMappedAuthConfigGroups('custom').map((group, index) => ({
        ...group,
        id: `custom-${index}`,
        source: 'custom' as const,
    }));

    if (!initialGroups.length) {
        return [];
    }

    writeCustomAuthConfigGroups(initialGroups);
    return initialGroups;
}

function normalizeStoredCustomGroup(config: StoredAuthConfigGroup | LegacyStoredAuthConfigGroup): StoredAuthConfigGroup | null {
    if ('externalApps' in config && Array.isArray(config.externalApps)) {
        const externalApps = sanitizeExternalApps(config.externalApps);
        if (!config.id || !config.organization || !externalApps.length) {
            return null;
        }

        return {
            id: config.id,
            source: 'custom',
            organization: config.organization,
            tenants: sanitizeTenants(config.tenants ?? []),
            urlApp: config.urlApp,
            urlBase: config.urlBase,
            externalApps,
        };
    }

    const tenant = 'tenant' in config ? config.tenant : '';
    const clientId = config.clientId?.trim();
    if (!config.id || !config.organization || !clientId) {
        return null;
    }

    return {
        id: config.id,
        source: 'custom',
        organization: config.organization,
        tenants: sanitizeTenants([tenant]),
        urlApp: config.urlApp,
        urlBase: config.urlBase,
        externalApps: [{
            name: config.name?.trim() || buildConfigName({ organization: config.organization, tenant, clientId }),
            clientId,
            scope: config.scope,
            urlAppRedirect: config.urlAppRedirect,
        }],
    };
}

function readCustomAuthConfigGroups(): StoredAuthConfigGroup[] {
    if (!canUseStorage()) {
        return [];
    }

    try {
        const rawConfigs = window.localStorage.getItem(CUSTOM_AUTH_CONFIGS_STORAGE_KEY);

        if (!rawConfigs) {
            return createInitialCustomAuthConfigGroups();
        }

        const parsedConfigs = JSON.parse(rawConfigs) as Array<StoredAuthConfigGroup | LegacyStoredAuthConfigGroup>;
        const normalizedConfigs = parsedConfigs
            .map((config) => normalizeStoredCustomGroup(config))
            .filter((config): config is StoredAuthConfigGroup => config !== null);

        return normalizedConfigs.length ? normalizedConfigs : createInitialCustomAuthConfigGroups();
    } catch {
        return createInitialCustomAuthConfigGroups();
    }
}

function writeCustomAuthConfigGroups(configs: StoredAuthConfigGroup[]): void {
    if (!canUseStorage()) {
        return;
    }

    window.localStorage.setItem(CUSTOM_AUTH_CONFIGS_STORAGE_KEY, JSON.stringify(configs));
}

export function getBundledAuthConfigs(): StoredAuthConfig[] {
    return normalizeBundledAuthGroups().flatMap(normalizeGroup);
}

export function getAvailableAuthConfigs(): StoredAuthConfig[] {
    const customConfigs = readCustomAuthConfigGroups().flatMap(normalizeGroup);
    if (customConfigs.length) {
        return customConfigs;
    }

    return getBundledAuthConfigs();
}

export function getSelectedAuthConfigId(configs = getAvailableAuthConfigs()): string | null {
    if (!canUseStorage()) {
        return null;
    }

    const storedId = window.localStorage.getItem(ACTIVE_AUTH_CONFIG_STORAGE_KEY);

    if (!storedId) {
        return null;
    }

    return configs.some((config) => config.id === storedId) ? storedId : null;
}

export function setSelectedAuthConfigId(configId: string | null): void {
    if (!canUseStorage()) {
        return;
    }

    if (!configId) {
        window.localStorage.removeItem(ACTIVE_AUTH_CONFIG_STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(ACTIVE_AUTH_CONFIG_STORAGE_KEY, configId);
}

export function getAuthConfigById(configId: string | null | undefined): StoredAuthConfig | null {
    if (!configId) {
        return null;
    }

    const configs = getAvailableAuthConfigs();
    return configs.find((config) => config.id === configId) ?? null;
}

export function getAuthConfigGroupById(groupId: string): StoredAuthConfigGroup | null {
    const bundledGroup = normalizeBundledAuthGroups().find((group) => group.id === groupId);

    if (bundledGroup) {
        return bundledGroup;
    }

    return readCustomAuthConfigGroups().find((group) => group.id === groupId) ?? null;
}

export type NewAuthConfigInput = AuthConfigGroupInput;

export function resetCustomAuthConfigs(): StoredAuthConfig[] {
    if (canUseStorage()) {
        window.localStorage.removeItem(CUSTOM_AUTH_CONFIGS_STORAGE_KEY);
        window.localStorage.removeItem(ACTIVE_AUTH_CONFIG_STORAGE_KEY);
    }

    return createInitialCustomAuthConfigGroups().flatMap(normalizeGroup);
}

export function addCustomAuthConfig(config: NewAuthConfigInput): StoredAuthConfig {
    const nextGroup: StoredAuthConfigGroup = {
        ...config,
        tenants: sanitizeTenants(config.tenants),
        externalApps: sanitizeExternalApps(config.externalApps),
        id: `custom-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString()}`,
        source: 'custom',
    };

    writeCustomAuthConfigGroups([...readCustomAuthConfigGroups(), nextGroup]);

    return normalizeGroup(nextGroup)[0];
}

export function updateCustomAuthConfig(groupId: string, config: NewAuthConfigInput, preferredTenant?: string, preferredName?: string): StoredAuthConfig {
    const existingGroups = readCustomAuthConfigGroups();
    const nextGroup: StoredAuthConfigGroup = {
        ...config,
        tenants: sanitizeTenants(config.tenants),
        externalApps: sanitizeExternalApps(config.externalApps),
        id: groupId,
        source: 'custom',
    };

    writeCustomAuthConfigGroups(existingGroups.map((group) => (group.id === groupId ? nextGroup : group)));

    const normalized = normalizeGroup(nextGroup);
    return normalized.find((entry) => entry.tenant === preferredTenant && entry.name === preferredName)
        ?? normalized.find((entry) => entry.tenant === preferredTenant)
        ?? normalized[0];
}

export function getPrimaryAuthConfig(): StoredAuthConfig {
    const primaryConfig = getAuthConfigById(getSelectedAuthConfigId());

    if (!primaryConfig) {
        throw new Error('Authentication configuration is not selected. Choose an organization, tenant, and auth config first.');
    }

    return primaryConfig;
}
