/**
 * Data Quality Unit Tests
 *
 * These tests guard against the two production bugs discovered in July 2026:
 *   Bug 1: 607 airports (17%) had name="N/A", including LHR (Heathrow)
 *   Bug 2: Only 7 airlines in seed data — major carriers like LH/IB returned NOT FOUND
 *
 * Any regression in airport name data or airline seed coverage will fail here.
 */

import { airports } from '../lib/data/airports';
import { airlines, getAirline } from '../lib/data/airlines';
import { executeCommand } from '../lib/command-engine';

// ─────────────────────────────────────────────────────────────────────────────
// BUG 1 — Airport Name Data Quality
// ─────────────────────────────────────────────────────────────────────────────

describe('Airport Data Quality', () => {
  it('should have no airports with name equal to "N/A"', () => {
    const naAirports = airports.filter((a) => a.name === 'N/A');
    if (naAirports.length > 0) {
      const codes = naAirports.slice(0, 10).map((a) => a.code).join(', ');
      throw new Error(
        `${naAirports.length} airport(s) have name="N/A". First 10 codes: ${codes}`
      );
    }
    expect(naAirports.length).toBe(0);
  });

  it('should have no airports with an empty string name', () => {
    const emptyAirports = airports.filter((a) => !a.name || a.name.trim() === '');
    if (emptyAirports.length > 0) {
      const codes = emptyAirports.slice(0, 10).map((a) => a.code).join(', ');
      throw new Error(
        `${emptyAirports.length} airport(s) have a blank/empty name. First 10 codes: ${codes}`
      );
    }
    expect(emptyAirports.length).toBe(0);
  });

  it('should have valid, non-sentinel names for all airports (no nulls, undefined, or placeholder strings)', () => {
    const sentinelValues = ['N/A', 'n/a', 'NA', 'null', 'undefined', 'unknown', '-'];
    const problematic = airports.filter(
      (a) => !a.name || sentinelValues.includes(a.name.trim())
    );
    expect(problematic.length).toBe(0);
  });

  describe('Major airport codes resolve to correct real-world names', () => {
    const majorAirports: [string, string][] = [
      ['LHR', 'HEATHROW'],
      ['JFK', 'KENNEDY'],
      ['CDG', 'GAULLE'],
      ['DXB', 'DUBAI'],
      ['SIN', 'CHANGI'],
      ['HND', 'HANEDA'],
      ['AMS', 'SCHIPHOL'],
      ['FRA', 'FRANKFURT'],
      ['MAD', 'BARAJAS'],
      ['BCN', 'BARCELONA'],
      ['FCO', 'FIUMICINO'],
      ['BOM', 'CHHATRAPATI'],
      ['DEL', 'INDIRA'],
      ['SYD', 'SYDNEY'],
      ['GRU', 'GUARULHOS'],
    ];

    for (const [code, nameFragment] of majorAirports) {
      it(`${code} should have a real name containing "${nameFragment}"`, () => {
        const airport = airports.find((a) => a.code === code);
        expect(airport).toBeDefined();
        expect(airport!.name).not.toBe('N/A');
        expect(airport!.name.trim()).not.toBe('');
        expect(airport!.name.toUpperCase()).toContain(nameFragment.toUpperCase());
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 1 — DAC Command Integration: Never expose "N/A" to user
// ─────────────────────────────────────────────────────────────────────────────

describe('DAC Command — no N/A output to user', () => {
  const SESSION_ID = 'TEST-DATA-QUALITY-DAC';

  it('DAC LHR should return a real airport name, not "N/A"', async () => {
    const result = await executeCommand('DAC LHR', { sessionId: SESSION_ID });
    expect(result.ok).toBe(true);
    expect(result.output).not.toContain('N/A');
    expect(result.output).toContain('LHR');
  });

  it('DAC JFK should return a real airport name', async () => {
    const result = await executeCommand('DAC JFK', { sessionId: SESSION_ID });
    expect(result.ok).toBe(true);
    expect(result.output).not.toContain('N/A');
  });

  it('DAC CDG should return a real airport name', async () => {
    const result = await executeCommand('DAC CDG', { sessionId: SESSION_ID });
    expect(result.ok).toBe(true);
    expect(result.output).not.toContain('N/A');
  });

  it('DAC for any airport should never produce "N/A" in output', async () => {
    const codes = ['LHR', 'FRA', 'AMS', 'SIN', 'HND', 'MAD', 'FCO', 'BOM', 'DEL', 'SYD'];
    for (const code of codes) {
      const result = await executeCommand(`DAC ${code}`, { sessionId: SESSION_ID });
      expect(result.output).not.toContain('N/A');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 — Airline Seed Data Coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('Airline Data Quality', () => {
  it('should have at least 30 airlines in seed data', () => {
    expect(airlines.length).toBeGreaterThanOrEqual(30);
  });

  describe('Major global carriers present in seed data (getAirline)', () => {
    const majorCarriers: [string, string][] = [
      // Originally failing
      ['LH', 'Lufthansa'],
      ['IB', 'Iberia'],
      // Star Alliance
      ['UA', 'United Airlines'],
      ['SQ', 'Singapore Airlines'],
      ['TK', 'Turkish Airlines'],
      ['NH', 'ANA'],
      ['LX', 'Swiss'],
      ['OS', 'Austrian'],
      ['AI', 'Air India'],
      ['ET', 'Ethiopian'],
      ['AC', 'Air Canada'],
      ['MS', 'EgyptAir'],
      ['SA', 'South African'],
      // Oneworld
      ['BA', 'British Airways'],
      ['AA', 'American Airlines'],
      ['QR', 'Qatar Airways'],
      ['CX', 'Cathay Pacific'],
      ['JL', 'Japan Airlines'],
      ['MH', 'Malaysia Airlines'],
      ['RJ', 'Royal Jordanian'],
      ['LA', 'LATAM'],
      ['AY', 'Finnair'],
      // SkyTeam
      ['DL', 'Delta'],
      ['AF', 'Air France'],
      ['KL', 'KLM'],
      ['AZ', 'ITA Airways'],
      ['MU', 'China Eastern'],
      ['KE', 'Korean Air'],
      // Middle East independents
      ['EK', 'Emirates'],
      ['EY', 'Etihad'],
      // European low-cost
      ['FR', 'Ryanair'],
      ['U2', 'easyJet'],
    ];

    for (const [code, expectedName] of majorCarriers) {
      it(`${code} (${expectedName}) should resolve via getAirline()`, () => {
        const airline = getAirline(code);
        expect(airline).toBeDefined();
        expect(airline!.code).toBe(code);
        expect(airline!.name.length).toBeGreaterThan(0);
      });
    }
  });

  it('should have no airline with an empty or missing name', () => {
    const broken = airlines.filter((a) => !a.name || a.name.trim() === '');
    expect(broken.length).toBe(0);
  });

  it('should have no airline with an empty or missing code', () => {
    const broken = airlines.filter((a) => !a.code || a.code.trim() === '');
    expect(broken.length).toBe(0);
  });

  it('should have no duplicate airline codes', () => {
    const codes = airlines.map((a) => a.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('should have no duplicate ticket prefixes', () => {
    const prefixes = airlines.map((a) => a.ticketPrefix);
    const unique = new Set(prefixes);
    expect(unique.size).toBe(prefixes.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 — DNA Command Integration: Major carriers resolve correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('DNA Command — major airline code lookups', () => {
  const SESSION_ID = 'TEST-DATA-QUALITY-DNA';

  const criticalCarriers: [string, string][] = [
    ['LH', 'LUFTHANSA'],
    ['IB', 'IBERIA'],
    ['AF', 'AIR FRANCE'],
    ['KL', 'KLM'],
    ['SQ', 'SINGAPORE'],
    ['EK', 'EMIRATES'],
    ['BA', 'BRITISH AIRWAYS'],
    ['AA', 'AMERICAN'],
    ['QR', 'QATAR'],
    ['TK', 'TURKISH'],
  ];

  for (const [code, nameFragment] of criticalCarriers) {
    it(`DNA ${code} should return ok:true and include "${nameFragment}"`, async () => {
      const result = await executeCommand(`DNA ${code}`, { sessionId: SESSION_ID });
      expect(result.ok).toBe(true);
      expect(result.output).not.toBe('NOT FOUND');
      expect(result.output.toUpperCase()).toContain(nameFragment.toUpperCase());
    });
  }

  it('DNA IBERIA (name search) should resolve to IB', async () => {
    const result = await executeCommand('DNA IBERIA', { sessionId: SESSION_ID });
    expect(result.ok).toBe(true);
    expect(result.output).not.toBe('NOT FOUND');
  });

  it('DNA LUFTHANSA (name search) should resolve to LH', async () => {
    const result = await executeCommand('DNA LUFTHANSA', { sessionId: SESSION_ID });
    expect(result.ok).toBe(true);
    expect(result.output).not.toBe('NOT FOUND');
  });
});
