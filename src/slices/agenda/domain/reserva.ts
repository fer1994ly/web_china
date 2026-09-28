import type { CodigoReserva } from './codigo-reserva'
import type { DatosPaciente } from './datos-paciente'
import type { FechaAgenda } from './fecha-agenda'
import type { HoraSlot } from './hora-slot'

export type EstadoReserva = 'confirmada' | 'cancelada'

/**
 * Compromiso de un paciente sobre un slot. Al cancelar no se borra:
 * queda con estado `cancelada` para que el historial del centro sea auditable
 * y para que el paciente pueda consultar su codigo despues.
 */
export class Reserva {
  constructor(
    readonly codigo: CodigoReserva,
    readonly fecha: FechaAgenda,
    readonly hora: HoraSlot,
    readonly terapiaId: string,
    readonly paciente: DatosPaciente,
    readonly estado: EstadoReserva,
    readonly creadaEn: string,
    readonly canceladaEn: string | null = null,
  ) {}

  static confirmar(
    codigo: CodigoReserva,
    fecha: FechaAgenda,
    hora: HoraSlot,
    terapiaId: string,
    paciente: DatosPaciente,
    creadaEn: Date,
  ): Reserva {
    return new Reserva(codigo, fecha, hora, terapiaId, paciente, 'confirmada', creadaEn.toISOString())
  }

  get estaActiva(): boolean {
    return this.estado === 'confirmada'
  }

  cancelar(cuando: Date): Reserva {
    return new Reserva(
      this.codigo,
      this.fecha,
      this.hora,
      this.terapiaId,
      this.paciente,
      'cancelada',
      this.creadaEn,
      cuando.toISOString(),
    )
  }

  ocupa(fecha: FechaAgenda, hora: HoraSlot): boolean {
    return this.estaActiva && this.fecha.equals(fecha) && this.hora.equals(hora)
  }
}
