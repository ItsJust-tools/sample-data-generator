import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import { clampCount, formatOf, isLocale, type SampleRecord, type ToolState } from './types';

export { generateRecords } from './generator';
export { toCsv, toJson } from './export-data';
export type { SampleRecord, ToolState, Locale } from './types';
export {
  DEFAULT_STATE,
  DEFAULT_COUNT,
  MIN_COUNT,
  MAX_COUNT,
  clampCount,
  isLocale,
  formatOf,
} from './types';

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    count: state.count,
    locale: state.locale,
    seed: state.seed,
    format: state.format,
  });
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected sample data generator state object',
    };
  }
  const v = data as Record<string, unknown>;
  const state: ToolState = {
    count: clampCount(v.count),
    locale: isLocale(v.locale) ? v.locale : 'en',
    seed: typeof v.seed === 'string' ? v.seed : '',
    format: formatOf(v.format),
    records: Array.isArray(v.records) ? (v.records as SampleRecord[]) : [],
  };
  return { success: true, data: state };
}

/** True when a serialized string round-trips back to the same state. */
export function roundTrips(state: ToolState): boolean {
  try {
    const restored = deserializeState(JSON.parse(serializeState(state)));
    return restored.success && JSON.stringify(restored.data) === JSON.stringify(state);
  } catch {
    return false;
  }
}

export const sampleDataGeneratorTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { count: 20, locale: 'en', seed: '', format: 'json', records: [] },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};
