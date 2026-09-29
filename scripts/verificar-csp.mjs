/**
 * Levanta `dist/` con las MISMAS cabeceras y redirecciones que aplicara Netlify y
 * comprueba que la app arranque en cada ruta.
 *
 * POR QUE EXISTE: una Content-Security-Policy demasiado estricta no falla en el build
 * ni en los tests con un servidor pelado. Falla en produccion, con pantalla en blanco
 * y un mensaje en la consola que nadie esta mirando.
 *
 * El servidor es el compartido, que lee las reglas de `netlify.toml`: la CSP que se
 * prueba aca es literalmente la que se va a publicar.
 *
 * Esto NO corre en el build de Netlify —necesita Chromium— sino en `npm run verify`,
 * antes de subir.
 */
import { chromium } from 'playwright'
import { levantar } from './servidor-estatico.mjs'

const PUERTO = 4181
const { servidor, base } = await levantar({ puerto: PUERTO })

const navegador = await chromium.launch()
const pagina = await navegador.newPage()
const problemas = []
pagina.on('console', (m) => {
  if (m.type() === 'error') problemas.push(m.text())
})
pagina.on('pageerror', (e) => problemas.push(String(e)))

let fallos = 0
for (const ruta of ['/', '/terapias', '/reservar', '/mi-turno', '/admin', '/legal/aviso']) {
  problemas.length = 0
  await pagina.goto(`${base}${ruta}`, { waitUntil: 'networkidle' })
  const textoVisible = (await pagina.locator('#root').innerText()).trim().length
  const bloqueos = problemas.filter((p) => /Content Security Policy|Refused to/i.test(p))

  // Un desajuste de hidratacion no rompe la pantalla —React redibuja— pero anula el
  // prerenderizado, asi que tambien tiene que fallar.
  const hidratacion = problemas.filter((p) => /[Hh]ydrat/.test(p))

  const ok = textoVisible > 100 && bloqueos.length === 0 && hidratacion.length === 0
  if (!ok) fallos += 1
  console.log(
    `${ok ? 'OK   ' : 'FALLA'} ${ruta.padEnd(14)} texto=${textoVisible} ` +
      `bloqueosCSP=${bloqueos.length} hidratación=${hidratacion.length}`,
  )
  for (const p of [...bloqueos, ...hidratacion].slice(0, 3)) console.log(`      ${p.slice(0, 160)}`)
}

await navegador.close()
servidor.close()
process.exit(fallos === 0 ? 0 : 1)
