import { generateTicketNumber, getLastCompletedRecordLocator, issueTicket, getPnr } from '@/lib/gds-store';
import type { CommandHandler } from './types';

export const ticketIssueCommand: CommandHandler = {
  name: 'TTP',
  match(input) {
    return input === 'TTP';
  },
  async execute(context) {
    const recordLocator = await getLastCompletedRecordLocator(context.sessionId);

    if (!recordLocator) {
      return {
        ok: false,
        command: 'TTP',
        echo: context.normalizedInput,
        output: 'NO COMPLETED PNR AVAILABLE'
      };
    }

    const pnr = await getPnr(recordLocator);

    if (!pnr?.tst) {
      return {
        ok: false,
        command: 'TTP',
        echo: context.normalizedInput,
        output: 'FXP REQUIRED BEFORE TTP'
      };
    }

    const ticketNumber = generateTicketNumber();
    await issueTicket(recordLocator, ticketNumber);

    return {
      ok: true,
      command: 'TTP',
      echo: context.normalizedInput,
      output: `E-TICKET ${ticketNumber}`
    };
  }
};