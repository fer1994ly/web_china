import type { FechaAgenda } from './fecha-agenda'
import type { HoraSlot } from './hora-slot'

/**
 * Slot que el centro retira de la venta por un motivo propio.
 * Se distingue del horario de atencion: eso es la regla semanal, esto es la excepcion puntual.
 */
export class Bloqueo {
  constructor(
    readonly id: string,
    readonly fecha: FechaAgenda,
    readonly hora: HoraSlot,
    readonly motivo: string,
    readonly creadoEn: string,
  ) {}

  static crear(fecha: FechaAgenda, hora: HoraSlot, motivo: string, cuando: Date): Bloqueo {
    const limpio = motivo.trim()
    return new Bloqueo(
      `${fecha.iso}T${hora.texto}`,
      fecha,
      hora,
      limpio.length > 0 ? limpio : 'No disponible',
      cuando.toISOString(),
    )
  }

  cubre(fecha: FechaAgenda, hora: HoraSlot): boolean {
    return this.fecha.equals(fecha) && this.hora.equals(hora)
  }
}
