import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

/**
 * Los escenarios Gherkin de `specs/features` son la especificacion ejecutable:
 * playwright-bdd los compila a tests reales usando los steps de `tests/e2e/steps`.
 * Si un escenario queda sin implementar, la compilacion falla y `npm run verify` tambien.
 *
 * OJO: `playwright test` NO regenera `.bdd-gen` por su cuenta, usa lo que haya. Un
 * escenario nuevo no correria y uno borrado seguiria corriendo, las dos veces sin avisar
 * —y un test que no corre es peor que uno que falla, porque se lee como verde—. Por eso
 * `npm run test:e2e` ejecuta `bddgen` antes: correr `playwright test` a mano se salta ese
 * paso.
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
    // `npm run preview` es el servidor que aplica las reglas de `netlify.toml`, no
    // `vite preview`: los escenarios corren contra el mismo comportamiento que el
    // sitio publicado (reserva en `spa.html`, 404 de verdad, cabeceras de producción).
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    /**
     * SIEMPRE se levanta un servidor nuevo, también en local.
     *
     * Con `reuseExistingServer` en true, cualquier cosa que estuviera escuchando en el
     * 4173 —un `vite preview` olvidado de la sesión anterior, por ejemplo— se usaba tal
     * cual y el `npm run build` no llegaba a correr: la suite validaba una build vieja
     * y servida con otras reglas. Eso da fallos y, peor, verdes que no significan nada.
     * Reconstruir cuesta menos de dos segundos desde que el prerenderizado no abre un
     * navegador, así que no hay nada que ahorrar.
     */
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
