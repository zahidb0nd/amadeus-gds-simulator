export type Airline = {
  code: string;
  name: string;
  alliance: string;
  ticketPrefix: string;
  participating: boolean;
};

export const airlines: Airline[] = [
  { code: 'QR', name: 'Qatar Airways', alliance: 'Oneworld', ticketPrefix: '157', participating: true },
  { code: '6E', name: 'IndiGo', alliance: 'None', ticketPrefix: '312', participating: false },
  { code: 'BA', name: 'British Airways', alliance: 'Oneworld', ticketPrefix: '125', participating: true },
  { code: 'AA', name: 'American Airlines', alliance: 'Oneworld', ticketPrefix: '001', participating: true },
  { code: 'DL', name: 'Delta Air Lines', alliance: 'SkyTeam', ticketPrefix: '006', participating: true },
  { code: 'UA', name: 'United Airlines', alliance: 'Star Alliance', ticketPrefix: '016', participating: true },
  { code: 'EK', name: 'Emirates', alliance: 'None', ticketPrefix: '176', participating: true }
];

export function getAirline(code: string) {
  return airlines.find((airline) => airline.code === code.toUpperCase());
}
