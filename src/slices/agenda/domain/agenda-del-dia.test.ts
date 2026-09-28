import { describe, expect, it } from 'vitest'
import { desempaquetar } from '@/shared/domain/result'
import { AgendaDelDia } from './agenda-del-dia'
import { CodigoReserva } from './codigo-reserva'
import { DatosPaciente } from './datos-paciente'
import { FechaAgenda } from './fecha-agenda'
import { HoraSlot } from './hora-slot'
import { HorarioAtencion } from './horario-atencion'
import { NombrePaciente } from './nombre-paciente'
import { CelularParaguayo } from './celular-paraguayo'
import { CodigoError } from './agenda.errors'

// Martes 6 de octubre de 2026, 07:00 de la mañana: el centro todavía no abrió.
const AHORA = new Date(2026, 9, 6, 7, 0, 0)
const MARTES = desempaquetar(FechaAgenda.desdeISO('2026-10-06'))
const DOMINGO = desempaquetar(FechaAgenda.desdeISO('2026-10-11'))
const horario = HorarioAtencion.delCentro()

const hora = (t: string) => desempaquetar(HoraSlot.desdeTexto(t))

const paciente = (nombre = 'Lucía Benítez', celular = '0981 456 789') =>
  new DatosPaciente(
    desempaquetar(NombrePaciente.crear(nombre)),
    desempaquetar(CelularParaguayo.crear(celular)),
  )

const solicitud = (t: string, terapiaId = 'acupuntura') => ({
  hora: hora(t),
  terapiaId,
  paciente: paciente(),
})

const agendaDelMartes = () => AgendaDelDia.crear(MARTES, horario)

describe('AgendaDelDia — generación de slots', () => {
  it('genera los 9 slots de un día hábil: 4 de mañana y 5 de tarde', () => {
    const slots = agendaDelMartes().slots(AHORA)
    expect(slots.map((s) => s.hora.texto)).toEqual([
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
    ])
  })

  it('no genera ningún slot el domingo', () => {
    const domingo = AgendaDelDia.crear(DOMINGO, horario)
    expect(domingo.atiende).toBe(false)
    expect(domingo.slots(AHORA)).toEqual([])
  })
})

describe('AgendaDelDia — invariante "un slot, una sola reserva" (CA-02)', () => {
  it('confirma una reserva sobre un slot libre', () => {
    const agenda = agendaDelMartes()
    const r = agenda.reservar(solicitud('09:00'), AHORA)

    expect(r.ok).toBe(true)
    expect(desempaquetar(r).hora.texto).toBe('09:00')
    expect(desempaquetar(r).estaActiva).toBe(true)
  })

  it('rechaza una segunda reserva sobre el mismo slot', () => {
    const agenda = agendaDelMartes()
    agenda.reservar(solicitud('09:00'), AHORA)

    const segunda = agenda.reservar(solicitud('09:00', 'reflexologia'), AHORA)

    expect(segunda.ok).toBe(false)
    if (!segunda.ok) expect(segunda.error.codigo).toBe(CodigoError.SLOT_YA_RESERVADO)
  })

  it('retira el slot de la lista de disponibles apenas se confirma', () => {
    const agenda = agendaDelMartes()
    expect(agenda.slotsDisponibles(AHORA).map((h) => h.texto)).toContain('09:00')

    agenda.reservar(solicitud('09:00'), AHORA)

    expect(agenda.slotsDisponibles(AHORA).map((h) => h.texto)).not.toContain('09:00')
    expect(agenda.slots(AHORA).find((s) => s.hora.texto === '09:00')?.estado).toBe('reservado')
  })

  it('deja libre el resto de los horarios', () => {
    const agenda = agendaDelMartes()
    agenda.reservar(solicitud('09:00'), AHORA)
    expect(agenda.slotsDisponibles(AHORA).map((h) => h.texto)).toContain('10:00')
  })
})

describe('AgendaDelDia — guardas de reserva', () => {
  it('rechaza un horario fuera del horario de atención', () => {
    const r = agendaDelMartes().reservar(solicitud('21:00'), AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.FUERA_DE_HORARIO)
  })

  it('rechaza un horario que cae en el hueco del mediodía', () => {
    const r = agendaDelMartes().reservar(solicitud('12:00'), AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.FUERA_DE_HORARIO)
  })

  it('rechaza cualquier reserva un día que el centro no atiende', () => {
    const r = AgendaDelDia.crear(DOMINGO, horario).reservar(solicitud('09:00'), AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.DIA_CERRADO)
  })

  it('rechaza un horario que ya pasó en el día de hoy', () => {
    const mediaTarde = new Date(2026, 9, 6, 15, 30, 0)
    const r = agendaDelMartes().reservar(solicitud('09:00'), mediaTarde)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.SLOT_EN_EL_PASADO)
  })

  it('marca como pasados los slots ya transcurridos pero deja libres los siguientes', () => {
    const mediaTarde = new Date(2026, 9, 6, 15, 30, 0)
    const estados = agendaDelMartes().slots(mediaTarde)
    expect(estados.find((s) => s.hora.texto === '15:00')?.estado).toBe('pasado')
    expect(estados.find((s) => s.hora.texto === '16:00')?.estado).toBe('disponible')
  })

  it('el slot en curso cuenta como pasado: no se reserva sobre la hora', () => {
    const justoEnLaHora = new Date(2026, 9, 6, 16, 0, 0)
    const r = agendaDelMartes().reservar(solicitud('16:00'), justoEnLaHora)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.SLOT_EN_EL_PASADO)
  })
})

