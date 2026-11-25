import { describe, it, expect } from 'vitest';
import {
  clampCount,
  DEFAULT_COUNT,
  MAX_COUNT,
  MIN_COUNT,
  type SampleRecord,
  type ToolState,
} from '@/tool/types';
import { generateRecords, hashSeed, createRng } from '@/tool/generator';
import { toCsv, toJson } from '@/tool/export-data';
import {
  deserializeState,
  serializeState,
  roundTrips,
  sampleDataGeneratorTool,
} from '@/tool/tool-definition';

const state = (patch: Partial<ToolState> = {}): ToolState => ({
  count: DEFAULT_COUNT,
  locale: 'en',
  seed: '',
  format: 'json',
  records: [],
  ...patch,
});

describe('count clamping', () => {
  it('accepts valid counts unchanged', () => {
    expect(clampCount(1)).toBe(1);
    expect(clampCount(50)).toBe(50);
    expect(clampCount(1000)).toBe(MAX_COUNT);
  });

  it('clamps below minimum to 1', () => {
    expect(clampCount(0)).toBe(MIN_COUNT);
    expect(clampCount(-5)).toBe(MIN_COUNT);
  });

  it('clamps above maximum to 1000', () => {
    expect(clampCount(1001)).toBe(MAX_COUNT);
    expect(clampCount(50000)).toBe(MAX_COUNT);
  });

  it('falls back to the default for NaN/invalid input', () => {
    expect(clampCount('abc')).toBe(DEFAULT_COUNT);
    expect(clampCount('')).toBe(DEFAULT_COUNT);
    expect(clampCount(undefined)).toBe(DEFAULT_COUNT);
    expect(clampCount(null)).toBe(DEFAULT_COUNT);
    expect(clampCount(Number.NaN)).toBe(DEFAULT_COUNT);
  });

  it('parses numeric strings and truncates floats', () => {
    expect(clampCount('25')).toBe(25);
    expect(clampCount(7.9)).toBe(7);
    expect(clampCount(0.5)).toBe(MIN_COUNT);
  });
});

