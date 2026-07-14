import { executeCommand } from '@/lib/command-engine';
import { tokenizeCommand } from '@/lib/command-parser';

describe('command parser and engine', () => {
  it('parses and executes a valid AN command', async () => {
    const result = await executeCommand('an15julblrdoh');
    const lines = result.output.split('\n');

    expect(result.ok).toBe(true);
    expect(result.command).toBe('AN');
    expect(result.echo).toBe('AN15JULBLRDOH');
    expect(result.output).toContain('** AMADEUS AVAILABILITY - AN **  15JUL26  BLR BENGALURU DOH DOHA');
    expect(lines[1]).toContain('QR  522');
    expect(lines[3].indexOf('BLR DOH')).toBe(lines[1].indexOf('BLR DOH'));
  });

  it('rejects missing AN arguments as invalid format', async () => {
    const result = await executeCommand('AN15JULBLR');

    expect(result.ok).toBe(false);
    expect(result.output).toBe('INVALID FORMAT');
  });

  it('treats commands case-insensitively', async () => {
    const result = await executeCommand('help');

    expect(result.ok).toBe(true);
    expect(result.command).toBe('HELP');
    expect(result.echo).toBe('HELP');
    expect(result.output).toContain('AN[DDMMM][ORIGIN][DEST]');
  });

  it('returns invalid format for unknown commands', async () => {
    const result = await executeCommand('XYZ123');

    expect(result.ok).toBe(false);
    expect(result.output).toBe('INVALID FORMAT');
  });

  it('tokenizes and normalizes input', () => {
    expect(tokenizeCommand('  help  ')).toEqual({
      rawInput: '  help  ',
      normalizedInput: 'HELP',
      commandToken: 'HELP'
    });
  });
});