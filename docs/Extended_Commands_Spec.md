# Extended Command Set Specification
## Amadeus GDS Command Simulator — Full Command Coverage

**Companion to:** `Amadeus_GDS_Simulator_SRS.md` (v1 core spec)
**Purpose:** This document catalogs the full command set from Zahid's Amadeus study material and organizes it into a realistic, phased build order for Antigravity. It replaces the informal §8 Phased Expansion outline in the main SRS with concrete, buildable detail.

**How to use this document:** Do not hand this entire document to Antigravity in one prompt. Work through it **one phase at a time**, in order. Each phase is sized to be a reasonable single build session, following the same pattern used for v1 (implement → unit test → E2E test → live verify). A ready-to-paste prompt template is provided at the end of each phase.

---

## Honest Scope Note

This is close to full command parity with a real Amadeus terminal — real GDS training programs spend weeks on this. Building literally all ~100 commands is achievable *incrementally*, but treat this as an ongoing side project that continues alongside your job search, not a blocker before you can showcase or apply. **The v1 core (already built) is already a strong, complete portfolio piece on its own.** Each phase below is optional additional depth — stop adding phases whenever the project already does what you need it to do for interviews/LinkedIn.

A few commands in Part 3 and Part 4 (below) are flagged **[LOW PRIORITY]** — they're either extremely niche, require very complex string parsing with little learning payoff (e.g. `SRDOCS` passport strings), or manage multi-agency permissions that don't make sense in a single-user simulator (`ES`/`ESX`). Recommend deprioritizing or skipping these entirely.

---

## Phase A: Encoding/Decoding & Reference (extends FR-11)

Already scoped in the main SRS as FR-11 (`DAC`, `DAN`, `EAN`). This phase **expands** that with additional reference lookups. All of these are read-only queries against static/seed data — no session state, no PNR interaction. Lowest complexity, highest learner value — good next phase after FR-11 ships.

| Command | Function | Data needed |
|---|---|---|
| `DC<Country Name>` | Encode country name → 2-letter code | New `countries` seed collection |
| `DC<Country Code>` | Decode 2-letter country code → name | Same as above |
| `DNA<Airline Name>` | Encode airline name → code | Reuse `airlines` |
| `DNA<Airline Code>` | Decode airline code → name | Reuse `airlines` |
| `DNA<Ticket Designator>` | Decode 3-digit ticket prefix → airline | Add `ticketPrefix` field to `airlines` |
| `DAC<City Code>/N` | Nearest 10 airports to a city | Requires lat/long on `airports` + distance calc |
| `GGAIS` | Display info-page menu | Static text response |
| `GGALLIANCE` | List all alliances | Derive from `airlines.alliance` field, group/dedupe |
| `GPOW` | List Oneworld partners | Filter `airlines` where `alliance = Oneworld` |
| `GPSA` | List Star Alliance partners | Filter `airlines` where `alliance = Star Alliance` |
| `GGA<Airline Code>` | Airline info page | Reuse `airlines`, format as info page |
| `GGCOU<Country Code>` | Country info page | Needs `countries` seed |
| `GGPCA<Airline Code>` | Check if airline is bookable in Amadeus | Add `participating: boolean` field to `airlines` |

**Note on `DNA` and `DAC` overlap with FR-11:** your study material uses `DNA` for airline decode/encode where the earlier SRS used `DAC`. Real Amadeus actually uses `DAC` for city/airport codes and has separate airline-specific commands — worth clarifying with Antigravity which convention to standardize on, since your FR-11 already shipped with one pattern. Recommend keeping FR-11's existing `DAC`/`DAN` as-is (don't break what's shipped) and adding `DNA` as an airline-specific alias/variant in this phase, matching your study material exactly since that's what you'll be tested/interviewed on.

**Skip for now:** `GGAMA<Country>LCL` (phone directory data — low value, needs a whole new data set for marginal benefit).

---

## Phase B: Date/Time & Math Utilities

Simple, self-contained, no PNR/session dependency. Good "quick win" phase — these are pure functions.

| Command | Function |
|---|---|
| `DD<City Code>` | Current date/time in a city (needs timezone-per-airport data) |
| `DD<Date>` | Day of week for a date |
| `DD<Date>+<Days>` / `DD<Date>-<Days>` | Date math |
| `DF<A>;<B>` | Add |
| `DF<A>-<B>` | Subtract |
| `DF<A>*<B>` | Multiply |
| `DF<A>/<B>` | Divide |

**Data needed:** `DD<City Code>` requires a timezone field on `airports` — worth adding now since it's a small addition with reuse value later (flight times could eventually respect timezones too).

---

## Phase C: Timetables & Extended Availability

Extends the existing `AN` command (already built) with real-world filtering options. Builds on FR-3, doesn't replace it.

