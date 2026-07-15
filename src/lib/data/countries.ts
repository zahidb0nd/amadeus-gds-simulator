export type Country = {
  code: string;
  name: string;
};

export const countries: Country[] = [
  { code: 'IN', name: 'India' },
  { code: 'QA', name: 'Qatar' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' }
];

export function getCountry(code: string) {
  return countries.find((country) => country.code === code.toUpperCase());
}
