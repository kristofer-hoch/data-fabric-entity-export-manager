import React, { useState, useMemo } from 'react';
import { Download, Eye, Loader2, AlertCircle, FileText } from 'lucide-react';
import { useEntities } from '@/hooks/useEntities';
import { EntityPreviewModal } from '@/components/EntityPreviewModal';
import { downloadCSV, convertToCSV } from '@/utils/csvExport';
import { toast } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/sonner';
import type { EntityGetResponse } from '@uipath/uipath-typescript/entities';
import { format } from 'date-fns';
export function EntityBrowser() {
  const { entities, isLoading, error, refetch } = useEntities();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewEntity, setPreviewEntity] = useState<EntityGetResponse | null>(null);
  const [exportingIds, setExportingIds] = useState<Set<string>>(new Set());
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
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
    } else {
      setSelectedIds(new Set(entities.map(e => e.id)));
    }
  };
  const exportEntity = async (entity: EntityGetResponse) => {
    setExportingIds(prev => new Set(prev).add(entity.id));
    try {
      const result = await entity.getAllRecords();
      const records = result.items || [];
      if (records.length === 0) {
        const headers = entity.fields?.map(f => f.name).join(',') || '';
        const csv = headers;
        const filename = `${entity.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(csv, filename);
        toast.success(`Exported ${entity.displayName || entity.name}`, {
          description: 'No records found - exported headers only',
        });
      } else {
        const fieldNames = entity.fields?.map(f => f.name) || [];
        const csv = convertToCSV(records, fieldNames);
        const filename = `${entity.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(csv, filename);
        toast.success(`Exported ${entity.displayName || entity.name}`, {
          description: `${records.length} record${records.length !== 1 ? 's' : ''} exported`,
        });
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed', {
        description: err instanceof Error ? err.message : 'Failed to export entity data',
      });
    } finally {
      setExportingIds(prev => {
        const next = new Set(prev);
        next.delete(entity.id);
        return next;
      });
    }
  };
  const exportSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchExporting(true);
    const selectedEntities = entities.filter(e => selectedIds.has(e.id));
    let successCount = 0;
    let failCount = 0;
    for (const entity of selectedEntities) {
      try {
        const result = await entity.getAllRecords();
        const records = result.items || [];
        const fieldNames = entity.fields?.map(f => f.name) || [];
        const csv = records.length > 0 ? convertToCSV(records, fieldNames) : fieldNames.join(',');
        const filename = `${entity.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(csv, filename);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Failed to export ${entity.name}:`, err);
        failCount++;
      }
    }
    setIsBatchExporting(false);
    if (failCount === 0) {
      toast.success('Batch export complete', {
        description: `${successCount} ${successCount !== 1 ? 'entities' : 'entity'} exported successfully`,
      });
    } else {
      toast.warning('Batch export completed with errors', {
        description: `${successCount} succeeded, ${failCount} failed`,
      });
    }
    setSelectedIds(new Set());
  };
  const selectedCount = selectedIds.size;
  const allSelected = entities.length > 0 && selectedIds.size === entities.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < entities.length;
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Failed to load entities</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={refetch}
                className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Data Service</span>
                <span>/</span>
                <span>Entities</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Data Fabric Entities</h1>
            </div>
          </div>
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedCount > 0 ? (
                  <>
                    <span className="font-medium text-gray-900">{selectedCount}</span> selected
                  </>
                ) : (
                  <>
                    <span className="font-medium text-gray-900">{entities.length}</span> {entities.length !== 1 ? 'entities' : 'entity'}
                  </>
                )}
              </span>
            </div>
            <button
              onClick={exportSelected}
              disabled={selectedCount === 0 || isBatchExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isBatchExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Selected</span>
                </>
              )}
            </button>
          </div>
          {isLoading ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-3 py-3 text-left">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-3 py-3">
                          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-12 ml-auto" />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-8 ml-auto" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : entities.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12">
              <div className="text-center space-y-3">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                <h3 className="text-sm font-medium text-gray-900">No entities found</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  No Data Fabric entities are available in this tenant. Create entities in Data Service to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={input => {
                            if (input) input.indeterminate = someSelected;
                          }}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 cursor-pointer"
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fields</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entities.map(entity => {
                      const isSelected = selectedIds.has(entity.id);
                      const isExporting = exportingIds.has(entity.id);
                      const fieldCount = entity.fields?.length || 0;
                      return (
                        <tr
                          key={entity.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(entity.id)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {entity.displayName || entity.name}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-gray-600 max-w-md truncate">
                              {entity.description || '—'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="text-sm text-gray-700 tabular-nums">—</div>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="text-sm text-gray-500 tabular-nums">{fieldCount}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setPreviewEntity(entity)}
                                className="p-2 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                title="Preview entity"
                              >
                                <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              </button>
                              <button
                                onClick={() => exportEntity(entity)}
                                disabled={isExporting}
                                className="p-2 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export to CSV"
                              >
                                {isExporting ? (
                                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 text-gray-400 hover:text-gray-600" />
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
      {previewEntity && (
        <EntityPreviewModal
          entity={previewEntity}
          onClose={() => setPreviewEntity(null)}
        />
      )}
      <Toaster richColors closeButton position="top-right" />
    </>
  );
}