| Command | Function |
|---|---|
| `TN<Date><CityPair>` | One-week timetable, all carriers |
| `TN<Date><CityPair>/A<Airline>` | One-week timetable, specific airline |
| `AN.../A<Airline>` | Filter availability by airline |
| `AN.../A<Airline1>,<Airline2>` | Filter by multiple airlines |
| `AN.../A-<Airline>` | Exclude an airline |
| `AN.../C<Class>` | Filter by booking class |
| `AN.../K<Cabin>` | Filter by cabin (F/C/W/M/Y) |
| `AN<Date><CityPair>*<ReturnDate>` | Dual city-pair (outbound + return) search |
| `AN.../7` | 7-day fallback search if no flights on exact date |
| `MN` / `MY` | Move to next/previous day's availability |
| `MB` | Move to bottom of display |
| `AC<Date>` | Change search date |
| `AC<Number>` / `AC-<Number>` | Shift search by N days |
| `AC<City>` | Change origin city |
| `DO<Flight Number>` | Operating vs marketing carrier lookup (code-share) |
| `DM<Airport>` | Minimum Connecting Time policy |
| `DMI` | Check MCT against current itinerary |
| `DRT<CityPair>` | Routing/connection options |

**Design note:** Most of these are **modifiers on the existing `AN` session context** — they act on "the last availability search," which means they need the session/workarea (already built in Milestone 4) to hold not just the results but the *search parameters* used to get them, so `MN`/`AC` can re-run with a tweak. This is the trickiest phase architecturally — flag it to Antigravity as needing a session-state extension, not just new standalone commands.

---

## Phase D: Full Passenger & Segment Handling

Extends `NM`/`SS` (already built) with realistic passenger types and modifications.

| Command | Function |
|---|---|
| `<SegNum>/<Seats>` | Increase seats on a sold segment |
| `NM1<Name> <Title>` | Add adult with title (Mr/Mrs/Ms) |
| `NM1<Name>(INF<Name>/<DOB>)` | Adult + associated infant |
| `NM1<Name> MSTR(CHD/<DOB>)` | Child passenger |
| `NM2<Lastname>/<First1>/<First2>` | Two passengers, same surname |
| `<PaxLine>/(INF...)` | Associate infant after initial booking |

**Data model impact:** the `pnrs.names` array needs new fields: `passengerType` (ADT/CHD/INF), `dob`, `title`, and an `associatedAdult` reference for infants. This overlaps with your original SRS's §8 Phase 2 note on passenger type codes — this phase now supersedes that note with concrete detail.

---

## Phase E: Contact, Ticketing Arrangement & PNR Lifecycle Detail

Extends `AP`/`TK`/`ER` (already built) with realistic variants.

