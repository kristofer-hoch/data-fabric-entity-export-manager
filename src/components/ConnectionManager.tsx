import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown, CircleHelp, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { tooltip } from '@/config/tooltip';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { deriveBaseUrl, getMissingRequiredScopes, REQUIRED_DATA_FABRIC_SCOPES } from '@/config/authConfig';
import type { AuthConfigExternalAppInput, StoredAuthConfig } from '@/config/authConfig';

type AuthConfigFormState = {
    organization: string;
    tenants: string;
    urlApp: string;
    externalApps: AuthConfigExternalAppInput[];
};

type OrganizationOption = {
    key: string;
    urlApp: string;
    organization: string;
    label: string;
};

type LabelWithTooltipProps = {
    htmlFor: string;
    label: string;
    tooltipText?: string;
};

const REQUIRED_SCOPE_TEXT = REQUIRED_DATA_FABRIC_SCOPES.join(' ');

const EMPTY_EXTERNAL_APP: AuthConfigExternalAppInput = {
    name: '',
    clientId: '',
    scope: REQUIRED_SCOPE_TEXT,
    urlAppRedirect: '',
};

const EMPTY_FORM: AuthConfigFormState = {
    organization: '',
    tenants: '',
    urlApp: '',
    externalApps: [{ ...EMPTY_EXTERNAL_APP }],
};

function parseTenants(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(/[\n,]/)
                .map((tenant) => tenant.trim())
                .filter(Boolean),
        ),
    );
}

