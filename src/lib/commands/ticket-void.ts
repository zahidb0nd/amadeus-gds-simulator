import { getCurrentTime, getLastCompletedRecordLocator, getPnr, voidTicket } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const sameDayWindowHours = 24;

export const ticketVoidCommand: CommandHandler = {
  name: 'TTV',
  match(input) {
    return input === 'TTV';
  },
  async execute(context) {
    const recordLocator = await getLastCompletedRecordLocator(context.sessionId);

    if (!recordLocator) {
      return {
        ok: false,
        command: 'TTV',
        echo: context.normalizedInput,
        output: 'NO TICKET TO VOID'
      };
    }

    const pnr = await getPnr(recordLocator);

    if (!pnr?.ticket) {
      return {
        ok: false,
        command: 'TTV',
        echo: context.normalizedInput,
        output: 'NO TICKET TO VOID'
      };
    }

    const ageMs = getCurrentTime().getTime() - pnr.ticket.issuedAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    if (ageHours > sameDayWindowHours) {
      return {
        ok: false,
        command: 'TTV',
        echo: context.normalizedInput,
        output: 'VOID WINDOW EXPIRED'
      };
    }

    await voidTicket(recordLocator);

    return {
      ok: true,
      command: 'TTV',
      echo: context.normalizedInput,
      output: 'TICKET VOIDED'
    };
  }
};