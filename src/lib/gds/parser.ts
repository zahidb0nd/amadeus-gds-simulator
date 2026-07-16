import { Passenger } from '../../types/pnr';

export type AvailabilitySearch = {
  type: 'AVAILABILITY_SEARCH';
  date: string;
  origin: string;
  destination: string;
};

export type AddPassenger = {
  type: 'ADD_PASSENGER';
  passenger: Passenger;
};

export type AddPhone = {
  type: 'ADD_PHONE';
  text: string;
};

export type TicketingArrangement = {
  type: 'TICKETING_ARRANGEMENT';
};

export type EndTransaction = {
  type: 'END_TRANSACTION';
};

export type GdsAction =
  | AvailabilitySearch
  | AddPassenger
  | AddPhone
  | TicketingArrangement
  | EndTransaction;

const AVAILABILITY_REGEX = /^AN(\d{2}[A-Z]{3})([A-Z]{3})([A-Z]{3})$/i;
const PASSENGER_REGEX = /^1([A-Z]+)\/([A-Z]+)(MR|MRS|MS|CHD|INF)$/i;
const PHONE_REGEX = /^AP\s+(.+)$/i;
const TICKETING_REGEX = /^TK\s+OK$/i;
const END_TRANSACTION_REGEX = /^ER$/i;

export function parseGdsCommand(input: string): GdsAction | null {
  const trimmed = input.trim();

  const availabilityMatch = trimmed.match(AVAILABILITY_REGEX);
  if (availabilityMatch) {
    return {
      type: 'AVAILABILITY_SEARCH',
      date: availabilityMatch[1]!.toUpperCase(),
      origin: availabilityMatch[2]!.toUpperCase(),
      destination: availabilityMatch[3]!.toUpperCase(),
    };
  }

  const passengerMatch = trimmed.match(PASSENGER_REGEX);
  if (passengerMatch) {
    const title = passengerMatch[3]!.toUpperCase() as Passenger['title'];
    return {
      type: 'ADD_PASSENGER',
      passenger: {
        lastName: passengerMatch[1]!.toUpperCase(),
        firstName: passengerMatch[2]!.toUpperCase(),
        title,
      },
    };
  }

  const phoneMatch = trimmed.match(PHONE_REGEX);
  if (phoneMatch) {
    return {
      type: 'ADD_PHONE',
      text: phoneMatch[1]!,
    };
  }

  const ticketingMatch = trimmed.match(TICKETING_REGEX);
  if (ticketingMatch) {
    return {
      type: 'TICKETING_ARRANGEMENT',
    };
  }

  const endTransactionMatch = trimmed.match(END_TRANSACTION_REGEX);
  if (endTransactionMatch) {
    return {
      type: 'END_TRANSACTION',
    };
  }

  return null;
}
