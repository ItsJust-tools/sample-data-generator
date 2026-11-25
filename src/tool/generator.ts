import type { Locale, SampleRecord } from './types';
import { clampCount, MAX_COUNT } from './types';

/** Deterministic 32-bit hash (FNV-1a style). */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG producing floats in [0, 1). */
export function createRng(seedString: string): () => number {
  let a = seedString ? hashSeed(seedString) : Math.floor(Math.random() * 0xffffffff) >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface NamePool {
  first: string[];
  last: string[];
  cities: string[];
  streets: string[];
  country: string;
  zipDigits: number;
  domain: string;
  phonePrefix: string;
}

const EN: NamePool = {
  first: [
    'James',
    'Mary',
    'John',
    'Patricia',
    'Robert',
    'Jennifer',
    'Michael',
    'Linda',
    'David',
    'Elizabeth',
    'William',
    'Susan',
    'Emma',
    'Olivia',
    'Noah',
    'Liam',
  ],
  last: [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Wilson',
    'Taylor',
    'Moore',
    'Martin',
    'Jackson',
    'Thompson',
  ],
  cities: [
    'Springfield',
    'Riverton',
    'Fairview',
    'Georgetown',
    'Salem',
    'Madison',
    'Franklin',
    'Bristol',
  ],
  streets: [
    'Maple Street',
    'Oak Avenue',
    'Cedar Lane',
    'Main Street',
    'Elm Drive',
    'Washington Boulevard',
    'Park Road',
    'Hill Court',
  ],
  country: 'United States',
  zipDigits: 5,
  domain: 'example.com',
  phonePrefix: '+1-555-',
};

const DE: NamePool = {
  first: [
    'Lukas',
    'Anna',
    'Felix',
    'Marie',
    'Jonas',
    'Emma',
    'Leon',
    'Lena',
    'Maximilian',
    'Sophie',
    'Paul',
    'Clara',
    'Elias',
    'Mia',
    'Jakob',
    'Hannah',
  ],
  last: [
    'Müller',
    'Schmidt',
    'Schneider',
    'Fischer',
    'Weber',
    'Meyer',
    'Wagner',
    'Becker',
    'Schulz',
    'Hoffmann',
    'Koch',
    'Bauer',
    'Richter',
    'Klein',
  ],
  cities: [
    'Berlin',
    'München',
    'Hamburg',
    'Köln',
    'Frankfurt',
    'Stuttgart',
    'Düsseldorf',
    'Leipzig',
  ],
  streets: [
    'Hauptstraße',
    'Bahnhofstraße',
    'Gartenweg',
    'Birkenallee',
    'Lindenstraße',
    'Rosenweg',
    'Kirchplatz',
    'Seestraße',
  ],
  country: 'Deutschland',
  zipDigits: 5,
  domain: 'beispiel.de',
  phonePrefix: '+49-171-',
};

const POOLS: Record<Locale, NamePool> = { en: EN, de: DE };

function pick<T>(rng: () => number, arr: T[]): T {
  const item = arr[Math.floor(rng() * arr.length) % arr.length];
  if (item === undefined) throw new Error('empty pool');
  return item;
}

function digits(rng: () => number, count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) out += String(Math.floor(rng() * 10));
  return out;
}

function hex(rng: () => number, count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) out += Math.floor(rng() * 16).toString(16);
  return out;
}

function uuidFrom(rng: () => number): string {
  const bytes = new Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(rng() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const h = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function ipv4From(rng: () => number): string {
  return Array.from({ length: 4 }, () => Math.floor(rng() * 256)).join('.');
}

function ipv6From(rng: () => number): string {
  return Array.from({ length: 8 }, () => hex(rng, 0)).length >= 0
    ? Array.from({ length: 8 }, () => hex(rng, 4)).join(':')
    : '';
}

function macFrom(rng: () => number): string {
  const firstByte = Math.floor(rng() * 256) | 0x02; // locally administered unicast
  const octets = [firstByte, ...Array.from({ length: 5 }, () => Math.floor(rng() * 256))];
  return octets
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

/** Generate `count` deterministic (for a given seed) sample records. */
export function generateRecords(countInput: unknown, locale: Locale, seed: string): SampleRecord[] {
  const count = Math.min(clampCount(countInput), MAX_COUNT);
  const pool = POOLS[locale];
  const rng = createRng(`${locale}:${seed}`);
  const records: SampleRecord[] = [];
  for (let i = 0; i < count; i++) {
    const first = pick(rng, pool.first);
    const last = pick(rng, pool.last);
    records.push({
      id: uuidFrom(rng),
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase().replace(/ä|ö|ü/g, (c) => (c === 'ä' ? 'ae' : c === 'ö' ? 'oe' : 'ue'))}.${last
        .toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')}@${pool.domain}`,
      phone: `${pool.phonePrefix}${digits(rng, 4)}`,
      street: `${Math.floor(rng() * 200) + 1} ${pick(rng, pool.streets)}`,
      city: pick(rng, pool.cities),
      zip: digits(rng, pool.zipDigits),
      country: pool.country,
      ipv4: ipv4From(rng),
      ipv6: ipv6From(rng),
      mac: macFrom(rng),
    });
  }
  return records;
}
