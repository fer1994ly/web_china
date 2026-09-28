import { useEffect } from 'react'

/**
 * Gestion de metadatos del documento.
 *
 * Se hace de forma imperativa y no renderizando <title>/<meta> en el arbol (React 19
 * sabe elevarlos al head) porque esa via AGREGA etiquetas en lugar de reemplazarlas:
 * convivirian con las de `index.html` y la pagina terminaria con dos descripciones,
 * que es peor que no tener ninguna. Aca cada etiqueta se busca y se actualiza en su
 * lugar, de modo que siempre hay exactamente una de cada.
 */

export interface DatosSeo {
  readonly titulo: string
  /** Entre 120 y 160 caracteres: lo que se ve en el resultado de busqueda. */
  readonly descripcion: string
  /** Ruta absoluta del sitio, empezando con "/". */
  readonly ruta: string
  readonly imagen?: string
  /** Paginas privadas o transaccionales que no deben aparecer en buscadores. */
  readonly noIndexar?: boolean
  /** Datos estructurados (schema.org) propios de esta pagina. */
  readonly datosEstructurados?: readonly object[]
}

export const SITIO = {
  /** Se configura con VITE_SITE_URL al desplegar. Ver README. */
  url: (import.meta.env['VITE_SITE_URL'] as string | undefined)?.replace(/\/$/, '') ??
    'https://centroqi.com.py',
  nombre: 'Centro Qi',
  idioma: 'es_PY',
  imagenPorDefecto: '/img/acupuntura.jpg',
} as const

const ID_JSONLD = 'datos-estructurados'

function upsertMeta(clave: 'name' | 'property', valor: string, contenido: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${clave}="${valor}"]`)
  if (el === null) {
    el = document.createElement('meta')
    el.setAttribute(clave, valor)
    document.head.appendChild(el)
  }
  el.setAttribute('content', contenido)
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (el === null) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(datos: readonly object[]): void {
  const anterior = document.getElementById(ID_JSONLD)
  if (anterior !== null) anterior.remove()
  if (datos.length === 0) return

  const el = document.createElement('script')
  el.id = ID_JSONLD
  el.type = 'application/ld+json'
  el.textContent = JSON.stringify(datos.length === 1 ? datos[0] : datos)
  document.head.appendChild(el)
}

export function useSeo(datos: DatosSeo): void {
  const {
    titulo,
    descripcion,
    ruta,
    imagen = SITIO.imagenPorDefecto,
    noIndexar = false,
    datosEstructurados = [],
  } = datos

  useEffect(() => {
    const urlCanonica = `${SITIO.url}${ruta}`
    const urlImagen = imagen.startsWith('http') ? imagen : `${SITIO.url}${imagen}`

    document.title = titulo

    upsertMeta('name', 'description', descripcion)
    upsertMeta(
      'name',
      'robots',
      noIndexar ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
    upsertLink('canonical', urlCanonica)

    // Open Graph: lo que ve quien recibe el enlace por WhatsApp, que en Paraguay
    // es como se comparte casi todo.
    upsertMeta('property', 'og:type', ruta === '/' ? 'website' : 'article')
    upsertMeta('property', 'og:site_name', SITIO.nombre)
    upsertMeta('property', 'og:locale', SITIO.idioma)
    upsertMeta('property', 'og:title', titulo)
    upsertMeta('property', 'og:description', descripcion)
    upsertMeta('property', 'og:url', urlCanonica)
    upsertMeta('property', 'og:image', urlImagen)
    upsertMeta('property', 'og:image:alt', descripcion)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', titulo)
    upsertMeta('name', 'twitter:description', descripcion)
    upsertMeta('name', 'twitter:image', urlImagen)

    upsertJsonLd(datosEstructurados)
  }, [titulo, descripcion, ruta, imagen, noIndexar, datosEstructurados])
}
