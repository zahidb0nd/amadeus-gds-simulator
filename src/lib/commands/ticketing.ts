import { updatePnrDraft } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const ticketingPattern = /^TK\s+(TL.+)$/;

export const ticketingCommand: CommandHandler = {
  name: 'TK',
  match(input) {
    return ticketingPattern.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(ticketingPattern);

    if (!match) {
      return {
        ok: false,
        command: 'TK',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const ticketingArrangement = match[1].trim();

    await updatePnrDraft(context.sessionId, (draft) => ({
      ...draft,
      ticketingArrangement
    }));

    return {
      ok: true,
      command: 'TK',
      echo: context.normalizedInput,
      output: `TK ${ticketingArrangement}`
    };
  }
};