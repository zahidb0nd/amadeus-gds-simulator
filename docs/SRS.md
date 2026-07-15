# Software Requirements Specification (SRS)
## Amadeus GDS Command Simulator

**Version:** 1.0
**Author:** Zahid
**Date:** July 2026
**Prepared for:** Build via Antigravity (AI-assisted development)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for the Amadeus GDS Command Simulator, a full-stack web application that replicates core Amadeus Global Distribution System (GDS) workflows — availability search, PNR creation, fare pricing, ticketing, and cancellation/refund — using authentic Amadeus-style command syntax.

The primary purpose of this project is to serve as a portfolio piece demonstrating both full-stack engineering ability and applied domain knowledge of travel industry GDS operations, in support of a career transition into corporate travel operations (target roles: Travel Consultant, BCD Travel and similar).

### 1.2 Scope
The system simulates a terminal-style interface where a user types Amadeus-style pseudo-commands and receives formatted responses mimicking real GDS output. It is a **simulation only** — no live GDS connection, no real airline inventory, no real payment processing. All flight, fare, and airport data is mock/seeded data.

In scope:
- Command-line style terminal UI
- Command parser/interpreter supporting a defined command set
- Session/workarea state management (mimics real GDS context-holding behavior)
- Mock flight availability, fare, and PNR data
- Full booking lifecycle: search → sell → price → PNR → ticket → refund/void

Out of scope:
- Real-time airline inventory integration
- Payment gateway integration
- Multi-user concurrent PNR editing
- Full IATA fare rule engine (simplified/representative fare logic only)

### 1.3 Intended Audience
- Zahid (developer/builder)
- Antigravity (AI coding agent) — this document is the primary build spec
- Interviewers/recruiters reviewing the finished project as a portfolio artifact

### 1.4 Definitions
| Term | Definition |
|---|---|
| GDS | Global Distribution System (e.g., Amadeus, Sabre) |
| PNR | Passenger Name Record |
| AN | Availability command (e.g., `AN15JULBLRDOH`) |
| SS | Sell Segment command |
| NM | Name element command |
| TST | Transitional Stored Ticket (fare quote record) |
| Workarea | The active session context holding current availability/PNR-in-progress |
| Fare Basis | Code representing a specific fare product and its rules |

---

## 2. Overall Description

### 2.1 Product Perspective
Standalone full-stack web application, deployed entirely on Vercel. No dependency on real Amadeus/Sabre APIs. Built as a Next.js app so frontend and backend (via API routes / Edge Functions) ship as a single deployable unit, with MongoDB Atlas for persistence.

### 2.2 User Roles
Single role for v1: **Agent** — the user acting as a travel consultant issuing GDS commands. (Future extension: Supervisor role for voids/overrides — out of scope for v1.)

### 2.3 Operating Environment
- Framework: Next.js (App Router), deployed on Vercel
- Command API: Vercel Edge Functions (`/api/command`) for near-zero cold start latency
- Database: MongoDB Atlas, accessed via a cached/global connection to avoid reconnect overhead on each invocation
- Static reference data (airports, airlines, base fare tables): bundled as static JSON or edge-cached rather than queried per command, to minimize DB round-trips
- Deployment: Single Vercel project (frontend + API routes together) — no separate backend host required

### 2.4 Design & Implementation Constraints
- Command syntax should closely mirror real Amadeus Cryptic Command syntax for authenticity and interview credibility, but does not need to be 100% spec-accurate — representative accuracy is the goal.
- All state changes within a session must persist only for that session's workarea until PNR is "ended" (ER command), mimicking real GDS transactional behavior.

---

## 3. System Features / Functional Requirements

### 3.1 Terminal Interface (FR-1)
- **FR-1.1**: The system shall provide a command-line style input field styled to resemble a GDS terminal (monospace font, dark background, green/amber text option).
- **FR-1.2**: The system shall display a scrollback of prior commands and their formatted responses, similar to a real terminal session.
- **FR-1.3**: The system shall provide a `HELP` command listing all supported commands and syntax examples.
- **FR-1.4**: The system shall preserve command history navigable via up/down arrow keys (like shell history).

