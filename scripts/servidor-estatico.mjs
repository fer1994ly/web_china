/**
 * Sirve `dist/` con las MISMAS reglas que Netlify.
 *
 * POR QUE NO `vite preview`: porque miente donde importa. Ante una ruta sin archivo,
 * `vite preview` devuelve `dist/index.html` —que ahora es la portada ya renderizada—
 * mientras Netlify devuelve `spa.html`, y siempre con 200 donde produccion responde
 * 404. Un E2E verde contra esa reserva no dice nada sobre el sitio publicado: es
 * exactamente la clase de diferencia que hace que algo "funcione en local".
 *
 * Las reglas no estan escritas aca: se leen de `netlify.toml`. Si alguien agrega una
 * pagina y se olvida de su redireccion, lo descubre corriendo los tests.
 *
 * Lo usan `npm run preview`, el `webServer` de Playwright y `npm run csp`. Antes cada
 * uno tenia su propio servidor de archivos copiado a mano.
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { cabecerasPara, leerNetlifyToml, redireccionPara } from './netlify-config.mjs'

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
}

/** El archivo que corresponde a una ruta, o null si no hay ninguno. */
async function archivoDe(dist, ruta) {
  // `normalize` mas el corte de `..`: sin esto, `/../../etc/passwd` sale del dist.
  const candidato = normalize(join(dist, decodeURIComponent(ruta)))
  if (!candidato.startsWith(normalize(dist))) return null

  try {
    const info = await stat(candidato)
    if (!info.isDirectory()) return candidato
  } catch {
    return null
  }

  // Directorio: Netlify sirve su index.html, que es como llegan las paginas
  // prerenderizadas (`/terapias` → `dist/terapias/index.html`).
  const indice = join(candidato, 'index.html')
  try {
    await stat(indice)
    return indice
  } catch {
    return null
  }
}

export function crearServidorNetlify({ dist = 'dist', conCabeceras = true } = {}) {
  const config = leerNetlifyToml()

  return createServer(async (peticion, respuesta) => {
    const ruta = (peticion.url ?? '/').split('?')[0]

    let archivo = await archivoDe(dist, ruta)
    let estado = 200

    if (archivo === null) {
      // Sin archivo: manda la primera redireccion que aplique, con SU codigo.
      const redireccion = redireccionPara(config, ruta)
      if (redireccion === null) {
        respuesta.writeHead(404, { 'content-type': TIPOS['.html'] }).end('<h1>404</h1>')
        return
      }
      archivo = await archivoDe(dist, redireccion.to)
      estado = redireccion.status ?? 200
      if (archivo === null) {
        respuesta
          .writeHead(500, { 'content-type': TIPOS['.html'] })
          .end(`<h1>500</h1><p>Falta ${redireccion.to} en ${dist}</p>`)
        return
      }
    }

    try {
      const cuerpo = await readFile(archivo)
      respuesta.writeHead(estado, {
        'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream',
        ...(conCabeceras ? cabecerasPara(config, ruta) : {}),
      })
      respuesta.end(cuerpo)
    } catch {
      respuesta.writeHead(500, { 'content-type': TIPOS['.html'] }).end('<h1>500</h1>')
    }
  })
}

/** Levanta el servidor y devuelve su URL base. */
export async function levantar({ puerto, dist = 'dist', conCabeceras = true } = {}) {
  const servidor = crearServidorNetlify({ dist, conCabeceras })
  await new Promise((listo) => servidor.listen(puerto, listo))
  return { servidor, base: `http://127.0.0.1:${puerto}` }
}
