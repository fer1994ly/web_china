import { desempaquetar } from '@/shared/domain/result'
import { HoraSlot } from './hora-slot'
import type { FechaAgenda } from './fecha-agenda'

export interface Tramo {
  readonly desde: HoraSlot
  readonly hasta: HoraSlot
}

/** La grilla del centro es uniforme: ver `specs/ubiquitous-language.md`. */
export const DURACION_SLOT_MINUTOS = 60

const tramo = (desde: string, hasta: string): Tramo => ({
  desde: desempaquetar(HoraSlot.desdeTexto(desde)),
  hasta: desempaquetar(HoraSlot.desdeTexto(hasta)),
})

/**
 * Politica que define que slots existen cada dia. Es lo unico que sabe de
 * feriados de calendario semanal; los cierres puntuales son Bloqueos.
 */
export class HorarioAtencion {
  /** Indice 0 = domingo ... 6 = sabado. */
  private constructor(private readonly porDia: ReadonlyArray<ReadonlyArray<Tramo>>) {}

  /** Horario real del centro: mañana y tarde de lunes a viernes, solo mañana el sábado. */
  static delCentro(): HorarioAtencion {
    const semana = [tramo('08:00', '12:00'), tramo('14:00', '19:00')]
    const sabado = [tramo('08:00', '12:00')]
    return new HorarioAtencion([[], semana, semana, semana, semana, semana, sabado])
  }

  tramosDe(fecha: FechaAgenda): ReadonlyArray<Tramo> {
    return this.porDia[fecha.diaSemana] ?? []
  }

  atiende(fecha: FechaAgenda): boolean {
    return this.tramosDe(fecha).length > 0
  }

  /** Todos los slots teoricos del dia, sin mirar reservas ni bloqueos. */
  slotsDe(fecha: FechaAgenda): HoraSlot[] {
    const slots: HoraSlot[] = []
    for (const t of this.tramosDe(fecha)) {
      for (
        let m = t.desde.enMinutos;
        m + DURACION_SLOT_MINUTOS <= t.hasta.enMinutos;
        m += DURACION_SLOT_MINUTOS
      ) {
        slots.push(HoraSlot.desdeMinutos(m))
      }
    }
    return slots
  }

  contiene(fecha: FechaAgenda, hora: HoraSlot): boolean {
    return this.slotsDe(fecha).some((s) => s.equals(hora))
  }

  /** "Lunes a viernes de 08:00 a 12:00 y de 14:00 a 19:00" — para la landing. */
  descripcionSemanal(): ReadonlyArray<{ dias: string; horas: string }> {
    return [
      { dias: 'Lunes a viernes', horas: '08:00 a 12:00 y 14:00 a 19:00' },
      { dias: 'Sábados', horas: '08:00 a 12:00' },
      { dias: 'Domingos', horas: 'Cerrado' },
    ]
  }
}
