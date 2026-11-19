import { defineConfig } from '@playwright/test'

// Runs against the built Storybook only; build it first with `pnpm build-storybook`.
export default defineConfig({
  testDir: './tests',
  testMatch: 'smoke.spec.ts',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  forbidOnly: true,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/smoke.json' }]],
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:6198',
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'python3 -u -m http.server 6198 --bind 127.0.0.1 --directory storybook-static',
    wait: { stdout: /Serving HTTP on 127\.0\.0\.1 port 6198/ },
    timeout: 15_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
})
