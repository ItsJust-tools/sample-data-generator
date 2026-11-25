import type { SampleRecord } from './types';

const CSV_COLUMNS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'phone',
  'street',
  'city',
  'zip',
  'country',
  'ipv4',
  'ipv6',
  'mac',
] as const;

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize records to RFC 4180-style CSV with a fixed column order. */
export function toCsv(records: SampleRecord[]): string {
  const lines = [CSV_COLUMNS.join(',')];
  for (const r of records) {
    lines.push(CSV_COLUMNS.map((col) => csvEscape(String(r[col] ?? ''))).join(','));
  }
  return lines.join('\n');
}

/** Serialize records to pretty-printed JSON. */
export function toJson(records: SampleRecord[]): string {
  return JSON.stringify(records, null, 2);
}
