import { CommandHandler, CommandResult, CommandHandlerContext } from './types';
import { countries } from '../data/countries';

export const dcCommand: CommandHandler = {
  name: 'DC',
  match: (input: string) => /^DC(.+)$/i.test(input),
  execute: (context: CommandHandlerContext): CommandResult => {
    const match = context.normalizedInput.match(/^DC(.+)$/i);
    if (!match) return { ok: false, command: 'DC', echo: context.normalizedInput, output: 'INVALID FORMAT' };

    const query = match[1].trim();

    // Check if it's a 2-letter country code
    if (query.length === 2 && /^[A-Z]{2}$/.test(query)) {
      const country = countries.find(c => c.code === query);
      if (country) {
        return {
          ok: true,
          command: 'DC',
          echo: context.normalizedInput,
          output: `${country.code} - ${country.name.toUpperCase()}`
        };
      }
    }

    // Otherwise, treat as country name
    const matches = countries.filter(c => c.name.toUpperCase().includes(query));
    if (matches.length > 0) {
      const output = matches
        .map(c => `${c.name.toUpperCase()} - ${c.code}`)
        .join('\n');
      return { ok: true, command: 'DC', echo: context.normalizedInput, output };
    }

    return { ok: false, command: 'DC', echo: context.normalizedInput, output: 'NOT FOUND' };
  }
};
