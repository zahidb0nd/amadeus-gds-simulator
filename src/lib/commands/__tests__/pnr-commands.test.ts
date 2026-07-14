import { randomUUID } from 'crypto';
import { executeCommand } from '@/lib/command-engine';
import { deletePnr, getPnr, resetSessionState } from '@/lib/gds-store';

async function buildBasicPnr(sessionId: string) {
  await executeCommand('AN15JULBLRDOH', { sessionId });
  await executeCommand('SS1Y1', { sessionId });
  await executeCommand('NM1KHAN/ZAHID', { sessionId });
  await executeCommand('AP+9745551234', { sessionId });
  await executeCommand('TK TL15JUL/1900', { sessionId });
}

describe('PNR command flow', () => {
  let sessionId: string;

  beforeEach(() => {
    sessionId = randomUUID();
  });

  afterEach(async () => {
    await resetSessionState(sessionId);
  });

  it('sells a segment against the current availability workarea', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });

    const result = await executeCommand('SS1Y1', { sessionId });

    expect(result.ok).toBe(true);
    expect(result.output).toContain('KK');
    expect(result.output).toContain('BLR DOH');
  });

  it('stores the passenger name element', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });

    const result = await executeCommand('NM1KHAN/ZAHID', { sessionId });

    expect(result.ok).toBe(true);
    expect(result.output).toBe('1  KHAN/ZAHID');
  });

  it('stores the contact element', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });

    const result = await executeCommand('AP+9745551234', { sessionId });

    expect(result.ok).toBe(true);
    expect(result.output).toBe('AP +9745551234');
  });

  it('stores the ticketing arrangement', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });

    const result = await executeCommand('TK TL15JUL/1900', { sessionId });

    expect(result.ok).toBe(true);
    expect(result.output).toBe('TK TL15JUL/1900');
  });

  it('persists the completed PNR on ER', async () => {
    await buildBasicPnr(sessionId);

    const result = await executeCommand('ER', { sessionId });
    const match = result.output.match(/PNR CREATED ([A-Z0-9]{6})/);

    expect(result.ok).toBe(true);
    expect(match).not.toBeNull();

    const recordLocator = match?.[1] ?? '';
    const pnr = await getPnr(recordLocator);

    expect(pnr).not.toBeNull();
    expect(pnr?.names).toEqual([{ surname: 'KHAN', firstname: 'ZAHID' }]);
    expect(pnr?.contact).toBe('+9745551234');
    expect(pnr?.ticketingArrangement).toBe('TL15JUL/1900');
    expect(pnr?.itinerary).toHaveLength(1);
    expect(pnr?.itinerary[0].status).toBe('KK');

    await deletePnr(recordLocator);
  });

  it('retrieves an existing PNR by record locator', async () => {
    await buildBasicPnr(sessionId);

    const erResult = await executeCommand('ER', { sessionId });
    const recordLocator = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/)?.[1] ?? '';

    expect(recordLocator).toHaveLength(6);

    const rtResult = await executeCommand(`RT${recordLocator}`, { sessionId });

    expect(rtResult.ok).toBe(true);
    expect(rtResult.output).toContain(`* PNR RETRIEVAL *  ${recordLocator}`);
    expect(rtResult.output).toContain('1  KHAN/ZAHID');
    expect(rtResult.output).toContain('1  QR  522  Y1  BLR DOH 0135 0350  KK');
    expect(rtResult.output).toContain('AP +9745551234');
    expect(rtResult.output).toContain('TK TL15JUL/1900');

    await deletePnr(recordLocator);
  });

  it('returns not found for a valid but missing record locator', async () => {
    const result = await executeCommand('RTABC123', { sessionId });

    expect(result.ok).toBe(false);
    expect(result.output).toBe('PNR NOT FOUND');
  });

  it('returns invalid format for a malformed record locator', async () => {
    const result = await executeCommand('RT12', { sessionId });

    expect(result.ok).toBe(false);
    expect(result.output).toBe('INVALID FORMAT');
  });
});