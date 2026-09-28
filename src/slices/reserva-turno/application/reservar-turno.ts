import { err, ok, type Result } from '@/shared/domain/result'
import type { DomainError } from '@/shared/domain/domain-error'
import type { Clock } from '@/shared/domain/clock'
import type { AgendaRepository, Reserva } from '@/slices/agenda'
import {
  validarFormulario,
  type EntradaFormulario,
  type ErroresFormulario,
} from '../domain/formulario-reserva'

/**
 * Dos fallos distintos que la UI tiene que mostrar en lugares distintos:
 * los de formulario van debajo de cada campo, el de agenda va arriba de todo
 * porque significa "alguien se te adelanto, elegi otro horario".
 */
export type FalloReserva =
  | { readonly tipo: 'formulario'; readonly errores: ErroresFormulario }
  | { readonly tipo: 'agenda'; readonly error: DomainError }

/**
 * CASO DE USO: reservar un turno.
 *
 * Valida, carga el agregado del dia, le pide que reserve y persiste.
 * La decision de si el slot esta libre la toma el agregado, nunca este archivo:
 * es lo que garantiza que CA-02 se cumpla aunque la UI muestre datos viejos.
 */
export function reservarTurno(
  repo: AgendaRepository,
  reloj: Clock,
  entrada: EntradaFormulario,
  terapiasValidas: readonly string[],
): Result<Reserva, FalloReserva> {
  const validada = validarFormulario(entrada, terapiasValidas)
  if (!validada.ok) return err({ tipo: 'formulario', errores: validada.error })

  const { fecha, hora, terapiaId, paciente } = validada.value
  const agenda = repo.cargarDia(fecha)

  const resultado = agenda.reservar({ hora, terapiaId, paciente }, reloj.ahora())
  if (!resultado.ok) return err({ tipo: 'agenda', error: resultado.error })

  repo.guardar(agenda)
  return ok(resultado.value)
}
