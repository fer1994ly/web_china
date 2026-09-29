/**
 * Los umbrales de Core Web Vitals, tal como los publica Google.
 *
 * Son las tres metricas con las que Google mide la experiencia real de una pagina
 * —y que usa como senal de ranking—, mas dos de apoyo que sirven para entender POR QUE
 * una de las tres se fue de rango:
 *
 *  LCP  Largest Contentful Paint. Cuanto tarda en dibujarse el elemento mas grande
 *       de la primera pantalla. Es la respuesta a "¿ya cargó?".
 *  CLS  Cumulative Layout Shift. Cuanto se mueve el contenido solo. Es lo que hace
 *       que toques el boton equivocado porque salto justo antes.
 *  INP  Interaction to Next Paint. Cuanto tarda la pagina en responder a un toque.
 *  FCP  First Contentful Paint y TTFB (tiempo hasta el primer byte): no son Core Web
 *       Vitals, pero un LCP malo casi siempre se explica con uno de los dos.
 *
 * Este archivo es TypeScript puro y sin navegador a proposito: la clasificacion se
 * testea en Node, y la parte que mide —que si necesita navegador— queda en
 * `metricas-web.ts` sin ninguna regla adentro.
 */

export type NombreMetrica = 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB'

export type Calificacion = 'buena' | 'mejorable' | 'mala'

export interface Umbral {
  /** Hasta aca la metrica es "buena". */
  readonly buena: number
  /** Pasado esto es "mala"; en el medio, "mejorable". */
  readonly mejorable: number
  /** Milisegundos para todas menos CLS, que es una proporcion sin unidad. */
  readonly unidad: 'ms' | 'proporcion'
}

/** Los cortes oficiales. Cambiarlos a mano es falsear la medicion, no mejorarla. */
export const UMBRALES: Readonly<Record<NombreMetrica, Umbral>> = {
  LCP: { buena: 2500, mejorable: 4000, unidad: 'ms' },
  CLS: { buena: 0.1, mejorable: 0.25, unidad: 'proporcion' },
  INP: { buena: 200, mejorable: 500, unidad: 'ms' },
  FCP: { buena: 1800, mejorable: 3000, unidad: 'ms' },
  TTFB: { buena: 800, mejorable: 1800, unidad: 'ms' },
} as const

/** Las tres que Google cuenta como Core Web Vitals. Las otras dos son diagnostico. */
export const CORE_WEB_VITALS: readonly NombreMetrica[] = ['LCP', 'CLS', 'INP']

export function calificar(nombre: NombreMetrica, valor: number): Calificacion {
  const umbral = UMBRALES[nombre]
  if (valor <= umbral.buena) return 'buena'
  if (valor <= umbral.mejorable) return 'mejorable'
  return 'mala'
}

export function formatear(nombre: NombreMetrica, valor: number): string {
  return UMBRALES[nombre].unidad === 'ms'
    ? `${Math.round(valor)} ms`
    : valor.toFixed(3)
}

export interface Metrica {
  readonly nombre: NombreMetrica
  readonly valor: number
  readonly calificacion: Calificacion
}

export function medir(nombre: NombreMetrica, valor: number): Metrica {
  return { nombre, valor, calificacion: calificar(nombre, valor) }
}
