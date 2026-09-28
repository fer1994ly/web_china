/**
 * Levanta `dist/` con las MISMAS cabeceras que aplicara Netlify y comprueba que la
 * app arranque. Una Content-Security-Policy demasiado estricta no falla en el build
 * ni en los tests con `vite preview`: falla en produccion, con pantalla en blanco.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { chromium } from 'playwright'

const CSP = await (async () => {
  const toml = await readFile('netlify.toml', 'utf8')
  const m = /Content-Security-Policy = "([^"]+)"/.exec(toml)
  if (m === null) throw new Error('No se encontró la CSP en netlify.toml')
  return m[1]
})()

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' }

const servidor = createServer(async (req, res) => {
  const url = (req.url ?? '/').split('?')[0]
  let ruta = join('dist', decodeURIComponent(url))
  try {
    const i = await stat(ruta)
    if (i.isDirectory()) ruta = join(ruta, 'index.html')
  } catch { ruta = join('dist', 'index.html') }
  try {
    const cuerpo = await readFile(ruta)
    res.writeHead(200, {
      'content-type': TIPOS[extname(ruta)] ?? 'application/octet-stream',
      'content-security-policy': CSP,
    })
    res.end(cuerpo)
  } catch { res.writeHead(404).end('404') }
})
await new Promise((l) => servidor.listen(4181, l))

const navegador = await chromium.launch()
const pagina = await navegador.newPage()
const problemas = []
pagina.on('console', (m) => { if (m.type() === 'error') problemas.push(m.text()) })
pagina.on('pageerror', (e) => problemas.push(String(e)))

let fallos = 0
for (const ruta of ['/', '/terapias', '/reservar', '/mi-turno', '/admin']) {
  problemas.length = 0
  await pagina.goto(`http://127.0.0.1:4181${ruta}`, { waitUntil: 'networkidle' })
  const textoVisible = (await pagina.locator('#root').innerText()).trim().length
  const bloqueos = problemas.filter((p) => /Content Security Policy|Refused to/i.test(p))

  const ok = textoVisible > 100 && bloqueos.length === 0
  if (!ok) fallos += 1
  console.log(`${ok ? 'OK ' : 'FALLA'} ${ruta.padEnd(12)} texto=${textoVisible} bloqueosCSP=${bloqueos.length}`)
  for (const b of bloqueos.slice(0, 3)) console.log(`      ${b.slice(0, 140)}`)
}

await navegador.close()
servidor.close()
process.exit(fallos === 0 ? 0 : 1)
