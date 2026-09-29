/**
 * Serializa una pagina a HTML estatico sobre la plantilla que emite Vite.
 *
 * Es la contraparte de `useSeo`: las mismas etiquetas de `etiquetas.ts`, pero escritas
 * como texto dentro del <head> en lugar de insertadas en un DOM vivo.
 *
 * Funcion pura y sin dependencias del navegador: se la puede testear con un string
 * de plantilla, que es lo que hace `tests/unit/pagina-estatica.test.ts`.
 */
import { etiquetasSeo, type DatosSeo, type Etiqueta } from './etiquetas'

/** Escapa lo que va como valor de atributo. */
function atributo(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Escapa lo que va como texto de un elemento. */
function texto(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function comoHtml(etiqueta: Etiqueta): string {
  switch (etiqueta.tipo) {
    case 'titulo':
      return `<title>${texto(etiqueta.texto)}</title>`
    case 'meta':
      return `<meta ${etiqueta.clave}="${atributo(etiqueta.valor)}" content="${atributo(etiqueta.contenido)}">`
    case 'enlace':
      return `<link rel="${atributo(etiqueta.rel)}" href="${atributo(etiqueta.href)}">`
    case 'jsonld':
      // `</script>` dentro del JSON cerraria la etiqueta antes de tiempo. Escapar la
      // barra es la forma canonica de meter JSON en un <script> sin romper el parseo.
      return `<script id="${atributo(etiqueta.id)}" type="application/ld+json">${etiqueta.json.replace(
        /<\//g,
        '<\\/',
      )}</script>`
  }
}

export function etiquetasComoHtml(datos: DatosSeo): string {
  return etiquetasSeo(datos).map(comoHtml).join('\n    ')
}

/**
 * El <title> y la <meta name="description"> genericos de `index.html`.
 *
 * Hay que SACARLOS antes de escribir los de la pagina: si se dejan, el HTML queda con
 * dos titulos y dos descripciones, y Google elige uno al azar. Es el mismo problema
 * que `useSeo` resuelve actualizando en lugar de agregar.
 */
function sinMetadatosGenericos(cabeza: string): string {
  return cabeza
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/?>\s*/i, '')
}

/**
 * La plantilla vacia con la que se sirven las rutas sin HTML propio.
 *
 * Lleva `noindex` ESCRITO EN EL HTML, y eso no es una precaucion de mas: es la unica
 * forma de que sea cierto. Todo lo que cae en esta plantilla es privado (`/admin`,
 * `/mi-turno`) o no existe, y hasta ahora el `noindex` lo ponia `useSeo` cuando la
 * pantalla se montaba. Un buscador que lee el HTML y no ejecuta JavaScript —o que lo
 * ejecuta pero se va antes de que baje el modulo del panel— veia una pagina sin
 * instrucciones y podia indexarla.
 *
 * Las paginas publicas no pasan por aca: cada una tiene su archivo con su propio
 * `robots`, y `useSeo` despues actualiza ESTA etiqueta en lugar de agregar otra, asi
 * que sigue habiendo exactamente una.
 */
export function plantillaDeLaSpa(plantilla: string): string {
  if (!/<\/head>/i.test(plantilla)) {
    throw new Error('La plantilla no tiene </head>: no se puede marcar como noindex')
  }
  const corte = plantilla.search(/<\/head>/i)
  return `${plantilla.slice(0, corte)}  <meta name="robots" content="noindex, nofollow">\n  ${plantilla.slice(corte)}`
}

export interface PaginaEstatica {
  /** Metadatos de la pagina. Si falta, se deja la plantilla como esta. */
  readonly seo?: DatosSeo | undefined
  /**
   * El arbol ya renderizado que va dentro de `#root`. Vacio para las paginas de las
   * que solo se publica la cabeza, porque su cuerpo depende de la fecha.
   */
  readonly cuerpo?: string
}

const MARCA_RAIZ = '<div id="root"></div>'

/**
 * Inserta metadatos y cuerpo en la plantilla de Vite.
 *
 * Lanza si la plantilla no tiene `#root` o `</head>`: si eso cambia, es mejor que el
 * build falle que publicar paginas sin metadatos y no enterarse hasta ver el Search
 * Console tres semanas despues.
 */
export function paginaEstatica(plantilla: string, { seo, cuerpo = '' }: PaginaEstatica): string {
  if (!plantilla.includes(MARCA_RAIZ)) {
    throw new Error(`La plantilla no contiene ${MARCA_RAIZ}: no se puede inyectar el cuerpo`)
  }
  if (!/<\/head>/i.test(plantilla)) {
    throw new Error('La plantilla no tiene </head>: no se pueden inyectar los metadatos')
  }

  let html = plantilla
  if (seo !== undefined) {
    const corte = html.search(/<\/head>/i)
    const cabeza = sinMetadatosGenericos(html.slice(0, corte))
    html = `${cabeza}    ${etiquetasComoHtml(seo)}\n  ${html.slice(corte)}`
  }

  return cuerpo === ''
    ? html
    : html.replace(MARCA_RAIZ, `<div id="root">${cuerpo}</div>`)
}
