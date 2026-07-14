export type Airline = {
  code: string;
  name: string;
  alliance: string;
};

export const airlines: Airline[] = [
  { code: 'QR', name: 'Qatar Airways', alliance: 'Oneworld' },
  { code: '6E', name: 'IndiGo', alliance: 'None' },
  { code: 'BA', name: 'British Airways', alliance: 'Oneworld' },
  { code: 'AA', name: 'American Airlines', alliance: 'Oneworld' },
  { code: 'DL', name: 'Delta Air Lines', alliance: 'SkyTeam' },
  { code: 'UA', name: 'United Airlines', alliance: 'Star Alliance' },
  { code: 'EK', name: 'Emirates', alliance: 'None' }
];

export function getAirline(code: string) {
  return airlines.find((airline) => airline.code === code.toUpperCase());
}
