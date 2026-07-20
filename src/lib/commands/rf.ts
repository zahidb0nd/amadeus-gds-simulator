import { updatePnrDraft } from '@/lib/gds-store';
import type { CommandHandler } from './types';

export const rfCommand: CommandHandler = {
  name: 'RF',
  match(input) {
    return /^RF\s*(.+)$/.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(/^RF\s*(.+)$/);
    if (!match) {
      return {
        ok: false,
        command: 'RF',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const signer = match[1].trim();
    if (!signer) {
      return {
        ok: false,
        command: 'RF',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    await updatePnrDraft(context.sessionId, (draft) => ({
      ...draft,
      receivedFrom: signer
    }));

    return {
      ok: true,
      command: 'RF',
      echo: context.normalizedInput,
      output: `RF ${signer}`
    };
  }
};
