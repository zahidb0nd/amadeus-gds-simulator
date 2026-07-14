import { clearWorkarea, generateRecordLocator, getSessionState, saveCompletedPnr } from '@/lib/gds-store';
import type { CommandHandler } from './types';

export const endRetrieveCommand: CommandHandler = {
  name: 'ER',
  match(input) {
    return input === 'ER';
  },
  async execute(context) {
    const session = await getSessionState(context.sessionId);
    const missingFields: string[] = [];

    if (session.pnrInProgress.names.length === 0) {
      missingFields.push('NAME');
    }

    if (session.pnrInProgress.segments.length === 0) {
      missingFields.push('ITINERARY');
    }

    if (!session.pnrInProgress.contact) {
      missingFields.push('CONTACT');
    }

    if (!session.pnrInProgress.ticketingArrangement) {
      missingFields.push('TK');
    }

    if (missingFields.length > 0) {
      return {
        ok: false,
        command: 'ER',
        echo: context.normalizedInput,
        output: `INCOMPLETE PNR - MISSING ${missingFields.join(', ')}`
      };
    }

    const recordLocator = generateRecordLocator();

    await saveCompletedPnr({
      recordLocator,
      sessionId: context.sessionId,
      names: session.pnrInProgress.names.map((name) => ({ ...name })),
      itinerary: session.pnrInProgress.segments.map((segment) => ({ ...segment })),
      contact: session.pnrInProgress.contact,
      ticketingArrangement: session.pnrInProgress.ticketingArrangement,
      tst: session.pnrInProgress.tst,
      status: 'ACTIVE',
      createdAt: new Date()
    });

    await clearWorkarea(context.sessionId, recordLocator);

    return {
      ok: true,
      command: 'ER',
      echo: context.normalizedInput,
      output: `PNR CREATED ${recordLocator}`
    };
  }
};