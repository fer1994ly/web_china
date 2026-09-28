/**
 * Prerenderizado estatico de las rutas de contenido.
 *
 * EL PROBLEMA: una SPA sirve `<div id="root"></div>` vacio. Google sabe ejecutar
 * JavaScript, pero lo hace tarde y no siempre; WhatsApp, Facebook y la mayoria de
 * los lectores de enlaces NO lo ejecutan nunca. Sin esto, compartir el sitio por
 * WhatsApp —que es como se comparte casi todo en Paraguay— muestra una tarjeta vacia.
 *
 * LA SOLUCION: se levanta el build, se visita cada ruta con el navegador que ya usa
 * la suite E2E (Playwright, cero dependencias nuevas) y se guarda el HTML resultante
 * en `dist/<ruta>/index.html`. El servidor lo sirve como archivo estatico y el
 * navegador del visitante igual arranca la SPA encima.
 *
 * QUE NO SE PRERENDERIZA: las rutas cuyo contenido depende de la fecha. Congelar la
 * agenda del dia de la compilacion dentro de un HTML seria mostrarle a alguien, por
 * un instante, horarios que ya no existen. `src/app/rutas.ts` marca cuales son.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { chromium } from 'playwright'
import { RUTAS } from '../src/app/rutas.ts'

const DIST = 'dist'
const PUERTO = 4179

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

/** Servidor estatico minimo con reserva a index.html, como hara Netlify. */
function servidorEstatico() {
  return createServer(async (req, res) => {
    const url = (req.url ?? '/').split('?')[0]
    let ruta = join(DIST, decodeURIComponent(url))

    try {
      const info = await stat(ruta)
      if (info.isDirectory()) ruta = join(ruta, 'index.html')
    } catch {
      ruta = join(DIST, 'index.html')
    }

    try {
      const cuerpo = await readFile(ruta)
      res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream' })
      res.end(cuerpo)
    } catch {
      res.writeHead(404).end('no encontrado')
    }
  })
}

const servidor = servidorEstatico()
await new Promise((listo) => servidor.listen(PUERTO, listo))

const navegador = await chromium.launch()
const contexto = await navegador.newContext({ locale: 'es-PY', timezoneId: 'America/Asuncion' })
const pagina = await contexto.newPage()

const objetivo = RUTAS.filter((r) => r.prerenderizable)
const generadas = []

for (const { ruta } of objetivo) {
  await pagina.goto(`http://127.0.0.1:${PUERTO}${ruta}`, { waitUntil: 'networkidle' })

  // Espera a que el SEO ya haya escrito su <title>: los metadatos se aplican en un
  // efecto, y guardar antes daria un HTML con el titulo generico de index.html.
  await pagina.waitForFunction(() => document.title !== '' && document.title !== 'Vite + React + TS')

  const html = await pagina.content()

  const destino =
    ruta === '/' ? join(DIST, 'index.html') : join(DIST, ruta.slice(1), 'index.html')
  await mkdir(dirname(destino), { recursive: true })
  await writeFile(destino, html, 'utf8')

  generadas.push({ ruta, destino, bytes: html.length })
}

await navegador.close()
servidor.close()

for (const g of generadas) {
  console.log(`  ${g.ruta.padEnd(20)} → ${g.destino} (${(g.bytes / 1024).toFixed(1)} kB)`)
}
console.log(
  `Prerender: ${generadas.length} rutas con HTML estático. ` +
    `${RUTAS.length - generadas.length} se sirven como SPA (contenido dependiente de la fecha o privado).`,
)
