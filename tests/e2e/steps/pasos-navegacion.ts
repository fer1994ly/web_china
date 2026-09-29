import { expect } from '@playwright/test'
import { Then, When } from './fixtures'
import { RUTAS } from '../../../src/app/rutas'
import { CENTRO } from '../../../src/seed/centro'

/**
 * Los pasos que comprueban que el sitio está cableado de punta a punta.
 *
 * El recorrido se hace una vez y deja en el contexto lo que encontró, para que los
 * escenarios que siguen no tengan que volver a visitar las siete rutas.
 *
 * Qué cuenta como enlace interno: los `href` que empiezan con `/`. Quedan fuera los
 * anclas (`#preguntas`), `wa.me`, `mailto:` y `tel:`, que no son páginas del sitio y
 * cuya validez no depende de nosotros.
 */

const esInterno = (href: string): boolean => href.startsWith('/') && !href.startsWith('//')

When('recorro todas las rutas del sitio', async ({ page, ctx }) => {
  ctx.pantallas = []

  for (const { ruta } of RUTAS) {
    await page.goto(ruta)
    // El <title> lo escribe un efecto: esperarlo asegura que la pantalla ya montó.
    await page.waitForFunction(() => document.title !== '')

    const encabezado = (await page.getByRole('heading', { level: 1 }).first().textContent()) ?? ''
    const caracteres = (await page.locator('#root').innerText()).trim().length
    const enlaces = await page
      .locator('a[href]')
      .evaluateAll((nodos) =>
        nodos.map((n) => (n as HTMLAnchorElement).getAttribute('href') ?? ''),
      )

    ctx.pantallas.push({ ruta, encabezado: encabezado.trim(), caracteres, enlaces })
  }

  expect(ctx.pantallas).toHaveLength(RUTAS.length)
})

Then('cada pantalla muestra contenido propio y un encabezado distinto', async ({ ctx }) => {
  for (const p of ctx.pantallas) {
    expect(p.encabezado, `${p.ruta} no tiene un <h1>`).not.toBe('')
  }

  // Dos rutas con el mismo <h1> suelen ser una ruta mal cableada que cae en la pantalla
  // de otra, que es exactamente el defecto que este escenario busca.
  const encabezados = ctx.pantallas.map((p) => p.encabezado)
  const repetidos = encabezados.filter((h, i) => encabezados.indexOf(h) !== i)
  expect(repetidos, `dos rutas muestran el mismo encabezado: ${repetidos.join(', ')}`).toEqual([])
})

Then('ninguna pantalla queda en blanco ni muestra un error', async ({ ctx }) => {
  for (const p of ctx.pantallas) {
    // 400 caracteres es poco para cualquier pantalla real: la más escueta es la puerta
    // del panel, que ronda los 700.
    expect(p.caracteres, `${p.ruta} apenas muestra ${p.caracteres} caracteres`).toBeGreaterThan(400)
  }
})

Then('todos los enlaces internos que encontré responden', async ({ page, ctx }) => {
  const internos = [...new Set(ctx.pantallas.flatMap((p) => p.enlaces).filter(esInterno))]
    // El querystring de `/reservar?terapia=…` no cambia la página que resuelve.
    .map((href) => href.split('?')[0] ?? href)

  expect(internos.length, 'no se encontró ningún enlace interno').toBeGreaterThan(3)

  const rotos: string[] = []
  for (const href of [...new Set(internos)]) {
    const respuesta = await page.request.get(href)
    if (!respuesta.ok()) rotos.push(`${href} → ${respuesta.status()}`)
  }

  expect(rotos, `enlaces que no llevan a ninguna parte: ${rotos.join(', ')}`).toEqual([])
})

Then('el menú principal lleva a las pantallas públicas', async ({ page }) => {
  // PRIORIDAD CELULAR: a 360px —el ancho por defecto de la suite— los enlaces de
  // escritorio están con `display:none` y el menú vive detrás del botón de hamburguesa.
  // Un elemento oculto así no está en el árbol de accesibilidad, o sea que no existe
  // para un lector de pantalla ni para quien mira. Se abre como lo abriría una persona.
  const hamburguesa = page.getByRole('button', { name: 'Abrir menú' })
  if (await hamburguesa.isVisible()) await hamburguesa.click()

  const encabezado = page.getByRole('banner')

  for (const texto of ['Inicio', 'Terapias', 'Reservar', 'Mi turno']) {
    await expect(
      encabezado.getByRole('link', { name: texto, exact: true }),
      `no se llega a "${texto}" desde el encabezado`,
    ).toBeVisible()
  }
})

Then('el pie de página lleva a las legales y al panel', async ({ page }) => {
  const legal = page.getByRole('navigation', { name: 'Legal' })

  for (const texto of ['Aviso legal', 'Privacidad', 'Panel']) {
    await expect(
      legal.getByRole('link', { name: texto, exact: true }),
      `falta "${texto}" en el pie`,
    ).toHaveCount(1)
  }
})

Then('el pie de página ofrece el celular del centro como enlace de WhatsApp', async ({ page }) => {
  const enlace = page.getByRole('contentinfo').getByRole('link', { name: CENTRO.celular })
  await expect(enlace).toHaveCount(1)

  const href = (await enlace.getAttribute('href')) ?? ''
  expect(href).toContain('wa.me/')
  expect(href, 'el enlace no lleva el celular del centro').toContain(CENTRO.celularE164)
})
