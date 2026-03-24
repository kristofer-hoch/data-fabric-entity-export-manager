import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
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
      loadRecords();
    }
  }, [activeTab]);
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
  const fieldNames = fields.map(f => f.name);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {entity.displayName || entity.name}
            </h2>
            {entity.description && (
              <p className="text-sm text-gray-600 mt-1">{entity.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'schema'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Schema
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'records'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Records Preview
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'schema' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Display Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.map(field => (
                    <tr key={field.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {field.displayName || field.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {field.dataType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {field.displayType || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {field.isRequired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Required
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
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
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-500">Loading records...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Failed to load records</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                      <button
                        onClick={loadRecords}
                        className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No records found in this entity</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        {fieldNames.map(name => (
                          <th
                            key={name}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          >
                            {name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record, idx) => (
                        <tr key={record.id || idx} className="hover:bg-gray-50">
                          {fieldNames.map(name => {
                            const value = record[name];
                            let displayValue: string;
                            if (value === null || value === undefined) {
                              displayValue = '—';
                            } else if (typeof value === 'object') {
                              displayValue = JSON.stringify(value);
                            } else if (typeof value === 'boolean') {
                              displayValue = value ? 'true' : 'false';
                            } else {
                              displayValue = String(value);
                            }
                            return (
                              <td
                                key={name}
                                className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate"
                                title={displayValue}
                              >
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
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