function getUniqueConfigOptions(configs: StoredAuthConfig[]): StoredAuthConfig[] {
    const seen = new Set<string>();

    return configs.filter((config) => {
        const key = `${config.groupId}:${config.name}`;
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function buildOrganizationOptions(configs: StoredAuthConfig[]): OrganizationOption[] {
    const seen = new Set<string>();

    return configs.filter((config) => {
        const key = `${config.urlApp}::${config.organization}`;
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    }).map((config) => ({
        key: `${config.urlApp}::${config.organization}`,
        urlApp: config.urlApp,
        organization: config.organization,
        label: `${config.urlApp} / ${config.organization}`,
    }));
}

function LabelWithTooltip({ htmlFor, label, tooltipText }: LabelWithTooltipProps) {
    return (
        <div className="flex items-center gap-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {tooltipText ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground transition-colors hover:text-foreground" aria-label={`${label} help`}>
                            <CircleHelp className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-balance">
                        <p>{tooltipText}</p>
                    </TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}

export function ConnectionManager() {
    const {
        authConfigs,
        activeAuthConfig,
        activeAuthConfigGroup,
        selectAuthConfig,
        addAuthConfig,
        updateAuthConfig,
        resetAuthConfigs,
    } = useAuth();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'add' | 'edit'>('add');
    const [form, setForm] = useState<AuthConfigFormState>(EMPTY_FORM);
    const [tenantDraft, setTenantDraft] = useState('');
    const [selectedOrganizationKey, setSelectedOrganizationKey] = useState('');
    const [selectedTenant, setSelectedTenant] = useState('');
    const [selectedAuthConfigName, setSelectedAuthConfigName] = useState('');
    const [expandedAuthConfigs, setExpandedAuthConfigs] = useState<boolean[]>([true]);

    const externalAppScopeIssues = useMemo(
        () => form.externalApps.map((externalApp) => (
            externalApp.clientId.trim().length > 0 ? getMissingRequiredScopes(externalApp.scope) : []
        )),
        [form.externalApps],
    );

    const derivedBaseUrl = useMemo(
        () => deriveBaseUrl(form.urlApp),
        [form.urlApp],
    );

    const canSave = useMemo(
        () => [form.organization, form.urlApp].every((value) => value.trim().length > 0)
            && derivedBaseUrl.length > 0
            && parseTenants(form.tenants).length > 0
            && form.externalApps.some((externalApp) => externalApp.clientId.trim().length > 0)
            && externalAppScopeIssues.every((missingScopes) => missingScopes.length === 0),
        [derivedBaseUrl, externalAppScopeIssues, form],
    );

    const organizationOptions = useMemo(
        () => buildOrganizationOptions(authConfigs),
        [authConfigs],
    );

    const selectedOrganization = useMemo(
        () => organizationOptions.find((option) => option.key === selectedOrganizationKey) ?? null,
        [organizationOptions, selectedOrganizationKey],
    );

    const availableTenants = useMemo(
        () => Array.from(new Set(
            authConfigs
                .filter((config) => config.urlApp === selectedOrganization?.urlApp && config.organization === selectedOrganization?.organization)
                .map((config) => config.tenant)
                .filter(Boolean),
        )),
        [authConfigs, selectedOrganization],
    );

    const availableAuthConfigs = useMemo(
        () => getUniqueConfigOptions(
            authConfigs.filter(
                (config) => config.urlApp === selectedOrganization?.urlApp
                    && config.organization === selectedOrganization?.organization
                    && config.tenant === selectedTenant,
            ),
        ),
        [authConfigs, selectedOrganization, selectedTenant],
    );

    const tenantValues = useMemo(
        () => parseTenants(form.tenants),
        [form.tenants],
    );

    useEffect(() => {
        setExpandedAuthConfigs((current) => form.externalApps.map((_, index) => current[index] ?? index === form.externalApps.length - 1));
    }, [form.externalApps.length]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (mode === 'edit' && activeAuthConfigGroup) {
            setForm({
                organization: activeAuthConfigGroup.organization,
                tenants: activeAuthConfigGroup.tenants.join('\n'),
                urlApp: activeAuthConfigGroup.urlApp,
                externalApps: activeAuthConfigGroup.externalApps.length
                    ? activeAuthConfigGroup.externalApps.map((externalApp) => ({ ...externalApp }))
                    : [{ ...EMPTY_EXTERNAL_APP }],
            });
            setExpandedAuthConfigs(activeAuthConfigGroup.externalApps.length
                ? activeAuthConfigGroup.externalApps.map((_, index) => index === 0)
                : [true]);
            setTenantDraft('');
            return;
        }

        setForm(EMPTY_FORM);
        setExpandedAuthConfigs([true]);
        setTenantDraft('');
    }, [activeAuthConfigGroup, mode, open]);

    useEffect(() => {
        if (activeAuthConfig) {
            setSelectedOrganizationKey(`${activeAuthConfig.urlApp}::${activeAuthConfig.organization}`);
            setSelectedTenant(activeAuthConfig.tenant);
            setSelectedAuthConfigName(activeAuthConfig.name);
            return;
        }

        if (selectedOrganizationKey && !organizationOptions.some((option) => option.key === selectedOrganizationKey)) {
            setSelectedOrganizationKey('');
            setSelectedTenant('');
            setSelectedAuthConfigName('');
            return;
        }

        if (selectedTenant && !availableTenants.includes(selectedTenant)) {
            setSelectedTenant('');
            setSelectedAuthConfigName('');
            return;
        }

        if (selectedAuthConfigName && !availableAuthConfigs.some((config) => config.name === selectedAuthConfigName)) {
            setSelectedAuthConfigName('');
        }
    }, [
        activeAuthConfig,
        availableAuthConfigs,
        availableTenants,
        organizationOptions,
        selectedAuthConfigName,
        selectedOrganizationKey,
        selectedTenant,
    ]);

    const handleFieldChange = (field: keyof Omit<AuthConfigFormState, 'externalApps'>, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleExternalAppChange = (index: number, field: keyof AuthConfigExternalAppInput, value: string) => {
        setForm((current) => ({
            ...current,
            externalApps: current.externalApps.map((externalApp, externalAppIndex) => (
                externalAppIndex === index ? { ...externalApp, [field]: value } : externalApp
            )),
        }));
    };

    const updateTenantValues = (tenants: string[]) => {
        handleFieldChange('tenants', tenants.join('\n'));
    };

    const commitTenantDraft = () => {
        if (!tenantDraft.trim()) {
            return;
        }

        updateTenantValues(parseTenants([...tenantValues, tenantDraft].join('\n')));
        setTenantDraft('');
    };

    const handleTenantKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            commitTenantDraft();
            return;
        }

        if (event.key === 'Backspace' && tenantDraft.length === 0 && tenantValues.length > 0) {
            event.preventDefault();
            updateTenantValues(tenantValues.slice(0, -1));
        }
    };

    const handleRemoveTenant = (tenantToRemove: string) => {
        updateTenantValues(tenantValues.filter((tenant) => tenant !== tenantToRemove));
    };

    const handleAddExternalApp = () => {
        setForm((current) => ({
            ...current,
            externalApps: [...current.externalApps, { ...EMPTY_EXTERNAL_APP }],
        }));
        setExpandedAuthConfigs((current) => [...current.map(() => false), true]);
    };

    const handleRemoveExternalApp = (index: number) => {
        setForm((current) => ({
            ...current,
            externalApps: current.externalApps.length === 1
                ? [{ ...EMPTY_EXTERNAL_APP }]
                : current.externalApps.filter((_, externalAppIndex) => externalAppIndex !== index),
        }));
        setExpandedAuthConfigs((current) => {
            if (current.length === 1) {
                return [true];
            }

            const next = current.filter((_, externalAppIndex) => externalAppIndex !== index);
            return next.some(Boolean) ? next : next.map((_, externalAppIndex) => externalAppIndex === 0);
        });
    };

    const handleToggleExternalApp = (index: number, nextOpen: boolean) => {
        setExpandedAuthConfigs((current) => current.map((isOpen, externalAppIndex) => (
            externalAppIndex === index ? nextOpen : isOpen
        )));
    };

    const handleSave = () => {
        if (!canSave) {
            return;
        }

        const payload = {
            organization: form.organization.trim(),
            tenants: parseTenants(form.tenants),
            urlApp: form.urlApp.trim(),
            urlBase: deriveBaseUrl(form.urlApp),
            externalApps: form.externalApps.map((externalApp) => ({
                name: externalApp.name.trim(),
                clientId: externalApp.clientId.trim(),
                scope: externalApp.scope.trim(),
                urlAppRedirect: externalApp.urlAppRedirect.trim(),
            })),
        };

        if (mode === 'edit' && activeAuthConfig?.source === 'custom') {
            updateAuthConfig(activeAuthConfig.groupId, payload, activeAuthConfig.tenant, activeAuthConfig.name);
        } else {
            addAuthConfig(payload);
        }

        setForm(EMPTY_FORM);
        setTenantDraft('');
        setExpandedAuthConfigs([true]);
        setOpen(false);
    };

    const handleResetConnections = () => {
        const shouldReset = window.confirm('Clear all saved connections and restore the initial configuration from the .env file?');
        if (!shouldReset) {
            return;
        }

        setForm(EMPTY_FORM);
        setExpandedAuthConfigs([true]);
        setOpen(false);
        setSelectedOrganizationKey('');
        setSelectedTenant('');
        setSelectedAuthConfigName('');
        selectAuthConfig(null);
        resetAuthConfigs();
    };

    const handleOrganizationChange = (organizationKey: string) => {
        setSelectedOrganizationKey(organizationKey);
        setSelectedTenant('');
        setSelectedAuthConfigName('');
        selectAuthConfig(null);
    };

    const handleTenantChange = (tenant: string) => {
        setSelectedTenant(tenant);

        const preferredAuthConfigName = selectedAuthConfigName || activeAuthConfig?.name;
        if (!preferredAuthConfigName) {
            selectAuthConfig(null);
            return;
        }

        const nextConfig = authConfigs.find(
            (config) => config.urlApp === selectedOrganization?.urlApp
                && config.organization === selectedOrganization?.organization
                && config.tenant === tenant
                && config.name === preferredAuthConfigName,
        );

        if (nextConfig) {
            setSelectedAuthConfigName(nextConfig.name);
            selectAuthConfig(nextConfig.id);
            return;
        }

        selectAuthConfig(null);
    };

    const handleAuthConfigChange = (authConfigName: string) => {
        setSelectedAuthConfigName(authConfigName);

        const nextConfig = authConfigs.find(
            (config) => config.urlApp === selectedOrganization?.urlApp
                && config.organization === selectedOrganization?.organization
                && config.tenant === selectedTenant
                && config.name === authConfigName,
        );

        selectAuthConfig(nextConfig?.id ?? null);
    };

    const openAddDialog = () => {
        setMode('add');
        setForm(EMPTY_FORM);
        setExpandedAuthConfigs([true]);
        setOpen(true);
    };

    const openEditDialog = () => {
        setMode('edit');
        setOpen(true);
    };

    const content = (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="organization-select">Organization</Label>
                        <Select value={selectedOrganizationKey || undefined} onValueChange={handleOrganizationChange}>
                            <SelectTrigger id="organization-select" className="w-full">
                                <SelectValue placeholder="Select app URL and organization" />
                            </SelectTrigger>
                            <SelectContent>
                                {organizationOptions.map((option) => (
                                    <SelectItem key={option.key} value={option.key}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="tenant-select">Tenant</Label>
                            <Select value={selectedTenant || undefined} onValueChange={handleTenantChange} disabled={!selectedOrganization}>
                                <SelectTrigger id="tenant-select" className="w-full">
                                    <SelectValue placeholder="Select a tenant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTenants.map((tenant) => (
                                        <SelectItem key={tenant} value={tenant}>
                                            {tenant}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="auth-config-select">Non-Confidential External Application Config</Label>
                            <Select value={selectedAuthConfigName || undefined} onValueChange={handleAuthConfigChange} disabled={!selectedOrganization || !selectedTenant}>
                                <SelectTrigger id="auth-config-select" className="w-full">
                                    <SelectValue placeholder="Select a non-confidential external application config" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAuthConfigs.map((config) => (
                                        <SelectItem key={`${config.groupId}:${config.name}`} value={config.name}>
                                            {config.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {activeAuthConfig ? (
                    <div className="space-y-1 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                        <p>{activeAuthConfig.urlApp}/{activeAuthConfig.organization}/{activeAuthConfig.tenant}</p>
                        <p>{activeAuthConfig.name}</p>
                        <p>Client Id: {activeAuthConfig.clientId}</p>
                        <p>Base URL: {activeAuthConfig.urlBase}</p>
                        <p>Scope: {activeAuthConfig.scope}</p>
                        <p>Redirect Uri: {activeAuthConfig.urlAppRedirect}</p>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Authentication will stay disabled until you select an organization, a tenant, and a non-confidential external application config.
                    </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={openAddDialog}>
                                <Plus />
                                Add Connection
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="max-w-3xl"
                            onInteractOutside={(event) => event.preventDefault()}
                            onEscapeKeyDown={(event) => event.preventDefault()}
                        >
                            <DialogHeader>
                                <DialogTitle>{mode === 'edit' ? 'Edit Authentication Configuration' : 'Add Authentication Configuration'}</DialogTitle>
                                <DialogDescription>
                                    Save UiPath connection settings locally in this browser, including one or more tenants and multiple external apps.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-5">
                                    <div className="space-y-2 sm:col-span-3">
                                        <LabelWithTooltip htmlFor="url-app" label="App URL" tooltipText={tooltip.connectionEditor.urlApp} />
                                        <Input id="url-app" value={form.urlApp} onChange={(event) => handleFieldChange('urlApp', event.target.value)} />
                                        <p className="text-xs text-muted-foreground">
                                            {derivedBaseUrl ? `Derived Base URL: ${derivedBaseUrl}` : 'Supported App URLs map to alpha, staging, or cloud UiPath environments.'}
                                        </p>
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <LabelWithTooltip htmlFor="organization" label="Organization" tooltipText={undefined} />
                                        <Input id="organization" value={form.organization} onChange={(event) => handleFieldChange('organization', event.target.value)} />
                                    </div>

                                    <div className="space-y-2 sm:col-span-5">
                                        <LabelWithTooltip htmlFor="tenants" label="Tenants" tooltipText={tooltip.connectionEditor.tenants} />
                                        <div className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                                            <div className="flex min-h-16 w-full flex-wrap items-start gap-2">
                                                {tenantValues.map((tenant) => (
                                                    <Badge key={tenant} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                                                        <span>{tenant}</span>
                                                        <button
                                                            type="button"
                                                            className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                                                            onClick={() => handleRemoveTenant(tenant)}
                                                            aria-label={`Remove tenant ${tenant}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                <Input
                                                    id="tenants"
                                                    value={tenantDraft}
                                                    onChange={(event) => setTenantDraft(event.target.value)}
                                                    onKeyDown={handleTenantKeyDown}
                                                    onBlur={commitTenantDraft}
                                                    className="h-8 min-w-[12rem] flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                                                    placeholder={tenantValues.length === 0 ? 'Type a tenant and press Enter or comma' : 'Add another tenant'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium">Non-Confidential External Application Config</h3>
                                        <p className="text-xs text-muted-foreground">Configure one or more external apps used for OAuth authentication.</p>
                                        <p className="text-xs text-muted-foreground">Minimum scopes: {REQUIRED_DATA_FABRIC_SCOPES.join(', ')}</p>
                                    </div>

                                    <div>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddExternalApp}>
                                            <Plus />
                                            Add Non-Confidential External Application Config
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {externalAppScopeIssues.some((missingScopes) => missingScopes.length > 0) ? (
                                            <Alert variant="destructive">
                                                <AlertDescription>
                                                    Each non-confidential external application config must include these scopes at minimum: {REQUIRED_DATA_FABRIC_SCOPES.join(', ')}.
                                                </AlertDescription>
                                            </Alert>
                                        ) : null}
                                        {form.externalApps.map((externalApp, index) => {
                                            const authConfigTitle = externalApp.name.trim() || `Non-Confidential External Application Config ${index + 1}`;
                                            const isOpen = expandedAuthConfigs[index] ?? false;

                                            return (
                                                <Collapsible key={`external-app-${index}`} open={isOpen} onOpenChange={(nextOpen) => handleToggleExternalApp(index, nextOpen)}>
                                                    <div className="rounded-lg border bg-background p-4">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <CollapsibleTrigger asChild>
                                                                <button type="button" className="flex flex-1 items-center justify-between gap-3 text-left">
                                                                    <h4 className="text-sm font-medium">Non-Confidential External Application Config: {authConfigTitle}</h4>
                                                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            </CollapsibleTrigger>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveExternalApp(index)}
                                                                disabled={form.externalApps.length === 1}
                                                            >
                                                                <Trash2 />
                                                                Remove
                                                            </Button>
                                                        </div>

                                                        <CollapsibleContent className="space-y-4 pt-4">
                                                            <div className="grid gap-4 sm:grid-cols-2">
                                                                <div className="space-y-2 sm:col-span-2">
                                                                    <LabelWithTooltip htmlFor={`connection-name-${index}`} label="External App Name" tooltipText={tooltip.connectionEditor.externalApps.name} />
                                                                    <Input
                                                                        id={`connection-name-${index}`}
                                                                        value={externalApp.name}
                                                                        onChange={(event) => handleExternalAppChange(index, 'name', event.target.value)}
                                                                        placeholder="External app label"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2 sm:col-span-2">
                                                                    <LabelWithTooltip htmlFor={`client-id-${index}`} label="Client ID" tooltipText={tooltip.connectionEditor.externalApps.clientId} />
                                                                    <Input
                                                                        id={`client-id-${index}`}
                                                                        value={externalApp.clientId}
                                                                        onChange={(event) => handleExternalAppChange(index, 'clientId', event.target.value)}
                                                                    />
                                                                </div>

                                                                <div className="space-y-2 sm:col-span-2">
                                                                    <LabelWithTooltip htmlFor={`scope-${index}`} label="Scope" tooltipText={tooltip.connectionEditor.externalApps.scope} />
                                                                    <Textarea
                                                                        id={`scope-${index}`}
                                                                        value={externalApp.scope}
                                                                        onChange={(event) => handleExternalAppChange(index, 'scope', event.target.value)}
                                                                        rows={4}
                                                                        placeholder={REQUIRED_SCOPE_TEXT}
                                                                    />
                                                                    {externalAppScopeIssues[index]?.length ? (
                                                                        <p className="text-xs text-destructive">
                                                                            Missing required scopes: {externalAppScopeIssues[index].join(', ')}
                                                                        </p>
                                                                    ) : null}
                                                                </div>

                                                                <div className="space-y-2 sm:col-span-2">
                                                                    <LabelWithTooltip htmlFor={`redirect-uri-${index}`} label="Redirect URI" tooltipText={tooltip.connectionEditor.externalApps.urlAppRedirect ?? tooltip.connectionEditor.urlAppRedirect} />
                                                                    <Input
                                                                        id={`redirect-uri-${index}`}
                                                                        value={externalApp.urlAppRedirect}
                                                                        onChange={(event) => handleExternalAppChange(index, 'urlAppRedirect', event.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </CollapsibleContent>
                                                    </div>
                                                </Collapsible>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="button" onClick={handleSave} disabled={!canSave}>
                                    {mode === 'edit' ? 'Save Changes' : 'Save Connection'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={openEditDialog}
                        disabled={!activeAuthConfig || activeAuthConfig.source !== 'custom'}
                    >
                        <Pencil />
                        Edit Connection
                    </Button>

                    <Button
                        type="button"
                        variant="destructive"
                        className="w-full sm:w-auto"
                        onClick={handleResetConnections}
                    >
                        <RotateCcw />
                        Reset Connections
                    </Button>
                </div>
            </div>
        </TooltipProvider>
    );

    return <div className="rounded-xl border bg-card/90 p-4 shadow-sm backdrop-blur">{content}</div>;
}
