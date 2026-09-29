/**
 * Terapia del catalogo. Es dato de referencia del centro: no cambia durante
 * una sesion del paciente, por eso se modela como valor inmutable y no como entidad viva.
 */
export interface Terapia {
  readonly id: string
  readonly nombre: string
  /** Una linea, para la tarjeta del listado. */
  readonly resumen: string
  /** Parrafo para la ficha ampliada. */
  readonly descripcion: string
  readonly beneficios: readonly string[]
  /** Informativa: la agenda usa una grilla uniforme de 60 minutos. */
  readonly duracionMinutos: number
  readonly precioGs: number
  readonly imagen: string
  /** Texto alternativo real, no decorativo. */
  readonly imagenAlt: string
  /**
   * Dimensiones reales del archivo, en pixeles.
   *
   * Van al `width`/`height` del <img> para que el navegador RESERVE el espacio antes
   * de que la imagen llegue. Sin ellas la foto aparece de golpe y empuja el texto que
   * tiene debajo: es la causa mas comun de Cumulative Layout Shift, la metrica de
   * Core Web Vitals que mide justamente cuanto se mueve solo el contenido.
   *
   * El CSS sigue decidiendo el tamano en pantalla; estos numeros solo le dan la
   * proporcion. Por eso son dato de la terapia y no de la hoja de estilos.
   */
  readonly imagenAncho: number
  readonly imagenAlto: number
}

/** "Gs. 180.000" — separador de miles con punto, como se escribe en Paraguay. */
export function precioEnGuaranies(monto: number): string {
  return `Gs. ${monto.toLocaleString('es-PY').replace(/,/g, '.')}`
}

export function duracionLegible(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}
