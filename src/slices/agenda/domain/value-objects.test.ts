import { describe, expect, it } from 'vitest'
import { desempaquetar } from '@/shared/domain/result'
import { CelularParaguayo } from './celular-paraguayo'
import { CodigoReserva } from './codigo-reserva'
import { FechaAgenda } from './fecha-agenda'
import { HoraSlot } from './hora-slot'
import { HorarioAtencion } from './horario-atencion'
import { NombrePaciente } from './nombre-paciente'

describe('FechaAgenda', () => {
  it('acepta una fecha ISO válida', () => {
    const f = desempaquetar(FechaAgenda.desdeISO('2026-10-06'))
    expect(f.iso).toBe('2026-10-06')
  })

  it('rechaza formatos que no son AAAA-MM-DD', () => {
    expect(FechaAgenda.desdeISO('06/10/2026').ok).toBe(false)
    expect(FechaAgenda.desdeISO('2026-10').ok).toBe(false)
    expect(FechaAgenda.desdeISO('').ok).toBe(false)
  })

  it('rechaza fechas que no existen en el calendario', () => {
    expect(FechaAgenda.desdeISO('2026-02-30').ok).toBe(false)
    expect(FechaAgenda.desdeISO('2026-13-01').ok).toBe(false)
  })

  // Esta es la razón por la que FechaAgenda no envuelve un Date: `new Date('2026-10-06')`
  // se parsea como medianoche UTC y en Asunción (UTC-3) devuelve el día 5.
  it('no se corre de día por la zona horaria', () => {
    const f = desempaquetar(FechaAgenda.desdeISO('2026-10-06'))
    expect(f.dia).toBe(6)
    expect(f.etiquetaLarga).toBe('martes 6 de octubre de 2026')
  })

  it('calcula el día de la semana', () => {
    expect(desempaquetar(FechaAgenda.desdeISO('2026-10-06')).nombreDia).toBe('martes')
    expect(desempaquetar(FechaAgenda.desdeISO('2026-10-11')).nombreDia).toBe('domingo')
  })

  it('suma días cruzando fin de mes y fin de año', () => {
    expect(desempaquetar(FechaAgenda.desdeISO('2026-10-31')).sumarDias(1).iso).toBe('2026-11-01')
    expect(desempaquetar(FechaAgenda.desdeISO('2026-12-31')).sumarDias(1).iso).toBe('2027-01-01')
  })

  it('toma la fecha local de un Date, no la UTC', () => {
    const f = FechaAgenda.desdeDate(new Date(2026, 9, 6, 23, 30))
    expect(f.iso).toBe('2026-10-06')
  })

  it('compara fechas por orden de calendario', () => {
    const a = desempaquetar(FechaAgenda.desdeISO('2026-10-06'))
    const b = desempaquetar(FechaAgenda.desdeISO('2026-10-07'))
    expect(a.esAnteriorA(b)).toBe(true)
    expect(b.esPosteriorA(a)).toBe(true)
    expect(a.equals(desempaquetar(FechaAgenda.desdeISO('2026-10-06')))).toBe(true)
  })

  it('produce una etiqueta corta para la tira de días del celular', () => {
    expect(desempaquetar(FechaAgenda.desdeISO('2026-10-06')).etiquetaCorta).toBe('mar 6 oct')
  })
})

describe('HoraSlot', () => {
  it('acepta HH:MM y normaliza a dos dígitos', () => {
    expect(desempaquetar(HoraSlot.desdeTexto('8:00')).texto).toBe('08:00')
    expect(desempaquetar(HoraSlot.desdeTexto('14:30')).texto).toBe('14:30')
  })

  it('rechaza horas que no existen', () => {
    expect(HoraSlot.desdeTexto('25:00').ok).toBe(false)
    expect(HoraSlot.desdeTexto('10:75').ok).toBe(false)
    expect(HoraSlot.desdeTexto('mediodía').ok).toBe(false)
  })

  it('convierte a minutos y vuelve', () => {
    const h = desempaquetar(HoraSlot.desdeTexto('14:30'))
    expect(h.enMinutos).toBe(870)
    expect(HoraSlot.desdeMinutos(870).texto).toBe('14:30')
  })

  it('suma minutos', () => {
    expect(desempaquetar(HoraSlot.desdeTexto('11:30')).masMinutos(60).texto).toBe('12:30')
  })

  it('compara por orden cronológico', () => {
    const a = desempaquetar(HoraSlot.desdeTexto('09:00'))
    const b = desempaquetar(HoraSlot.desdeTexto('10:00'))
    expect(a.esAnteriorA(b)).toBe(true)
    expect(a.equals(desempaquetar(HoraSlot.desdeTexto('09:00')))).toBe(true)
  })
})