describe('AgendaDelDia — bloqueos (CA-05)', () => {
  it('no ofrece un slot bloqueado', () => {
    const agenda = agendaDelMartes()
    agenda.bloquear(hora('10:00'), 'Capacitación del equipo', AHORA)

    expect(agenda.slotsDisponibles(AHORA).map((h) => h.texto)).not.toContain('10:00')
    const slot = agenda.slots(AHORA).find((s) => s.hora.texto === '10:00')
    expect(slot?.estado).toBe('bloqueado')
    expect(slot?.motivo).toBe('Capacitación del equipo')
  })

  it('impide reservar sobre un slot bloqueado', () => {
    const agenda = agendaDelMartes()
    agenda.bloquear(hora('10:00'), 'Capacitación del equipo', AHORA)

    const r = agenda.reservar(solicitud('10:00'), AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.SLOT_BLOQUEADO)
  })

  it('impide bloquear un slot que ya tiene un turno confirmado', () => {
    const agenda = agendaDelMartes()
    agenda.reservar(solicitud('11:00'), AHORA)

    const r = agenda.bloquear(hora('11:00'), 'Mantenimiento', AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.SLOT_YA_RESERVADO)
  })

  it('rechaza bloquear dos veces el mismo slot', () => {
    const agenda = agendaDelMartes()
    agenda.bloquear(hora('10:00'), 'Capacitación', AHORA)

    const r = agenda.bloquear(hora('10:00'), 'Otra cosa', AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.SLOT_YA_BLOQUEADO)
  })

  it('desbloquear devuelve el slot a disponible', () => {
    const agenda = agendaDelMartes()
    agenda.bloquear(hora('10:00'), 'Capacitación', AHORA)
    agenda.desbloquear(hora('10:00'))

    expect(agenda.slotsDisponibles(AHORA).map((h) => h.texto)).toContain('10:00')
  })

  it('usa un motivo por defecto cuando no se escribe ninguno', () => {
    const agenda = agendaDelMartes()
    const r = agenda.bloquear(hora('10:00'), '   ', AHORA)
    expect(desempaquetar(r).motivo).toBe('No disponible')
  })
})

describe('AgendaDelDia — cancelación', () => {
  it('libera el slot y conserva la reserva en el historial', () => {
    const agenda = agendaDelMartes()
    const reserva = desempaquetar(agenda.reservar(solicitud('09:00'), AHORA))

    const cancelada = desempaquetar(agenda.cancelar(reserva.codigo, AHORA))

    expect(cancelada.estado).toBe('cancelada')
    expect(cancelada.canceladaEn).not.toBeNull()
    expect(agenda.slotsDisponibles(AHORA).map((h) => h.texto)).toContain('09:00')
    expect(agenda.todasLasReservas).toHaveLength(1)
    expect(agenda.reservasActivas).toHaveLength(0)
  })

  it('permite volver a reservar el slot liberado', () => {
    const agenda = agendaDelMartes()
    const reserva = desempaquetar(agenda.reservar(solicitud('09:00'), AHORA))
    agenda.cancelar(reserva.codigo, AHORA)

    const nueva = agenda.reservar(solicitud('09:00', 'moxibustion'), AHORA)
    expect(nueva.ok).toBe(true)
  })

  it('rechaza un código inexistente', () => {
    const r = agendaDelMartes().cancelar(desempaquetar(CodigoReserva.crear('QI-ZZZZZZ')), AHORA)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe(CodigoError.RESERVA_NO_ENCONTRADA)
  })

  it('rechaza cancelar dos veces la misma reserva', () => {
    const agenda = agendaDelMartes()
    const reserva = desempaquetar(agenda.reservar(solicitud('09:00'), AHORA))
    agenda.cancelar(reserva.codigo, AHORA)

    const segunda = agenda.cancelar(reserva.codigo, AHORA)
    expect(segunda.ok).toBe(false)
    if (!segunda.ok) expect(segunda.error.codigo).toBe(CodigoError.RESERVA_YA_CANCELADA)
  })
})

describe('AgendaDelDia — aislamiento por fecha', () => {
  it('ignora reservas y bloqueos de otros días al construirse', () => {
    const otroDia = desempaquetar(FechaAgenda.desdeISO('2026-10-07'))
    const agendaOtroDia = AgendaDelDia.crear(otroDia, horario)
    agendaOtroDia.reservar(solicitud('09:00'), AHORA)

    const martes = AgendaDelDia.crear(MARTES, horario, agendaOtroDia.todasLasReservas)

    expect(martes.todasLasReservas).toHaveLength(0)
    expect(martes.slotsDisponibles(AHORA).map((h) => h.texto)).toContain('09:00')
  })
})
