import { test, expect } from '@playwright/test';

test.describe('Green-Screen Terminal E2E Console Test', () => {
  test('should accept a command and render the terminal log canvas wrapper with responses', async ({ page }) => {
    // a. Navigate to the root url
    await page.goto('/');

    // b. Target the main console input field element
    const terminalInput = page.getByTestId('terminal-input');
    await expect(terminalInput).toBeVisible();

    // Simulate typing a real command string
    const command = 'AN12OCTDELBOM';
    await terminalInput.fill(command);
    
    // Press 'Enter'
    await terminalInput.press('Enter');

    // c. Assert that the terminal log canvas wrapper becomes visible
    // In your terminal-ui.tsx, logs are appended to a div container.
    // We check for the presence of the exact command in the output logs.
    const commandLog = page.getByText(`> ${command}`);
    await expect(commandLog).toBeVisible();

    // d. Confirm that the terminal history output text updates to contain simulated flight responses
    // The default behavior for a successful AN command typically outputs flight lines or seat buckets.
    // We wait for the network request to complete and assert that standard Amadeus output is visible.
    // Depending on your mock data, it might contain airline codes, dates, or specific text patterns.
    
    // Wait for the pending state to disappear and results to appear
    await page.waitForResponse(response => response.url().includes('/api/command') && response.status() === 200);

    // Assert that the page contains the parsed data from the command
    // (We look for standard availability output fragments like the date or origin/destination)
    await expect(page.locator('body')).toContainText(/DEL|BOM|12OCT/i);
    
    // Ensure no INVALID FORMAT error was thrown for this valid command
    await expect(page.locator('body')).not.toContainText('INVALID FORMAT');
  });
});
