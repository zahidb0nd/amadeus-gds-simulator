import { expect, test } from '@playwright/test';

test('booking flow: AN -> SS -> NM -> AP -> TK -> FXP -> ER -> TTP -> XI -> REFUND', async ({ request }) => {
  const sessionId = `e2e-${Date.now()}`;

  const postCommand = (command: string) =>
    request.post('/api/command', {
      data: {
        command,
        sessionId
      }
    });

  const anResponse = await postCommand('AN15JULBLRDOH');
  const anJson = await anResponse.json();

  expect(anResponse.ok()).toBe(true);
  expect(anJson.output).toContain('** AMADEUS AVAILABILITY - AN **  15JUL26  BLR BENGALURU DOH DOHA');

  const ssResponse = await postCommand('SS1Y1');
  const ssJson = await ssResponse.json();

  expect(ssResponse.ok()).toBe(true);
  expect(ssJson.output).toContain('KK');

  const nmResponse = await postCommand('NM1KHAN/ZAHID');
  const nmJson = await nmResponse.json();

  expect(nmResponse.ok()).toBe(true);
  expect(nmJson.output).toBe('1.1KHAN/ZAHID');

  const apResponse = await postCommand('AP+9745551234');
  const apJson = await apResponse.json();

  expect(apResponse.ok()).toBe(true);
  expect(apJson.output).toBe('AP +9745551234');

  const tkResponse = await postCommand('TK TL15JUL/1900');
  const tkJson = await tkResponse.json();

  expect(tkResponse.ok()).toBe(true);
  expect(tkJson.output).toBe('TK TL15JUL/1900');

  const fxpResponse = await postCommand('FXP');
  const fxpJson = await fxpResponse.json();

  expect(fxpResponse.ok()).toBe(true);
  expect(fxpJson.output).toContain('TST PRICE PNR');
  expect(fxpJson.output).toContain('TOTAL USD 267.00');

  const erResponse = await postCommand('ER');
  const erJson = await erResponse.json();

  expect(erResponse.ok()).toBe(true);
  expect(erJson.output.split('\n')[0]).toMatch(/([A-Z0-9]{6})\s*$/);

  const recordLocator = erJson.output.split('\n')[0].match(/([A-Z0-9]{6})\s*$/)?.[1] ?? '';

  const ttpResponse = await postCommand('TTP');
  const ttpJson = await ttpResponse.json();

  expect(ttpResponse.ok()).toBe(true);
  expect(ttpJson.output).toMatch(/^E-TICKET [0-9]{13}$/);

  const xiResponse = await postCommand('XI1');
  const xiJson = await xiResponse.json();

  expect(xiResponse.ok()).toBe(true);
  expect(xiJson.output).toBe('SEGMENT 1 CANCELLED');

  const refundResponse = await postCommand('REFUND');
  const refundJson = await refundResponse.json();

  expect(refundResponse.ok()).toBe(true);
  expect(refundJson.output).toContain('REFUND USD 267.00');
  expect(refundJson.output).toContain('STATUS REFUNDED');

  const rtResponse = await postCommand(`RT${recordLocator}`);
  const rtJson = await rtResponse.json();

  expect(rtResponse.ok()).toBe(true);
  expect(rtJson.output).toContain('TOTAL USD 267.00');
  expect(rtJson.output).toContain('TICKET STATUS VOIDED');
  expect(rtJson.output).toContain('REFUND USD 267.00');
  expect(rtJson.output).toContain('STATUS REFUNDED');
});