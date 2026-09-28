import { err, ok, type Result } from '@/shared/domain/result'
import { errorDeDominio, type DomainError } from '@/shared/domain/domain-error'

const FORMATO = /^(\d{1,2}):(\d{2})$/

/** Hora del dia con resolucion de minutos, dentro de las 24 horas. */
export class HoraSlot {
  private constructor(
    readonly horas: number,
    readonly minutos: number,
  ) {}

  static desdeTexto(texto: string): Result<HoraSlot, DomainError> {
    const m = FORMATO.exec(texto.trim())
    if (!m) {
      return err(errorDeDominio('HORA_INVALIDA', 'La hora debe tener el formato HH:MM.'))
    }
    const horas = Number(m[1])
    const minutos = Number(m[2])
    if (horas > 23 || minutos > 59) {
      return err(errorDeDominio('HORA_INVALIDA', `La hora ${texto} no existe.`))
    }
    return ok(new HoraSlot(horas, minutos))
  }

  static desdeMinutos(totalMinutos: number): HoraSlot {
    const normalizado = ((totalMinutos % 1440) + 1440) % 1440
    return new HoraSlot(Math.floor(normalizado / 60), normalizado % 60)
  }

  get texto(): string {
    return `${String(this.horas).padStart(2, '0')}:${String(this.minutos).padStart(2, '0')}`
  }

  get enMinutos(): number {
    return this.horas * 60 + this.minutos
  }

  masMinutos(cantidad: number): HoraSlot {
    return HoraSlot.desdeMinutos(this.enMinutos + cantidad)
  }

  equals(otra: HoraSlot): boolean {
    return this.enMinutos === otra.enMinutos
  }

  esAnteriorA(otra: HoraSlot): boolean {
    return this.enMinutos < otra.enMinutos
  }
}