### 3.2 Command Parser (FR-2)
- **FR-2.1**: The system shall parse raw text input into a command token (e.g., `AN`, `SS`, `NM`) and its arguments.
- **FR-2.2**: The system shall route parsed commands to the appropriate handler module.
- **FR-2.3**: The system shall return an `INVALID FORMAT` style error for unrecognized or malformed commands, mimicking real GDS error responses.
- **FR-2.4**: The parser shall be case-insensitive but echo responses in uppercase (GDS convention).

### 3.3 Availability Search (FR-3)
- **FR-3.1**: The system shall support the command format `AN[DDMMM][ORIGIN][DESTINATION]` (e.g., `AN15JULBLRDOH`).
- **FR-3.2**: The system shall query mock flight data and return a numbered list of flight options including: line number, airline code, flight number, class availability, departure/arrival times, and aircraft type.
- **FR-3.3**: The system shall store the returned availability list in the session workarea for subsequent SS reference.

**Example output:**
```
AN15JULBLRDOH
** AMADEUS AVAILABILITY - AN **  15JUL26  BLR DOH
1  QR 522  J9 C9 Y9  BLR DOH 0135 0350  E0/321
2  QR 524  J4 C4 Y9  BLR DOH 0910 1120  E0/321
3  6E1234  Y9        BLR DOH 1400 1615  E0/320
```

### 3.4 Sell Segment (FR-4)
- **FR-4.1**: The system shall support `SS[qty][class][line number]` (e.g., `SS1Y1` — sell 1 seat, Y class, line 1).
- **FR-4.2**: The system shall validate the referenced line number exists in the current workarea's availability list.
- **FR-4.3**: The system shall add the sold segment to the in-progress PNR and return confirmation status (KK = confirmed, HK convention optional).

### 3.5 PNR Creation (FR-5)
- **FR-5.1**: The system shall support name element entry via `NM1[SURNAME]/[FIRSTNAME]`.
- **FR-5.2**: The system shall require minimum mandatory PNR elements before allowing `ER` (End & Retrieve): name, itinerary (from SS), contact/phone element (`AP`), ticketing arrangement element (`TK`).
- **FR-5.3**: The system shall generate a 6-character alphanumeric PNR record locator upon successful `ER`.
- **FR-5.4**: The system shall support `RT[record locator]` to retrieve an existing PNR.
- **FR-5.5**: The system shall persist completed PNRs to MongoDB.

### 3.6 Fare Pricing (FR-6)
- **FR-6.1**: The system shall support `FXP` (fare price PNR) to calculate and display fare for the current itinerary.
- **FR-6.2**: The system shall return a TST-style breakdown: base fare, taxes (itemized mock tax codes), total, and fare basis code.
- **FR-6.3**: Fare calculation shall use a simplified lookup against seeded fare data by route/class rather than a full fare engine.

### 3.7 Ticketing (FR-7)
- **FR-7.1**: The system shall support `TTP` (ticket PNR) to issue a ticket against a priced PNR, generating a mock 13-digit e-ticket number.
- **FR-7.2**: The system shall update PNR status to "TICKETED" upon successful ticketing.
- **FR-7.3**: The system shall support `TTV` (void ticket) within a simulated "same-day void window."

### 3.8 Cancellation & Refund (FR-8)
- **FR-8.1**: The system shall support `XI[segment number]` to cancel a specific segment.
- **FR-8.2**: The system shall support a `REFUND` command that calculates a mock refund amount based on fare rules (e.g., refundable vs. non-refundable fare basis) and cancellation penalty logic.
- **FR-8.3**: The system shall update PNR/ticket status accordingly (CANCELLED, REFUNDED).

