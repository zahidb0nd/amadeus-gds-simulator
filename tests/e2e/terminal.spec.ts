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

  test('extended reference commands (Phase A) work in live terminal', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('terminal-input');

    // DNA
    await input.fill('DNAQR');
    await input.press('Enter');
    await expect(page.locator('text=QR - QATAR AIRWAYS (ONEWORLD)')).toBeVisible();

    // DC
    await input.fill('DCFRANCE');
    await input.press('Enter');
    await expect(page.locator('text=FRANCE - FR')).toBeVisible();

    // GPOW
    await input.fill('GPOW');
    await input.press('Enter');
    await expect(page.locator('text=ONEWORLD ALLIANCE CARRIERS:')).toBeVisible();
    await expect(page.locator('text=QR - QATAR AIRWAYS').first()).toBeVisible();
  });

  test('retrieves a seeded PNR by its record locator from the isolated database', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('terminal-input');

    // Submit PNR retrieval command for seeded PNR Y7B9XZ
    await input.fill('RTY7B9XZ');
    await input.press('Enter');

    // Verify response outputs details of the seeded PNR
    await expect(page.locator('body')).toContainText('Y7B9XZ');
    await expect(page.locator('body')).toContainText('DOE/JOHN');
    await expect(page.locator('body')).toContainText('AA  100');
    await expect(page.locator('body')).toContainText('LAX JFK');
  });

  test('date/time and math utilities (Phase B) work in live terminal', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('terminal-input');

    // Test DDDEL city time lookup
    await input.fill('DDDEL');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('DELHI');
    await expect(page.locator('body')).toContainText('IN');

    // Test DD23JUN day of week calculation (e.g. June 23, 2026 is Tuesday)
    await input.fill('DD23JUN26');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('TUESDAY');

    // Test date math DD15JUL26+10
    await input.fill('DD15JUL26+10');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('15JUL26 + 10D = 25JUL26 SATURDAY');

    // Test math addition DF10;5
    await input.fill('DF10;5');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('10 + 5 = 15');

    // Test math division and divide-by-zero DF10/0
    await input.fill('DF10/0');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('DIVISION BY ZERO');
  });

  test('timetable and availability navigation (Phase C) work in live terminal', async ({ page }) => {
    await page.goto('/');
    const input = page.getByTestId('terminal-input');

    // 1. Initial filtered search
    await input.fill('AN15JULBLRDOH/AQR');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('AMADEUS AVAILABILITY');
    // Ensure QR is there
    await expect(page.locator('body')).toContainText('QR');
    // Ensure 6E is NOT there (assuming it's normally there)
    await expect(page.locator('body')).not.toContainText('6E');

    // 2. Move Next day (MN)
    await input.fill('MN');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('16JUL');
    // Filter should carry over
    await expect(page.locator('body')).toContainText('QR');

    // 3. Sell segment from the filtered list (SS1Y1)
    await input.fill('SS1Y1');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('Y1  BLR DOH');

    // 4. Test timetable (TN)
    await input.fill('TN20AUGBLRDOH');
    await input.press('Enter');
    await expect(page.locator('body')).toContainText('AMADEUS TIMETABLE - TN');
    await expect(page.locator('body')).toContainText('J  C  Y'); // Class letters without numbers
  });
});
