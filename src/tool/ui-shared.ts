import type { Locale, ToolState } from './types';

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English (US)' },
  { value: 'de', label: 'Deutsch (DE)' },
];

export const FORMATS: { value: 'json' | 'csv'; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
];

export function isState(value: unknown): value is { count: number; locale: Locale } {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as { count?: unknown; locale?: unknown };
  return typeof v.count === 'number' && (v.locale === 'en' || v.locale === 'de');
}

/** Compact summary used by the status bar and copy actions. */
export function summaryText(state: ToolState): string {
  const seedPart = state.seed ? `, seed "${state.seed}"` : '';
  return `${state.records.length} records (${state.locale.toUpperCase()}${seedPart})`;
}
