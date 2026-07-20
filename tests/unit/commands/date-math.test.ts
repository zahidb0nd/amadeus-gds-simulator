import { ddCommand } from '@/lib/commands/dd';
import { dfCommand } from '@/lib/commands/df';
import type { CommandHandlerContext } from '@/lib/commands/types';

describe('Date/Time & Math Utilities (Phase B)', () => {
  const createCtx = (input: string, argument: string): CommandHandlerContext => ({
    rawInput: input,
    normalizedInput: input.toUpperCase(),
    commandToken: input.slice(0, 2).toUpperCase(),
    argument: argument.toUpperCase(),
    sessionId: 'test'
  });

  describe('DD Command - Date and Time', () => {
    it('should return correct day of week for a known date (e.g. 23JUN25 -> MONDAY)', async () => {
      const ctx = createCtx('DD23JUN25', '23JUN25');
      expect(ddCommand.match('DD23JUN25')).toBe(true);
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('23JUN25 MONDAY');
    });

    it('should return correct day of week for 17JUL26 -> FRIDAY', async () => {
      const ctx = createCtx('DD17JUL26', '17JUL26');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('17JUL26 FRIDAY');
    });

    it('should perform valid date math: addition (+)', async () => {
      const ctx = createCtx('DD15JUL26+10', '15JUL26+10');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('15JUL26 + 10D = 25JUL26 SATURDAY');
    });

    it('should perform valid date math: subtraction (-)', async () => {
      const ctx = createCtx('DD15JUL26-5', '15JUL26-5');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('15JUL26 - 5D = 10JUL26 FRIDAY');
    });

    it('should retrieve current local time in a known city code (e.g. LAX)', async () => {
      const ctx = createCtx('DDLAX', 'LAX');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toContain('LOS ANGELES');
      expect(result.output).toContain('US');
    });

    it('should return error for unknown city code', async () => {
      const ctx = createCtx('DDXYZ', 'XYZ');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(false);
      expect(result.output).toBe('UNKNOWN CITY/AIRPORT CODE');
    });

    it('should return error for invalid date format', async () => {
      const ctx = createCtx('DD35BAD', '35BAD');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(false);
      expect(result.output).toBe('INVALID DATE FORMAT');
    });

    it('should return generic INVALID FORMAT for completely garbage input', async () => {
      const ctx = createCtx('DDGARBAGE', 'GARBAGE');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(false);
      expect(result.output).toBe('INVALID FORMAT');
    });

    it('should convert time from LAX to MUC correctly with DST (9-hour offset in July)', async () => {
      const ctx = createCtx('DDLAX1500/MUC', 'LAX1500/MUC');
      const result = await ddCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('LAX 1500 / MUC 0000 (+1D)');
    });
  });

  describe('DF Command - Math Utilities', () => {
    it('should perform addition (;)', async () => {
      const ctx = createCtx('DF10;5', '10;5');
      expect(dfCommand.match('DF10;5')).toBe(true);
      const result = await dfCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('10 + 5 = 15');
    });

    it('should perform subtraction (-)', async () => {
      const ctx = createCtx('DF10-3', '10-3');
      const result = await dfCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('10 - 3 = 7');
    });

    it('should perform multiplication (*)', async () => {
      const ctx = createCtx('DF4*2.5', '4*2.5');
      const result = await dfCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('4 * 2.5 = 10');
    });

    it('should perform division (/)', async () => {
      const ctx = createCtx('DF15/3', '15/3');
      const result = await dfCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('15 / 3 = 5');
    });

    it('should handle divide-by-zero gracefully', async () => {
      const ctx = createCtx('DF10/0', '10/0');
      const result = await dfCommand.execute(ctx);
      expect(result.ok).toBe(false);
      expect(result.output).toBe('DIVISION BY ZERO');
    });

    it('should handle decimal math correctly', async () => {
      const ctx = createCtx('DF0.1;0.2', '0.1;0.2');
      const result = await dfCommand.execute(ctx);
      expect(result.ok).toBe(true);
      expect(result.output).toBe('0.1 + 0.2 = 0.3');
    });

    it('should return error for invalid format', async () => {
      const ctx = createCtx('DF10A5', '10A5');
      const result = await dfCommand.execute(ctx);
      expect(result.ok).toBe(false);
      expect(result.output).toBe('INVALID FORMAT');
    });
  });
});
