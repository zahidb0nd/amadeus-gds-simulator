import { ObjectId } from 'mongodb';

export interface Passenger {
  firstName: string;
  lastName: string;
  title: 'MR' | 'MRS' | 'MS' | 'CHD' | 'INF';
}

export interface FlightSegment {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  status: 'HK' | 'TK' | 'HX';
}

export interface PnrDocument {
  _id?: ObjectId;
  pnrLocator: string;
  passengers: Passenger[];
  segments: FlightSegment[];
}
