import { dnaCommand } from '@/lib/commands/dna';
import { dcCommand } from '@/lib/commands/dc';
import { ggCommand } from '@/lib/commands/gg';
import type { CommandHandlerContext } from '@/lib/commands/types';

describe('Extended Reference Commands (Phase A)', () => {
  const createCtx = (input: string): CommandHandlerContext => ({
    rawInput: input,
    normalizedInput: input.toUpperCase(),
    sessionId: 'test'
  });

  describe('DNA Command', () => {
    it('should decode a 2-letter airline code to its name', () => {
      expect(dnaCommand.match('DNAQR')).toBe(true);
      const result = dnaCommand.execute(createCtx('DNAQR'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('QR - QATAR AIRWAYS (ONEWORLD)');
    });

    it('should decode a 3-digit ticket prefix', () => {
      expect(dnaCommand.match('DNA157')).toBe(true);
      const result = dnaCommand.execute(createCtx('DNA157'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('157 - QR - QATAR AIRWAYS');
    });

    it('should encode an airline name', () => {
      expect(dnaCommand.match('DNAQATAR')).toBe(true);
      const result = dnaCommand.execute(createCtx('DNAQATAR'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('QATAR AIRWAYS - QR (157)');
    });

    it('should return NOT FOUND for unknown DNA queries', () => {
      const result = dnaCommand.execute(createCtx('DNAXXX'));
      expect(result.ok).toBe(false);
      expect(result.output).toBe('NOT FOUND');
    });
  });

  describe('DC Command', () => {
    it('should decode a 2-letter country code', () => {
      expect(dcCommand.match('DCFR')).toBe(true);
      const result = dcCommand.execute(createCtx('DCFR'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('FR - FRANCE');
    });

    it('should encode a country name', () => {
      expect(dcCommand.match('DCFRANCE')).toBe(true);
      const result = dcCommand.execute(createCtx('DCFRANCE'));
      expect(result.ok).toBe(true);
      expect(result.output).toBe('FRANCE - FR');
    });

    it('should return NOT FOUND for unknown DC queries', () => {
      const result = dcCommand.execute(createCtx('DCXXX'));
      expect(result.ok).toBe(false);
      expect(result.output).toBe('NOT FOUND');
    });
  });

  describe('GG Commands', () => {
    it('should list Oneworld airlines for GGALLIANCE and GPOW', () => {
      expect(ggCommand.match('GGALLIANCE')).toBe(true);
      const resultAll = ggCommand.execute(createCtx('GGALLIANCE'));
      expect(resultAll.ok).toBe(true);
      expect(resultAll.output).toContain('ONEWORLD ALLIANCE CARRIERS:');
      expect(resultAll.output).toContain('QR - QATAR AIRWAYS');

      expect(ggCommand.match('GPOW')).toBe(true);
      const resultPow = ggCommand.execute(createCtx('GPOW'));
      expect(resultPow.output).toBe(resultAll.output);
    });

    it('should list Star Alliance airlines for GPSA', () => {
      expect(ggCommand.match('GPSA')).toBe(true);
      const result = ggCommand.execute(createCtx('GPSA'));
      expect(result.ok).toBe(true);
      expect(result.output).toContain('STAR ALLIANCE CARRIERS:');
      expect(result.output).toContain('UA - UNITED AIRLINES');
    });

    it('should display airline info page for GGA', () => {
      expect(ggCommand.match('GGAQR')).toBe(true);
      const result = ggCommand.execute(createCtx('GGAQR'));
      expect(result.ok).toBe(true);
      expect(result.output).toContain('AIRLINE INFORMATION - QR');
      expect(result.output).toContain('NAME: QATAR AIRWAYS');
      expect(result.output).toContain('TICKET PREFIX: 157');
    });

    it('should display country info page for GGCOU', () => {
      expect(ggCommand.match('GGCOUFR')).toBe(true);
      const result = ggCommand.execute(createCtx('GGCOUFR'));
      expect(result.ok).toBe(true);
      expect(result.output).toContain('COUNTRY INFORMATION - FR');
      expect(result.output).toContain('NAME: FRANCE');
    });

    it('should check participating status for GGPCA', () => {
      expect(ggCommand.match('GGPCAQR')).toBe(true);
      const resultTrue = ggCommand.execute(createCtx('GGPCAQR'));
      expect(resultTrue.ok).toBe(true);
      expect(resultTrue.output).toBe('QR IS A PARTICIPATING CARRIER');

      expect(ggCommand.match('GGPCA6E')).toBe(true);
      const resultFalse = ggCommand.execute(createCtx('GGPCA6E'));
      expect(resultFalse.ok).toBe(true);
      expect(resultFalse.output).toBe('6E IS NOT A PARTICIPATING CARRIER');
    });

    it('should return NOT FOUND for unknown codes in GG commands', () => {
      expect(ggCommand.execute(createCtx('GGAXX')).ok).toBe(false);
      expect(ggCommand.execute(createCtx('GGCOUXX')).ok).toBe(false);
      expect(ggCommand.execute(createCtx('GGPCAXX')).ok).toBe(false);
    });
  });
});
