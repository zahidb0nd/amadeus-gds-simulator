import { clearWorkarea, generateRecordLocator, getSessionState, saveCompletedPnr } from '@/lib/gds-store';
import type { CommandHandler } from './types';

export const endRetrieveCommand: CommandHandler = {
  name: 'ER',
  match(input) {
    return input === 'ER';
  },
  async execute(context) {
    const session = await getSessionState(context.sessionId);

    if (session.pnrInProgress.names.length === 0) {
      return {
        ok: false,
        command: 'ER',
        echo: context.normalizedInput,
        output: 'NEED NAME ELEMENT'
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

    // Format output layout
    const outputLines: string[] = [];
    outputLines.push(`RP/BLR1A0950/BLR1A0950            AA/SU  15DEC26/0900Z   ${recordLocator}`);
    
    session.pnrInProgress.names.forEach((name, i) => {
      const title = name.title ? ` ${name.title}` : '';
      outputLines.push(`  ${i + 1}.${name.surname}/${name.firstname}${title}`);
    });

    let segStartIndex = session.pnrInProgress.names.length + 1;
    session.pnrInProgress.segments.forEach((seg, i) => {
      outputLines.push(`  ${segStartIndex + i}  ${seg.airline} ${seg.flightNumber} ${seg.bookingClass} 15DEC ${seg.origin}${seg.destination} HK${seg.quantity}  ${seg.departure} ${seg.arrival} *1A/E*`);
    });

    outputLines.push('OK - CONFIRMED');

    return {
      ok: true,
      command: 'ER',
      echo: context.normalizedInput,
      output: outputLines.join('\n')
    };
  }
};