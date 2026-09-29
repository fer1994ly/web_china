import { expect, type Page } from '@playwright/test'
import { Then, When } from './fixtures'
import { TERAPIAS } from '../../../src/slices/catalogo-terapias'
import { CLAVE_ADMIN } from '../../../src/slices/admin-acceso/domain/clave-admin'
import {
  calificar,
  formatear,
  UMBRALES,
  type NombreMetrica,
} from '../../../src/shared/rendimiento/umbrales'

/**
 * Los pasos de rendimiento.
 *
 * Miden dos cosas distintas y las dos importan:
 *
 *  1. Core Web Vitals REALES, leídos de `window.__METRICAS_WEB__`, que es lo que
 *     `observarMetricasWeb` va llenando con `PerformanceObserver`. No es una
 *     aproximación: son las mismas entradas que reporta Chrome al Chrome UX Report.
 *
 *  2. Lo que trae el HTML SIN ejecutar JavaScript, pidiéndolo con `request` en lugar de
 *     con `page.goto`. Es la única forma de comprobar el prerenderizado: si se mira con
 *     un navegador, la SPA ya hidrató y todo parece estar ahí incluso cuando el HTML
 *     servido venía vacío.
 *
 * NOTA SOBRE EL AMBIENTE: la suite corre en una máquina de desarrollo contra un
 * servidor local, así que los tiempos son mejores que en un celular con 3G. Un fallo
 * acá no dice "el sitio es rápido en Paraguay": dice que algo se rompió tanto que ni
 * en las mejores condiciones entra en rango. Para eso sirve: como red de seguridad
 * contra regresiones (una imagen sin dimensiones, una fuente de un tercero), no como
 * medición de campo.
 */

interface MetricaMedida {
  readonly nombre: NombreMetrica
  readonly valor: number
}

/**
 * Espera a que la métrica exista y la devuelve.
 *
 * El CLS necesita que la página se haya asentado y el LCP se reporta cuando el
 * navegador deja de encontrar candidatos más grandes, así que se le da tiempo en lugar
 * de leer el objeto al instante.
 */
async function leerMetrica(page: Page, nombre: NombreMetrica): Promise<MetricaMedida> {
  await page.waitForLoadState('networkidle')

  // El CLS sólo se reporta si hubo algún desplazamiento: si no hay entrada, el valor
  // correcto es cero, que es el mejor posible.
  if (nombre === 'CLS') {
    const valor = await page.evaluate(
      () => window.__METRICAS_WEB__?.['CLS']?.valor ?? 0,
    )
    return { nombre, valor }
  }

  await page.waitForFunction(
    (clave) => window.__METRICAS_WEB__?.[clave as NombreMetrica] !== undefined,
    nombre,
    { timeout: 10_000 },
  )

  const valor = await page.evaluate(
    (clave) => window.__METRICAS_WEB__?.[clave as NombreMetrica]?.valor ?? Number.NaN,
    nombre,
  )
  return { nombre, valor }
}

Then(
  'el {string} está en el rango bueno de Core Web Vitals',
  async ({ page }, nombre: string) => {
    const metrica = nombre as NombreMetrica
    expect(UMBRALES[metrica], `"${nombre}" no es una métrica conocida`).toBeDefined()

    const { valor } = await leerMetrica(page, metrica)

    expect(
      calificar(metrica, valor),
      `${metrica} = ${formatear(metrica, valor)}; el umbral de Google para "buena" es ` +
        `${formatear(metrica, UMBRALES[metrica].buena)}`,
    ).toBe('buena')
  },
)

// --- Lo que trae el HTML sin JavaScript ------------------------------------

When(
  'pido el HTML de {string} sin ejecutar JavaScript',
  async ({ page, ctx }, ruta: string) => {
    // `page.request` comparte el `baseURL` de la configuración pero NO ejecuta nada:
    // es lo que ve el lector de enlaces de WhatsApp o el primer pase de Google.
    const r = await page.request.get(ruta)
    ctx.estadoHttp = r.status()
    ctx.htmlCrudo = await r.text()
  },
)

