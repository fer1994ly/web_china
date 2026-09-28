/**
 * PUBLIC API del slice `agenda`.
 *
 * Los demas slices importan SOLO desde aqui: `@/slices/agenda`, nunca
 * `@/slices/agenda/domain/...`. `tests/unit/arquitectura.test.ts` lo verifica.
 *
 * Deliberadamente NO exporta el adapter de localStorage: si lo hiciera, cualquier
 * archivo de dominio que importe de aca arrastraria la infraestructura consigo.
 * El unico que conoce la implementacion concreta es el composition root
 * (`src/app/container.ts`), que es exactamente su trabajo.
 */
export { AgendaDelDia } from './domain/agenda-del-dia'
export type { EstadoSlot, SlotConEstado, SolicitudDeReserva } from './domain/agenda-del-dia'
export type { AgendaRepository } from './domain/agenda.port'
export { CodigoError, reservaNoEncontrada } from './domain/agenda.errors'
export { Bloqueo } from './domain/bloqueo'
export { CelularParaguayo } from './domain/celular-paraguayo'
export { CodigoReserva } from './domain/codigo-reserva'
export { DatosPaciente } from './domain/datos-paciente'
export { FechaAgenda } from './domain/fecha-agenda'
export { HoraSlot } from './domain/hora-slot'
export { DURACION_SLOT_MINUTOS, HorarioAtencion } from './domain/horario-atencion'
export type { Tramo } from './domain/horario-atencion'
export { NombrePaciente } from './domain/nombre-paciente'
export { Reserva } from './domain/reserva'
export type { EstadoReserva } from './domain/reserva'

export { diasDeAgenda, primerDiaConLugar, slotsDelDia } from './application/consultar-disponibilidad'
export type { DiaDeAgenda } from './application/consultar-disponibilidad'
