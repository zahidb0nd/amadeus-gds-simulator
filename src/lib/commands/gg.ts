import { CommandHandler, CommandResult, CommandHandlerContext } from './types';
import { airlines } from '../data/airlines';
import { countries } from '../data/countries';

export const ggCommand: CommandHandler = {
  name: 'GG',
  match: (input: string) => {
    return /^(GGALLIANCE|GPOW|GPSA|GGA[A-Z0-9]{2}|GGCOU[A-Z]{2}|GGPCA[A-Z0-9]{2})$/i.test(input);
  },
  execute: (context: CommandHandlerContext): CommandResult => {
    const input = context.normalizedInput;

    // Alliance Lists
    if (input === 'GGALLIANCE' || input === 'GPOW') {
      const owAirlines = airlines.filter(a => a.alliance.toUpperCase() === 'ONEWORLD');
      const output = ['ONEWORLD ALLIANCE CARRIERS:', ...owAirlines.map(a => `${a.code} - ${a.name.toUpperCase()}`)].join('\n');
      return { ok: true, command: 'GG', echo: input, output };
    }

    if (input === 'GPSA') {
      const saAirlines = airlines.filter(a => a.alliance.toUpperCase() === 'STAR ALLIANCE');
      const output = ['STAR ALLIANCE CARRIERS:', ...saAirlines.map(a => `${a.code} - ${a.name.toUpperCase()}`)].join('\n');
      return { ok: true, command: 'GG', echo: input, output };
    }

    // GGA<Airline Code> - Airline Info
    const ggaMatch = input.match(/^GGA([A-Z0-9]{2})$/i);
    if (ggaMatch) {
      const code = ggaMatch[1];
      const airline = airlines.find(a => a.code === code);
      if (!airline) return { ok: false, command: 'GG', echo: input, output: 'NOT FOUND' };
      const output = [
        `AIRLINE INFORMATION - ${airline.code}`,
        `NAME: ${airline.name.toUpperCase()}`,
        `ALLIANCE: ${airline.alliance.toUpperCase()}`,
        `TICKET PREFIX: ${airline.ticketPrefix}`,
        `PARTICIPATING CARRIER: ${airline.participating ? 'YES' : 'NO'}`
      ].join('\n');
      return { ok: true, command: 'GG', echo: input, output };
    }

    // GGCOU<Country Code> - Country Info
    const ggcouMatch = input.match(/^GGCOU([A-Z]{2})$/i);
    if (ggcouMatch) {
      const code = ggcouMatch[1];
      const country = countries.find(c => c.code === code);
      if (!country) return { ok: false, command: 'GG', echo: input, output: 'NOT FOUND' };
      const output = [
        `COUNTRY INFORMATION - ${country.code}`,
        `NAME: ${country.name.toUpperCase()}`,
        `ISO CODE: ${country.code}`
      ].join('\n');
      return { ok: true, command: 'GG', echo: input, output };
    }

    // GGPCA<Airline Code> - Participating Carrier Check
    const ggpcaMatch = input.match(/^GGPCA([A-Z0-9]{2})$/i);
    if (ggpcaMatch) {
      const code = ggpcaMatch[1];
      const airline = airlines.find(a => a.code === code);
      if (!airline) return { ok: false, command: 'GG', echo: input, output: 'NOT FOUND' };
      if (airline.participating) {
        return { ok: true, command: 'GG', echo: input, output: `${airline.code} IS A PARTICIPATING CARRIER` };
      } else {
        return { ok: true, command: 'GG', echo: input, output: `${airline.code} IS NOT A PARTICIPATING CARRIER` };
      }
    }

    return { ok: false, command: 'GG', echo: input, output: 'INVALID COMMAND' };
  }
};
