import React, { useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Download, Eye, FileText, Loader2 } from 'lucide-react';
import type { EntityGetResponse } from '@uipath/uipath-typescript/entities';
import { EntityPreviewModal } from '@/components/EntityPreviewModal';
import { Toaster, toast } from '@/components/ui/sonner';
import { useEntities } from '@/hooks/useEntities';
import { convertToCSV, downloadCSV } from '@/utils/csvExport';

export function EntityBrowser() {
  const { entities, isLoading, error, refetch } = useEntities();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewEntity, setPreviewEntity] = useState<EntityGetResponse | null>(null);
  const [exportingIds, setExportingIds] = useState<Set<string>>(new Set());
  const [isBatchExporting, setIsBatchExporting] = useState(false);

  const getAllEntityRecords = async (entity: EntityGetResponse) => {
    const records = [];
    let result = await entity.getAllRecords({ pageSize: 500 });

    records.push(...(result.items || []));

    while (result.hasNextPage && result.nextCursor) {
      result = await entity.getAllRecords({ cursor: result.nextCursor });
      records.push(...(result.items || []));
    }

    return records;
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entities.length) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(entities.map((entity) => entity.id)));
  };

  const exportEntity = async (entity: EntityGetResponse) => {
    setExportingIds((prev) => new Set(prev).add(entity.id));

    try {
      const records = await getAllEntityRecords(entity);
      const filename = `${entity.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;

      if (records.length === 0) {
        const headers = entity.fields?.map((field) => field.name).join(',') || '';
        downloadCSV(headers, filename);
        toast.success(`Exported ${entity.displayName || entity.name}`, {
          description: 'No records found. Exported headers only.',
        });
        return;
      }

      const fieldNames = entity.fields?.map((field) => field.name) || [];
      const csv = convertToCSV(records, fieldNames);
      downloadCSV(csv, filename);
      toast.success(`Exported ${entity.displayName || entity.name}`, {
        description: `${records.length} record${records.length !== 1 ? 's' : ''} exported.`,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed', {
        description: err instanceof Error ? err.message : 'Failed to export entity data.',
      });
    } finally {
      setExportingIds((prev) => {
        const next = new Set(prev);
        next.delete(entity.id);
        return next;
      });
    }
  };

  const exportSelected = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    setIsBatchExporting(true);
    const selectedEntities = entities.filter((entity) => selectedIds.has(entity.id));
    let successCount = 0;
    let failCount = 0;

    for (const entity of selectedEntities) {
      try {
        const records = await getAllEntityRecords(entity);
        const fieldNames = entity.fields?.map((field) => field.name) || [];
        const csv = records.length > 0 ? convertToCSV(records, fieldNames) : fieldNames.join(',');
        const filename = `${entity.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;

        downloadCSV(csv, filename);
        successCount++;
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Failed to export ${entity.name}:`, err);
        failCount++;
      }
    }

    setIsBatchExporting(false);

    if (failCount === 0) {
      toast.success('Batch export complete', {
        description: `${successCount} ${successCount !== 1 ? 'entities' : 'entity'} exported successfully.`,
      });
    } else {
      toast.warning('Batch export completed with errors', {
        description: `${successCount} succeeded, ${failCount} failed.`,
      });
    }

    setSelectedIds(new Set());
  };

  const selectedCount = selectedIds.size;
  const allSelected = entities.length > 0 && selectedIds.size === entities.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < entities.length;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Failed to load entities</h3>
              <p className="mt-1 text-sm text-destructive/80">{error}</p>
              <button onClick={refetch} className="mt-3 text-sm font-medium text-destructive underline">
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Data Service</span>
                <span>/</span>
                <span>Entities</span>
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[#182126]">Data Fabric Entities</h1>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[#182126]/10 bg-white/90 px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {selectedCount > 0 ? (
                  <>
                    <span className="font-semibold text-[#182126]">{selectedCount}</span> selected
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-[#182126]">{entities.length}</span> {entities.length !== 1 ? 'entities' : 'entity'}
                  </>
                )}
              </span>
            </div>

            <button
              onClick={exportSelected}
              disabled={selectedCount === 0 || isBatchExporting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fa4616] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#e33d10] focus:outline-none focus:ring-2 focus:ring-[#fa4616] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#d9d9d9]"
            >
              {isBatchExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export selected</span>
                </>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-[#182126]/10 bg-white/90 shadow-soft">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#182126]/10">
                  <thead className="bg-[#f4fbfd]">
                    <tr>
                      <th className="w-12 px-3 py-3 text-left">
                        <div className="h-4 w-4 animate-pulse rounded bg-[#d9d9d9]" />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Entity Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Description</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Fields</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182126]/10 bg-white">
                    {[...Array(5)].map((_, index) => (
                      <tr key={index}>
                        <td className="px-3 py-3">
                          <div className="h-4 w-4 animate-pulse rounded bg-[#d9d9d9]" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 w-32 animate-pulse rounded bg-[#d9d9d9]" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 w-48 animate-pulse rounded bg-[#d9d9d9]" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="ml-auto h-4 w-8 animate-pulse rounded bg-[#d9d9d9]" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-8 w-8 animate-pulse rounded-full bg-[#d9d9d9]" />
                            <div className="h-8 w-8 animate-pulse rounded-full bg-[#d9d9d9]" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : entities.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[#182126]/10 bg-white/90 p-12 shadow-soft">
              <div className="space-y-3 text-center">
                <FileText className="mx-auto h-12 w-12 text-[#0ba2b3]" />
                <h3 className="text-sm font-medium text-[#182126]">No entities found</h3>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  No Data Fabric entities are available in this tenant. Create entities in Data Service to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.5rem] border border-[#182126]/10 bg-white/90 shadow-soft">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#182126]/10">
                  <thead className="bg-[#f4fbfd]">
                    <tr>
                      <th className="w-12 px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = someSelected;
                            }
                          }}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 cursor-pointer rounded border-[#d9d9d9] text-[#fa4616] focus:ring-2 focus:ring-[#fa4616] focus:ring-offset-0"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Entity Name</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Description</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Fields</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182126]/10 bg-white">
                    {entities.map((entity) => {
                      const isSelected = selectedIds.has(entity.id);
                      const isExporting = exportingIds.has(entity.id);
                      const fieldCount = entity.fields?.length || 0;

                      return (
                        <tr key={entity.id} className={isSelected ? 'bg-[#fff4ef]' : 'transition-colors hover:bg-[#f9fbfc]'}>
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(entity.id)}
                              className="h-4 w-4 cursor-pointer rounded border-[#d9d9d9] text-[#fa4616] focus:ring-2 focus:ring-[#fa4616] focus:ring-offset-0"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm font-medium text-[#182126]">{entity.displayName || entity.name}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="max-w-md truncate text-sm text-muted-foreground">{entity.description || '-'}</div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="text-sm tabular-nums text-muted-foreground">{fieldCount}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPreviewEntity(entity)}
                                className="rounded-full p-2 transition-colors hover:bg-[#ccf2ff]/50 focus:outline-none focus:ring-2 focus:ring-[#0ba2b3] focus:ring-offset-0"
                                title="Preview entity"
                              >
                                <Eye className="h-4 w-4 text-[#0ba2b3]" />
                              </button>
                              <button
                                onClick={() => exportEntity(entity)}
                                disabled={isExporting}
                                className="rounded-full p-2 transition-colors hover:bg-[#fff4ef] focus:outline-none focus:ring-2 focus:ring-[#fa4616] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Export to CSV"
                              >
                                {isExporting ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-[#fa4616]" />
                                ) : (
                                  <Download className="h-4 w-4 text-[#fa4616]" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewEntity ? <EntityPreviewModal entity={previewEntity} onClose={() => setPreviewEntity(null)} /> : null}
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
