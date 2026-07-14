import { updatePnrDraft } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const contactPattern = /^AP(.+)$/;

export const contactCommand: CommandHandler = {
  name: 'AP',
  match(input) {
    return contactPattern.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(contactPattern);

    if (!match) {
      return {
        ok: false,
        command: 'AP',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const contact = match[1].trim();

    await updatePnrDraft(context.sessionId, (draft) => ({
      ...draft,
      contact
    }));

    return {
      ok: true,
      command: 'AP',
      echo: context.normalizedInput,
      output: `AP ${contact}`
    };
  }
};