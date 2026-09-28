/**
 * Inventario unico de rutas del sitio.
 *
 * Lo consumen el router, el generador de sitemap.xml y el prerenderizador.
 * Tenerlo en un solo lugar evita el error clasico de agregar una pagina y que
 * quede fuera del sitemap, o peor, que una pagina privada entre en el.
 */
export interface RutaDelSitio {
  readonly ruta: string
  /** Si entra en sitemap.xml y puede ser indexada. */
  readonly publica: boolean
  /**
   * Si se genera un HTML estatico con su contenido ya renderizado.
   * Las paginas cuyo contenido depende de la fecha no se prerenderizan: el HTML
   * quedaria congelado con la agenda del dia de la compilacion.
   */
  readonly prerenderizable: boolean
  /** Prioridad relativa dentro del sitio, para sitemap.xml. */
  readonly prioridad: number
  readonly frecuencia: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export const RUTAS: readonly RutaDelSitio[] = [
  { ruta: '/', publica: true, prerenderizable: true, prioridad: 1.0, frecuencia: 'weekly' },
  { ruta: '/terapias', publica: true, prerenderizable: true, prioridad: 0.9, frecuencia: 'monthly' },
  // La agenda cambia cada dia: se sirve el esqueleto con sus metadatos y el
  // contenido lo arma el navegador.
  { ruta: '/reservar', publica: true, prerenderizable: false, prioridad: 0.9, frecuencia: 'daily' },
  {
    ruta: '/legal/aviso',
    publica: true,
    prerenderizable: true,
    prioridad: 0.3,
    frecuencia: 'yearly',
  },
  {
    ruta: '/legal/privacidad',
    publica: true,
    prerenderizable: true,
    prioridad: 0.3,
    frecuencia: 'yearly',
  },
  // Privadas: muestran datos de un turno o la agenda interna.
  { ruta: '/mi-turno', publica: false, prerenderizable: false, prioridad: 0, frecuencia: 'daily' },
  { ruta: '/admin', publica: false, prerenderizable: false, prioridad: 0, frecuencia: 'daily' },
]

export const rutasPublicas = (): readonly RutaDelSitio[] => RUTAS.filter((r) => r.publica)
export const rutasPrerenderizables = (): readonly RutaDelSitio[] =>
  RUTAS.filter((r) => r.prerenderizable)
