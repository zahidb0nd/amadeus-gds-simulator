import type { CommandHandler } from './types';
import { findAirportsByName } from '../gds-store';

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

    const airports = await findAirportsByName(arg);

    if (!airports || airports.length === 0) {
      return {
        ok: false,
        command: 'DAN',
        echo: normalizedInput,
        output: 'NOT FOUND'
      };
    }

    const output = airports.map((airport) => `${airport.code} - ${airport.name.toUpperCase()}, ${airport.city.toUpperCase()}, ${airport.country.toUpperCase()}`).join('\n');

    return {
      ok: true,
      command: 'DAN',
      echo: normalizedInput,
      output
    };
  }
};
