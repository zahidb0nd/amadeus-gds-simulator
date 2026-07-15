import { executeCommand } from '../lib/command-engine';
import { getPnr, resetSessionState, getSessionState, getLastCompletedRecordLocator } from '../lib/gds-store';

describe('In-Memory Storage State: gds-store.ts', () => {
  const testSessionId = 'TEST-MAP-VERIFICATION-456';

  beforeEach(async () => {
    // Arrange: Clear the local memory collections / session state before running
    await resetSessionState(testSessionId);
  });

  it('should generate a valid PnrDocument and append to the Map upon ER command', async () => {
    // Arrange: We have our clean session state.
    const nameCommand = 'NM1SMITH/JOHNMR';
    const endTransactionCommand = 'ER';
    
    // Act: Execute a name command sequence coupled with an 'End of Transaction' ('ER')
    const nameResult = await executeCommand(nameCommand, { sessionId: testSessionId });
    expect(nameResult.ok).toBe(true);
    
    const erResult = await executeCommand(endTransactionCommand, { sessionId: testSessionId });
    expect(erResult.ok).toBe(true);

    // Retrieve the newly created Record Locator from the session state
    const recordLocator = await getLastCompletedRecordLocator(testSessionId);
    
    // Ensure it exists so we can query the Map
    expect(recordLocator).toBeDefined();

    // Act: Query the store for the resulting PnrDocument
    const pnrDocument = await getPnr(recordLocator as string);

    // Assert: Verify a valid PnrDocument structure was generated
    expect(pnrDocument).toBeDefined();
    expect(pnrDocument?.names[0].surname).toBe('SMITH');
    expect(pnrDocument?.names[0].firstname).toBe('JOHNMR');

    // Assert: Use regex to assert that the generated PNR locator is exactly 6 alphanumeric uppercase characters
    expect(pnrDocument?.recordLocator).toMatch(/^[A-Z0-9]{6}$/);
    expect(pnrDocument?.status).toBe('ACTIVE');
  });
});
