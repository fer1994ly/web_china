import { err, ok, type Result } from '@/shared/domain/result'
import type { DomainError } from '@/shared/domain/domain-error'
import type { Clock } from '@/shared/domain/clock'
import {
  HoraSlot,
  type AgendaRepository,
  type Bloqueo,
  type FechaAgenda,
  type Reserva,
} from '@/slices/agenda'

/**
 * CASO DE USO: bloquear un horario desde el panel.
 * Persistir por el agregado es lo que hace que CA-05 se cumpla en la vista publica
 * sin ningun codigo de sincronizacion entre pantallas.
 */
export function bloquearHorario(
  repo: AgendaRepository,
  reloj: Clock,
  fecha: FechaAgenda,
  horaTexto: string,
  motivo: string,
): Result<Bloqueo, DomainError> {
  const hora = HoraSlot.desdeTexto(horaTexto)
  if (!hora.ok) return err(hora.error)

  const agenda = repo.cargarDia(fecha)
  const bloqueo = agenda.bloquear(hora.value, motivo, reloj.ahora())
  if (!bloqueo.ok) return err(bloqueo.error)

  repo.guardar(agenda)
  return ok(bloqueo.value)
}

/** CASO DE USO: liberar un horario bloqueado. */
export function liberarHorario(
  repo: AgendaRepository,
  fecha: FechaAgenda,
  horaTexto: string,
): Result<Bloqueo, DomainError> {
  const hora = HoraSlot.desdeTexto(horaTexto)
  if (!hora.ok) return err(hora.error)

  const agenda = repo.cargarDia(fecha)
  const liberado = agenda.desbloquear(hora.value)
  if (!liberado.ok) return err(liberado.error)

  repo.guardar(agenda)
  return ok(liberado.value)
}

/** CASO DE USO: cancelar un turno desde recepción, cuando el paciente avisa por teléfono. */
export function cancelarDesdeElPanel(
  repo: AgendaRepository,
  reloj: Clock,
  reserva: Reserva,
): Result<Reserva, DomainError> {
  const agenda = repo.cargarDia(reserva.fecha)
  const cancelada = agenda.cancelar(reserva.codigo, reloj.ahora())
  if (!cancelada.ok) return err(cancelada.error)

  repo.guardar(agenda)
  return ok(cancelada.value)
}

/** CASO DE USO: volver a los datos de ejemplo. */
export function reiniciarDatosDemo(repo: AgendaRepository): void {
  repo.reiniciarDemo()
}

export interface ResumenDelDia {
  readonly confirmados: number
  readonly cancelados: number
  readonly bloqueados: number
  readonly libres: number
  readonly ingresosEstimadosGs: number
}

export function resumenDelDia(
  repo: AgendaRepository,
  fecha: FechaAgenda,
  ahora: Date,
  precioDe: (terapiaId: string) => number,
): ResumenDelDia {
  const agenda = repo.cargarDia(fecha)
  const slots = agenda.slots(ahora)
  const confirmadas = agenda.reservasActivas

  return {
    confirmados: confirmadas.length,
    cancelados: agenda.todasLasReservas.filter((r) => !r.estaActiva).length,
    bloqueados: slots.filter((s) => s.estado === 'bloqueado').length,
    libres: slots.filter((s) => s.estado === 'disponible').length,
    ingresosEstimadosGs: confirmadas.reduce((total, r) => total + precioDe(r.terapiaId), 0),
  }
}
