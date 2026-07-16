import type { CommandHandler } from './types';
import { getSessionState, findAirportByCode } from '../gds-store';
import { airlines } from '../data/airlines';

export const flightInfoCommand: CommandHandler = {
  name: 'FLIGHT_INFO',
  match(input) {
    return /^(DO|DM|DMI|DRT).*$/.test(input);
  },
  async execute(context) {
    const cmdToken = context.commandToken || context.normalizedInput.substring(0, 3);
    const arg = context.argument || '';

    if (cmdToken === 'DO') {
      if (!arg || arg.length < 3) {
        return { ok: false, command: 'DO', echo: context.normalizedInput, output: 'INVALID FLIGHT NUMBER' };
      }
      const airlineCode = arg.slice(0, 2);
      const flightNum = arg.slice(2);
      const airline = airlines.find(a => a.code === airlineCode);
      const name = airline ? airline.name : 'UNKNOWN CARRIER';
      return {
        ok: true,
        command: 'DO',
        echo: context.normalizedInput,
        output: `${airlineCode} ${flightNum} - OPERATED BY ${name.toUpperCase()}`
      };
    }

    if (cmdToken === 'DM') {
      if (!arg || arg.length !== 3) {
        return { ok: false, command: 'DM', echo: context.normalizedInput, output: 'INVALID AIRPORT CODE' };
      }
      const airport = await findAirportByCode(arg);
      if (!airport) {
        return { ok: false, command: 'DM', echo: context.normalizedInput, output: 'UNKNOWN AIRPORT' };
      }
      return {
        ok: true,
        command: 'DM',
        echo: context.normalizedInput,
        output: `STANDARD MCT FOR ${arg} (${airport.city.toUpperCase()}) IS 0100 (1HR 00MIN)\nEXCEPTIONS MAY APPLY`
      };
    }

    if (cmdToken === 'DMI') {
      const session = await getSessionState(context.sessionId);
      if (session.pnrInProgress.segments.length < 2) {
        return {
          ok: false,
          command: 'DMI',
          echo: context.normalizedInput,
          output: 'NO CONNECTING FLIGHTS IN ITINERARY'
        };
      }
      return {
        ok: true,
        command: 'DMI',
        echo: context.normalizedInput,
        output: 'ALL CONNECTIONS MEET MINIMUM CONNECTING TIME'
      };
    }

    if (cmdToken === 'DRT') {
      if (!arg || arg.length !== 6) {
        return { ok: false, command: 'DRT', echo: context.normalizedInput, output: 'INVALID CITY PAIR' };
      }
      const origin = arg.slice(0, 3);
      const dest = arg.slice(3, 6);
      return {
        ok: true,
        command: 'DRT',
        echo: context.normalizedInput,
        output: `ROUTING OPTIONS FOR ${origin} TO ${dest}:\n1. DIRECT FLIGHTS\n2. VIA MAJOR ALLIANCE HUBS`
      };
    }

    return {
      ok: false,
      command: cmdToken,
      echo: context.normalizedInput,
      output: 'INVALID FORMAT'
    };
  }
};
