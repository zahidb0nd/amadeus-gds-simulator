import { findAirportByCode, findFlights, setAvailabilityContext, type FlightDocument } from '../gds-store';
import type { CommandHandler } from './types';

const availabilityPattern = /^(?:(\d{2}[A-Z]{3}))?([A-Z]{3})([A-Z]{3})$/;

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parseDate(dateStr: string): Date {
  const day = parseInt(dateStr.slice(0, 2), 10);
  const monthStr = dateStr.slice(2, 5).toUpperCase();
  const monthIndex = months.indexOf(monthStr);
  
  const now = new Date();
  let year = now.getFullYear();
  
  // If the parsed month is earlier than the current month, assume next year
  if (monthIndex < now.getMonth() && monthIndex !== -1) {
    year++;
  }
  
  return new Date(year, monthIndex !== -1 ? monthIndex : 0, day);
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  return `${day}${month}`;
}

async function formatAvailability(dateStr: string, origin: string, destination: string, flights: FlightDocument[]) {
  const originAirport = await findAirportByCode(origin);
  const destinationAirport = await findAirportByCode(destination);
  const yearSuffix = new Date().getFullYear().toString().slice(-2);

  const headerOrigin = originAirport ? `${originAirport.code} ${originAirport.city.toUpperCase()}` : origin;
  const headerDestination = destinationAirport ? `${destinationAirport.code} ${destinationAirport.city.toUpperCase()}` : destination;
  const header = `** AMADEUS AVAILABILITY - AN **  ${dateStr}${yearSuffix}  ${headerOrigin} ${headerDestination}`;

  if (flights.length === 0) {
    return [header, 'NO AVAILABILITY FOUND'].join('\n');
  }

  const classStrings = flights.map((flight) =>
    flight.classes
      .map(({ class: c, seats }) => `${c}${Math.min(seats, 9)}`)
      .join(' ')
  );
  const classColumnWidth = Math.max(...classStrings.map((value) => value.length), 0);

  const lines = flights.map((flight, index) => {
    const classes = classStrings[index];
    const classColumn = classes.padEnd(classColumnWidth, ' ');
    const flightNumber = flight.flightNumber.padStart(4, ' ');

    return `${index + 1}  ${flight.carrierCode} ${flightNumber}  ${classColumn}  ${flight.origin} ${flight.destination} ${flight.departureTime} ${flight.arrivalTime}  E0/737`;
  });

  return [header, ...lines].join('\n');
}

function buildAvailabilityContext(date: string, origin: string, destination: string, flights: FlightDocument[]) {
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
      aircraft: '737', // Defaulting aircraft since it's not in FlightDocument
      date
    };
  });
}

export const availabilityCommand: CommandHandler = {
  name: 'AN',
  match(input) {
    return /^AN.*$/.test(input);
  },
  async execute(context) {
    if (!context.argument) {
      return {
        ok: false,
        command: 'AN',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const match = context.argument.match(availabilityPattern);

    if (!match) {
      return {
        ok: false,
        command: 'AN',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const [, parsedDate, origin, destination] = match;
    
    // Default to today if date is omitted
    const dateStr = parsedDate || formatDate(new Date());
    const dateObj = parseDate(dateStr);
    
    // AST Payload as requested
    const parsedPayload = {
      commandType: 'AN',
      date: dateObj,
      origin,
      destination
    };

    const flights = await findFlights(parsedPayload.origin, parsedPayload.destination, parsedPayload.date);
    const availabilityContext = buildAvailabilityContext(dateStr, parsedPayload.origin, parsedPayload.destination, flights);
    await setAvailabilityContext(context.sessionId, availabilityContext, context.normalizedInput);

    return {
      ok: true,
      command: 'AN',
      echo: context.normalizedInput,
      output: await formatAvailability(dateStr, parsedPayload.origin, parsedPayload.destination, flights)
    };
  }
};