import type { CommandHandler } from './types';
import { getAirline } from '../data/airlines';

export const dacCommand: CommandHandler = {
  name: 'DAC',
  match: (input) => /^DAC[A-Z0-9]{2}$/.test(input),
  execute: ({ normalizedInput }) => {
    const code = normalizedInput.slice(3);
    const airline = getAirline(code);

    if (!airline) {
      return {
        ok: false,
        command: 'DAC',
        echo: normalizedInput,
        output: 'NOT FOUND'
      };
    }

    return {
      ok: true,
      command: 'DAC',
      echo: normalizedInput,
      output: `${airline.code} - ${airline.name.toUpperCase()} (${airline.alliance.toUpperCase()})`
    };
  }
};
