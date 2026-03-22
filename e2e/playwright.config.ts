import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const USER_BASE_URL = process.env.USER_BASE_URL || 'http://localhost:3000';
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'http://localhost:3002';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'user-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: USER_BASE_URL,
      },
      testMatch: '**/user-login.spec.ts',
    },
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ADMIN_BASE_URL,
      },
      testMatch: '**/admin-login.spec.ts',
    },
  ],
});
