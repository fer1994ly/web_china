import { err, ok, type Result } from '@/shared/domain/result'
import {
  CelularParaguayo,
  DatosPaciente,
  FechaAgenda,
  HoraSlot,
  NombrePaciente,
} from '@/slices/agenda'

export type CampoReserva = 'nombre' | 'celular' | 'terapia' | 'fecha' | 'hora'

export const CAMPOS_OBLIGATORIOS: readonly CampoReserva[] = [
  'nombre',
  'celular',
  'terapia',
  'fecha',
  'hora',
]

export interface EntradaFormulario {
  readonly nombre: string
  readonly celular: string
  readonly terapiaId: string
  readonly fechaIso: string
  readonly horaTexto: string
  readonly motivoConsulta: string
}

export type ErroresFormulario = Partial<Record<CampoReserva, string>>

export interface SolicitudValidada {
  readonly paciente: DatosPaciente
  readonly terapiaId: string
  readonly fecha: FechaAgenda
  readonly hora: HoraSlot
}

export const FORMULARIO_VACIO: EntradaFormulario = {
  nombre: '',
  celular: '',
  terapiaId: '',
  fechaIso: '',
  horaTexto: '',
  motivoConsulta: '',
}

/**
 * Valida los cinco campos obligatorios del criterio CA-01.
 *
 * Reporta TODOS los errores de una sola pasada, no el primero: en un formulario de
 * celular, mostrar los errores de a uno obliga a cinco viajes de ida y vuelta.
 */
export function validarFormulario(
  entrada: EntradaFormulario,
  terapiasValidas: readonly string[],
): Result<SolicitudValidada, ErroresFormulario> {
  const errores: ErroresFormulario = {}

  const nombre = NombrePaciente.crear(entrada.nombre)
  if (!nombre.ok) errores.nombre = nombre.error.mensaje

  const celular = CelularParaguayo.crear(entrada.celular)
  if (!celular.ok) errores.celular = celular.error.mensaje

  const terapiaId = entrada.terapiaId.trim()
  if (terapiaId.length === 0) {
    errores.terapia = 'Elegí la terapia que querés reservar.'
  } else if (!terapiasValidas.includes(terapiaId)) {
    errores.terapia = 'Esa terapia no está disponible.'
  }

  const fecha = FechaAgenda.desdeISO(entrada.fechaIso)
  if (entrada.fechaIso.trim().length === 0) {
    errores.fecha = 'Elegí el día de tu sesión.'
  } else if (!fecha.ok) {
    errores.fecha = fecha.error.mensaje
  }

  const hora = HoraSlot.desdeTexto(entrada.horaTexto)
  if (entrada.horaTexto.trim().length === 0) {
    errores.hora = 'Elegí un horario disponible.'
  } else if (!hora.ok) {
    errores.hora = hora.error.mensaje
  }

  if (Object.keys(errores).length > 0) return err(errores)

  // En este punto los cuatro Result son ok; el chequeo redundante es lo que le
  // permite a TypeScript estrechar los tipos sin un cast.
  if (!nombre.ok || !celular.ok || !fecha.ok || !hora.ok) return err(errores)

  return ok({
    paciente: new DatosPaciente(nombre.value, celular.value, entrada.motivoConsulta.trim()),
    terapiaId,
    fecha: fecha.value,
    hora: hora.value,
  })
}

export const hayErrores = (e: ErroresFormulario): boolean => Object.keys(e).length > 0
