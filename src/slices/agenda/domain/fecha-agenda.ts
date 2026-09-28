import { err, ok, type Result } from '@/shared/domain/result'
import { errorDeDominio, type DomainError } from '@/shared/domain/domain-error'

const FORMATO_ISO = /^(\d{4})-(\d{2})-(\d{2})$/

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'] as const
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre',
] as const

/**
 * Fecha de calendario sin hora ni zona horaria.
 *
 * Deliberadamente NO envuelve un `Date`: `new Date('2026-10-05')` se interpreta en UTC
 * y en Asuncion (UTC-3/-4) devuelve el dia anterior. Guardamos anio/mes/dia como enteros
 * y usamos `Date.UTC` solo para aritmetica de calendario, donde es seguro.
 */
export class FechaAgenda {
  private constructor(
    readonly anio: number,
    readonly mes: number,
    readonly dia: number,
  ) {}

  static desdeISO(iso: string): Result<FechaAgenda, DomainError> {
    const m = FORMATO_ISO.exec(iso.trim())
    if (!m) {
      return err(errorDeDominio('FECHA_INVALIDA', 'La fecha debe tener el formato AAAA-MM-DD.'))
    }
    const anio = Number(m[1])
    const mes = Number(m[2])
    const dia = Number(m[3])
    const control = new Date(Date.UTC(anio, mes - 1, dia))
    const existe =
      control.getUTCFullYear() === anio &&
      control.getUTCMonth() === mes - 1 &&
      control.getUTCDate() === dia
    if (!existe) {
      return err(errorDeDominio('FECHA_INVALIDA', `La fecha ${iso} no existe en el calendario.`))
    }
    return ok(new FechaAgenda(anio, mes, dia))
  }

  /** Toma la fecha *local* del Date: es lo que ve el paciente en su telefono. */
  static desdeDate(d: Date): FechaAgenda {
    return new FechaAgenda(d.getFullYear(), d.getMonth() + 1, d.getDate())
  }

  get iso(): string {
    const mm = String(this.mes).padStart(2, '0')
    const dd = String(this.dia).padStart(2, '0')
    return `${this.anio}-${mm}-${dd}`
  }

  /** 0 = domingo ... 6 = sabado */
  get diaSemana(): number {
    return new Date(Date.UTC(this.anio, this.mes - 1, this.dia)).getUTCDay()
  }

  get nombreDia(): string {
    return DIAS[this.diaSemana] ?? ''
  }

  /** "lun 5 oct" — para la tira de dias en el celular. */
  get etiquetaCorta(): string {
    return `${DIAS_CORTOS[this.diaSemana] ?? ''} ${this.dia} ${MESES_CORTOS[this.mes - 1] ?? ''}`
  }

  /** "lunes 5 de octubre de 2026" — para confirmaciones y mensajes. */
  get etiquetaLarga(): string {
    return `${this.nombreDia} ${this.dia} de ${MESES[this.mes - 1] ?? ''} de ${this.anio}`
  }

  sumarDias(cantidad: number): FechaAgenda {
    const d = new Date(Date.UTC(this.anio, this.mes - 1, this.dia + cantidad))
    return new FechaAgenda(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
  }

  equals(otra: FechaAgenda): boolean {
    return this.iso === otra.iso
  }

  esAnteriorA(otra: FechaAgenda): boolean {
    return this.iso < otra.iso
  }

  esPosteriorA(otra: FechaAgenda): boolean {
    return this.iso > otra.iso
  }
}
