import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

/**
 * Los escenarios Gherkin de `specs/features` son la especificacion ejecutable:
 * playwright-bdd los compila a tests reales usando los steps de `tests/e2e/steps`.
 * Si un escenario queda sin implementar, la compilacion falla y `npm run verify` tambien.
 */
const testDir = defineBddConfig({
  features: 'specs/features/**/*.feature',
  steps: 'tests/e2e/steps/**/*.ts',
  outputDir: '.bdd-gen',
})

export default defineConfig({
  testDir,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    locale: 'es-PY',
    timezoneId: 'America/Asuncion',
  },

  projects: [
    {
      name: 'celular',
      // Prioridad celular: la suite corre por defecto en el ancho mas chico que
      // pide el criterio CA-07, no en escritorio.
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 640 } },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