Then('la respuesta tiene estado {int}', async ({ ctx }, estado: number) => {
  expect(ctx.estadoHttp, `el HTML vino con estado ${ctx.estadoHttp}`).toBe(estado)
})

Then('el HTML ya trae el título de la página', async ({ ctx }) => {
  const titulo = /<title>([^<]+)<\/title>/.exec(ctx.htmlCrudo)?.[1] ?? ''
  expect(titulo, 'el HTML servido no trae <title>').not.toBe('')
  expect(titulo).toContain('Centro Qi')
  // El genérico de `index.html` significaría que el prerenderizado no corrió.
  expect(titulo, 'quedó el título genérico de la plantilla').not.toBe(
    'Centro Qi · Terapias Orientales en Asunción',
  )
  expect(ctx.htmlCrudo).toContain('rel="canonical"')
})

Then('el HTML ya trae el nombre de las cuatro terapias', async ({ ctx }) => {
  for (const terapia of TERAPIAS) {
    expect(ctx.htmlCrudo, `falta "${terapia.nombre}" en el HTML servido`).toContain(terapia.nombre)
  }
  expect(ctx.htmlCrudo, '#root vino vacío: no se prerenderizó el cuerpo').not.toContain(
    '<div id="root"></div>',
  )
})

Then('el HTML no trae horarios de la agenda', async ({ ctx }) => {
  // Congelar la agenda del día de la compilación mostraría horarios que ya pasaron.
  expect(ctx.htmlCrudo).toContain('<div id="root"></div>')
  expect(ctx.htmlCrudo).not.toMatch(/data-testid="slot"/)
})

// --- Terceros y tipografía -------------------------------------------------

Then('la página no pide nada a dominios de terceros', async ({ page }) => {
  // Se vuelve a cargar con el registro de pedidos puesto: lo que ya cargó no se puede
  // observar hacia atrás.
  const ajenos: string[] = []
  const propio = new URL(page.url()).host

  page.on('request', (peticion) => {
    const host = new URL(peticion.url()).host
    if (host !== propio && host !== '') ajenos.push(`${peticion.resourceType()} → ${host}`)
  })

  await page.reload({ waitUntil: 'networkidle' })

  expect(ajenos, `la página pide recursos a terceros: ${ajenos.join(', ')}`).toEqual([])
})

Then('la tipografía del título ya está aplicada', async ({ page }) => {
  const h1 = page.getByRole('heading', { level: 1 }).first()
  await expect(h1).toBeVisible()

  const familia = await h1.evaluate((el) => getComputedStyle(el).fontFamily)
  expect(familia, 'el <h1> no está usando la tipografía de títulos').toContain('Cinzel')

  // Que la fuente esté cargada de verdad, no solamente declarada: si faltara, el
  // navegador dibujaría con la serif de reserva y el título se vería distinto.
  const cargada = await page.evaluate(() => document.fonts.check('600 1rem Cinzel'))
  expect(cargada, 'la tipografía Cinzel no llegó a cargarse').toBe(true)
})

Then('el código descargado no incluye la clave del panel', async ({ page }) => {
  // El panel se carga aparte (`lazy`), así que su módulo —y la clave de la demo— no
  // viajan en el archivo que descarga todo el mundo para ver la portada.
  const guiones = await page
    .locator('script[src]')
    .evaluateAll((nodos) => nodos.map((n) => (n as HTMLScriptElement).src))

  expect(guiones.length, 'la página no cargó ningún script').toBeGreaterThan(0)

  for (const src of guiones) {
    const cuerpo = await (await page.request.get(src)).text()
    expect(cuerpo, `${src} incluye la clave del panel`).not.toContain(CLAVE_ADMIN)
  }
})
