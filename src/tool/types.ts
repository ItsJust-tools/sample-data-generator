export type Locale = 'en' | 'de';

export interface ToolState {
  /** Number of records to generate per batch. */
  count: number;
  /** Output locale for names, addresses and phone numbers. */
  locale: Locale;
  /** Deterministic seed; empty string means random each run. */
  seed: string;
  /** Export format shared via the primary download buttons. */
  format: 'json' | 'csv';
  /** Latest generated records (kept so UI/export share the same data). */
  records: SampleRecord[];
}

export interface SampleRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  ipv4: string;
  ipv6: string;
  mac: string;
}

export const MIN_COUNT = 1;
export const MAX_COUNT = 1000;
export const DEFAULT_COUNT = 20;

export const DEFAULT_STATE: ToolState = {
  count: DEFAULT_COUNT,
  locale: 'en',
  seed: '',
  format: 'json',
  records: [],
};

/** Clamp any numeric-ish input into the valid count range. */
export function clampCount(value: unknown): number {
  const num = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(num)) return DEFAULT_COUNT;
  const clamped = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.trunc(num)));
  return clamped;
}

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'de';
}

export function formatOf(value: unknown): 'json' | 'csv' {
  return value === 'csv' ? 'csv' : 'json';
}
