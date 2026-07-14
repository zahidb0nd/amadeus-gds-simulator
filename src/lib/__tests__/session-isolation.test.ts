import { randomUUID } from 'crypto';
import { executeCommand } from '@/lib/command-engine';
import { getSessionState, resetSessionState } from '@/lib/gds-store';

describe('session isolation', () => {
  const sessionA = randomUUID();
  const sessionB = randomUUID();

  afterAll(async () => {
    await resetSessionState(sessionA);
    await resetSessionState(sessionB);
  });

  it('keeps availability and PNR draft state isolated between sessions', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId: sessionA });

    const sessionBAfterAn = await getSessionState(sessionB);

    expect(sessionBAfterAn.availabilityContext).toHaveLength(0);
    expect(sessionBAfterAn.pnrInProgress.segments).toHaveLength(0);

    await executeCommand('SS1Y1', { sessionId: sessionA });

    const sessionBAfterSs = await getSessionState(sessionB);

    expect(sessionBAfterSs.availabilityContext).toHaveLength(0);
    expect(sessionBAfterSs.pnrInProgress.segments).toHaveLength(0);
  });
});