import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, CircleHelp, Pencil, Plus, PlugZap, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { tooltip } from '@/config/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AuthConfigExternalAppInput, StoredAuthConfig } from '@/config/authConfig';

type ConnectionManagerProps = {
    compact?: boolean;
};

type AuthConfigFormState = {
    organization: string;
    tenants: string;
    urlApp: string;
    urlBase: string;
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

const EMPTY_EXTERNAL_APP: AuthConfigExternalAppInput = {
    name: '',
    clientId: '',
    scope: '',
    urlAppRedirect: '',
};

const EMPTY_FORM: AuthConfigFormState = {
    organization: '',
    tenants: '',
    urlApp: '',
    urlBase: '',
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

export function ConnectionManager({ compact = false }: ConnectionManagerProps) {
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
    const [selectedOrganizationKey, setSelectedOrganizationKey] = useState('');
    const [selectedTenant, setSelectedTenant] = useState('');
    const [selectedAuthConfigName, setSelectedAuthConfigName] = useState('');
    const [expandedAuthConfigs, setExpandedAuthConfigs] = useState<boolean[]>([true]);

    const canSave = useMemo(
        () => [form.organization, form.urlApp, form.urlBase].every((value) => value.trim().length > 0)
            && parseTenants(form.tenants).length > 0
            && form.externalApps.some((externalApp) => externalApp.clientId.trim().length > 0),
        [form],
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
                urlBase: activeAuthConfigGroup.urlBase,
                externalApps: activeAuthConfigGroup.externalApps.length
                    ? activeAuthConfigGroup.externalApps.map((externalApp) => ({ ...externalApp }))
                    : [{ ...EMPTY_EXTERNAL_APP }],
            });
            setExpandedAuthConfigs(activeAuthConfigGroup.externalApps.length
                ? activeAuthConfigGroup.externalApps.map((_, index) => index === 0)
                : [true]);
            return;
        }

        setForm(EMPTY_FORM);
        setExpandedAuthConfigs([true]);
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
            urlBase: form.urlBase.trim(),
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
        setExpandedAuthConfigs([true]);
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
        setSelectedAuthConfigName('');
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
                            <Label htmlFor="auth-config-select">Auth Config</Label>
                            <Select value={selectedAuthConfigName || undefined} onValueChange={handleAuthConfigChange} disabled={!selectedOrganization || !selectedTenant}>
                                <SelectTrigger id="auth-config-select" className="w-full">
                                    <SelectValue placeholder="Select an auth config" />
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
                        <p>Scope: {activeAuthConfig.scope}</p>
                        <p>Redirect Uri: {activeAuthConfig.urlAppRedirect}</p>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Authentication will stay disabled until you select an organization, a tenant, and an auth config.
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
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <LabelWithTooltip htmlFor="organization" label="Organization" tooltipText={undefined} />
                                        <Input id="organization" value={form.organization} onChange={(event) => handleFieldChange('organization', event.target.value)} />
                                    </div>

                                    <div className="space-y-2 sm:col-span-3">
                                        <LabelWithTooltip htmlFor="tenants" label="Tenants" tooltipText={tooltip.connectionEditor.tenants} />
                                        <Textarea
                                            id="tenants"
                                            value={form.tenants}
                                            onChange={(event) => handleFieldChange('tenants', event.target.value)}
                                            rows={4}
                                            placeholder="Enter one tenant per line or separate with commas"
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <LabelWithTooltip htmlFor="base-url" label="Base URL" tooltipText={tooltip.connectionEditor.urlBase} />
                                        <Input id="base-url" value={form.urlBase} onChange={(event) => handleFieldChange('urlBase', event.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-medium">Authorization Configuration</h3>
                                            <p className="text-xs text-muted-foreground">Configure one or more external apps used for OAuth authentication.</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={handleAddExternalApp}>
                                            <Plus />
                                            Add Auth Config
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {form.externalApps.map((externalApp, index) => {
                                            const authConfigTitle = externalApp.name.trim() || `Auth Config ${index + 1}`;
                                            const isOpen = expandedAuthConfigs[index] ?? false;

                                            return (
                                                <Collapsible key={`external-app-${index}`} open={isOpen} onOpenChange={(nextOpen) => handleToggleExternalApp(index, nextOpen)}>
                                                    <div className="rounded-lg border bg-background p-4">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <CollapsibleTrigger asChild>
                                                                <button type="button" className="flex flex-1 items-center justify-between gap-3 text-left">
                                                                    <h4 className="text-sm font-medium">Auth Config: {authConfigTitle}</h4>
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
                                                                    />
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

    if (compact) {
        return <div className="rounded-xl border bg-card/90 p-4 shadow-sm backdrop-blur">{content}</div>;
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <PlugZap className="h-4 w-4" />
                    Connection Settings
                </CardTitle>
                <CardDescription>
                    Choose an organization, tenant, and auth config before signing in, or add and edit connections with multiple tenants.
                </CardDescription>
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
}
