import { AlmacenamientoLocal } from '@/shared/infra/almacenamiento-local'
import { construirSemilla } from '@/seed/seed.asuncion'
import { AgendaDelDia } from '../domain/agenda-del-dia'
import type { AgendaRepository } from '../domain/agenda.port'
import type { Bloqueo } from '../domain/bloqueo'
import type { CodigoReserva } from '../domain/codigo-reserva'
import type { FechaAgenda } from '../domain/fecha-agenda'
import { HorarioAtencion } from '../domain/horario-atencion'
import type { Reserva } from '../domain/reserva'
import {
  aBloqueo,
  aBloqueoDTO,
  aReserva,
  aReservaDTO,
  type DatosAgenda,
} from './agenda.dto'

export const CLAVE_ALMACEN = 'centro-qi:agenda'
export const VERSION_ESQUEMA = 1

/**
 * Adapter de localStorage para el port `AgendaRepository`.
 *
 * Es el unico archivo de todo el slice que sabe que existe localStorage.
 * Cuando Kodarvia migre a su API, se reemplaza este archivo y nada mas.
 */
export class AgendaLocalStorageRepo implements AgendaRepository {
  private readonly almacen: AlmacenamientoLocal<DatosAgenda>

  constructor(
    private readonly horario: HorarioAtencion = HorarioAtencion.delCentro(),
    private readonly ahora: () => Date = () => new Date(),
  ) {
    this.almacen = new AlmacenamientoLocal<DatosAgenda>(CLAVE_ALMACEN, VERSION_ESQUEMA, () =>
      construirSemilla(this.ahora()),
    )
  }

  cargarDia(fecha: FechaAgenda): AgendaDelDia {
    const { reservas, bloqueos } = this.leerDominio()
    return AgendaDelDia.crear(fecha, this.horario, reservas, bloqueos)
  }

  guardar(agenda: AgendaDelDia): void {
    const datos = this.almacen.leer()
    const iso = agenda.fecha.iso

    // Reemplazo total de la fecha: el agregado es la unidad de consistencia,
    // asi que su estado pisa por completo lo que hubiera guardado de ese dia.
    this.almacen.escribir({
      reservas: [
        ...datos.reservas.filter((r) => r.fecha !== iso),
        ...agenda.todasLasReservas.map(aReservaDTO),
      ],
      bloqueos: [
        ...datos.bloqueos.filter((b) => b.fecha !== iso),
        ...agenda.todosLosBloqueos.map(aBloqueoDTO),
      ],
    })
  }

  buscarPorCodigo(codigo: CodigoReserva): Reserva | null {
    return this.leerDominio().reservas.find((r) => r.codigo.equals(codigo)) ?? null
  }

  reservasEntre(desde: FechaAgenda, hasta: FechaAgenda): readonly Reserva[] {
    return this.leerDominio()
      .reservas.filter((r) => r.fecha.iso >= desde.iso && r.fecha.iso <= hasta.iso)
      .sort(ordenCronologico)
  }

  bloqueosEntre(desde: FechaAgenda, hasta: FechaAgenda): readonly Bloqueo[] {
    return this.leerDominio()
      .bloqueos.filter((b) => b.fecha.iso >= desde.iso && b.fecha.iso <= hasta.iso)
      .sort(ordenCronologico)
  }

  reiniciarDemo(): void {
    this.almacen.reiniciar()
  }

  /** Lee y reconstruye el dominio, descartando registros corruptos en silencio. */
  private leerDominio(): { reservas: Reserva[]; bloqueos: Bloqueo[] } {
    const datos = this.almacen.leer()
    return {
      reservas: datos.reservas.map(aReserva).filter((r): r is Reserva => r !== null),
      bloqueos: datos.bloqueos.map(aBloqueo).filter((b): b is Bloqueo => b !== null),
    }
  }
}

interface Cronologico {
  readonly fecha: { readonly iso: string }
  readonly hora: { readonly enMinutos: number }
}

const ordenCronologico = (a: Cronologico, b: Cronologico): number =>
  a.fecha.iso === b.fecha.iso
    ? a.hora.enMinutos - b.hora.enMinutos
    : a.fecha.iso.localeCompare(b.fecha.iso)
