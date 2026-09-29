/**
 * Medicion de Core Web Vitals con las APIs nativas del navegador.
 *
 * POR QUE A MANO Y NO CON LA LIBRERIA `web-vitals`: la app no tiene backend ni
 * analitica a donde mandar las mediciones, asi que de esa libreria se usaria una
 * fraccion minima. Las tres metricas salen de `PerformanceObserver`, que es de donde
 * las saca ella tambien. Cero dependencias nuevas, cero JavaScript de terceros y
 * nada que la Content-Security-Policy tenga que permitir.
 *
 * PARA QUE SIRVE SI NO SE ENVIA A NINGUNA PARTE: para que una regresion se note.
 * Los valores quedan en `window.__METRICAS_WEB__`, y el escenario de rendimiento de
 * `specs/features/rendimiento.feature` los lee y falla si el LCP o el CLS se van de
 * los umbrales de Google. Una imagen sin dimensiones o una fuente que llega tarde
 * dejan de ser algo que se descubre en PageSpeed tres semanas despues.
 *
 * Cuando el centro tenga analitica, `alMedir` es el punto donde se engancha el envio.
 */
import { medir, type Metrica, type NombreMetrica } from './umbrales'

declare global {
  interface Window {
    /** Lo que se haya medido hasta el momento. Lo consume la suite de rendimiento. */
    __METRICAS_WEB__?: Partial<Record<NombreMetrica, Metrica>>
  }
}

/** Entradas de `PerformanceObserver` que TypeScript todavia no tipa. */
interface EntradaDesplazamiento extends PerformanceEntry {
  readonly value: number
  /** Un desplazamiento provocado por un toque del usuario no cuenta como CLS. */
  readonly hadRecentInput: boolean
}

interface EntradaEvento extends PerformanceEntry {
  readonly interactionId?: number
}

type AlMedir = (metrica: Metrica) => void

function observar(tipo: string, opciones: PerformanceObserverInit, alRecibir: (entradas: PerformanceEntryList) => void): void {
  try {
    const observador = new PerformanceObserver((lista) => alRecibir(lista.getEntries()))
    observador.observe({ type: tipo, ...opciones })
  } catch {
    // El tipo de entrada no existe en este navegador. Medir es opcional: que falte
    // una metrica no puede romper la pagina.
  }
}

/**
 * CLS con ventanas de sesion, que es la definicion que usa Google.
 *
 * No es la suma de todos los desplazamientos: se agrupan los que ocurren a menos de
 * un segundo uno de otro (y como maximo cinco segundos de ventana) y se reporta la
 * PEOR ventana. Sumarlo todo castigaria de mas a una pagina larga donde cada seccion
 * se acomoda una vez.
 */
function observarCls(alMedir: AlMedir): void {
  let peorVentana = 0
  let ventana = 0
  let primera = 0
  let ultima = 0

  observar('layout-shift', { buffered: true }, (entradas) => {
    for (const entrada of entradas as EntradaDesplazamiento[]) {
      if (entrada.hadRecentInput) continue

      const nuevaVentana =
        ventana !== 0 && (entrada.startTime - ultima > 1000 || entrada.startTime - primera > 5000)

      if (nuevaVentana) {
        ventana = 0
        primera = entrada.startTime
      }
      if (ventana === 0) primera = entrada.startTime

      ventana += entrada.value
      ultima = entrada.startTime

      if (ventana > peorVentana) {
        peorVentana = ventana
        alMedir(medir('CLS', peorVentana))
      }
    }
  })
}

/**
 * INP aproximado por la interaccion mas lenta.
 *
 * Google define INP como el percentil 98 de las interacciones de la visita, lo que
 * con pocas interacciones es directamente la peor. Reportar la peor es entonces
 * exacto en una visita corta y PESIMISTA en una larga, que es el lado correcto para
 * equivocarse cuando lo que se quiere es detectar una regresion.
 */
function observarInp(alMedir: AlMedir): void {
  let peor = 0

  observar('event', { buffered: true, durationThreshold: 40 } as PerformanceObserverInit, (entradas) => {
    for (const entrada of entradas as EntradaEvento[]) {
      // Sin `interactionId` la entrada no viene de una interaccion real del usuario.
      if (entrada.interactionId === undefined || entrada.interactionId === 0) continue
      if (entrada.duration <= peor) continue
      peor = entrada.duration
      alMedir(medir('INP', peor))
    }
  })
}

function observarLcp(alMedir: AlMedir): void {
  // El LCP puede cambiar varias veces mientras carga la pagina: vale la ULTIMA
  // entrada antes de que el visitante interactue, no la primera.
  observar('largest-contentful-paint', { buffered: true }, (entradas) => {
    const ultima = entradas.at(-1)
    if (ultima !== undefined) alMedir(medir('LCP', ultima.startTime))
  })
}

function observarFcp(alMedir: AlMedir): void {
  observar('paint', { buffered: true }, (entradas) => {
    for (const entrada of entradas) {
      if (entrada.name === 'first-contentful-paint') alMedir(medir('FCP', entrada.startTime))
    }
  })
}

function observarTtfb(alMedir: AlMedir): void {
  observar('navigation', { buffered: true }, (entradas) => {
    for (const entrada of entradas as PerformanceNavigationTiming[]) {
      alMedir(medir('TTFB', entrada.responseStart))
    }
  })
}

/**
 * Arranca la medicion. Se llama una vez, al montar la app.
 *
 * `alMedir` recibe cada metrica cada vez que mejora su valor conocido; por defecto
 * solo las guarda. Devuelve el objeto acumulador, que es el mismo que queda en
 * `window.__METRICAS_WEB__`.
 */
export function observarMetricasWeb(
  alMedir?: AlMedir,
): Partial<Record<NombreMetrica, Metrica>> {
  const acumulado: Partial<Record<NombreMetrica, Metrica>> = {}

  if (typeof PerformanceObserver === 'undefined') return acumulado

  const registrar: AlMedir = (metrica) => {
    acumulado[metrica.nombre] = metrica
    alMedir?.(metrica)
  }

  observarLcp(registrar)
  observarCls(registrar)
  observarInp(registrar)
  observarFcp(registrar)
  observarTtfb(registrar)

  window.__METRICAS_WEB__ = acumulado
  return acumulado
}