### 3.9 Session/Workarea Management (FR-9)
- **FR-9.1**: The system shall maintain an active session context (current availability list, in-progress PNR elements) until `ER` or `IG` (ignore) is issued. Since Edge/serverless functions are stateless between invocations, this context shall be persisted in MongoDB (or an edge-compatible KV store) keyed by session ID, rather than held in server memory.
- **FR-9.2**: The system shall support `IG` to discard the current in-progress PNR without saving.

### 3.10 Command Library (FR-10)
- **FR-10.1**: The system shall provide a searchable, browsable Command Library panel (separate from the terminal) listing every supported command with: syntax pattern, plain-English description, a worked example input, and the expected formatted output.
- **FR-10.2**: The library shall be filterable by category (Availability, PNR, Fare/Pricing, Ticketing, Cancellation/Refund, Queues, Seat Maps, etc. — per phase, see §10).
- **FR-10.3**: Each library entry shall include a "Try it" action that pre-fills the terminal with the example command, so learners can run it immediately without memorizing syntax.
- **FR-10.4**: The library shall be usable as standalone documentation (e.g., a dedicated `/library` route) so it can be linked/shared independent of the terminal itself.
- **FR-10.5**: Library content shall be stored as structured data (JSON/MongoDB) so it can grow as new commands are added without UI rework.



## 4. Data Model (MongoDB Collections)

### 4.1 `airports`
```
{ code: "BLR", name: "Kempegowda International", city: "Bengaluru", country: "IN" }
```

### 4.2 `airlines`
```
{ code: "QR", name: "Qatar Airways", alliance: "Oneworld" }
```

### 4.3 `flights` (seed inventory)
```
{
  airline: "QR", flightNumber: "522", origin: "BLR", destination: "DOH",
  departure: "0135", arrival: "0350", aircraft: "321",
  classes: { J: 9, C: 9, Y: 9 }
}
```

### 4.4 `fares`
```
{
  origin: "BLR", destination: "DOH", bookingClass: "Y",
  fareBasis: "YOW", baseFare: 210, currency: "USD",
  taxes: [{ code: "YQ", amount: 45 }, { code: "IN", amount: 12 }],
  refundable: true, penalty: 0
}
```

### 4.5 `pnrs`
```
{
  recordLocator: "AB12CD",
  names: [{ surname: "KHAN", firstname: "ZAHID" }],
  itinerary: [{ segmentRef, airline, flightNumber, date, status: "HK" }],
  contact: "+974xxxxxxx",
  ticketingArrangement: "TK TL15JUL/1900",
  tst: { baseFare, taxes, total, fareBasis },
  ticket: { number, status },
  status: "ACTIVE | TICKETED | CANCELLED | REFUNDED",
  createdAt
}
```

### 4.6 `sessions` (in-memory or Mongo, per active terminal session)
```
{
  sessionId,
  availabilityContext: [ ...flight results with line numbers... ],
  pnrInProgress: { names, segments, contact, ticketingArrangement },
  lastCommand,
  updatedAt
}
```

---

## 5. External Interface Requirements

### 5.1 REST API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/command` | Submit a raw terminal command string; returns formatted response |
| GET | `/api/pnr/:recordLocator` | Retrieve a saved PNR |
| GET | `/api/session/:sessionId` | Get current workarea state |
| GET | `/api/help` | Return command reference list |

### 5.2 UI Requirements
- Single-page terminal view as primary interface
- Optional side panel: "Cheat sheet" of command syntax (useful for demo/interview walkthroughs)
- Response formatting must use monospace alignment to visually match real GDS screens