describe('seed reproducibility', () => {
  it('produces identical data for the same seed and locale', () => {
    const a = generateRecords(50, 'en', 'ci-tests');
    const b = generateRecords(50, 'en', 'ci-tests');
    expect(a).toEqual(b);
  });

  it('produces identical data across different counts with same prefix seed', () => {
    const a = generateRecords(10, 'de', 'seed-42');
    const b = generateRecords(20, 'de', 'seed-42');
    expect(b.slice(0, 10)).toEqual(a);
  });

  it('differs between seeds', () => {
    const a = generateRecords(20, 'en', 'seed-a');
    const b = generateRecords(20, 'en', 'seed-b');
    expect(a).not.toEqual(b);
  });

  it('differs between locales with the same seed', () => {
    const a = generateRecords(20, 'en', 'shared');
    const b = generateRecords(20, 'de', 'shared');
    expect(a).not.toEqual(b);
  });

  it('clamps an out-of-range count request instead of exploding', () => {
    expect(generateRecords(99999, 'en', 'x')).toHaveLength(MAX_COUNT);
    expect(generateRecords(0, 'en', 'x')).toHaveLength(1);
    expect(generateRecords('nonsense', 'en', 'x')).toHaveLength(DEFAULT_COUNT);
  });

  it('hashes distinct seeds to distinct values and is stable', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
  });

  it('rng stays within [0, 1)', () => {
    const rng = createRng('bounded');
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('record shape', () => {
  const records = generateRecords(30, 'de', 'shape');

  it('fills every field with plausible values', () => {
    for (const r of records) {
      expect(r.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(r.firstName.length).toBeGreaterThan(0);
      expect(r.lastName.length).toBeGreaterThan(0);
      expect(r.email).toMatch(/^[^@\s]+@[^@\s]+$/);
      expect(r.phone).toMatch(/^\+49-171-\d{4}$/);
      expect(r.zip).toMatch(/^\d{5}$/);
      expect(r.ipv4).toMatch(/^(\d{1,3}\.){3}\d{1,3}$/);
      for (const octet of r.ipv4.split('.')) {
        expect(Number(octet)).toBeLessThanOrEqual(255);
      }
      expect(r.ipv6).toMatch(/^([0-9a-f]{4}:){7}[0-9a-f]{4}$/);
      expect(r.mac).toMatch(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/);
      expect(r.country).toBe('Deutschland');
    }
  });

  it('generates locale-specific addresses', () => {
    const enFirst = generateRecords(5, 'en', 'loc')[0];
    const deFirst = generateRecords(5, 'de', 'loc')[0];
    expect(enFirst?.country).toBe('United States');
    expect(deFirst?.country).toBe('Deutschland');
  });
});

describe('exporters', () => {
  const records: SampleRecord[] = [
    {
      id: 'id-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+1-555-0100',
      street: '1 Analytical Way',
      city: 'London',
      zip: '12345',
      country: 'United States',
      ipv4: '192.168.0.1',
      ipv6: 'fe80::1',
      mac: '02:00:00:00:00:01',
    },
  ];

  it('writes valid JSON matching the records', () => {
    const parsed: unknown = JSON.parse(toJson(records));
    expect(parsed).toEqual(records);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('writes CSV with the exact fixed column header', () => {
    const header = toCsv(records).split('\n')[0];
    expect(header).toBe('id,firstName,lastName,email,phone,street,city,zip,country,ipv4,ipv6,mac');
  });

  it('writes one CSV data row per record in column order', () => {
    const row = toCsv(records).split('\n')[1];
    expect(row).toBe(
      'id-1,Ada,Lovelace,ada@example.com,+1-555-0100,1 Analytical Way,London,12345,United States,192.168.0.1,fe80::1,02:00:00:00:00:01'
    );
  });

  it('quotes CSV fields containing commas, quotes or newlines', () => {
    const tricky: SampleRecord[] = [
      {
        ...records[0]!,
        street: '42 "Quoted", Road\nLine2',
      },
    ];
    const csv = toCsv(tricky);
    expect(csv).toContain('"42 ""Quoted"", Road\nLine2"');
  });

  it('produces an empty CSV for no records (header only)', () => {
    expect(toCsv([]).split('\n')).toHaveLength(1);
    expect(toJson([])).toBe('[]');
  });
});

describe('serialization round-trip', () => {
  it('round-trips a typical state', () => {
    const s = state({ count: 42, locale: 'de', seed: 'round', format: 'csv' });
    expect(roundTrips(s)).toBe(true);
  });

  it('serialized output contains the key configuration', () => {
    const s = state({ count: 7, seed: 'abc', locale: 'de', format: 'csv' });
    const text = serializeState(s);
    expect(text).toContain('"count":7');
    expect(text).toContain('"seed":"abc"');
    expect(text).toContain('"locale":"de"');
    expect(text).toContain('"format":"csv"');
  });

  it('deserializes valid payloads with defaults for missing keys', () => {
    const result = deserializeState({ count: 5, locale: 'de' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(5);
      expect(result.data.locale).toBe('de');
      expect(result.data.seed).toBe('');
      expect(result.data.format).toBe('json');
    }
  });

  it('clamps invalid counts and locales during deserialization', () => {
    const result = deserializeState({ count: 99999, locale: 'fr', seed: 12, format: 'xml' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(MAX_COUNT);
      expect(result.data.locale).toBe('en');
      expect(result.data.seed).toBe('');
      expect(result.data.format).toBe('json');
    }
  });

  it('rejects non-object payloads', () => {
    expect(deserializeState('nope').success).toBe(false);
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState([1, 2]).success).toBe(false);
    expect(deserializeState(undefined).success).toBe(false);
  });

  it('tool round-trips through its own serialize/deserialize', () => {
    const s = state({ count: 12, seed: 'tooltest' });
    const tool = sampleDataGeneratorTool;
    const restored = tool.deserialize(JSON.parse(tool.serialize(s)));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data).toEqual(s);
    }
  });

  it('exposes identity and config', () => {
    expect(sampleDataGeneratorTool.id).toBe('sample-data-generator');
    expect(sampleDataGeneratorTool.name).toBe('Sample Data Generator');
    expect(sampleDataGeneratorTool.version).toBe('1.0.0');
  });
});
