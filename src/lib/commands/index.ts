import { availabilityCommand } from './availability';
import { contactCommand } from './contact';
import { endRetrieveCommand } from './end-retrieve';
import { helpCommand } from './help';
import { ignoreCommand } from './ignore';
import { nameCommand } from './name';
import { retrieveCommand } from './retrieve';
import { farePricingCommand } from './fare-pricing';
import { refundCommand } from './refund';
import { sellSegmentCommand } from './sell';
import { ticketingCommand } from './ticketing';
import { ticketIssueCommand } from './ticket-issue';
import { ticketVoidCommand } from './ticket-void';
import { cancelSegmentCommand } from './cancel-segment';
import { dacCommand } from './dac';
import { danCommand } from './dan';
import { eanCommand } from './ean';
import { dnaCommand } from './dna';
import { dcCommand } from './dc';
import { ggCommand } from './gg';
import { ddCommand } from './dd';
import { dfCommand } from './df';
import { availabilityNavCommand } from './availability-nav';
import { flightInfoCommand } from './flight-info';
import type { CommandHandler } from './types';

export const commandHandlers: CommandHandler[] = [
  helpCommand,
  availabilityCommand,
  availabilityNavCommand,
  flightInfoCommand,
  dacCommand,
  danCommand,
  eanCommand,
  dnaCommand,
  dcCommand,
  ggCommand,
  ddCommand,
  dfCommand,
  sellSegmentCommand,
  nameCommand,
  contactCommand,
  ticketingCommand,
  farePricingCommand,
  ticketIssueCommand,
  ticketVoidCommand,
  cancelSegmentCommand,
  refundCommand,
  retrieveCommand,
  ignoreCommand,
  endRetrieveCommand
];

export function getCommandHandler(input: string) {
  return commandHandlers.find((handler) => handler.match(input));
}