### 5.3 Fluid Experience Requirements
- **Instant echo**: typed command appears in scrollback immediately on Enter, before the response resolves (see NFR-9)
- **Smooth auto-scroll**: terminal auto-scrolls to the latest line on new output, using smooth (not jump-cut) scrolling behavior
- **Command autocomplete/suggestions**: as the user types, show a lightweight inline suggestion or dropdown of matching commands (pulling from the Command Library, §3.10), reducing reliance on memorization
- **Keyboard-first interaction**: up/down arrow for command history (FR-1.4), Tab to accept an autocomplete suggestion, no mouse required to complete a full booking flow
- **Micro-feedback on state changes**: subtle visual cue (e.g., brief highlight/flash) when a PNR is created, ticketed, or an error occurs — reinforces what just happened without needing to read every line
- **No blocking spinners for known-fast operations**: since most operations resolve in under 200ms (NFR-1), avoid loading spinners that would introduce more perceived latency than the operation itself; reserve loading states only for operations that could exceed ~300ms
- **Persistent input focus**: the command input field should stay focused by default so a user can keep typing commands back-to-back without re-clicking the input
- **Error recovery without friction**: an invalid command should never clear what the user typed — it should be echoed with the error below it, so the user can arrow-up and correct it rather than retyping from scratch

---

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | Command response time shall be under 150-200ms for all mock data operations (perceived as "instant") |
| NFR-2 | System shall be deployable as a public demo link (for resume/interview sharing) |
| NFR-3 | Codebase shall be modular (one file per command family) to support clean walkthroughs in interviews |
| NFR-4 | System shall handle malformed input gracefully without crashing the session |
| NFR-5 | README shall include command reference and setup instructions sufficient for a recruiter/interviewer or learner to run it locally |
| NFR-6 | The `/api/command` endpoint shall run on Vercel Edge Runtime to minimize cold-start latency |
| NFR-7 | Static reference data (airports, airlines, base fares) shall be bundled or edge-cached rather than fetched from MongoDB on every command |
| NFR-8 | MongoDB connections shall use a cached/global connection pattern to avoid reconnect overhead across serverless invocations |
| NFR-9 | Frontend shall echo the typed command immediately in the terminal (optimistic UI) before the response resolves, so input never feels blocked |
| NFR-10 | UI shall avoid heavy component libraries — terminal is primarily monospace text rendering, keep JS bundle minimal for fast first load |

---

## 7. Command Reference Summary (v1 Scope)

| Command | Function |
|---|---|
| `AN[date][origin][dest]` | Availability search |
| `SS[qty][class][line]` | Sell segment |
| `NM1[surname]/[firstname]` | Add name element |
| `AP[phone]` | Add contact element |
| `TK TL[date/time]` | Add ticketing arrangement |
| `ER` | End & Retrieve (save PNR) |
| `RT[record locator]` | Retrieve PNR |
| `IG` | Ignore in-progress PNR |
| `FXP` | Price PNR |
| `TTP` | Issue ticket |
| `TTV` | Void ticket |
| `XI[segment]` | Cancel segment |
| `REFUND` | Calculate/process refund |
| `HELP` | List all commands |

---

## 8. Phased Command Expansion (Toward Fuller Amadeus Coverage)

Full 1:1 parity with a real Amadeus terminal is out of scope for a single build (real GDS training takes weeks even for professionals). Instead, coverage expands in phases after v1 ships — this keeps the project demo-able early while giving a credible growth path.

**Phase 1 (v1 — this SRS, §3.1-3.9):** Core booking lifecycle — availability, sell, PNR build, fare, ticketing, cancellation/refund.

**Phase 2 (post-v1):**
- Passenger type codes (ADT/CHD/INF) in name elements
- Multi-city / open-jaw itinerary search
- Seat maps (`SM` command) — visual seat selection
- Special Service Requests (SSR — meals, wheelchair, etc.)
- Queue placement and retrieval (`QS`, `QT` style) — simulates how agents route PNRs for follow-up

