import { beforeEach, describe, expect, it } from 'vitest'
import { desempaquetar } from '@/shared/domain/result'
import { construirSemilla, proximosDiasHabiles } from '@/seed/seed.asuncion'
import { CelularParaguayo } from '../domain/celular-paraguayo'
import { CodigoReserva } from '../domain/codigo-reserva'
import { DatosPaciente } from '../domain/datos-paciente'
import { HoraSlot } from '../domain/hora-slot'
import { NombrePaciente } from '../domain/nombre-paciente'
import { AgendaLocalStorageRepo, CLAVE_ALMACEN } from './agenda.localstorage.repo'

// Lunes 5 de octubre de 2026, 07:00: antes de que el centro abra, así ningún slot
// del primer día hábil cuenta como pasado.
const AHORA = new Date(2026, 9, 5, 7, 0, 0)
const reloj = () => AHORA

const paciente = (nombre = 'Lucía Benítez', celular = '0981456789', motivo = '') =>
  new DatosPaciente(
    desempaquetar(NombrePaciente.crear(nombre)),
    desempaquetar(CelularParaguayo.crear(celular)),
    motivo,
  )

const hora = (t: string) => desempaquetar(HoraSlot.desdeTexto(t))

/** Un repo nuevo simula "el paciente cerró el navegador y volvió a entrar". */
const repoNuevo = () => new AgendaLocalStorageRepo(undefined, reloj)

const primerDia = () => {
  const dia = proximosDiasHabiles(AHORA, 1)[0]
  if (!dia) throw new Error('El seed no produjo ningún día hábil')
  return dia
}

describe('AgendaLocalStorageRepo — siembra inicial', () => {
  beforeEach(() => localStorage.clear())

  it('siembra los datos de ejemplo la primera vez que se abre la demo', () => {
    const repo = repoNuevo()
    const dias = proximosDiasHabiles(AHORA, 14)
    const reservas = repo.reservasEntre(dias[0]!, dias[13]!)

    expect(reservas.length).toBe(9)
    expect(reservas.filter((r) => r.estaActiva).length).toBe(8)
    expect(reservas.filter((r) => !r.estaActiva).length).toBe(1)
  })

  it('siembra los bloqueos de ejemplo', () => {
    const repo = repoNuevo()
    const dias = proximosDiasHabiles(AHORA, 14)
    expect(repo.bloqueosEntre(dias[0]!, dias[13]!).length).toBe(3)
  })

  it('escribe el sobre versionado en localStorage', () => {
    repoNuevo().cargarDia(primerDia())
    const crudo = localStorage.getItem(CLAVE_ALMACEN)
    expect(crudo).not.toBeNull()
    expect(JSON.parse(crudo!).schemaVersion).toBe(1)
  })

  it('ningún turno de ejemplo cae en un día que el centro no atiende', () => {
    const repo = repoNuevo()
    const dias = proximosDiasHabiles(AHORA, 14)
    for (const r of repo.reservasEntre(dias[0]!, dias[13]!)) {
      expect(r.fecha.diaSemana, `${r.fecha.iso} es domingo`).not.toBe(0)
    }
  })
})

