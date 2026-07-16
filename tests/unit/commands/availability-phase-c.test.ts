import { executeCommand } from '@/lib/command-engine';
import { getSessionState } from '@/lib/gds-store';

describe('Timetable & Extended Availability (Phase C)', () => {
  it('filters availability by specific airline (/A)', async () => {
    const result = await executeCommand('AN15JULBLRDOH/AQR', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('QR');
    expect(result.output).not.toContain('6E');
  });

  it('excludes specific airline (/A-)', async () => {
    const result = await executeCommand('AN15JULBLRDOH/A-QR', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).not.toContain('QR');
    expect(result.output).toContain('6E');
  });

  it('filters availability by cabin (/K)', async () => {
    // 6E has Y, QR has J, C, Y
    const result = await executeCommand('AN15JULBLRDOH/KC', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('QR');
    // 6E has only Y9, shouldn't appear
    expect(result.output).not.toContain('6E');
  });

  it('supports timetable command (TN)', async () => {
    const result = await executeCommand('TN15JULBLRDOH', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('TIMETABLE');
    expect(result.output).toContain('QR');
    // TN removes the numbers from classes
    expect(result.output).toContain('J  C  Y');
    expect(result.output).not.toContain('J9');
  });

  it('supports move next day (MN) and updates session', async () => {
    await executeCommand('AN15JULBLRDOH/AQR', { sessionId: 'test-session' });
    const result = await executeCommand('MN', { sessionId: 'test-session' });
    
    expect(result.ok).toBe(true);
    expect(result.output).toContain('16JUL');
    // Filter should carry over
    expect(result.output).toContain('QR');
    expect(result.output).not.toContain('6E');

    const session = await getSessionState('test-session');
    expect(session.lastAvailabilitySearch?.dateStr).toBe('16JUL');
  });

  it('supports change date (AC)', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId: 'test-session' });
    const result = await executeCommand('AC20JUL', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('20JUL');
  });

  it('supports flight info command (DO)', async () => {
    const result = await executeCommand('DOQR522', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('QATAR AIRWAYS');
  });

  it('supports minimum connecting time policy (DM)', async () => {
    const result = await executeCommand('DMDOH', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('MCT FOR DOH');
  });

  it('supports routing command (DRT)', async () => {
    const result = await executeCommand('DRTBLRDOH', { sessionId: 'test-session' });
    expect(result.ok).toBe(true);
    expect(result.output).toContain('ROUTING OPTIONS FOR BLR TO DOH');
  });
});
