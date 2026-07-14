import { calculateTstTotal, findFare, getSessionState, updatePnrDraft } from '@/lib/gds-store';
import type { CommandHandler } from './types';

function formatMoney(amount: number) {
  return amount.toFixed(2);
}

function formatTstOutput(route: string, bookingClass: string, fareBasis: string, currency: string, baseFare: number, taxes: { code: string; amount: number }[]) {
  const total = calculateTstTotal(baseFare, taxes);

  return [
    'TST PRICE PNR',
    `ROUTE ${route}`,
    `BOOKING CLASS ${bookingClass}`,
    `FARE BASIS ${fareBasis}`,
    `BASE FARE ${currency} ${formatMoney(baseFare)}`,
    ...taxes.map((tax) => `${tax.code} ${currency} ${formatMoney(tax.amount)}`),
    `TOTAL ${currency} ${formatMoney(total)}`
  ].join('\n');
}

export const farePricingCommand: CommandHandler = {
  name: 'FXP',
  match(input) {
    return input === 'FXP';
  },
  async execute(context) {
    const session = await getSessionState(context.sessionId);
    const segment = session.pnrInProgress.segments[0];

    if (!segment) {
      return {
        ok: false,
        command: 'FXP',
        echo: context.normalizedInput,
        output: 'NO ITINERARY TO PRICE'
      };
    }

    const fare = await findFare(segment.origin, segment.destination, segment.bookingClass);

    if (!fare) {
      return {
        ok: false,
        command: 'FXP',
        echo: context.normalizedInput,
        output: 'NO FARE FOUND'
      };
    }

    const total = calculateTstTotal(fare.baseFare, fare.taxes);
    const tst = {
      route: `${fare.origin}-${fare.destination}`,
      bookingClass: fare.bookingClass,
      fareBasis: fare.fareBasis,
      baseFare: fare.baseFare,
      taxes: fare.taxes.map((tax) => ({ ...tax })),
      total,
      currency: fare.currency,
      refundable: fare.refundable,
      penalty: fare.penalty
    };

    await updatePnrDraft(context.sessionId, (draft) => ({
      ...draft,
      tst
    }));

    return {
      ok: true,
      command: 'FXP',
      echo: context.normalizedInput,
      output: formatTstOutput(tst.route, tst.bookingClass, tst.fareBasis, tst.currency, tst.baseFare, tst.taxes)
    };
  }
};