describe('AgendaLocalStorageRepo — persistencia (CA-03)', () => {
  beforeEach(() => localStorage.clear())

  it('una reserva sobrevive a reabrir el navegador', () => {
    const fecha = primerDia()
    const repo = repoNuevo()
    const agenda = repo.cargarDia(fecha)
    const reserva = desempaquetar(
      agenda.reservar({ hora: hora('08:00'), terapiaId: 'acupuntura', paciente: paciente() }, AHORA),
    )
    repo.guardar(agenda)

    const despues = repoNuevo().cargarDia(fecha)

    expect(despues.slotsDisponibles(AHORA).map((h) => h.texto)).not.toContain('08:00')
    expect(despues.reservasActivas.some((r) => r.codigo.equals(reserva.codigo))).toBe(true)
  })

  it('conserva los datos del paciente sin perder tildes ni el motivo de consulta', () => {
    const fecha = primerDia()
    const repo = repoNuevo()
    const agenda = repo.cargarDia(fecha)
    desempaquetar(
      agenda.reservar(
        {
          hora: hora('08:00'),
          terapiaId: 'moxibustion',
          paciente: paciente('Rocío Gaona', '0961 887 205', 'Dolor de rodilla con el frío.'),
        },
        AHORA,
      ),
    )
    repo.guardar(agenda)

    const recuperada = repoNuevo().cargarDia(fecha).reservasActivas.find((r) => r.hora.texto === '08:00')

    expect(recuperada?.paciente.nombre.valor).toBe('Rocío Gaona')
    expect(recuperada?.paciente.celular.formateado).toBe('0961 887 205')
    expect(recuperada?.paciente.motivoConsulta).toBe('Dolor de rodilla con el frío.')
  })

  it('una cancelación sobrevive a reabrir el navegador', () => {
    const fecha = primerDia()
    const repo = repoNuevo()
    const agenda = repo.cargarDia(fecha)
    const reserva = desempaquetar(
      agenda.reservar({ hora: hora('08:00'), terapiaId: 'acupuntura', paciente: paciente() }, AHORA),
    )
    agenda.cancelar(reserva.codigo, AHORA)
    repo.guardar(agenda)

    const despues = repoNuevo()

    expect(despues.buscarPorCodigo(reserva.codigo)?.estado).toBe('cancelada')
    expect(despues.cargarDia(fecha).slotsDisponibles(AHORA).map((h) => h.texto)).toContain('08:00')
  })

  it('un bloqueo sobrevive a reabrir el navegador', () => {
    const fecha = primerDia()
    const repo = repoNuevo()
    const agenda = repo.cargarDia(fecha)
    agenda.bloquear(hora('08:00'), 'Feriado municipal', AHORA)
    repo.guardar(agenda)

    const slot = repoNuevo()
      .cargarDia(fecha)
      .slots(AHORA)
      .find((s) => s.hora.texto === '08:00')

    expect(slot?.estado).toBe('bloqueado')
    expect(slot?.motivo).toBe('Feriado municipal')
  })

  it('guardar un día no pisa los turnos de los otros días', () => {
    const dias = proximosDiasHabiles(AHORA, 3)
    const repo = repoNuevo()
    const antesEnElTercerDia = repo.cargarDia(dias[2]!).reservasActivas.length

    const agenda = repo.cargarDia(dias[0]!)
    agenda.reservar({ hora: hora('08:00'), terapiaId: 'acupuntura', paciente: paciente() }, AHORA)
    repo.guardar(agenda)

    expect(repoNuevo().cargarDia(dias[2]!).reservasActivas.length).toBe(antesEnElTercerDia)
  })

  it('desbloquear también persiste', () => {
    const dias = proximosDiasHabiles(AHORA, 2)
    const fecha = dias[1]!
    const repo = repoNuevo()
    const agenda = repo.cargarDia(fecha)
    agenda.desbloquear(hora('10:00')) // bloqueo del seed: "Capacitación del equipo"
    repo.guardar(agenda)

    expect(repoNuevo().cargarDia(fecha).slotsDisponibles(AHORA).map((h) => h.texto)).toContain('10:00')
  })
})

describe('AgendaLocalStorageRepo — reinicio de la demo', () => {
  beforeEach(() => localStorage.clear())

  it('devuelve la agenda al estado de ejemplo', () => {
    const fecha = primerDia()
    const repo = repoNuevo()
    const agenda = repo.cargarDia(fecha)
    agenda.bloquear(hora('08:00'), 'Bloqueo de prueba', AHORA)
    repo.guardar(agenda)
    expect(repo.cargarDia(fecha).slotsDisponibles(AHORA).map((h) => h.texto)).not.toContain('08:00')

    repo.reiniciarDemo()

    expect(repo.cargarDia(fecha).slotsDisponibles(AHORA).map((h) => h.texto)).toContain('08:00')
  })
})

describe('AgendaLocalStorageRepo — tolerancia a datos rotos', () => {
  beforeEach(() => localStorage.clear())

  it('vuelve a sembrar si el JSON está corrupto en lugar de romper la demo', () => {
    localStorage.setItem(CLAVE_ALMACEN, '{esto no es json')
    expect(repoNuevo().cargarDia(primerDia())).toBeDefined()
    expect(JSON.parse(localStorage.getItem(CLAVE_ALMACEN)!).schemaVersion).toBe(1)
  })

  it('vuelve a sembrar si el esquema guardado es de otra versión', () => {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ schemaVersion: 99, data: { reservas: [], bloqueos: [] } }))
    const dias = proximosDiasHabiles(AHORA, 14)
    expect(repoNuevo().reservasEntre(dias[0]!, dias[13]!).length).toBe(9)
  })

  it('descarta un registro inválido sin arrastrar a los demás', () => {
    const semilla = construirSemilla(AHORA)
    semilla.reservas.push({
      codigo: 'ESTO-NO-ES-UN-CODIGO',
      fecha: 'ayer',
      hora: '99:99',
      terapiaId: 'inventada',
      nombre: '',
      celular: '1',
      motivoConsulta: '',
      estado: 'confirmada',
      creadaEn: AHORA.toISOString(),
      canceladaEn: null,
    })
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify({ schemaVersion: 1, data: semilla }))

    const dias = proximosDiasHabiles(AHORA, 14)
    expect(repoNuevo().reservasEntre(dias[0]!, dias[13]!).length).toBe(9)
  })
})

describe('AgendaLocalStorageRepo — búsqueda por código', () => {
  beforeEach(() => localStorage.clear())

  it('encuentra un turno del seed por su código', () => {
    const encontrada = repoNuevo().buscarPorCodigo(desempaquetar(CodigoReserva.crear('QI-K7R2MP')))
    expect(encontrada?.paciente.nombre.valor).toBe('Mariana Ojeda')
  })

  it('devuelve null para un código que no existe', () => {
    expect(repoNuevo().buscarPorCodigo(desempaquetar(CodigoReserva.crear('QI-ZZZZZZ')))).toBeNull()
  })
})
