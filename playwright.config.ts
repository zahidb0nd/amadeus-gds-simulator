import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/amadeus_test'
    },
    stdout: 'pipe',
    stderr: 'pipe'
  }
});