describe('CelularParaguayo (CA-01)', () => {
  it('acepta los formatos que la gente realmente escribe', () => {
    for (const entrada of [
      '0981456789',
      '0981 456 789',
      '0981-456-789',
      '+595 981 456 789',
      '595981456789',
    ]) {
      const r = CelularParaguayo.crear(entrada)
      expect(r.ok, `debería aceptar ${entrada}`).toBe(true)
      expect(desempaquetar(r).plano).toBe('0981456789')
    }
  })

  it('rechaza números que no son celulares paraguayos', () => {
    for (const entrada of ['123', '021 456 789', '0981 456 78', '098145678912', 'no tengo']) {
      expect(CelularParaguayo.crear(entrada).ok, `debería rechazar ${entrada}`).toBe(false)
    }
  })

  it('rechaza un celular vacío con un mensaje propio', () => {
    const r = CelularParaguayo.crear('   ')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.codigo).toBe('CELULAR_REQUERIDO')
  })

  it('formatea para mostrar y produce el E.164 que espera wa.me', () => {
    const c = desempaquetar(CelularParaguayo.crear('0981456789'))
    expect(c.formateado).toBe('0981 456 789')
    expect(c.e164).toBe('595981456789')
  })
})

describe('NombrePaciente (CA-01)', () => {
  it('acepta nombres con tildes y apellidos compuestos', () => {
    expect(desempaquetar(NombrePaciente.crear('Lucía Benítez')).valor).toBe('Lucía Benítez')
    expect(desempaquetar(NombrePaciente.crear("María de la O'Higgins")).valor).toContain('Higgins')
  })

  it('colapsa espacios repetidos y recorta los extremos', () => {
    expect(desempaquetar(NombrePaciente.crear('  Diego   Ayala  ')).valor).toBe('Diego Ayala')
  })

  it('rechaza vacío, demasiado corto y con números', () => {
    expect(NombrePaciente.crear('').ok).toBe(false)
    expect(NombrePaciente.crear('Jo').ok).toBe(false)
    expect(NombrePaciente.crear('Paciente 42').ok).toBe(false)
  })

  it('distingue el nombre vacío del nombre inválido', () => {
    const vacio = NombrePaciente.crear('  ')
    expect(vacio.ok).toBe(false)
    if (!vacio.ok) expect(vacio.error.codigo).toBe('NOMBRE_REQUERIDO')
  })

  it('expone el primer nombre para los saludos', () => {
    expect(desempaquetar(NombrePaciente.crear('Lucía Benítez')).primerNombre).toBe('Lucía')
  })
})

describe('CodigoReserva', () => {
  it('genera códigos con el prefijo QI- y seis caracteres', () => {
    const c = CodigoReserva.generar(() => 0.5)
    expect(c.valor).toMatch(/^QI-[A-Z2-9]{6}$/)
  })

  it('es determinista cuando se le inyecta el azar', () => {
    expect(CodigoReserva.generar(() => 0).valor).toBe(CodigoReserva.generar(() => 0).valor)
  })

  it('no usa caracteres ambiguos: ni I, ni O, ni 0, ni 1', () => {
    const valores = Array.from({ length: 50 }, (_, i) => CodigoReserva.generar(() => i / 50).valor)
    for (const v of valores) {
      expect(v.slice(3)).not.toMatch(/[IO01]/)
    }
  })

  it('acepta que el paciente tipee el código en minúsculas y sin prefijo', () => {
    expect(desempaquetar(CodigoReserva.crear('qi-abc234')).valor).toBe('QI-ABC234')
    expect(desempaquetar(CodigoReserva.crear('ABC234')).valor).toBe('QI-ABC234')
  })

  it('rechaza códigos mal formados', () => {
    expect(CodigoReserva.crear('QI-123').ok).toBe(false)
    expect(CodigoReserva.crear('').ok).toBe(false)
  })
})

describe('HorarioAtencion', () => {
  const horario = HorarioAtencion.delCentro()
  const fecha = (iso: string) => desempaquetar(FechaAgenda.desdeISO(iso))

  it('atiende de lunes a sábado y cierra el domingo', () => {
    expect(horario.atiende(fecha('2026-10-05'))).toBe(true) // lunes
    expect(horario.atiende(fecha('2026-10-10'))).toBe(true) // sábado
    expect(horario.atiende(fecha('2026-10-11'))).toBe(false) // domingo
  })

  it('el sábado solo abre a la mañana', () => {
    expect(horario.slotsDe(fecha('2026-10-10')).map((h) => h.texto)).toEqual([
      '08:00',
      '09:00',
      '10:00',
      '11:00',
    ])
  })

  it('no genera un slot que se pase del cierre del tramo', () => {
    const slots = horario.slotsDe(fecha('2026-10-06')).map((h) => h.texto)
    expect(slots).not.toContain('12:00')
    expect(slots).not.toContain('19:00')
    expect(slots.at(-1)).toBe('18:00')
  })

  it('sabe si una hora pertenece a la grilla del día', () => {
    expect(horario.contiene(fecha('2026-10-06'), desempaquetar(HoraSlot.desdeTexto('09:00')))).toBe(true)
    expect(horario.contiene(fecha('2026-10-06'), desempaquetar(HoraSlot.desdeTexto('09:30')))).toBe(false)
    expect(horario.contiene(fecha('2026-10-10'), desempaquetar(HoraSlot.desdeTexto('15:00')))).toBe(false)
  })
})
