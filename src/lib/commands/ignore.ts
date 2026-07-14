import { resetSessionState } from '@/lib/gds-store';
import type { CommandHandler } from './types';

export const ignoreCommand: CommandHandler = {
  name: 'IG',
  match(input) {
    return input === 'IG';
  },
  async execute(context) {
    await resetSessionState(context.sessionId);

    return {
      ok: true,
      command: 'IG',
      echo: context.normalizedInput,
      output: 'WORKAREA IGNORED'
    };
  }
};