import { esOk } from '@/shared/domain/result'
import { Bloqueo } from '../domain/bloqueo'
import { CelularParaguayo } from '../domain/celular-paraguayo'
import { CodigoReserva } from '../domain/codigo-reserva'
import { DatosPaciente } from '../domain/datos-paciente'
import { FechaAgenda } from '../domain/fecha-agenda'
import { HoraSlot } from '../domain/hora-slot'
import { NombrePaciente } from '../domain/nombre-paciente'
import { Reserva, type EstadoReserva } from '../domain/reserva'

/** Forma exacta que se guarda en localStorage. Plana y estable, sin clases. */
export interface ReservaDTO {
  codigo: string
  fecha: string
  hora: string
  terapiaId: string
  nombre: string
  celular: string
  motivoConsulta: string
  estado: EstadoReserva
  creadaEn: string
  canceladaEn: string | null
}

export interface BloqueoDTO {
  id: string
  fecha: string
  hora: string
  motivo: string
  creadoEn: string
}

export interface DatosAgenda {
  reservas: ReservaDTO[]
  bloqueos: BloqueoDTO[]
}

export const aReservaDTO = (r: Reserva): ReservaDTO => ({
  codigo: r.codigo.valor,
  fecha: r.fecha.iso,
  hora: r.hora.texto,
  terapiaId: r.terapiaId,
  nombre: r.paciente.nombre.valor,
  celular: r.paciente.celular.plano,
  motivoConsulta: r.paciente.motivoConsulta,
  estado: r.estado,
  creadaEn: r.creadaEn,
  canceladaEn: r.canceladaEn,
})

/**
 * Devuelve `null` en vez de lanzar: un registro corrupto se descarta y la demo sigue.
 * Reconstruir por los value objects garantiza que nada invalido entre al dominio,
 * aunque alguien haya editado localStorage a mano.
 */
export function aReserva(dto: ReservaDTO): Reserva | null {
  const codigo = CodigoReserva.crear(dto.codigo)
  const fecha = FechaAgenda.desdeISO(dto.fecha)
  const hora = HoraSlot.desdeTexto(dto.hora)
  const nombre = NombrePaciente.crear(dto.nombre)
  const celular = CelularParaguayo.crear(dto.celular)

  if (!esOk(codigo) || !esOk(fecha) || !esOk(hora) || !esOk(nombre) || !esOk(celular)) return null
  if (dto.estado !== 'confirmada' && dto.estado !== 'cancelada') return null

  return new Reserva(
    codigo.value,
    fecha.value,
    hora.value,
    dto.terapiaId,
    new DatosPaciente(nombre.value, celular.value, dto.motivoConsulta ?? ''),
    dto.estado,
    dto.creadaEn,
    dto.canceladaEn,
  )
}

export const aBloqueoDTO = (b: Bloqueo): BloqueoDTO => ({
  id: b.id,
  fecha: b.fecha.iso,
  hora: b.hora.texto,
  motivo: b.motivo,
  creadoEn: b.creadoEn,
})

export function aBloqueo(dto: BloqueoDTO): Bloqueo | null {
  const fecha = FechaAgenda.desdeISO(dto.fecha)
  const hora = HoraSlot.desdeTexto(dto.hora)
  if (!esOk(fecha) || !esOk(hora)) return null
  return new Bloqueo(dto.id, fecha.value, hora.value, dto.motivo, dto.creadoEn)
}
