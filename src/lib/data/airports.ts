export type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
};

export const airports: Airport[] = [
  { code: 'BLR', name: 'Kempegowda International', city: 'Bengaluru', country: 'IN' },
  { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'QA' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'AE' },
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'IN' }
];

export function getAirport(code: string) {
  return airports.find((airport) => airport.code === code.toUpperCase());
}