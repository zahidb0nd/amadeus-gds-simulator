export type Flight = {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  aircraft: string;
  classes: Record<string, number>;
};

export const flights: Flight[] = [
  {
    airline: 'QR',
    flightNumber: '522',
    origin: 'BLR',
    destination: 'DOH',
    departure: '0135',
    arrival: '0350',
    aircraft: '321',
    classes: { J: 9, C: 9, Y: 9 }
  },
  {
    airline: 'QR',
    flightNumber: '524',
    origin: 'BLR',
    destination: 'DOH',
    departure: '0910',
    arrival: '1120',
    aircraft: '321',
    classes: { J: 4, C: 4, Y: 9 }
  },
  {
    airline: '6E',
    flightNumber: '1234',
    origin: 'BLR',
    destination: 'DOH',
    departure: '1400',
    arrival: '1615',
    aircraft: '320',
    classes: { Y: 9 }
  },
  {
    airline: 'QR',
    flightNumber: '528',
    origin: 'BLR',
    destination: 'DOH',
    departure: '1845',
    arrival: '2100',
    aircraft: '359',
    classes: { J: 9, C: 9, D: 9, Y: 9, B: 9, M: 9 }
  }
];

export function findFlights(origin: string, destination: string) {
  return flights.filter(
    (flight) => flight.origin === origin.toUpperCase() && flight.destination === destination.toUpperCase()
  );
}