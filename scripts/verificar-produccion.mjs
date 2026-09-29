/**
 * Verifica el sitio PUBLICADO, no `dist/`.
 *
 * POR QUE HACE FALTA si ya existen `npm run csp` y los E2E: porque hay cosas que solo
 * pasan en producción. Este guion encontró dos:
 *
 *  1. Netlify inyectaba su insignia —un iframe con un script en línea— y la CSP la
 *     bloqueaba, así que cada visita registraba una violación en la consola. En `dist/`
 *     esa insignia no existe.
 *  2. "Pretty URLs" devolvía un 301 de `/terapias` a `/terapias/`, mientras el sitemap y
 *     la canónica anunciaban la URL sin barra final. El servidor local responde 200
 *     directo, así que no había forma de verlo antes de publicar.
 *
 * QUE COMPRUEBA en cada ruta: que la pantalla tenga contenido, que hidrate sin
 * desajustes, que la CSP real no bloquee nada, que no se pida nada a terceros y que
 * Core Web Vitals entren en los umbrales de Google.
 *
 * NO corre en `npm run verify`: necesita el sitio desplegado y red. Se corre después de
 * publicar.
 *
 *   npm run verificar:produccion
 *   SITIO_URL=https://otro-dominio.com npm run verificar:produccion
 */
import { chromium, devices } from 'playwright'
import { calificar, formatear, UMBRALES } from '../src/shared/rendimiento/umbrales.ts'
import { RUTAS } from '../src/app/rutas.ts'

const SITIO = (
  process.env.SITIO_URL ?? 'https://gorgeous-shortbread-f7e06f.netlify.app'
).replace(/\/$/, '')

/** Las de diagnóstico van también: un LCP malo casi siempre se explica con una de ellas. */
const MEDIDAS = ['TTFB', 'FCP', 'LCP', 'CLS']

const navegador = await chromium.launch()
// Prioridad celular, igual que la suite E2E: es desde donde entra casi todo el mundo.
const contexto = await navegador.newContext({
  ...devices['Pixel 7'],
  viewport: { width: 360, height: 640 },
  locale: 'es-PY',
  timezoneId: 'America/Asuncion',
})

const anfitrion = new URL(SITIO).host
let fallos = 0

console.log(`Verificando ${SITIO}\n`)

for (const { ruta } of RUTAS) {
  const pagina = await contexto.newPage()
  const problemas = []
  const terceros = new Set()

  pagina.on('console', (m) => {
    if (m.type() === 'error') problemas.push(m.text())
  })
  pagina.on('pageerror', (e) => problemas.push(String(e)))
  pagina.on('request', (p) => {
    const host = new URL(p.url()).host
    if (host !== anfitrion && host !== '') terceros.add(host)
  })

  const respuesta = await pagina.goto(`${SITIO}${ruta}`, { waitUntil: 'networkidle' })

  const texto = (await pagina.locator('#root').innerText()).trim().length
  const csp = problemas.filter((p) => /Content Security Policy|Refused to/i.test(p))
  const hidratacion = problemas.filter((p) => /[Hh]ydrat/.test(p))
  const redirecciones = respuesta?.request().redirectedFrom() !== null

  // El LCP se reporta cuando el navegador deja de encontrar candidatos más grandes, y en
  // la portada —la página más pesada— eso puede caer despues de `networkidle`. Sin esta
  // espera la portada salía con "LCP=?", que es peor que un número malo: parece que no se
  // puede medir cuando en realidad solo había que esperar.
  await pagina
    .waitForFunction(() => window.__METRICAS_WEB__?.LCP !== undefined, undefined, { timeout: 5000 })
    .catch(() => {})

  // El CLS puede no reportarse si nada se movió, y ese es el mejor valor posible: cero.
  const medidas = await pagina.evaluate(
    (claves) =>
      Object.fromEntries(
        claves.map((c) => [c, window.__METRICAS_WEB__?.[c]?.valor ?? (c === 'CLS' ? 0 : null)]),
      ),
    MEDIDAS,
  )

  const fuera = MEDIDAS.filter(
    (n) => medidas[n] !== null && calificar(n, medidas[n]) !== 'buena',
  ).map((n) => `${n}=${formatear(n, medidas[n])} (umbral ${formatear(n, UMBRALES[n].buena)})`)

  const ok =
    texto > 400 &&
    csp.length === 0 &&
    hidratacion.length === 0 &&
    terceros.size === 0 &&
    !redirecciones &&
    fuera.length === 0
  if (!ok) fallos += 1

  const valores = MEDIDAS.map((n) =>
    (medidas[n] === null ? `${n}=?` : `${n}=${formatear(n, medidas[n])}`).padEnd(12),
  ).join('')

  console.log(
    `${ok ? 'OK   ' : 'FALLA'} ${ruta.padEnd(20)} texto=${String(texto).padStart(4)} ` +
      `${valores}csp=${csp.length} hidr=${hidratacion.length} terceros=${terceros.size}`,
  )
  if (redirecciones) console.log('        llegó por una redirección: la URL anunciada no es la servida')
  for (const f of fuera) console.log(`        fuera de rango: ${f}`)
  for (const p of [...csp, ...hidratacion].slice(0, 2)) console.log(`        ${p.slice(0, 150)}`)
  if (terceros.size > 0) console.log(`        terceros: ${[...terceros].join(', ')}`)

  await pagina.close()
}

await navegador.close()

console.log(
  fallos === 0
    ? '\nEl sitio publicado está en orden.'
    : `\n${fallos} ruta(s) con problemas en el sitio publicado.`,
)
process.exit(fallos === 0 ? 0 : 1)
