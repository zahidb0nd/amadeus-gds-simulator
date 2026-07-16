import { ObjectId } from 'mongodb';

export type PnrName = {
  surname: string;
  firstname: string;
  title?: string;
};

export type PnrSegment = {
  segmentRef: number;
  airline: string;
  flightNumber: string;
  bookingClass: string;
  quantity: number;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  status: 'KK' | 'XX';
};

export type FareTax = {
  code: string;
  amount: number;
};

export type TstQuote = {
  route: string;
  bookingClass: string;
  fareBasis: string;
  baseFare: number;
  taxes: FareTax[];
  total: number;
  currency: string;
  refundable: boolean;
  penalty: number;
};

export type TicketDocument = {
  number: string;
  status: 'ISSUED' | 'VOIDED';
  issuedAt: Date;
  voidedAt?: Date;
};

export type PnrDraft = {
  names: PnrName[];
  segments: PnrSegment[];
  contact?: string;
  ticketingArrangement?: string;
  tst?: TstQuote;
};

export type PnrDocument = {
  _id?: ObjectId;
  recordLocator: string;
  sessionId: string;
  names: PnrName[];
  itinerary: PnrSegment[];
  contact?: string;
  ticketingArrangement?: string;
  tst?: TstQuote;
  ticket?: TicketDocument;
  refund?: {
    amount: number;
    currency: string;
    processedAt: Date;
  };
  status: 'ACTIVE' | 'TICKETED' | 'CANCELLED' | 'REFUNDED';
  createdAt: Date;
};
