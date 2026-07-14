import { findFlights } from '@/lib/data/flights';
import { getAirport } from '@/lib/data/airports';
import { setAvailabilityContext } from '@/lib/gds-store';
import type { CommandHandler } from './types';

const availabilityPattern = /^AN(\d{2}[A-Z]{3})([A-Z]{3})([A-Z]{3})$/;

function formatAvailability(date: string, origin: string, destination: string) {
  const originAirport = getAirport(origin);
  const destinationAirport = getAirport(destination);
  const flights = findFlights(origin, destination);
  const yearSuffix = new Date().getFullYear().toString().slice(-2);

  const headerOrigin = originAirport ? `${originAirport.code} ${originAirport.city.toUpperCase()}` : origin;
  const headerDestination = destinationAirport ? `${destinationAirport.code} ${destinationAirport.city.toUpperCase()}` : destination;
  const header = `** AMADEUS AVAILABILITY - AN **  ${date}${yearSuffix}  ${headerOrigin} ${headerDestination}`;

  if (flights.length === 0) {
    return [header, 'NO AVAILABILITY FOUND'].join('\n');
  }

  const classStrings = flights.map((flight) =>
    Object.entries(flight.classes)
      .map(([bookingClass, seats]) => `${bookingClass}${Math.min(seats, 9)}`)
      .join(' ')
  );
  const classColumnWidth = Math.max(...classStrings.map((value) => value.length), 0);

  const lines = flights.map((flight, index) => {
    const classes = classStrings[index];
    const classColumn = classes.padEnd(classColumnWidth, ' ');
    const flightNumber = flight.flightNumber.padStart(4, ' ');

    return `${index + 1}  ${flight.airline} ${flightNumber}  ${classColumn}  ${flight.origin} ${flight.destination} ${flight.departure} ${flight.arrival}  E0/${flight.aircraft}`;
  });

  return [header, ...lines].join('\n');
}

function buildAvailabilityContext(date: string, origin: string, destination: string) {
  const flights = findFlights(origin, destination);

  return flights.map((flight, index) => ({
    lineNumber: index + 1,
    airline: flight.airline,
    flightNumber: flight.flightNumber,
    classes: flight.classes,
    origin: flight.origin,
    destination: flight.destination,
    departure: flight.departure,
    arrival: flight.arrival,
    aircraft: flight.aircraft,
    date
  }));
}

export const availabilityCommand: CommandHandler = {
  name: 'AN',
  match(input) {
    return availabilityPattern.test(input);
  },
  async execute(context) {
    const match = context.normalizedInput.match(availabilityPattern);

    if (!match) {
      return {
        ok: false,
        command: 'AN',
        echo: context.normalizedInput,
        output: 'INVALID FORMAT'
      };
    }

    const [, date, origin, destination] = match;
    const availabilityContext = buildAvailabilityContext(date, origin, destination);
    await setAvailabilityContext(context.sessionId, availabilityContext, context.normalizedInput);

    return {
      ok: true,
      command: 'AN',
      echo: context.normalizedInput,
      output: formatAvailability(date, origin, destination)
    };
  }
};