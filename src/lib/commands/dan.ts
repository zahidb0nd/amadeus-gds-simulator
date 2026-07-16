import type { CommandHandler } from './types';
import { findAirportByName } from '../gds-store';

export const danCommand: CommandHandler = {
  name: 'DAN',
  match: (input) => /^DAN.*$/.test(input),
  execute: async ({ normalizedInput, argument }) => {
    const arg = argument || normalizedInput.slice(3).trim();

    if (arg.length === 0) {
      return {
        ok: false,
        command: 'DAN',
        echo: normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const airport = await findAirportByName(arg);

    if (!airport) {
      return {
        ok: false,
        command: 'DAN',
        echo: normalizedInput,
        output: 'NOT FOUND'
      };
    }

    return {
      ok: true,
      command: 'DAN',
      echo: normalizedInput,
      output: `${airport.code} - ${airport.name.toUpperCase()}, ${airport.city.toUpperCase()}, ${airport.country.toUpperCase()}`
    };
  }
};
