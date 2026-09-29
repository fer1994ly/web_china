/**
 * Lee `netlify.toml`.
 *
 * POR QUE: las redirecciones y las cabeceras de produccion deciden cosas que se
 * pueden romper sin que ningun test lo note —que `/admin` caiga en `spa.html`, que una
 * CSP deje pasar la hoja de estilos, que una URL inexistente devuelva 404 y no 200—.
 * Leyendo el archivo de verdad, el servidor con el que corren los E2E aplica LAS
 * MISMAS reglas que Netlify, en lugar de una imitacion que se desincroniza sola.
 *
 * Es un parser del subconjunto de TOML que este archivo usa (tablas, arrays de tablas,
 * strings y enteros), no un parser de TOML completo: alcanza de sobra y evita sumar
 * una dependencia al build.
 */
import { readFileSync } from 'node:fs'

function valorToml(crudo) {
  const texto = crudo.trim()
  if (/^".*"$/s.test(texto)) return texto.slice(1, -1)
  if (/^-?\d+$/.test(texto)) return Number(texto)
  if (texto === 'true' || texto === 'false') return texto === 'true'
  return texto
}

export function leerNetlifyToml(ruta = 'netlify.toml') {
  const config = { build: {}, redirects: [], headers: [] }
  /** Donde van a caer los `clave = valor` que siguen. */
  let destino = config

  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const texto = linea.trim()
    if (texto === '' || texto.startsWith('#')) continue

    // Array de tablas: `[[redirects]]` abre una entrada nueva de la lista.
    const arreglo = /^\[\[([\w.]+)\]\]$/.exec(texto)
    if (arreglo !== null) {
      const nombre = arreglo[1]
      config[nombre] ??= []
      destino = {}
      config[nombre].push(destino)
      continue
    }

    // Tabla: `[build]` o `[headers.values]`. El ultimo tramo es la subtabla del
    // objeto abierto; los de mas arriba cuelgan de la raiz.
    const tabla = /^\[([\w.]+)\]$/.exec(texto)
    if (tabla !== null) {
      const tramos = tabla[1].split('.')
      if (tramos.length > 1 && Array.isArray(config[tramos[0]])) {
        // `[headers.values]` describe la entrada de `[[headers]]` que quedo abierta.
        const abierta = config[tramos[0]].at(-1)
        abierta[tramos.at(-1)] = {}
        destino = abierta[tramos.at(-1)]
      } else {
        let actual = config
        for (const tramo of tramos) {
          actual[tramo] ??= {}
          actual = actual[tramo]
        }
        destino = actual
      }
      continue
    }

    const par = /^([\w-]+)\s*=\s*(.+)$/.exec(texto)
    if (par !== null) destino[par[1]] = valorToml(par[2])
  }

  return config
}

/** `/*` y `/assets/*` como predicado sobre la ruta pedida. */
export function coincide(patron, ruta) {
  if (!patron.includes('*')) return patron === ruta
  const prefijo = patron.slice(0, patron.indexOf('*'))
  return ruta.startsWith(prefijo)
}

/** La primera redireccion que aplica a `ruta`, o null. */
export function redireccionPara(config, ruta) {
  return config.redirects.find((r) => coincide(r.from, ruta)) ?? null
}

/** Todas las cabeceras que aplican a `ruta`, de la mas general a la mas especifica. */
export function cabecerasPara(config, ruta) {
  const valores = {}
  for (const regla of config.headers) {
    if (coincide(regla.for, ruta)) Object.assign(valores, regla.values ?? {})
  }
  return valores
}