**Phase 3 (stretch):**
- Fare rules display (`FQD`-style — cancellation/change penalties in detail)
- Group booking basics
- Interline/alliance-aware routing (tie into airline alliance data you're already studying)
- Reissue/exchange flow (beyond simple void)

Each phase should get its own Command Library entries (§3.10) as it's built, so the library stays the single source of truth for "what this simulator currently supports."

---

## 9. Testing Strategy

Testing matters here for two reasons: correctness of command parsing/state logic (easy to get subtly wrong), and confidence to demo live in an interview without something breaking mid-flow.

### 9.1 Unit Tests
- **Command parser**: test tokenization and routing for every command in §7 — valid input, missing arguments, malformed syntax, case-insensitivity
- **Command handlers**: test each handler in isolation (`availability.js`, `sell.js`, `pnr.js`, `fare.js`, `ticketing.js`, `refund.js`) against mock data — e.g., `AN` returns correct flights for a given route/date, `SS` rejects an out-of-range line number, `FXP` calculates correct totals from seeded fare data
- **Fare/refund calculation logic**: explicit test cases for refundable vs. non-refundable fare basis, penalty math

### 9.2 Integration Tests
- Test the full `/api/command` route end-to-end against a test MongoDB instance (e.g., `mongodb-memory-server`) — verify session/workarea persistence across sequential commands within one session
- Test session isolation: two concurrent sessions should never see each other's workarea state

### 9.3 End-to-End (E2E) Tests
- Use Playwright (or Cypress) to script full booking flows through the actual UI:
  - Happy path: `AN` → `SS` → `NM` → `AP` → `TK` → `ER` → `FXP` → `TTP` (confirm ticketed status end to end)
  - Cancellation path: ticketed PNR → `XI` → `REFUND` (confirm status and refund amount)
  - Error path: invalid command syntax → confirm graceful error display, no crash, input not cleared (per §5.3)
- These E2E flows double as a safety net before any live interview demo — run them before showing the tool to anyone

### 9.4 Manual / Exploratory Testing Checklist
- Rapid sequential command entry (stress the optimistic UI + auto-scroll)
- Browser refresh mid-session — confirm session recovery behavior (or a clear "session expired" message) rather than a silent broken state
- Mobile/narrow viewport — confirm terminal remains usable (even if desktop is the primary target for demos)

### 9.5 Tooling
- **Jest** (or Vitest) for unit/integration tests
- **Playwright** for E2E
- Add a `npm test` script and a brief "Testing" section in the README so this is visible to anyone reviewing the repo — signals engineering rigor beyond the feature list

---

## 10. Milestones (Suggested Build Order for Antigravity)

1. Scaffold project structure (Next.js app + MongoDB Atlas connection), set up Jest
2. Build command parser with `HELP` and `AN` only — validate end-to-end flow, write unit tests for parser + `AN` handler
3. Add `SS`, `NM`, `AP`, `TK`, `ER` — complete basic PNR creation loop; unit test each handler, add first E2E happy-path test (Playwright)
4. Add `RT` retrieval + session persistence in MongoDB; integration tests for session isolation
5. Add `FXP` fare pricing against seeded fare data; unit tests for fare calculation edge cases
6. Add `TTP`/`TTV` ticketing; extend E2E happy path through ticketing
7. Add `XI`/`REFUND` cancellation flow; add E2E cancellation-path test
8. Build Command Library panel (§3.10) with autocomplete wired into the terminal (§5.3)
9. Polish terminal UI for fluid experience (auto-scroll, micro-feedback, keyboard-first flow), write README with testing + command reference
10. Deploy on Vercel (Edge Function for `/api/command`, Atlas for DB), run full E2E suite against the live deployment, get a public demo link

---

## 11. Acceptance Criteria (v1 Done Definition)
- A user can complete a full flow: search availability → sell a segment → build a PNR → price it → ticket it → view confirmation, entirely via typed commands
- A user can cancel and simulate a refund on a ticketed PNR
- All commands have formatted, GDS-style output (not raw JSON)
- Project is deployed with a public link and documented in a README suitable for linking from a resume/GitHub
- All unit and integration tests pass (`npm test`); happy-path and cancellation-path E2E tests pass against the deployed Vercel instance
- Typed commands echo instantly, terminal auto-scrolls smoothly, and a full booking flow can be completed keyboard-only, without visible loading spinners on typical (sub-200ms) operations
- Command Library is browsable, searchable, and each entry's "Try it" action correctly pre-fills the terminal
