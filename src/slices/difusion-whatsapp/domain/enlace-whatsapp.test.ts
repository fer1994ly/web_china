import { describe, expect, it } from 'vitest'
import { CENTRO } from '@/seed/centro'
import { datosDelTurno, enlaceDeConsulta, enlaceDeWhatsApp, mensajeDelTurno } from './enlace-whatsapp'
import { desempaquetar } from '@/shared/domain/result'
import {
  CelularParaguayo,
  CodigoReserva,
  DatosPaciente,
  FechaAgenda,
  HoraSlot,
  NombrePaciente,
  Reserva,
} from '@/slices/agenda'

const TURNO = {
  nombrePaciente: 'Lucía Benítez',
  terapia: 'Auriculoterapia',
  fecha: 'martes 6 de octubre de 2026',
  hora: '09:00',
  codigo: 'QI-K7R2MP',
}

/** Lo que el destinatario realmente lee: el parámetro `text` decodificado. */
const textoDecodificado = (url: string): string =>
  decodeURIComponent(new URL(url).searchParams.get('text') ?? '')

describe('enlaceDeWhatsApp — CA-06', () => {
  it('usa el esquema https://wa.me/', () => {
    expect(enlaceDeWhatsApp(TURNO)).toMatch(/^https:\/\/wa\.me\//)
  })

  it('apunta al celular del centro en formato internacional, sin signos ni espacios', () => {
    expect(new URL(enlaceDeWhatsApp(TURNO)).pathname).toBe(`/${CENTRO.celularE164}`)
    expect(CENTRO.celularE164).toMatch(/^\d+$/)
  })

  it('lleva el nombre del paciente en el texto', () => {
    expect(textoDecodificado(enlaceDeWhatsApp(TURNO))).toContain('Lucía Benítez')
  })

  it('lleva el servicio en el texto', () => {
    expect(textoDecodificado(enlaceDeWhatsApp(TURNO))).toContain('Auriculoterapia')
  })

  it('lleva la fecha en el texto', () => {
    expect(textoDecodificado(enlaceDeWhatsApp(TURNO))).toContain('martes 6 de octubre de 2026')
  })

  it('lleva la hora en el texto', () => {
    expect(textoDecodificado(enlaceDeWhatsApp(TURNO))).toContain('09:00')
  })

  it('codifica el texto como componente de URL', () => {
    const url = enlaceDeWhatsApp(TURNO)
    const crudo = url.split('?text=')[1] ?? ''
    // Si no estuviera codificado, los espacios y saltos de línea aparecerían tal cual.
    expect(crudo).not.toContain(' ')
    expect(crudo).not.toContain('\n')
    expect(crudo).toContain('%20')
  })

  it('sobrevive a tildes, ñ y saltos de línea sin romper la URL', () => {
    const url = enlaceDeWhatsApp({ ...TURNO, nombrePaciente: 'Sofía Núñez' })
    expect(() => new URL(url)).not.toThrow()
    expect(textoDecodificado(url)).toContain('Sofía Núñez')
  })

  it('incluye el código de reserva para que recepción lo identifique', () => {
    expect(textoDecodificado(enlaceDeWhatsApp(TURNO))).toContain('QI-K7R2MP')
  })

  it('permite apuntar a otro número, por ejemplo el del paciente', () => {
    expect(new URL(enlaceDeWhatsApp(TURNO, '595981456789')).pathname).toBe('/595981456789')
  })
})

describe('mensajeDelTurno', () => {
  it('arma un mensaje legible con una línea por dato', () => {
    const m = mensajeDelTurno(TURNO)
    expect(m).toContain('Paciente: Lucía Benítez')
    expect(m).toContain('Terapia: Auriculoterapia')
    expect(m).toContain('Hora: 09:00')
  })

  it('no contiene texto de relleno', () => {
    expect(mensajeDelTurno(TURNO).toLowerCase()).not.toContain('lorem')
  })
})

describe('datosDelTurno', () => {
  it('traduce una Reserva del dominio a los datos del mensaje', () => {
    const reserva = Reserva.confirmar(
      desempaquetar(CodigoReserva.crear('QI-K7R2MP')),
      desempaquetar(FechaAgenda.desdeISO('2026-10-06')),
      desempaquetar(HoraSlot.desdeTexto('09:00')),
      'auriculoterapia',
      new DatosPaciente(
        desempaquetar(NombrePaciente.crear('Lucía Benítez')),
        desempaquetar(CelularParaguayo.crear('0981456789')),
      ),
      new Date(2026, 9, 1),
    )

    expect(datosDelTurno(reserva, 'Auriculoterapia')).toEqual(TURNO)
  })
})

describe('enlaceDeConsulta', () => {
  it('genera un enlace válido para el botón flotante', () => {
    const url = enlaceDeConsulta()
    expect(url).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
    expect(textoDecodificado(url)).toContain(CENTRO.nombre)
  })
})
