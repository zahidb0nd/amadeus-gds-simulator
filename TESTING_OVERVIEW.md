# Amadeus GDS Command Simulator - Testing Process Overview

This document outlines the testing strategy, architecture, and required dependencies for validating the Amadeus GDS Command Simulator.

## Architecture Tested
- **Next.js 15 App Router** (`src/app/api/command/route.ts`)
- **Native MongoDB + Hybrid RAM Store** (`src/lib/gds-store.ts`)
- **Terminal UI Client** (`src/app/terminal-ui.tsx`)

## Required Dependencies
To run these test suites, ensure the following `devDependencies` are installed:
```bash
npm install -D jest @types/jest ts-jest @playwright/test
```

## Test Suites

### 1. Core Command Parser Unit Tests (Jest)
**Path:** `src/__tests__/command-engine.test.ts`
- **Purpose:** Validates the string parsing logic inside `command-engine.ts`.
- **Coverage:** Ensures valid strings (like `AN01DECJFKLHR`) route correctly and junk strings correctly return `ok: false` along with standard Amadeus error strings (e.g., `INVALID FORMAT`).

### 2. In-Memory Storage Integration Tests (Jest)
**Path:** `src/__tests__/gds-store.test.ts`
- **Purpose:** Verifies the hybrid RAM fallback mechanism (JavaScript `Map` objects) properly creates and persists state.
- **Coverage:** Simulates a transaction (e.g., `NM1SMITH/JOHNMR` followed by `ER`), validates the generation of a `PnrDocument`, and ensures the Record Locator adheres to a 6-character alphanumeric uppercase regex (`/^[A-Z0-9]{6}$/`).

### 3. Terminal UI End-to-End Tests (Playwright)
**Path:** `e2e/terminal-ui.spec.ts`
- **Purpose:** Simulates a real user interacting with the Next.js green-screen terminal client.
- **Coverage:** Drives the browser to `localhost`, inputs an Availability command into the input field, hits Enter, waits for the `/api/command` network intercept, and validates that standard Amadeus output is rendered onto the `<pre>` logs canvas successfully without format errors.

## Running the Tests
- Unit/Integration (Jest): `npm run test`
- End-to-End (Playwright): `npm run test:e2e`
