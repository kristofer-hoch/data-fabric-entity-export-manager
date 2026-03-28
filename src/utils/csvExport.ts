import type { EntityRecord } from '@uipath/uipath-typescript/entities';
/**
 * Escapes a CSV field value according to RFC 4180.
 * Wraps in quotes if contains comma, quote, or newline.
 * Doubles internal quotes.
 */
function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
/**
 * Converts a value to a CSV-safe string.
 * Handles primitives, objects, arrays, dates, null/undefined.
 */
function valueToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
/**
 * Converts entity records to CSV format.
 * @param records - Array of entity records
 * @param fieldNames - Array of field names to include (in order)
 * @returns CSV string with headers and data rows
 */
export function convertToCSV(records: EntityRecord[], fieldNames: string[]): string {
  if (records.length === 0) {
    return fieldNames.map(escapeCSVField).join(',');
  }
  // Collect all unique field names from records (some may have sparse data)
  const allFields = new Set<string>(fieldNames);
  records.forEach(record => {
    Object.keys(record).forEach(key => {
      if (key !== 'id' && key !== 'Id') {
        allFields.add(key);
      }
    });
  });
  const finalFields = [...allFields];
  // Build header row
  const headers = finalFields.map(escapeCSVField).join(',');
  // Build data rows
  const rows = records.map(record => {
    return finalFields
      .map(field => {
        const value = record[field];
        const stringValue = valueToString(value);
        return escapeCSVField(stringValue);
      })
      .join(',');
  });
  return [headers, ...rows].join('\n');
}
/**
 * Triggers a browser download of CSV content.
 * @param content - CSV string content
 * @param filename - Desired filename (should end with .csv)
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
