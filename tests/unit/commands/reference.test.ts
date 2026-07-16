import { dacCommand } from '@/lib/commands/dac';
import { danCommand } from '@/lib/commands/dan';
import { eanCommand } from '@/lib/commands/ean';
import type { CommandHandlerContext } from '@/lib/commands/types';
import { dcCommand } from '@/lib/commands/dc';

describe('Reference Decode/Encode Commands', () => {
  const createCtx = (input: string): CommandHandlerContext => ({
    rawInput: input,
    normalizedInput: input.toUpperCase(),
    sessionId: 'test'
  });

  describe('DAC (Airline Decode)', () => {
    it('should decode a valid airline code', async () => {
      expect(dacCommand.match('DACQR')).toBe(true);
      const result = await dacCommand.execute(createCtx('DACQR'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('QR - QATAR AIRWAYS (ONEWORLD)');
    });

    it('should return NOT FOUND for an invalid airline code', async () => {
      expect(dacCommand.match('DACXX')).toBe(true);
      const result = await dacCommand.execute(createCtx('DACXX'));
      expect(result.ok).toBe(false);
      expect(result.output).toBe('NOT FOUND');
    });
  });

  describe('DAN (Airport Decode)', () => {
    it('should decode a valid airport code', async () => {
      expect(danCommand.match('DANBLR')).toBe(true);
      const result = await danCommand.execute(createCtx('DANBLR'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('BLR - KEMPEGOWDA INTERNATIONAL, BENGALURU, IN');
    });

    it('should return NOT FOUND for an invalid airport code', async () => {
      expect(danCommand.match('DANXXX')).toBe(true);
      const result = await danCommand.execute(createCtx('DANXXX'));
      expect(result.ok).toBe(false);
      expect(result.output).toBe('NOT FOUND');
    });
  });

  describe('EAN (City/Airport Encode)', () => {
    it('should encode a valid city name (single match)', () => {
      expect(eanCommand.match('EANDOHA')).toBe(true);
      const result = eanCommand.execute(createCtx('EANDOHA'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('DOH - HAMAD INTERNATIONAL, DOHA, QA');
    });

    it('should encode a valid airport name (partial match, case-insensitive)', () => {
      expect(eanCommand.match('EANkempegowda')).toBe(true);
      const result = eanCommand.execute(createCtx('EANkempegowda'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('BLR - KEMPEGOWDA INTERNATIONAL, BENGALURU, IN');
    });

    it('should return multiple matches if query is ambiguous', () => {
      // Both Delhi and Dubai have 'D' and 'I' etc, let's query 'IN'
      // 'IN' matches 'Indira Gandhi International', 'Kempegowda International', 'Dubai International', 'Hamad International'
      expect(eanCommand.match('EANINTERNATIONAL')).toBe(true);
      const result = eanCommand.execute(createCtx('EANINTERNATIONAL'));
      expect(result.ok).toBe(true);
      expect(result.output).toContain('BLR');
      expect(result.output).toContain('DOH');
      expect(result.output).toContain('DXB');
      expect(result.output).toContain('DEL');
    });

    it('should return NOT FOUND for unknown city', () => {
      expect(eanCommand.match('EANATLANTIS')).toBe(true);
      const result = eanCommand.execute(createCtx('EANATLANTIS'));
      expect(result.ok).toBe(false);
      expect(result.output).toBe('NOT FOUND');
    });

    it('should encode a newly imported airport city name (JFK / New York)', () => {
      expect(eanCommand.match('EANNEW YORK')).toBe(true);
      const result = eanCommand.execute(createCtx('EANNEW YORK'));
      expect(result.ok).toBe(true);
      expect(result.output).toContain('JFK');
    });
  });

  describe('New Database Lookups', () => {
    it('should decode newly imported airport codes', async () => {
      const resultJfk = await danCommand.execute(createCtx('DANJFK'));
      expect(resultJfk.ok).toBe(true);
      expect(resultJfk.output).toBe('JFK - JOHN F KENNEDY INTERNATIONAL, NEW YORK, US');

      const resultKef = await danCommand.execute(createCtx('DANKEF'));
      expect(resultKef.ok).toBe(true);
      expect(resultKef.output).toBe('KEF - KEFLAVIK NAS, KEFLAVIK, IS');
    });

    it('should decode/encode newly imported countries', () => {
      // Decode country code
      const resultGl = dcCommand.execute(createCtx('DCGL'));
      expect(resultGl.ok).toBe(true);
      expect(resultGl.output).toBe('GL - GREENLAND');

      // Encode country name
      const resultGreenland = dcCommand.execute(createCtx('DCGREENLAND'));
      expect(resultGreenland.ok).toBe(true);
      expect(resultGreenland.output).toBe('GREENLAND - GL');
    });
  });
});

