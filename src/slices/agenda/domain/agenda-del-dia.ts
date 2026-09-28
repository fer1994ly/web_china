import { err, ok, type Result } from '@/shared/domain/result'
import type { DomainError } from '@/shared/domain/domain-error'
import { Bloqueo } from './bloqueo'
import { CodigoReserva } from './codigo-reserva'
import type { DatosPaciente } from './datos-paciente'
import type { FechaAgenda } from './fecha-agenda'
import { HoraSlot } from './hora-slot'
import type { HorarioAtencion } from './horario-atencion'
import { Reserva } from './reserva'
import {
  bloqueoNoEncontrado,
  diaCerrado,
  fueraDeHorario,
  reservaNoEncontrada,
  reservaYaCancelada,
  slotBloqueado,
  slotEnElPasado,
  slotYaBloqueado,
  slotYaReservado,
} from './agenda.errors'

export type EstadoSlot = 'disponible' | 'reservado' | 'bloqueado' | 'pasado'

export interface SlotConEstado {
  readonly hora: HoraSlot
  readonly estado: EstadoSlot
  /** Motivo del bloqueo, si lo hay. Vacio en los demas estados. */
  readonly motivo: string
}

export interface SolicitudDeReserva {
  readonly hora: HoraSlot
  readonly terapiaId: string
  readonly paciente: DatosPaciente
}

/**
 * AGGREGATE ROOT. Identidad = la fecha.
 *
 * Por que el dia entero y no cada Reserva: la invariante central del negocio es
 * "un slot, una sola reserva confirmada". Esa regla cruza varias reservas a la vez,
 * asi que solo se puede garantizar si el limite de consistencia abarca el dia completo.
 * Con un agregado `Reserva` suelto, la deteccion de colisiones se escaparia a la UI,
 * que es exactamente el bug que persigue el criterio CA-02.
 */
export class AgendaDelDia {
  private constructor(
    readonly fecha: FechaAgenda,
    private readonly horario: HorarioAtencion,
    private readonly reservas: Reserva[],
    private readonly bloqueos: Bloqueo[],
  ) {}

  static crear(
    fecha: FechaAgenda,
    horario: HorarioAtencion,
    reservas: readonly Reserva[] = [],
    bloqueos: readonly Bloqueo[] = [],
  ): AgendaDelDia {
    return new AgendaDelDia(
      fecha,
      horario,
      reservas.filter((r) => r.fecha.equals(fecha)),
      bloqueos.filter((b) => b.fecha.equals(fecha)),
    )
  }

  // --- Consultas -----------------------------------------------------------

  get atiende(): boolean {
    return this.horario.atiende(this.fecha)
  }

  /** Todos los slots del dia con su estado derivado. Nunca se persiste el estado. */
  slots(ahora: Date): SlotConEstado[] {
    return this.horario.slotsDe(this.fecha).map((hora) => {
      const bloqueo = this.bloqueos.find((b) => b.cubre(this.fecha, hora))
      if (bloqueo) return { hora, estado: 'bloqueado' as const, motivo: bloqueo.motivo }
      if (this.reservas.some((r) => r.ocupa(this.fecha, hora))) {
        return { hora, estado: 'reservado' as const, motivo: '' }
      }
      if (this.esPasado(hora, ahora)) return { hora, estado: 'pasado' as const, motivo: '' }
      return { hora, estado: 'disponible' as const, motivo: '' }
    })
  }

  slotsDisponibles(ahora: Date): HoraSlot[] {
    return this.slots(ahora)
      .filter((s) => s.estado === 'disponible')
      .map((s) => s.hora)
  }

  get reservasActivas(): readonly Reserva[] {
    return this.reservas.filter((r) => r.estaActiva)
  }

  get todasLasReservas(): readonly Reserva[] {
    return [...this.reservas]
  }

  get todosLosBloqueos(): readonly Bloqueo[] {
    return [...this.bloqueos]
  }

  // --- Comandos ------------------------------------------------------------

  /**
   * Unica puerta de entrada para ocupar un slot. El orden de las guardas va de la
   * regla mas estructural (el centro ni siquiera abre) a la mas circunstancial
   * (alguien se adelanto), para que el mensaje al paciente sea el mas util.
   */
  reservar(
    solicitud: SolicitudDeReserva,
    ahora: Date,
    generarCodigo: () => CodigoReserva = () => CodigoReserva.generar(),
  ): Result<Reserva, DomainError> {
    const { hora } = solicitud

    if (!this.atiende) return err(diaCerrado(this.fecha))
    if (!this.horario.contiene(this.fecha, hora)) return err(fueraDeHorario(hora))
    if (this.bloqueos.some((b) => b.cubre(this.fecha, hora))) return err(slotBloqueado(hora))
    if (this.reservas.some((r) => r.ocupa(this.fecha, hora))) return err(slotYaReservado(hora))
    if (this.esPasado(hora, ahora)) return err(slotEnElPasado(hora))

    const reserva = Reserva.confirmar(
      generarCodigo(),
      this.fecha,
      hora,
      solicitud.terapiaId,
      solicitud.paciente,
      ahora,
    )
    this.reservas.push(reserva)
    return ok(reserva)
  }

  cancelar(codigo: CodigoReserva, ahora: Date): Result<Reserva, DomainError> {
    const indice = this.reservas.findIndex((r) => r.codigo.equals(codigo))
    if (indice === -1) return err(reservaNoEncontrada(codigo.valor))

    const actual = this.reservas[indice]
    if (!actual) return err(reservaNoEncontrada(codigo.valor))
    if (!actual.estaActiva) return err(reservaYaCancelada(codigo.valor))

    const cancelada = actual.cancelar(ahora)
    this.reservas[indice] = cancelada
    return ok(cancelada)
  }

  /** Un slot con turno confirmado no se puede bloquear: primero hay que cancelar el turno. */
  bloquear(hora: HoraSlot, motivo: string, ahora: Date): Result<Bloqueo, DomainError> {
    if (!this.atiende) return err(diaCerrado(this.fecha))
    if (!this.horario.contiene(this.fecha, hora)) return err(fueraDeHorario(hora))
    if (this.bloqueos.some((b) => b.cubre(this.fecha, hora))) return err(slotYaBloqueado(hora))
    if (this.reservas.some((r) => r.ocupa(this.fecha, hora))) return err(slotYaReservado(hora))

    const bloqueo = Bloqueo.crear(this.fecha, hora, motivo, ahora)
    this.bloqueos.push(bloqueo)
    return ok(bloqueo)
  }

  desbloquear(hora: HoraSlot): Result<Bloqueo, DomainError> {
    const indice = this.bloqueos.findIndex((b) => b.cubre(this.fecha, hora))
    if (indice === -1) return err(bloqueoNoEncontrado(hora))
    const [quitado] = this.bloqueos.splice(indice, 1)
    if (!quitado) return err(bloqueoNoEncontrado(hora))
    return ok(quitado)
  }

  // --- Internos ------------------------------------------------------------

  private esPasado(hora: HoraSlot, ahora: Date): boolean {
    const hoyIso = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(
      ahora.getDate(),
    ).padStart(2, '0')}`
    if (this.fecha.iso < hoyIso) return true
    if (this.fecha.iso > hoyIso) return false
    return hora.enMinutos <= ahora.getHours() * 60 + ahora.getMinutes()
  }
}

export { HoraSlot, Reserva, Bloqueo, CodigoReserva }
