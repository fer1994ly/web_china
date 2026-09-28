import { err, ok, type Result } from '@/shared/domain/result'
import type { DomainError } from '@/shared/domain/domain-error'
import type { Clock } from '@/shared/domain/clock'
import {
  CodigoReserva,
  reservaNoEncontrada,
  type AgendaRepository,
  type Reserva,
} from '@/slices/agenda'

/**
 * CASO DE USO: buscar el turno propio con el codigo de reserva.
 * Sin cuenta ni login: el codigo es la credencial.
 */
export function consultarTurno(
  repo: AgendaRepository,
  codigoEscrito: string,
): Result<Reserva, DomainError> {
  const codigo = CodigoReserva.crear(codigoEscrito)
  if (!codigo.ok) return err(codigo.error)

  const reserva = repo.buscarPorCodigo(codigo.value)
  if (reserva === null) return err(reservaNoEncontrada(codigo.value.valor))

  return ok(reserva)
}

/**
 * CASO DE USO: cancelar el turno propio.
 *
 * Cancelar pasa por el agregado del dia, no por la Reserva suelta: es lo que
 * garantiza que el slot vuelva a ofrecerse en la vista publica al instante.
 */
export function cancelarTurno(
  repo: AgendaRepository,
  reloj: Clock,
  codigoEscrito: string,
): Result<Reserva, DomainError> {
  const encontrada = consultarTurno(repo, codigoEscrito)
  if (!encontrada.ok) return err(encontrada.error)

  const agenda = repo.cargarDia(encontrada.value.fecha)
  const cancelada = agenda.cancelar(encontrada.value.codigo, reloj.ahora())
  if (!cancelada.ok) return err(cancelada.error)

  repo.guardar(agenda)
  return ok(cancelada.value)
}
