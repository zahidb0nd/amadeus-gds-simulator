# Amadeus GDS Command Simulator

A full-stack Next.js web application that replicates core Amadeus Global Distribution System (GDS) workflows—availability search, PNR creation, fare pricing, ticketing, and cancellation/refund—using authentic Amadeus-style command syntax.

This project serves as a portfolio piece demonstrating both full-stack engineering ability and applied domain knowledge of travel industry GDS operations.

## Features
- **Authentic Command Parser**: Supports real Amadeus cryptic commands.
- **Fluid Terminal UI**: Keyboard-first interface with instant echoing, smooth auto-scroll, command history (up/down arrows), and intelligent autocomplete.
- **Full Booking Lifecycle**: Search availability → Sell segments → Add names/contacts → Price → Ticket → Cancel & Refund.
- **State Management**: True-to-life workarea state management simulating real GDS sessions.
- **Command Library**: Standalone `/library` page offering searchable documentation with one-click "Try it" integration into the terminal.
- **Edge Native**: API routes built for Vercel Edge Functions to minimize latency (<200ms responses).
- **MongoDB Persistence**: Completed PNRs and their states are persisted securely to MongoDB Atlas.

## Command Reference

| Command | Function | Example |
|---|---|---|
| `AN[date][origin][dest]` | Availability search | `AN15JULBLRDOH` |
| `SS[qty][class][line]` | Sell segment | `SS1Y1` |
| `NM1[surname]/[firstname]` | Add name element | `NM1PATEL/ARJUN` |
| `AP[phone]` | Add contact element | `AP+919876543210` |
| `TK TL[date/time]` | Add ticketing arrangement | `TK TL15JUL/2100` |
| `FXP` | Price PNR (TST creation) | `FXP` |
| `ER` | End & Retrieve (Save PNR) | `ER` |
| `RT[locator]` | Retrieve existing PNR | `RT85CF5C` |
| `TTP` | Issue ticket | `TTP` |
| `TTV` | Void ticket | `TTV` |
| `XI[segment]` | Cancel segment | `XI1` |
| `REFUND` | Process refund | `REFUND` |
| `IG` | Ignore workarea | `IG` |
| `HELP` | Show command list | `HELP` |

## Setup & Local Development

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file in the root directory and add your MongoDB Atlas connection string:
   ```env
   MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to access the terminal, or `http://localhost:3000/library` for the Command Library.

## Testing Strategy

This project ensures correctness of complex GDS logic through a comprehensive testing strategy.

### Unit Tests (`npm test`)
Powered by **Jest**. Tests cover:
- Command tokenization and parser routing.
- Individual command handlers (availability, sell, PNR creation, ticketing, etc.).
- Fare calculation and refund penalty logic.
- Session isolation (ensuring concurrent sessions don't leak state).

Run unit tests:
```bash
npm test
```

### End-to-End Tests (`npm run test:e2e`)
Powered by **Playwright**. Tests validate full user flows against a live environment:
- **Booking Flow**: `AN -> SS -> NM -> AP -> TK -> FXP -> ER -> TTP -> XI -> REFUND`. Validates correct API responses through the entire lifecycle.
- **Terminal UI**: Tests the React interface for instant echo, autocomplete, keyboard navigation, and error recovery.
- **Command Library**: Tests category filtering and "Try it" redirection to the terminal.

Run E2E tests:
```bash
npm run test:e2e
```
