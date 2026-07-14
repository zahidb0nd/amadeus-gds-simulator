import { getSessionState, saveSessionState, updatePnrDraft } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const sellPattern = /^SS(\d+)([A-Z])(\d+)$/;

export const sellSegmentCommand: CommandHandler = {
  name: 'SS',
  match(input) {
    return sellPattern.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(sellPattern);

    if (!match) {
      return {
        ok: false,
        command: 'SS',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const [, quantityText, bookingClass, lineText] = match;
    const quantity = Number(quantityText);
    const lineNumber = Number(lineText);
    const session = await getSessionState(context.sessionId);
    const availability = session.availabilityContext.find((line) => line.lineNumber === lineNumber);

    if (!availability) {
      return {
        ok: false,
        command: 'SS',
        echo: context.normalizedInput,
        output: 'NO AVAILABILITY FOR LINE'
      };
    }

    const availableSeats = availability.classes[bookingClass] ?? 0;

    if (availableSeats < quantity) {
      return {
        ok: false,
        command: 'SS',
        echo: context.normalizedInput,
        output: `NOT ENOUGH ${bookingClass} CLASS AVAILABILITY`
      };
    }

    availability.classes[bookingClass] = availableSeats - quantity;
    session.availabilityContext = session.availabilityContext.map((line) => (line.lineNumber === lineNumber ? availability : line));
    await saveSessionState(session);

    await updatePnrDraft(context.sessionId, (draft) => ({
      ...draft,
      segments: [
        ...draft.segments,
        {
          segmentRef: draft.segments.length + 1,
          airline: availability.airline,
          flightNumber: availability.flightNumber,
          bookingClass,
          quantity,
          origin: availability.origin,
          destination: availability.destination,
          departure: availability.departure,
          arrival: availability.arrival,
          status: 'KK'
        }
      ]
    }));

    return {
      ok: true,
      command: 'SS',
      echo: context.normalizedInput,
      output: `1  ${availability.airline} ${availability.flightNumber.padStart(4, ' ')}  ${bookingClass}${quantity}  ${availability.origin} ${availability.destination} ${availability.departure} ${availability.arrival}  KK`
    };
  }
};