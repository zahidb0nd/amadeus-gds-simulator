import { updatePnrDraft } from '@/lib/gds-store';
import type { CommandHandler } from './types';

export const ticketingCommand: CommandHandler = {
  name: 'TK',
  match(input) {
    const norm = input.toUpperCase().replace(/\s+/g, '');
    return norm.startsWith('TKTL') || norm.startsWith('TKDO') || norm.startsWith('TKIN') || norm === 'TKOK';
  },
  async execute(context) {
    const input = context.normalizedInput.replace(/\s+/g, '');
    let type = '';
    let arrangementText = '';

    if (input === 'TKOK') {
      type = 'OK';
      arrangementText = 'OK';
    } else if (input.startsWith('TKTL')) {
      type = 'TL';
      arrangementText = `TL${input.slice(4)}`;
    } else if (input.startsWith('TKDO')) {
      type = 'DO';
      arrangementText = `DO${input.slice(4)}`;
    } else if (input.startsWith('TKIN')) {
      type = 'IN';
      arrangementText = `IN${input.slice(4)}`;
    } else {
      return {
        ok: false,
        command: 'TK',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    await updatePnrDraft(context.sessionId, (draft) => ({
      ...draft,
      ticketingArrangement: arrangementText
    }));

    return {
      ok: true,
      command: 'TK',
      echo: context.normalizedInput,
      output: `TK ${arrangementText}`
    };
  }
};