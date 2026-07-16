import { findAirportByCode, findFlights, setAvailabilityContext, type FlightDocument, type AvailabilitySearchParams } from '../gds-store';
import type { CommandHandler } from './types';

// Updated pattern: (Date)?(Origin)(Destination)(*ReturnDate)?(/Filters)?
const availabilityPattern = /^(?:(\d{2}[A-Z]{3}))?([A-Z]{3})([A-Z]{3})(?:\*(\d{2}[A-Z]{3}))?(?:\/(.*))?$/;

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function parseDate(dateStr: string): Date {
  const day = parseInt(dateStr.slice(0, 2), 10);
  const monthStr = dateStr.slice(2, 5).toUpperCase();
  const monthIndex = months.indexOf(monthStr);
  
  const now = new Date();
  let year = now.getFullYear();
  
  if (monthIndex !== -1) {
    if (monthIndex < now.getMonth() || (monthIndex === now.getMonth() && day < now.getDate())) {
      year++;
    }
  }
  
  return new Date(year, monthIndex !== -1 ? monthIndex : 0, day);
}

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  return `${day}${month}`;
}

export async function formatAvailability(dateStr: string, origin: string, destination: string, flights: FlightDocument[], commandType: string = 'AN') {
  const originAirport = await findAirportByCode(origin);
  const destinationAirport = await findAirportByCode(destination);
  const yearSuffix = new Date().getFullYear().toString().slice(-2);

  const headerOrigin = originAirport ? `${originAirport.code} ${originAirport.city.toUpperCase()}` : origin;
  const headerDestination = destinationAirport ? `${destinationAirport.code} ${destinationAirport.city.toUpperCase()}` : destination;
  const header = `** AMADEUS ${commandType === 'TN' ? 'TIMETABLE' : 'AVAILABILITY'} - ${commandType} **  ${dateStr}${yearSuffix}  ${headerOrigin} ${headerDestination}`;

  if (flights.length === 0) {
    return [header, 'NO AVAILABILITY FOUND'].join('\n');
  }

  const classStrings = flights.map((flight) =>
    flight.classes
      .map(({ class: c, seats }) => `${c}${commandType === 'TN' ? ' ' : Math.min(seats, 9)}`)
      .join(' ')
  );
  const classColumnWidth = Math.max(...classStrings.map((value) => value.length), 0);

  const lines = flights.map((flight, index) => {
    const classes = classStrings[index];
    const classColumn = classes.padEnd(classColumnWidth, ' ');
    const flightNumber = flight.flightNumber.padStart(4, ' ');
    
    if (!flight.aircraft) {
      throw new Error(`Aircraft missing from flight data for ${flight.carrierCode}${flight.flightNumber}`);
    }

    return `${index + 1}  ${flight.carrierCode} ${flightNumber}  ${classColumn}  ${flight.origin} ${flight.destination} ${flight.departureTime} ${flight.arrivalTime}  E0/${flight.aircraft}`;
  });

  return [header, ...lines].join('\n');
}

export function buildAvailabilityContext(date: string, origin: string, destination: string, flights: FlightDocument[]) {
  return flights.map((flight, index) => {
    const classesMap = flight.classes.reduce((acc, { class: c, seats }) => {
      acc[c] = seats;
      return acc;
    }, {} as Record<string, number>);

    return {
      lineNumber: index + 1,
      airline: flight.carrierCode,
      flightNumber: flight.flightNumber,
      classes: classesMap,
      origin: flight.origin,
      destination: flight.destination,
      departure: flight.departureTime,
      arrival: flight.arrivalTime,
      aircraft: flight.aircraft,
      date
    };
  });
}

export const availabilityCommand: CommandHandler = {
  name: 'AN',
  match(input) {
    return /^(AN|AD|TN).*$/.test(input);
  },
  async execute(context) {
    const cmdToken = context.commandToken || context.normalizedInput.substring(0, 2);

    if (!context.argument) {
      return {
        ok: false,
        command: cmdToken,
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const match = context.argument.match(availabilityPattern);

    if (!match) {
      return {
        ok: false,
        command: cmdToken,
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const [, parsedDate, origin, destination, returnDate, filtersStr] = match;
    
    const dateStr = parsedDate || formatDate(new Date());
    const dateObj = parseDate(dateStr);
    
    const searchParams: AvailabilitySearchParams = {
      commandType: cmdToken as 'AN' | 'TN',
      dateStr,
      date: dateObj,
      origin,
      destination
    };

    if (filtersStr) {
      const filters = filtersStr.split('/');
      for (const filter of filters) {
        if (filter.startsWith('A-')) {
          searchParams.excludeAirline = filter.slice(2);
        } else if (filter.startsWith('A')) {
          searchParams.airlineFilter = filter.slice(1);
        } else if (filter.startsWith('C')) {
          searchParams.classFilter = filter.slice(1);
        } else if (filter.startsWith('K')) {
          searchParams.cabinFilter = filter.slice(1);
        }
      }
    }

    let flights = await findFlights(origin, destination, dateObj);

    // Apply filters
    if (searchParams.airlineFilter) {
      const allowedAirlines = searchParams.airlineFilter.split(',');
      flights = flights.filter(f => allowedAirlines.includes(f.carrierCode));
    }
    if (searchParams.excludeAirline) {
      const excludedAirlines = searchParams.excludeAirline.split(',');
      flights = flights.filter(f => !excludedAirlines.includes(f.carrierCode));
    }
    if (searchParams.classFilter) {
      flights = flights.filter(f => f.classes.some(c => c.class === searchParams.classFilter));
    }
    if (searchParams.cabinFilter) {
      const cabinMap: Record<string, string[]> = {
        'F': ['F', 'P', 'A'],
        'C': ['C', 'J', 'D', 'Z'],
        'Y': ['Y', 'B', 'M', 'H', 'Q', 'K', 'L', 'V', 'S', 'N', 'O']
      };
      const allowedClasses = cabinMap[searchParams.cabinFilter] || [searchParams.cabinFilter];
      flights = flights.filter(f => f.classes.some(c => allowedClasses.includes(c.class)));
    }

    const availabilityContext = buildAvailabilityContext(dateStr, origin, destination, flights);
    await setAvailabilityContext(context.sessionId, availabilityContext, context.normalizedInput, searchParams);

    return {
      ok: true,
      command: cmdToken,
      echo: context.normalizedInput,
      output: await formatAvailability(dateStr, origin, destination, flights, searchParams.commandType)
    };
  }
};