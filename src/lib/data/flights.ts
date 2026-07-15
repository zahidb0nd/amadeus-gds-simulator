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
  // Original BLR-DOH
  { airline: 'QR', flightNumber: '522', origin: 'BLR', destination: 'DOH', departure: '0135', arrival: '0350', aircraft: '321', classes: { J: 9, C: 9, Y: 9 } },
  { airline: 'QR', flightNumber: '524', origin: 'BLR', destination: 'DOH', departure: '0910', arrival: '1120', aircraft: '321', classes: { J: 4, C: 4, Y: 9 } },
  { airline: '6E', flightNumber: '1234', origin: 'BLR', destination: 'DOH', departure: '1400', arrival: '1615', aircraft: '320', classes: { Y: 9 } },
  { airline: 'QR', flightNumber: '528', origin: 'BLR', destination: 'DOH', departure: '1845', arrival: '2100', aircraft: '359', classes: { J: 9, C: 9, D: 9, Y: 9, B: 9, M: 9 } },
  
  // JFK (New York) - LHR (London)
  { airline: 'BA', flightNumber: '112', origin: 'JFK', destination: 'LHR', departure: '1830', arrival: '0630', aircraft: '77W', classes: { F: 2, J: 9, W: 9, Y: 9 } },
  { airline: 'VS', flightNumber: '4', origin: 'JFK', destination: 'LHR', departure: '2130', arrival: '0930', aircraft: '35K', classes: { J: 5, W: 8, Y: 9 } },
  { airline: 'AA', flightNumber: '100', origin: 'JFK', destination: 'LHR', departure: '2230', arrival: '1030', aircraft: '772', classes: { J: 9, W: 4, Y: 9 } },

  // DXB (Dubai) - LHR (London)
  { airline: 'EK', flightNumber: '1', origin: 'DXB', destination: 'LHR', departure: '0745', arrival: '1225', aircraft: '388', classes: { F: 4, J: 9, Y: 9 } },
  { airline: 'EK', flightNumber: '3', origin: 'DXB', destination: 'LHR', departure: '1430', arrival: '1910', aircraft: '388', classes: { F: 2, J: 9, Y: 9 } },
  { airline: 'BA', flightNumber: '106', origin: 'DXB', destination: 'LHR', departure: '0130', arrival: '0615', aircraft: '789', classes: { J: 9, W: 9, Y: 9 } },

  // HND (Tokyo) - LAX (Los Angeles)
  { airline: 'NH', flightNumber: '106', origin: 'HND', destination: 'LAX', departure: '2255', arrival: '1700', aircraft: '789', classes: { F: 1, J: 9, Y: 9 } },
  { airline: 'JL', flightNumber: '16', origin: 'HND', destination: 'LAX', departure: '1700', arrival: '1100', aircraft: '77W', classes: { F: 3, J: 9, Y: 9 } },

  // SIN (Singapore) - SYD (Sydney)
  { airline: 'SQ', flightNumber: '211', origin: 'SIN', destination: 'SYD', departure: '0930', arrival: '1920', aircraft: '77W', classes: { F: 2, J: 9, Y: 9 } },
  { airline: 'SQ', flightNumber: '221', origin: 'SIN', destination: 'SYD', departure: '2015', arrival: '0555', aircraft: '388', classes: { F: 4, J: 9, Y: 9 } },
  { airline: 'QF', flightNumber: '82', origin: 'SIN', destination: 'SYD', departure: '2100', arrival: '0640', aircraft: '333', classes: { J: 9, Y: 9 } },

  // CDG (Paris) - DXB (Dubai)
  { airline: 'AF', flightNumber: '662', origin: 'CDG', destination: 'DXB', departure: '1330', arrival: '2230', aircraft: '77W', classes: { F: 1, J: 9, W: 9, Y: 9 } },
  { airline: 'EK', flightNumber: '74', origin: 'CDG', destination: 'DXB', departure: '1535', arrival: '0020', aircraft: '388', classes: { F: 4, J: 9, Y: 9 } }
];

export function findFlights(origin: string, destination: string) {
  const found = flights.filter(
    (flight) => flight.origin === origin.toUpperCase() && flight.destination === destination.toUpperCase()
  );
  
  if (found.length === 0) {
    return [{
      airline: 'ZZ',
      flightNumber: Math.floor(Math.random() * 9000 + 1000).toString(),
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departure: '1000',
      arrival: '1400',
      aircraft: '737',
      classes: { J: 9, C: 9, Y: 9, M: 9 }
    }];
  }
  
  return found;
}