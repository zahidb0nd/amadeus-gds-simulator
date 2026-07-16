import { test, expect } from '@playwright/test';

test.describe('Command Library', () => {
  test('renders commands and filters by category', async ({ page }) => {
    await page.goto('/library');
    
    // Check if the title is present
    await expect(page.locator('h1')).toContainText('Command Library');
    
    // All 32 commands should be visible initially
    await expect(page.locator('text=Try it')).toHaveCount(32);
    
    // Filter by Ticketing
    await page.click('button:has-text("Ticketing")');
    
    // Should only show TTP and TTV
    await expect(page.locator('text=Try it')).toHaveCount(2);
    await expect(page.locator('h2', { hasText: 'TTP' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'TTV' })).toBeVisible();
  });

  test('Try it button navigates to terminal and pre-fills input', async ({ page }) => {
    await page.goto('/library');
    
    // Click Try it for AN command
    const anTryItButton = page.locator('a[href="/?cmd=AN15JULBLRDOH"]');
    await anTryItButton.click();
    
    // Should navigate to /
    await expect(page).toHaveURL(/\/\?cmd=AN15JULBLRDOH/);
    
    // Input should be pre-filled
    const input = page.getByTestId('terminal-input');
    await expect(input).toHaveValue('AN15JULBLRDOH');
  });
});
