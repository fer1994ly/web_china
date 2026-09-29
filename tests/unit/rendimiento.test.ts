import { describe, expect, it } from 'vitest'
import {
  calificar,
  CORE_WEB_VITALS,
  formatear,
  medir,
  UMBRALES,
  type NombreMetrica,
} from '@/shared/rendimiento/umbrales'

/**
 * Los umbrales son los de Google y no una preferencia del equipo: si alguien los
 * relaja para que el tablero se ponga verde, la medicion deja de significar algo.
 * Estos tests los fijan con los numeros publicados.
 */

const NOMBRES = Object.keys(UMBRALES) as NombreMetrica[]

describe('Umbrales de Core Web Vitals', () => {
  it('las tres métricas que Google cuenta como Core Web Vitals están definidas', () => {
    expect(CORE_WEB_VITALS).toEqual(['LCP', 'CLS', 'INP'])
    for (const nombre of CORE_WEB_VITALS) expect(UMBRALES[nombre]).toBeDefined()
  })

  // Los cortes oficiales, tal como los publica web.dev. Cambiar cualquiera de estos
  // numeros es falsear la medicion.
  it.each([
    ['LCP', 2500, 4000],
    ['CLS', 0.1, 0.25],
    ['INP', 200, 500],
    ['FCP', 1800, 3000],
    ['TTFB', 800, 1800],
  ] as const)('%s: buena hasta %d, mala pasando %d', (nombre, buena, mejorable) => {
    expect(UMBRALES[nombre].buena).toBe(buena)
    expect(UMBRALES[nombre].mejorable).toBe(mejorable)
  })

  it.each(NOMBRES)('el corte de "buena" de %s es menor que el de "mejorable"', (nombre) => {
    expect(UMBRALES[nombre].buena).toBeLessThan(UMBRALES[nombre].mejorable)
  })

  it('solo CLS es una proporción; el resto se mide en milisegundos', () => {
    expect(UMBRALES.CLS.unidad).toBe('proporcion')
    for (const nombre of NOMBRES.filter((n) => n !== 'CLS')) {
      expect(UMBRALES[nombre].unidad, nombre).toBe('ms')
    }
  })
})

describe('Clasificación de una medición', () => {
  it.each(NOMBRES)('%s en el límite exacto todavía es buena', (nombre) => {
    // El limite es inclusivo: un LCP de exactamente 2500 ms es bueno, no mejorable.
    expect(calificar(nombre, UMBRALES[nombre].buena)).toBe('buena')
    expect(calificar(nombre, UMBRALES[nombre].mejorable)).toBe('mejorable')
  })

  it.each(NOMBRES)('%s apenas pasado el límite deja de ser buena', (nombre) => {
    const apenasMas = UMBRALES[nombre].buena + (nombre === 'CLS' ? 0.001 : 1)
    expect(calificar(nombre, apenasMas)).toBe('mejorable')
  })

  it.each(NOMBRES)('%s muy por encima es mala', (nombre) => {
    expect(calificar(nombre, UMBRALES[nombre].mejorable * 2)).toBe('mala')
  })

  it('una página instantánea califica bien en todo', () => {
    for (const nombre of NOMBRES) expect(calificar(nombre, 0)).toBe('buena')
  })

  it('medir devuelve el valor junto con su calificación', () => {
    expect(medir('LCP', 1200)).toEqual({ nombre: 'LCP', valor: 1200, calificacion: 'buena' })
    expect(medir('CLS', 0.4)).toEqual({ nombre: 'CLS', valor: 0.4, calificacion: 'mala' })
  })
})

describe('Presentación de los valores', () => {
  it('los tiempos se redondean a milisegundos enteros', () => {
    expect(formatear('LCP', 1234.56)).toBe('1235 ms')
    expect(formatear('INP', 48)).toBe('48 ms')
  })

  it('el CLS se muestra con tres decimales, porque los saltos chicos importan', () => {
    expect(formatear('CLS', 0.0512)).toBe('0.051')
    expect(formatear('CLS', 0)).toBe('0.000')
  })
})