| Command | Function |
|---|---|
| `APM-<Mobile>` | Passenger mobile (distinct from agency phone) |
| `APE-<Email>` | Passenger email |
| `TKOK` | Ticket today |
| `TKTL<Date>` | Ticketing time limit |
| `TKXL<Date>` | Auto-cancel if not ticketed by date |
| `RF<Initials>` | Received-from agent initials |
| `ET` | End transaction + complete (vs `ER`'s redisplay) |
| `RTAXR`, `SP<PaxNum>`, `EF` | PNR splitting (advanced — consider skipping, low learner value) |
| `RTG` / `RTI` / `RTR` | Partial PNR display (general/itinerary/remarks only) |

**Recommend:** build the contact/ticketing variants (`APM`, `APE`, `TKOK`, `TKTL`, `TKXL`, `RF`, `ET`) — genuinely useful and low complexity. **Skip PNR splitting** (`SP`/`EF`/`RTAXR`) — real edge-case functionality, disproportionate complexity for a portfolio project.

---

## Phase F: Remarks & Special Service Requests (SSR)

New PNR sub-elements — extends the `pnrs` schema with a `remarks` array and an `ssr` array.

| Command | Function |
|---|---|
| `RX <Text>` | Corporate remark |
| `RC <Text>` | Confidential remark |
| `RM <Text>` | General remark (airline-visible) |
| `RIR <Text>` | Itinerary remark (prints on receipt) |
| `OS<Airline> <Text>` | OSI message to specific airline |
| `OSYY <Text>` | OSI to all airlines |
| `HESR` | List SSR codes (static reference list) |
| `SR<SSRCode>[/P<PaxNum>]` | Add SSR (meal, wheelchair, etc.) |
| `SM` | Open seat map (this is a **UI feature**, not just a text command — see note below) |

**Skip for now [LOW PRIORITY]:** `SRCTCM`/`SRCTCE` (contact SSRs with obscure encoding like `//` for `@`), `SRDOCS`/`SRDOCO` (full passport/visa string parsing) — these have very long, fragile syntax with little interview-relevant payoff. If you want passport/visa capability later, a simpler structured form-based UI (not raw command parsing) would serve better than replicating the exact cryptic string format.

**`SM` (seat map) needs design thought:** this is the one command in the whole set that's inherently visual, not textual. Building it means a seat-grid UI component, not just a parser response — worth treating as its own small sub-project when you get here, reusing the flight/aircraft data already in `flights.ts`.

---

## Phase G: Element Deletion & PNR Editing

| Command | Function |
|---|---|
| `XE<Line>` | Delete a specific PNR line element |
| `XE<Line1>-<Line2>` | Delete a range of elements |
| `XI` (full itinerary) | Cancel entire itinerary — **note:** your v1 already has `XI[segment]` for single-segment cancel (FR-8.1); this is the no-argument variant that cancels everything. Needs disambiguation in the parser (`XI` alone vs `XI1`).

This phase requires PNR elements to be addressable by line number in a consistent, stable way (i.e., the retrieved/displayed PNR needs line numbering that the deletion commands can reference) — worth checking that your existing `RT` display already numbers lines predictably before building this.

---

## Phase H: Pricing Depth (extends FXP)

Your v1 already has `FXP` (FR-6). Real Amadeus actually splits pricing into many specific variants — this phase adds that depth.

| Command | Function |
|---|---|
| `FXX` | Price in same class, display only (no TST) |
| `FXT` | Price + store as TST (closest to existing `FXP` — consider `FXP` as an alias for this) |
| `FXR` | Rebook to lowest fare (no TST) |
| `FXB` | Rebook to lowest fare + create TST |
| `FXA` | List all valid fares (menu) |
| `FQQ<Line>` | View detail of a fare from the FXA menu |
| `FXZ<Line>` | Select a fare from FXA (no TST) |
| `FXU<Line>` | Select a fare from FXA + create TST |
| `FXL` | Lowest fare regardless of seat availability |
| `FQN<Line>` | Fare rules/notes (`*PE` jumps to penalty section) |
| `FQC<Amount><Cur>/<TargetCur>` | Currency converter (needs a static exchange-rate table) |
| `TQT` / `TQT/T<Num>` | Display stored TST(s) |
| `TTE/ALL` / `TTE/T<Num>` | Delete TST(s) |
| `FQD<CityPair>` | Fare quote without a PNR (menu of base fares) |
| `FQD.../A<Airline>` | Fare quote for specific airline |
| `FQK<Line>` | Split fare quote into base + tax |
| `FQD.../R,AT` | Fare quote including taxes |
| `FQP...` | Multi-city fare quote without building an itinerary |

**Recommend prioritizing** `FXA`/`FXZ`/`FQN` (the "compare and choose a fare" flow — very realistic day-to-day agent behavior) over the currency converter or multi-city fare quote pricing, which are more niche.

---

## Phase I: Queue Management

Queues are how real agents route PNRs to each other for follow-up work — conceptually interesting but entirely new: needs a `queues` collection and the idea of PNRs being "placed" into a queue.

| Command | Function |
|---|---|
| `QTQ` | List all active queues |
| `QT` | List only queues with PNRs in them |
| `QS<Queue>C<Cat>D<Range>` | Open/process a queue |
| `QN` | Next PNR in queue |
| `QD` | Delay current PNR in queue |
| `QI` | Exit queue mode |
| `QE<Queue>C<Cat>` | Send a PNR to a queue |

**[LOW PRIORITY]** `ES<OfficeID>-B/-T`, `ESX` (extended security / multi-agency permissions) — doesn't make sense in a single-user simulator, skip entirely.

---

## Suggested Overall Priority Order

If you're picking phases selectively rather than building all of them:

1. **Phase A** (encode/decode) — highest learner value, lowest complexity, natural extension of what you already have
2. **Phase B** (date/math) — trivial to build, nice quick addition
3. **Phase H, partial** (`FXA`/`FXZ`/`FQN` fare comparison flow) — realistic agent behavior, strong interview talking point
4. **Phase D** (passenger types) — closes a real gap (ADT/CHD/INF is genuinely common)
5. **Phase F, partial** (remarks + basic SSR, skip passport/visa) — adds realism without huge complexity
6. **Phase C** (extended availability filtering) — valuable but architecturally trickier (session-state rework)
7. **Phase E** (ticketing arrangement variants) — nice-to-have polish
8. **Phase G** (element deletion) — mostly useful once other phases add more element types
9. **Phase I** (queues) — interesting but the least essential for a resume-facing demo
10. **Phase F's `SM` seat map** — treat as its own mini-project whenever you have appetite for a UI-heavy build

---

## Prompt Template (use per-phase, don't dump the whole spec)

Once you decide which phase to build next, use this template:

---

Read docs/SRS.md and docs/Extended_Commands_Spec.md (save this document into your repo's `docs/` folder alongside the SRS).

Build **Phase [X]** from Extended_Commands_Spec.md: [name of phase].

Follow the existing command-engine/registry pattern. [Note any new data model changes needed, per the phase's table above.] Add unit tests per §9.1 style (valid input, invalid input, edge cases) for each new command. Extend the E2E suite with at least one live-flow test covering the new commands. Verify live against production once done.

---

Save this file into your repo (e.g. `docs/Extended_Commands_Spec.md`) alongside your existing SRS so Antigravity can reference both going forward without you re-pasting content each session.
