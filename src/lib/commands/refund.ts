import { applyRefund, calculateTstTotal, getLastCompletedRecordLocator, getPnr } from '@/lib/gds-store';
import type { CommandHandler } from './types';

function calculateRefundAmount(baseTotal: number, refundable: boolean, penalty: number) {
  return refundable ? baseTotal : Math.max(0, baseTotal - penalty);
}

export const refundCommand: CommandHandler = {
  name: 'REFUND',
  match(input) {
    return input === 'REFUND';
  },
  async execute(context) {
    const recordLocator = await getLastCompletedRecordLocator(context.sessionId);

    if (!recordLocator) {
      return {
        ok: false,
        command: 'REFUND',
        echo: context.normalizedInput,
        output: 'NO COMPLETED PNR AVAILABLE'
      };
    }

    const pnr = await getPnr(recordLocator);

    if (!pnr?.ticket || !pnr.tst) {
      return {
        ok: false,
        command: 'REFUND',
        echo: context.normalizedInput,
        output: 'TICKET AND TST REQUIRED BEFORE REFUND'
      };
    }

    const hasCancelledSegment = pnr.itinerary.some((segment) => segment.status === 'XX');

    if (!hasCancelledSegment) {
      return {
        ok: false,
        command: 'REFUND',
        echo: context.normalizedInput,
        output: 'SEGMENT MUST BE CANCELLED FIRST'
      };
    }

    const baseTotal = calculateTstTotal(pnr.tst.baseFare, pnr.tst.taxes);
    const refundAmount = calculateRefundAmount(baseTotal, pnr.tst.refundable, pnr.tst.penalty);
    const updated = await applyRefund(recordLocator, refundAmount, pnr.tst.currency);

    if (!updated) {
      return {
        ok: false,
        command: 'REFUND',
        echo: context.normalizedInput,
        output: 'REFUND FAILED'
      };
    }

    return {
      ok: true,
      command: 'REFUND',
      echo: context.normalizedInput,
      output: [`REFUND ${pnr.tst.currency} ${refundAmount.toFixed(2)}`, `STATUS ${updated.status}`].join('\n')
    };
  }
};