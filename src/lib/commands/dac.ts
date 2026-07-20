import type { CommandHandler } from './types';
import { findAirportByCode } from '../gds-store';
import { getAirline } from '../data/airlines';

export const dacCommand: CommandHandler = {
  name: 'DAC',
  match: (input) => /^DAC.*$/.test(input),
  execute: async ({ normalizedInput, argument }) => {
    const arg = argument || normalizedInput.slice(3).trim();

    if (arg.length === 2) {
      const airline = getAirline(arg);

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

    if (arg.length !== 3) {
      return {
        ok: false,
        command: 'DAC',
        echo: normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const airport = await findAirportByCode(arg);

    if (!airport || !airport.name || airport.name.trim() === '' || airport.name.trim() === 'N/A') {
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
      output: `${airport.code} - ${airport.name.toUpperCase()}, ${airport.city.toUpperCase()}, ${airport.country.toUpperCase()}`
    };
  }
};
