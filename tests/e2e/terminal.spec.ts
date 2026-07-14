import { test, expect } from '@playwright/test';

test.describe('Terminal UI', () => {
  test('handles basic input, instant echo, and autocomplete', async ({ page }) => {
    await page.goto('/');

    const input = page.getByTestId('terminal-input');
    await expect(input).toBeVisible();

    // Type partial command 'A'
    await input.fill('A');
    // Expect autocomplete suggestion 'N15JULBLRDOH' to be visible (because AN15JULBLRDOH is the example)
    await expect(page.locator('text=N15JULBLRDOH')).toBeVisible();

    // Hit Tab to accept autocomplete
    await input.press('Tab');
    await expect(input).toHaveValue('AN15JULBLRDOH');

    // Submit command
    await input.press('Enter');

    // Verify optimistic UI adds command to logs immediately
    await expect(page.locator('text=> AN15JULBLRDOH')).toBeVisible();

    // Wait for the response
    await expect(page.locator('text=AMADEUS AVAILABILITY - AN')).toBeVisible();
    
    // Input should be cleared after success
    await expect(input).toHaveValue('');
  });

  test('handles keyboard history (Up/Down arrows)', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('terminal-input');

    // Submit first command
    await input.fill('HELP');
    await input.press('Enter');
    await expect(page.locator('text=AMADEUS GDS COMMAND SIMULATOR - COMMAND LIBRARY')).toBeVisible();

    // Submit second command
    await input.fill('IG');
    await input.press('Enter');
    await expect(page.locator('text=WORKAREA IGNORED')).toBeVisible();

    // Press Up arrow to get previous command ('IG')
    await input.press('ArrowUp');
    await expect(input).toHaveValue('IG');

    // Press Up arrow again to get first command ('HELP')
    await input.press('ArrowUp');
    await expect(input).toHaveValue('HELP');

    // Press Down arrow to go back to 'IG'
    await input.press('ArrowDown');
    await expect(input).toHaveValue('IG');
    
    // Press Down arrow again to clear input
    await input.press('ArrowDown');
    await expect(input).toHaveValue('');
  });

  test('error recovery retains input or allows correction', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('terminal-input');

    // Submit invalid command
    const invalidCommand = 'INVALIDCMD123';
    await input.fill(invalidCommand);
    await input.press('Enter');

    // The command should echo
    await expect(page.locator(`text=> ${invalidCommand}`)).toBeVisible();

    // Error response should appear and have anim-error class
    const errorResponse = page.locator('text=INVALID FORMAT');
    await expect(errorResponse).toBeVisible();
    await expect(errorResponse).toHaveClass(/anim-error/);

    // The input should retain the invalid command for easy correction
    await expect(input).toHaveValue(invalidCommand);
  });

  test('reference decode/encode commands work in live terminal', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('terminal-input');

    // Decode airline
    await input.fill('DACQR');
    await input.press('Enter');
    await expect(page.locator('text=QR - QATAR AIRWAYS (ONEWORLD)')).toBeVisible();

    // Encode city
    await input.fill('EANDoha');
    await input.press('Enter');
    await expect(page.locator('text=DOH - HAMAD INTERNATIONAL, DOHA, QA')).toBeVisible();
  });
});
