import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { EntityGetResponse, EntityRecord } from '@uipath/uipath-typescript/entities';

interface EntityPreviewModalProps {
  entity: EntityGetResponse;
  onClose: () => void;
}

export function EntityPreviewModal({ entity, onClose }: EntityPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'records'>('schema');
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'records' && records.length === 0) {
      void loadRecords();
    }
  }, [activeTab, records.length]);

  const loadRecords = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await entity.getAllRecords({ pageSize: 50 });
      setRecords(result.items || []);
    } catch (err) {
      console.error('Failed to load records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  const fields = entity.fields || [];
  const fieldNames = fields.map((field) => field.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#182126]/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[1.75rem] border border-white/40 bg-white shadow-[0_30px_90px_-45px_rgba(24,33,38,0.65)]">
        <div className="flex items-center justify-between border-b border-[#182126]/10 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#182126]">{entity.displayName || entity.name}</h2>
            {entity.description ? <p className="mt-1 text-sm text-muted-foreground">{entity.description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-[#f4fbfd] focus:outline-none focus:ring-2 focus:ring-[#0ba2b3] focus:ring-offset-2"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="border-b border-[#182126]/10">
          <div className="flex">
            <button
              onClick={() => setActiveTab('schema')}
              className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'schema'
                  ? 'border-[#fa4616] text-[#182126]'
                  : 'border-transparent text-muted-foreground hover:border-[#0ba2b3]/30 hover:text-[#182126]'
              }`}
            >
              Schema
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'records'
                  ? 'border-[#fa4616] text-[#182126]'
                  : 'border-transparent text-muted-foreground hover:border-[#0ba2b3]/30 hover:text-[#182126]'
              }`}
            >
              Records Preview
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'schema' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full rounded-[1.25rem] border border-[#182126]/10">
                <thead className="bg-[#f4fbfd]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Field Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Display Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182126]/10 bg-white">
                  {fields.map((field) => (
                    <tr key={field.name} className="transition-colors hover:bg-[#f9fbfc]">
                      <td className="px-4 py-3 text-sm font-medium text-[#182126]">{field.displayName || field.name}</td>
                      <td className="px-4 py-3 text-sm text-[#182126]">
                        <span className="inline-flex items-center rounded-full bg-[#ccf2ff] px-3 py-1 text-xs font-medium text-[#1e6482]">
                          {field.dataType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{field.displayType || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {field.isRequired ? (
                          <span className="inline-flex items-center rounded-full bg-[#fff4ef] px-3 py-1 text-xs font-medium text-[#a32200]">
                            Required
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-3 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading records...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-[1.25rem] border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                    <div>
                      <h3 className="text-sm font-medium text-destructive">Failed to load records</h3>
                      <p className="mt-1 text-sm text-destructive/80">{error}</p>
                      <button onClick={() => void loadRecords()} className="mt-3 text-sm font-medium text-destructive underline">
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : records.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No records found in this entity.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full rounded-[1.25rem] border border-[#182126]/10">
                    <thead className="bg-[#f4fbfd]">
                      <tr>
                        {fieldNames.map((name) => (
                          <th
                            key={name}
                            className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#1e6482]"
                          >
                            {name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182126]/10 bg-white">
                      {records.map((record, index) => (
                        <tr key={record.id || index} className="transition-colors hover:bg-[#f9fbfc]">
                          {fieldNames.map((name) => {
                            const value = record[name];
                            let displayValue: string;

                            if (value === null || value === undefined) {
                              displayValue = '-';
                            } else if (typeof value === 'object') {
                              displayValue = JSON.stringify(value);
                            } else if (typeof value === 'boolean') {
                              displayValue = value ? 'true' : 'false';
                            } else {
                              displayValue = String(value);
                            }

                            return (
                              <td key={name} className="max-w-xs truncate px-4 py-3 text-sm text-[#182126]/80" title={displayValue}>
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Showing first {records.length} record{records.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
