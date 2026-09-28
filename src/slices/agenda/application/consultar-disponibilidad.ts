import type { AgendaRepository } from '../domain/agenda.port'
import type { SlotConEstado } from '../domain/agenda-del-dia'
import { FechaAgenda } from '../domain/fecha-agenda'
import { HorarioAtencion } from '../domain/horario-atencion'

export interface DiaDeAgenda {
  readonly fecha: FechaAgenda
  readonly etiqueta: string
  readonly cantidadLibre: number
  readonly hayLugar: boolean
}

/**
 * Read model para la tira de dias del celular. Devuelve los proximos dias en que
 * el centro atiende, ya con la cuenta de lugares libres, para que la UI no tenga
 * que recorrer la agenda por su cuenta.
 */
export function diasDeAgenda(
  repo: AgendaRepository,
  ahora: Date,
  cantidad = 14,
  horario: HorarioAtencion = HorarioAtencion.delCentro(),
): DiaDeAgenda[] {
  const dias: DiaDeAgenda[] = []
  let cursor = FechaAgenda.desdeDate(ahora)

  for (let i = 0; i < 90 && dias.length < cantidad; i += 1) {
    if (horario.atiende(cursor)) {
      const libres = repo.cargarDia(cursor).slotsDisponibles(ahora).length
      dias.push({
        fecha: cursor,
        etiqueta: cursor.etiquetaCorta,
        cantidadLibre: libres,
        hayLugar: libres > 0,
      })
    }
    cursor = cursor.sumarDias(1)
  }
  return dias
}

export function slotsDelDia(repo: AgendaRepository, fecha: FechaAgenda, ahora: Date): SlotConEstado[] {
  return repo.cargarDia(fecha).slots(ahora)
}

/** El primer dia con lugar, para preseleccionar algo util al abrir la pantalla. */
export function primerDiaConLugar(dias: readonly DiaDeAgenda[]): FechaAgenda | null {
  return dias.find((d) => d.hayLugar)?.fecha ?? dias[0]?.fecha ?? null
}
