/**
 * Prerenderizado estatico de las rutas de contenido.
 *
 * EL PROBLEMA: una SPA sirve `<div id="root"></div>` vacio. Google sabe ejecutar
 * JavaScript, pero lo hace tarde y no siempre; WhatsApp, Facebook y la mayoria de
 * los lectores de enlaces NO lo ejecutan nunca. Sin esto, compartir el sitio por
 * WhatsApp —que es como se comparte casi todo en Paraguay— muestra una tarjeta vacia.
 *
 * LA SOLUCION: se renderiza cada ruta con `react-dom/server` y se guarda el HTML en
 * `dist/<ruta>/index.html`. El servidor lo sirve como archivo estatico y el navegador
 * del visitante hidrata la SPA encima, sin volver a construir el arbol.
 *
 * ANTES ESTO ABRIA UN CHROMIUM. Se levantaba el build en un puerto, se lo visitaba
 * con Playwright y se guardaba el `outerHTML`. Daba el mismo resultado y hacia el
 * deploy imposible: el contenedor de build de Netlify no puede instalar las
 * dependencias de sistema de un Chromium headless, asi que
 * `playwright install --with-deps` —y con el todo el deploy— fallaba. Renderizar en
 * Node no necesita navegador: el prerenderizado de las cinco paginas tarda ~0,4 s, build
 * del bundle de servidor incluido.
 *
 * QUE NO SE PRERENDERIZA COMPLETO: las rutas cuyo cuerpo depende de la fecha. De
 * `/reservar` se publica solo la cabeza (metadatos y datos estructurados) con `#root`
 * vacio; congelar su agenda seria mostrarle a alguien horarios que ya pasaron. Las
 * privadas no generan HTML: caen en `spa.html`. `src/app/rutas.ts` decide cual es cual.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { build } from 'vite'

const DIST = 'dist'
const SALIDA_SSR = 'node_modules/.tmp/ssr'
const ENTRADA = 'src/app/entrada-servidor.tsx'

/**
 * El arbol de la app se compila aparte para poder importarlo desde Node: trae JSX,
 * alias `@/` y `import.meta.env`, que Node no entiende por su cuenta. Es el mismo
 * codigo que el bundle del navegador, compilado para otro destino.
 */
await build({
  configFile: 'vite.config.ts',
  logLevel: 'warn',
  build: {
    ssr: ENTRADA,
    outDir: SALIDA_SSR,
    emptyOutDir: true,
    // El prerenderizado lee el HTML de `dist/`, que ya esta escrito: si este build
    // lo vaciara, se perderia el bundle del navegador.
    copyPublicDir: false,
    minify: false,
    target: 'node22',
  },
})

const { htmlDeLaRuta, plantillaDeLaSpa, rutasPrerenderizables, rutasSoloMetadatos } =
  await import(new URL(`../${SALIDA_SSR}/entrada-servidor.js`, import.meta.url).href)

/**
 * La plantilla vacia que emitio Vite, ANTES de que la toquemos.
 *
 * Se guarda como `spa.html` porque es la reserva de las rutas sin HTML propio
 * (`/mi-turno`, `/admin`, y cualquier URL inexistente). No se puede usar `index.html`
 * para eso: ese archivo pasa a ser la portada ya renderizada, y servirlo en `/admin`
 * haria que React tuviera que hidratar el panel sobre el HTML de la portada —un
 * desajuste completo que obliga a redibujar todo en el cliente.
 *
 * Se le agrega el `noindex`: todo lo que cae en esta plantilla es privado o no existe.
 */
const plantilla = await readFile(join(DIST, 'index.html'), 'utf8')
await writeFile(join(DIST, 'spa.html'), plantillaDeLaSpa(plantilla), 'utf8')

const destinoDe = (ruta) =>
  ruta === '/' ? join(DIST, 'index.html') : join(DIST, ruta.slice(1), 'index.html')

const generadas = []

async function generar(ruta, conCuerpo) {
  const html = htmlDeLaRuta(plantilla, ruta, { conCuerpo })
  const destino = destinoDe(ruta)
  await mkdir(dirname(destino), { recursive: true })
  await writeFile(destino, html, 'utf8')
  generadas.push({ ruta, destino, bytes: html.length, conCuerpo })
}

for (const { ruta } of rutasPrerenderizables()) await generar(ruta, true)
for (const { ruta } of rutasSoloMetadatos()) await generar(ruta, false)

await rm(SALIDA_SSR, { recursive: true, force: true })

for (const g of generadas) {
  const clase = g.conCuerpo ? 'completa' : 'solo cabeza'
  console.log(`  ${g.ruta.padEnd(20)} → ${g.destino} (${(g.bytes / 1024).toFixed(1)} kB, ${clase})`)
}
console.log(`  ${'reserva de la SPA'.padEnd(20)} → ${join(DIST, 'spa.html')}`)
console.log(
  `Prerender: ${generadas.filter((g) => g.conCuerpo).length} páginas con cuerpo estático, ` +
    `${generadas.filter((g) => !g.conCuerpo).length} con solo metadatos.`,
)
