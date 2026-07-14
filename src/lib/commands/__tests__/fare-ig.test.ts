import { randomUUID } from 'crypto';
import { executeCommand } from '@/lib/command-engine';
import { calculateTstTotal, getCurrentTime, getPnr, getSessionState, resetSessionState, setCurrentTimeProvider, updatePnrDraft } from '@/lib/gds-store';

describe('fare pricing and workarea commands', () => {
  let sessionId: string;

  beforeEach(() => {
    sessionId = randomUUID();
    setCurrentTimeProvider(() => new Date('2026-07-14T09:30:00.000Z'));
  });

  afterEach(async () => {
    await resetSessionState(sessionId);
    setCurrentTimeProvider(undefined);
  });

  it('calculates fare total as base plus taxes', () => {
    expect(calculateTstTotal(210, [
      { code: 'YQ', amount: 45 },
      { code: 'IN', amount: 12 }
    ])).toBe(267);
  });

  it('prices the current itinerary and stores the TST on the session draft', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });

    const result = await executeCommand('FXP', { sessionId });

    expect(result.ok).toBe(true);
    expect(result.output).toContain('TST PRICE PNR');
    expect(result.output).toContain('BASE FARE USD 210.00');
    expect(result.output).toContain('YQ USD 45.00');
    expect(result.output).toContain('IN USD 12.00');
    expect(result.output).toContain('TOTAL USD 267.00');

    const session = await getSessionState(sessionId);

    expect(session.pnrInProgress.tst).toMatchObject({
      route: 'BLR-DOH',
      bookingClass: 'Y',
      fareBasis: 'YOW',
      baseFare: 210,
      total: 267,
      currency: 'USD'
    });
  });

  it('returns a graceful error when no fare matches', async () => {
    await updatePnrDraft(sessionId, () => ({
      names: [{ surname: 'KHAN', firstname: 'ZAHID' }],
      segments: [
        {
          segmentRef: 1,
          airline: 'QR',
          flightNumber: '522',
          bookingClass: 'Z',
          quantity: 1,
          origin: 'BLR',
          destination: 'DOH',
          departure: '0135',
          arrival: '0350',
          status: 'KK'
        }
      ],
      contact: '+9745551234',
      ticketingArrangement: 'TL15JUL/1900'
    }));

    const result = await executeCommand('FXP', { sessionId });

    expect(result.ok).toBe(false);
    expect(result.output).toBe('NO FARE FOUND');
  });

  it('ignores the current workarea without saving a PNR', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });

    const result = await executeCommand('IG', { sessionId });

    expect(result.ok).toBe(true);
    expect(result.output).toBe('WORKAREA IGNORED');

    const session = await getSessionState(sessionId);

    expect(session.availabilityContext).toHaveLength(0);
    expect(session.pnrInProgress.names).toHaveLength(0);
    expect(session.pnrInProgress.segments).toHaveLength(0);
    expect(session.pnrInProgress.tst).toBeUndefined();
  });

  it('tickets a priced PNR and persists the ticket number', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });
    await executeCommand('FXP', { sessionId });

    const erResult = await executeCommand('ER', { sessionId });
    const recordLocator = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/)?.[1] ?? '';

    expect(recordLocator).toHaveLength(6);

    const ttpResult = await executeCommand('TTP', { sessionId });
    const pnr = await getPnr(recordLocator);

    expect(ttpResult.ok).toBe(true);
    expect(ttpResult.output).toMatch(/^E-TICKET [0-9]{13}$/);
    expect(pnr?.status).toBe('TICKETED');
    expect(pnr?.ticket?.number).toMatch(/^[0-9]{13}$/);
  });

  it('cancels a valid segment on the saved PNR', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });
    await executeCommand('FXP', { sessionId });

    const erResult = await executeCommand('ER', { sessionId });
    const recordLocator = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/)?.[1] ?? '';

    const xiResult = await executeCommand('XI1', { sessionId });
    const pnr = await getPnr(recordLocator);

    expect(xiResult.ok).toBe(true);
    expect(xiResult.output).toBe('SEGMENT 1 CANCELLED');
    expect(pnr?.status).toBe('CANCELLED');
    expect(pnr?.itinerary[0].status).toBe('XX');
  });

  it('returns an error when cancelling a non-existent segment', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });
    await executeCommand('FXP', { sessionId });

    await executeCommand('ER', { sessionId });

    const result = await executeCommand('XI9', { sessionId });

    expect(result.ok).toBe(false);
    expect(result.output).toBe('SEGMENT NOT FOUND');
  });

  it('refunds a refundable fare at the full priced amount', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });
    await executeCommand('FXP', { sessionId });

    const erResult = await executeCommand('ER', { sessionId });
    const recordLocator = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/)?.[1] ?? '';

    await executeCommand('TTP', { sessionId });
    await executeCommand('XI1', { sessionId });

    const refundResult = await executeCommand('REFUND', { sessionId });
    const pnr = await getPnr(recordLocator);

    expect(refundResult.ok).toBe(true);
    expect(refundResult.output).toContain('REFUND USD 267.00');
    expect(refundResult.output).toContain('STATUS REFUNDED');
    expect(pnr?.status).toBe('REFUNDED');
    expect(pnr?.refund?.amount).toBe(267);
  });

  it('refunds a non-refundable fare after penalty deduction', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1B4', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });
    await executeCommand('FXP', { sessionId });

    const erResult = await executeCommand('ER', { sessionId });
    const recordLocator = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/)?.[1] ?? '';

    await executeCommand('TTP', { sessionId });
    await executeCommand('XI1', { sessionId });

    const refundResult = await executeCommand('REFUND', { sessionId });
    const pnr = await getPnr(recordLocator);

    expect(refundResult.ok).toBe(true);
    expect(refundResult.output).toContain('REFUND USD 169.00');
    expect(refundResult.output).toContain('STATUS REFUNDED');
    expect(pnr?.status).toBe('REFUNDED');
    expect(pnr?.refund?.amount).toBe(169);
  });

  it('rejects ticketing before a priced TST exists', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });

    await executeCommand('ER', { sessionId });

    const result = await executeCommand('TTP', { sessionId });

    expect(result.ok).toBe(false);
    expect(result.output).toBe('FXP REQUIRED BEFORE TTP');
  });

  it('voids a ticket inside the same-day window', async () => {
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });
    await executeCommand('FXP', { sessionId });

    const erResult = await executeCommand('ER', { sessionId });
    const recordLocator = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/)?.[1] ?? '';

    await executeCommand('TTP', { sessionId });

    const ttvResult = await executeCommand('TTV', { sessionId });
    const pnr = await getPnr(recordLocator);

    expect(ttvResult.ok).toBe(true);
    expect(ttvResult.output).toBe('TICKET VOIDED');
    expect(pnr?.status).toBe('ACTIVE');
    expect(pnr?.ticket?.status).toBe('VOIDED');
    expect(pnr?.ticket?.voidedAt).toBeDefined();
  });

  it('rejects voiding after the same-day window expires', async () => {
    const issuedAt = new Date('2026-07-14T09:30:00.000Z');
    await executeCommand('AN15JULBLRDOH', { sessionId });
    await executeCommand('SS1Y1', { sessionId });
    await executeCommand('NM1KHAN/ZAHID', { sessionId });
    await executeCommand('AP+9745551234', { sessionId });
    await executeCommand('TK TL15JUL/1900', { sessionId });
    await executeCommand('FXP', { sessionId });

    const erResult = await executeCommand('ER', { sessionId });
    const recordLocator = erResult.output.match(/PNR CREATED ([A-Z0-9]{6})/)?.[1] ?? '';

    await executeCommand('TTP', { sessionId });

    setCurrentTimeProvider(() => new Date(issuedAt.getTime() + 25 * 60 * 60 * 1000));

    const ttvResult = await executeCommand('TTV', { sessionId });

    expect(ttvResult.ok).toBe(false);
    expect(ttvResult.output).toBe('VOID WINDOW EXPIRED');

    const pnr = await getPnr(recordLocator);
    expect(pnr?.status).toBe('TICKETED');
  });
});