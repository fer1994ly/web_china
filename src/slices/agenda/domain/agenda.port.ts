import type { AgendaDelDia } from './agenda-del-dia'
import type { CodigoReserva } from './codigo-reserva'
import type { FechaAgenda } from './fecha-agenda'
import type { Reserva } from './reserva'
import type { Bloqueo } from './bloqueo'

/**
 * PORT. El dominio declara que necesita, no como se guarda.
 * Hoy lo implementa localStorage; manana Kodarvia lo implementa contra su API
 * sin tocar una sola linea de `domain/`.
 *
 * La unidad de carga y guardado es el agregado completo de un dia: guardar medio
 * agregado dejaria la invariante "un slot, una sola reserva" sin defensa.
 */
export interface AgendaRepository {
  /** Reconstruye el agregado del dia con sus reservas y bloqueos ya aplicados. */
  cargarDia(fecha: FechaAgenda): AgendaDelDia

  /** Reemplaza todo lo persistido de esa fecha por el estado del agregado. */
  guardar(agenda: AgendaDelDia): void

  buscarPorCodigo(codigo: CodigoReserva): Reserva | null

  /** Para el panel: todo lo agendado en un rango, ordenado por fecha y hora. */
  reservasEntre(desde: FechaAgenda, hasta: FechaAgenda): readonly Reserva[]

  bloqueosEntre(desde: FechaAgenda, hasta: FechaAgenda): readonly Bloqueo[]

  /** Devuelve la demo a los datos de ejemplo originales. */
  reiniciarDemo(): void
}
