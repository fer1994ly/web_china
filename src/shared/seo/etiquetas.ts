/**
 * Las etiquetas de <head> de una pagina, como DATOS.
 *
 * POR QUE NO ESTAN ESCRITAS DIRECTO CONTRA EL DOM: se aplican en dos lugares
 * distintos —el navegador las escribe en `document.head` (ver `useSeo`) y el
 * prerenderizador las serializa a texto dentro del HTML estatico— y si cada lado
 * tuviera su propia lista, tarde o temprano una og:image aparece solo en una de las
 * dos. Aca se decide UNA vez que etiquetas lleva la pagina; cada lado solo sabe
 * como materializar la lista.
 *
 * El modulo es TypeScript puro a proposito: no toca el DOM, asi que corre igual en
 * Node durante la compilacion y en el navegador.
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
  url:
    (import.meta.env['VITE_SITE_URL'] as string | undefined)?.replace(/\/$/, '') ??
    'https://centroqi.com.py',
  nombre: 'Centro Qi',
  idioma: 'es_PY',
  imagenPorDefecto: '/img/acupuntura.jpg',
} as const

/** El id del <script> de schema.org. Los tests E2E lo buscan por este nombre. */
export const ID_JSONLD = 'datos-estructurados'

export type Etiqueta =
  | { readonly tipo: 'titulo'; readonly texto: string }
  | {
      readonly tipo: 'meta'
      /** `name` para las estandar y las de Twitter; `property` para Open Graph. */
      readonly clave: 'name' | 'property'
      readonly valor: string
      readonly contenido: string
    }
  | { readonly tipo: 'enlace'; readonly rel: string; readonly href: string }
  | { readonly tipo: 'jsonld'; readonly id: string; readonly json: string }

/** Absolutiza una ruta del sitio; deja intacto lo que ya es una URL completa. */
export function urlAbsoluta(rutaOUrl: string): string {
  return rutaOUrl.startsWith('http') ? rutaOUrl : `${SITIO.url}${rutaOUrl}`
}

export function etiquetasSeo(datos: DatosSeo): readonly Etiqueta[] {
  const {
    titulo,
    descripcion,
    ruta,
    imagen = SITIO.imagenPorDefecto,
    noIndexar = false,
    datosEstructurados = [],
  } = datos

  const urlCanonica = urlAbsoluta(ruta)
  const urlImagen = urlAbsoluta(imagen)

  const etiquetas: Etiqueta[] = [
    { tipo: 'titulo', texto: titulo },
    { tipo: 'meta', clave: 'name', valor: 'description', contenido: descripcion },
    {
      tipo: 'meta',
      clave: 'name',
      valor: 'robots',
      contenido: noIndexar ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    },
    { tipo: 'enlace', rel: 'canonical', href: urlCanonica },

    // Open Graph: lo que ve quien recibe el enlace por WhatsApp, que en Paraguay
    // es como se comparte casi todo.
    { tipo: 'meta', clave: 'property', valor: 'og:type', contenido: ruta === '/' ? 'website' : 'article' },
    { tipo: 'meta', clave: 'property', valor: 'og:site_name', contenido: SITIO.nombre },
    { tipo: 'meta', clave: 'property', valor: 'og:locale', contenido: SITIO.idioma },
    { tipo: 'meta', clave: 'property', valor: 'og:title', contenido: titulo },
    { tipo: 'meta', clave: 'property', valor: 'og:description', contenido: descripcion },
    { tipo: 'meta', clave: 'property', valor: 'og:url', contenido: urlCanonica },
    { tipo: 'meta', clave: 'property', valor: 'og:image', contenido: urlImagen },
    { tipo: 'meta', clave: 'property', valor: 'og:image:alt', contenido: descripcion },

    { tipo: 'meta', clave: 'name', valor: 'twitter:card', contenido: 'summary_large_image' },
    { tipo: 'meta', clave: 'name', valor: 'twitter:title', contenido: titulo },
    { tipo: 'meta', clave: 'name', valor: 'twitter:description', contenido: descripcion },
    { tipo: 'meta', clave: 'name', valor: 'twitter:image', contenido: urlImagen },
  ]

  if (datosEstructurados.length > 0) {
    etiquetas.push({
      tipo: 'jsonld',
      id: ID_JSONLD,
      json: JSON.stringify(
        datosEstructurados.length === 1 ? datosEstructurados[0] : datosEstructurados,
      ),
    })
  }

  return etiquetas
}
