import type { CommandHandler } from './types';
import { airports } from '../data/airports';

export const eanCommand: CommandHandler = {
  name: 'EAN',
  match: (input) => /^EAN.+$/.test(input),
  execute: ({ normalizedInput }) => {
    const query = normalizedInput.slice(3).trim();
    
    if (!query) {
      return {
        ok: false,
        command: 'EAN',
        echo: normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const matches = airports.filter((airport) => 
      airport.name.toUpperCase().includes(query) || 
      airport.city.toUpperCase().includes(query)
    );

    if (matches.length === 0) {
      return {
        ok: false,
        command: 'EAN',
        echo: normalizedInput,
        output: 'NOT FOUND'
      };
    }

    const lines = matches.map((m) => `${m.code} - ${m.name.toUpperCase()}, ${m.city.toUpperCase()}, ${m.country.toUpperCase()}`);
    
    return {
      ok: true,
      command: 'EAN',
      echo: normalizedInput,
      output: lines.join('\n')
    };
  }
};
