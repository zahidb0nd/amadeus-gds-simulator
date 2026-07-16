import { getSessionState, findFlights, setAvailabilityContext, type FlightDocument, type AvailabilitySearchParams } from '../gds-store';
import type { CommandHandler } from './types';
import { formatAvailability, buildAvailabilityContext, formatDate } from './availability';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const availabilityNavCommand: CommandHandler = {
  name: 'AN_NAV',
  match(input) {
    return /^(MN|MY|MB|AC).*$/.test(input);
  },
  async execute(context) {
    const cmdToken = context.commandToken || context.normalizedInput.substring(0, 2);
    
    if (cmdToken === 'MB') {
      return {
        ok: true,
        command: 'MB',
        echo: context.normalizedInput,
        output: 'END OF DISPLAY' // Simulator does not paginate
      };
    }

    const session = await getSessionState(context.sessionId);
    const searchParams = session.lastAvailabilitySearch;

    if (!searchParams) {
      return {
        ok: false,
        command: cmdToken,
        echo: context.normalizedInput,
        output: 'NO PREVIOUS AVAILABILITY OR TIMETABLE'
      };
    }

    let newDate = new Date(searchParams.date);
    let newOrigin = searchParams.origin;

    if (cmdToken === 'MN') {
      newDate = addDays(newDate, 1);
    } else if (cmdToken === 'MY') {
      newDate = addDays(newDate, -1);
    } else if (cmdToken === 'AC') {
      const arg = context.argument;
      if (!arg) {
        return { ok: false, command: cmdToken, echo: context.normalizedInput, output: 'INVALID FORMAT' };
      }

      if (/^-?\d+$/.test(arg)) {
        // e.g. AC3 or AC-3
        newDate = addDays(newDate, parseInt(arg, 10));
      } else if (/^\d{2}[A-Z]{3}$/.test(arg)) {
        // e.g. AC15JUL
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const day = parseInt(arg.slice(0, 2), 10);
        const monthStr = arg.slice(2, 5).toUpperCase();
        const monthIndex = months.indexOf(monthStr);
        
        let year = new Date().getFullYear();
        if (monthIndex !== -1) {
          if (monthIndex < new Date().getMonth() || (monthIndex === new Date().getMonth() && day < new Date().getDate())) {
            year++;
          }
        }
        newDate = new Date(year, monthIndex !== -1 ? monthIndex : 0, day);
      } else if (/^[A-Z]{3}$/.test(arg)) {
        // e.g. ACJFK
        newOrigin = arg;
      } else {
        return { ok: false, command: cmdToken, echo: context.normalizedInput, output: 'INVALID FORMAT' };
      }
    }

    const dateStr = formatDate(newDate);

    // Update params
    const newSearchParams: AvailabilitySearchParams = {
      ...searchParams,
      date: newDate,
      dateStr,
      origin: newOrigin
    };

    let flights = await findFlights(newOrigin, searchParams.destination, newDate);

    // Apply filters from previous search
    if (newSearchParams.airlineFilter) {
      const allowedAirlines = newSearchParams.airlineFilter.split(',');
      flights = flights.filter(f => allowedAirlines.includes(f.carrierCode));
    }
    if (newSearchParams.excludeAirline) {
      const excludedAirlines = newSearchParams.excludeAirline.split(',');
      flights = flights.filter(f => !excludedAirlines.includes(f.carrierCode));
    }
    if (newSearchParams.classFilter) {
      flights = flights.filter(f => f.classes.some(c => c.class === newSearchParams.classFilter));
    }
    if (newSearchParams.cabinFilter) {
      const cabinMap: Record<string, string[]> = {
        'F': ['F', 'P', 'A'],
        'C': ['C', 'J', 'D', 'Z'],
        'Y': ['Y', 'B', 'M', 'H', 'Q', 'K', 'L', 'V', 'S', 'N', 'O']
      };
      const allowedClasses = cabinMap[newSearchParams.cabinFilter] || [newSearchParams.cabinFilter];
      flights = flights.filter(f => f.classes.some(c => allowedClasses.includes(c.class)));
    }

    const availabilityContext = buildAvailabilityContext(dateStr, newOrigin, searchParams.destination, flights);
    await setAvailabilityContext(context.sessionId, availabilityContext, context.normalizedInput, newSearchParams);

    return {
      ok: true,
      command: cmdToken,
      echo: context.normalizedInput,
      output: await formatAvailability(dateStr, newOrigin, searchParams.destination, flights, newSearchParams.commandType)
    };
  }
};
