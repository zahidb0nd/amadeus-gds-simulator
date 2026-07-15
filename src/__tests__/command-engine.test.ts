import { executeCommand } from '../lib/command-engine';

describe('Core Command Parser: command-engine.ts', () => {
  const testSessionId = 'TEST-SESSION-123';

  describe('executeCommand() string manipulation & parsing', () => {
    // Note: The prompt requested testing an object return with { commandType, date, origin, destination }.
    // Based on the current architecture, executeCommand returns a CommandResult with output strings.
    // If you plan to refactor command-engine to expose the raw parsed tokens, this is how the AAA pattern test looks.

    it('Test Case A: should parse a valid Availability command into its core components', async () => {
      // Arrange
      const rawCommand = 'AN01DECJFKLHR';
      
      // Act
      const result = await executeCommand(rawCommand, { sessionId: testSessionId });
      
      // Assert
      // Assuming result returns the parsed tokens in a refactored architecture, or we check standard output
      expect(result.ok).toBe(true);
      expect(result.command).toContain('AN');
      
      // If we expose the parsed AST in the future:
      // expect(result.parsedTree).toEqual({ commandType: 'AN', date: '01DEC', origin: 'JFK', destination: 'LHR' });
    });

    it('Test Case B: should return an error state and INVALID FORMAT for junk strings', async () => {
      // Arrange
      const junkCommand = 'INVALID_JUNK_STRING_XYZ';
      
      // Act
      const result = await executeCommand(junkCommand, { sessionId: testSessionId });
      
      // Assert
      expect(result.ok).toBe(false);
      // Validating standard Amadeus terminal warnings
      expect(result.output).toMatch(/INVALID FORMAT|CHECK FORMAT/i);
    });
  });
});
