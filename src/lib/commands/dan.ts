import type { CommandHandler } from './types';
import { getAirport } from '../data/airports';

export const danCommand: CommandHandler = {
  name: 'DAN',
  match: (input) => /^DAN[A-Z]{3}$/.test(input),
  execute: ({ normalizedInput }) => {
    const code = normalizedInput.slice(3);
    const airport = getAirport(code);

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
