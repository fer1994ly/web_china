import { createContext, useContext, useEffect } from 'react'
import { etiquetasSeo, ID_JSONLD, type DatosSeo, type Etiqueta } from './etiquetas'

/**
 * Gestion de metadatos del documento.
 *
 * Se hace de forma imperativa y no renderizando <title>/<meta> en el arbol (React 19
 * sabe elevarlos al head) porque esa via AGREGA etiquetas en lugar de reemplazarlas:
 * convivirian con las de `index.html` y la pagina terminaria con dos descripciones,
 * que es peor que no tener ninguna. Aca cada etiqueta se busca y se actualiza en su
 * lugar, de modo que siempre hay exactamente una de cada.
 *
 * QUE ETIQUETAS van es decision de `etiquetas.ts`, que es el mismo modulo que usa el
 * prerenderizador para escribirlas en el HTML estatico. Este archivo solo las aplica
 * al DOM vivo.
 */

export { SITIO, type DatosSeo } from './etiquetas'

/**
 * Canal por el que el prerenderizador se entera de los metadatos de la pagina.
 *
 * En el navegador vale `null` y no pasa nada: las etiquetas las escribe el efecto.
 * Pero durante la compilacion no hay DOM ni efectos —`renderToString` no los corre—,
 * asi que la pagina anuncia sus metadatos mientras se renderiza y el generador los
 * recoge para armar el <head> del HTML estatico. Es el mismo mecanismo que usa
 * react-helmet y la unica forma de que un <title> exista antes de que haya navegador.
 */
export interface SumideroSeo {
  registrar(datos: DatosSeo): void
}

export const ContextoSumideroSeo = createContext<SumideroSeo | null>(null)

function aplicarEnElDocumento(etiqueta: Etiqueta): void {
  switch (etiqueta.tipo) {
    case 'titulo':
      document.title = etiqueta.texto
      return

    case 'meta': {
      const selector = `meta[${etiqueta.clave}="${etiqueta.valor}"]`
      let el = document.head.querySelector<HTMLMetaElement>(selector)
      if (el === null) {
        el = document.createElement('meta')
        el.setAttribute(etiqueta.clave, etiqueta.valor)
        document.head.appendChild(el)
      }
      el.setAttribute('content', etiqueta.contenido)
      return
    }

    case 'enlace': {
      let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${etiqueta.rel}"]`)
      if (el === null) {
        el = document.createElement('link')
        el.setAttribute('rel', etiqueta.rel)
        document.head.appendChild(el)
      }
      el.setAttribute('href', etiqueta.href)
      return
    }

    case 'jsonld': {
      const anterior = document.getElementById(etiqueta.id)
      if (anterior !== null) anterior.remove()
      const el = document.createElement('script')
      el.id = etiqueta.id
      el.type = 'application/ld+json'
      el.textContent = etiqueta.json
      document.head.appendChild(el)
    }
  }
}

export function useSeo(datos: DatosSeo): void {
  const sumidero = useContext(ContextoSumideroSeo)
  if (sumidero !== null) sumidero.registrar(datos)

  const {
    titulo,
    descripcion,
    ruta,
    imagen,
    noIndexar = false,
    datosEstructurados = [],
  } = datos

  useEffect(() => {
    const etiquetas = etiquetasSeo({
      titulo,
      descripcion,
      ruta,
      noIndexar,
      datosEstructurados,
      ...(imagen === undefined ? {} : { imagen }),
    })

    // Paginas sin datos estructurados propios: si la anterior dejo un <script> puesto,
    // hay que sacarlo, o el negocio de la portada viaja pegado al aviso legal.
    const sobranteJsonLd = document.getElementById(ID_JSONLD)
    if (sobranteJsonLd !== null && !etiquetas.some((e) => e.tipo === 'jsonld')) {
      sobranteJsonLd.remove()
    }

    for (const etiqueta of etiquetas) aplicarEnElDocumento(etiqueta)
  }, [titulo, descripcion, ruta, imagen, noIndexar, datosEstructurados])
}
