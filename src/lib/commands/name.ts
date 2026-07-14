import { updatePnrDraft } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const namePattern = /^NM1([A-Z]+)\/([A-Z]+)$/;

export const nameCommand: CommandHandler = {
  name: 'NM',
  match(input) {
    return namePattern.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(namePattern);

    if (!match) {
      return {
        ok: false,
        command: 'NM',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const [, surname, firstname] = match;

    await updatePnrDraft(context.sessionId, (draft) => ({
      ...draft,
      names: [...draft.names, { surname, firstname }]
    }));

    return {
      ok: true,
      command: 'NM',
      echo: context.normalizedInput,
      output: `1  ${surname}/${firstname}`
    };
  }
};