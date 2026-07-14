import { getPnr } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const retrievePattern = /^RT([A-Z0-9]{6})$/;

function formatPnr(pnr: Awaited<ReturnType<typeof getPnr>>) {
  if (!pnr) {
    return 'PNR NOT FOUND';
  }

  const itineraryLines = pnr.itinerary.map(
    (segment) =>
      `${segment.segmentRef}  ${segment.airline} ${segment.flightNumber.padStart(4, ' ')}  ${segment.bookingClass}${segment.quantity}  ${segment.origin} ${segment.destination} ${segment.departure} ${segment.arrival}  ${segment.status}`
  );

  const tstLines = pnr.tst
    ? [
        `TST ${pnr.tst.route} ${pnr.tst.bookingClass} ${pnr.tst.fareBasis}`,
        `BASE FARE ${pnr.tst.currency} ${pnr.tst.baseFare.toFixed(2)}`,
        ...pnr.tst.taxes.map((tax) => `${tax.code} ${pnr.tst?.currency ?? 'USD'} ${tax.amount.toFixed(2)}`),
        `TOTAL ${pnr.tst.currency} ${pnr.tst.total.toFixed(2)}`,
        `REFUNDABLE ${pnr.tst.refundable ? 'YES' : 'NO'}`,
        `PENALTY ${pnr.tst.currency} ${pnr.tst.penalty.toFixed(2)}`
      ]
    : [];

  const ticketLines = pnr.ticket
    ? [
        `TICKET ${pnr.ticket.number}`,
        `TICKET STATUS ${pnr.ticket.status}`,
        `ISSUED ${pnr.ticket.issuedAt.toISOString()}`,
        pnr.ticket.voidedAt ? `VOIDED ${pnr.ticket.voidedAt.toISOString()}` : ''
      ]
    : [];

  return [
    `* PNR RETRIEVAL *  ${pnr.recordLocator}`,
    ...pnr.names.map((name, index) => `${index + 1}  ${name.surname}/${name.firstname}`),
    ...itineraryLines,
    ...tstLines,
    ...ticketLines,
    pnr.refund ? `REFUND ${pnr.refund.currency} ${pnr.refund.amount.toFixed(2)}` : '',
    pnr.contact ? `AP ${pnr.contact}` : '',
    pnr.ticketingArrangement ? `TK ${pnr.ticketingArrangement}` : '',
    `STATUS ${pnr.status}`
  ]
    .filter(Boolean)
    .join('\n');
}

export const retrieveCommand: CommandHandler = {
  name: 'RT',
  match(input) {
    return retrievePattern.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(retrievePattern);

    if (!match) {
      return {
        ok: false,
        command: 'RT',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const [, recordLocator] = match;
    const pnr = await getPnr(recordLocator);

    return {
      ok: Boolean(pnr),
      command: 'RT',
      echo: context.normalizedInput,
      output: formatPnr(pnr)
    };
  }
};