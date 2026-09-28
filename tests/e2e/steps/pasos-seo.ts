import { expect, type Page } from '@playwright/test'
import { Then } from './fixtures'

/** Lee el `content` de una etiqueta meta, o null si no existe. */
async function meta(page: Page, selector: string): Promise<string | null> {
  const el = page.locator(`head ${selector}`)
  if ((await el.count()) === 0) return null
  return el.first().getAttribute('content')
}

async function datosEstructurados(page: Page): Promise<unknown[]> {
  const crudo = await page.locator('head script#datos-estructurados').textContent()
  if (crudo === null) return []
  const json: unknown = JSON.parse(crudo)
  return Array.isArray(json) ? json : [json]
}

const tipoDe = (nodo: unknown): string =>
  typeof nodo === 'object' && nodo !== null && '@type' in nodo
    ? String((nodo as Record<string, unknown>)['@type'])
    : ''

// --- Metadatos basicos -----------------------------------------------------

Then('la página tiene un título descriptivo', async ({ page }) => {
  const titulo = await page.title()
  expect(titulo.length, 'el título está vacío').toBeGreaterThan(15)
  // Más de 60 caracteres y Google lo recorta con puntos suspensivos.
  expect(titulo.length, `el título es demasiado largo: "${titulo}"`).toBeLessThanOrEqual(75)
  expect(titulo).toContain('Centro Qi')
})

Then(
  'la página tiene una descripción de entre {int} y {int} caracteres',
  async ({ page }, minimo: number, maximo: number) => {
    const descripcion = await meta(page, 'meta[name="description"]')
    expect(descripcion, 'falta la meta description').not.toBeNull()
    expect(
      (descripcion ?? '').length,
      `la descripción mide ${(descripcion ?? '').length}: "${descripcion}"`,
    ).toBeGreaterThanOrEqual(minimo)
    expect((descripcion ?? '').length).toBeLessThanOrEqual(maximo)
  },
)

Then('la página declara su URL canónica para {string}', async ({ page }, ruta: string) => {
  const canonica = await page.locator('head link[rel="canonical"]').getAttribute('href')
  expect(canonica, 'falta la etiqueta canonical').not.toBeNull()
  expect(canonica).toMatch(/^https?:\/\//)
  expect(new URL(canonica ?? '').pathname).toBe(ruta)
})

Then('la página es indexable', async ({ page }) => {
  const robots = (await meta(page, 'meta[name="robots"]')) ?? 'index'
  expect(robots).not.toContain('noindex')
})

Then('la página no es indexable', async ({ page }) => {
  const robots = await meta(page, 'meta[name="robots"]')
  expect(robots, 'falta la meta robots').not.toBeNull()
  expect(robots).toContain('noindex')
})

// --- Compartir el enlace ---------------------------------------------------

Then(
  'la página tiene las etiquetas Open Graph de título, descripción, imagen y URL',
  async ({ page }) => {
    for (const propiedad of ['og:title', 'og:description', 'og:image', 'og:url']) {
      const valor = await meta(page, `meta[property="${propiedad}"]`)
      expect(valor, `falta ${propiedad}`).toBeTruthy()
    }
    expect(await meta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image')
  },
)

Then('la imagen de Open Graph es una dirección absoluta', async ({ page }) => {
  // Una ruta relativa acá rompe la vista previa: quien lee el enlace no sabe
  // contra qué dominio resolverla.
  const imagen = await meta(page, 'meta[property="og:image"]')
  expect(imagen).toMatch(/^https?:\/\//)
})

// --- Datos estructurados ---------------------------------------------------

Then('la página incluye datos estructurados de tipo {string}', async ({ page }, tipo: string) => {
  const nodos = await datosEstructurados(page)
  expect(nodos.map(tipoDe), `tipos presentes: ${nodos.map(tipoDe).join(', ')}`).toContain(tipo)
})

Then('los datos estructurados incluyen la dirección y los horarios del centro', async ({ page }) => {
  const nodos = await datosEstructurados(page)
  const negocio = nodos.find((n) => tipoDe(n) === 'MedicalBusiness') as
    | Record<string, unknown>
    | undefined

  expect(negocio, 'no hay nodo MedicalBusiness').toBeDefined()

  const direccion = negocio?.['address'] as Record<string, unknown> | undefined
  expect(direccion?.['addressLocality']).toBe('Asunción')
  expect(direccion?.['streetAddress']).toBeTruthy()

  const horarios = negocio?.['openingHoursSpecification']
  expect(Array.isArray(horarios) && horarios.length).toBeGreaterThan(0)
  expect(negocio?.['telephone']).toMatch(/^\+595/)
})

// --- Coherencia entre paginas ----------------------------------------------

Then('ninguna página pública repite el título de otra', async ({ page }) => {
  const rutas = ['/', '/terapias', '/reservar', '/legal/aviso', '/legal/privacidad']
  const titulos: string[] = []

  for (const ruta of rutas) {
    await page.goto(ruta)
    await page.waitForFunction(() => document.title !== '')
    titulos.push(await page.title())
  }

  expect(new Set(titulos).size, `títulos: ${titulos.join(' | ')}`).toBe(rutas.length)
})
