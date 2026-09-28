import { describe, expect, it } from 'vitest'
import { desempaquetar } from '@/shared/domain/result'
import {
  CAMPOS_OBLIGATORIOS,
  FORMULARIO_VACIO,
  hayErrores,
  validarFormulario,
  type EntradaFormulario,
} from './formulario-reserva'

const TERAPIAS = ['acupuntura', 'auriculoterapia', 'reflexologia', 'moxibustion']

const completo = (parche: Partial<EntradaFormulario> = {}): EntradaFormulario => ({
  nombre: 'Lucía Benítez',
  celular: '0981 456 789',
  terapiaId: 'acupuntura',
  fechaIso: '2026-10-06',
  horaTexto: '09:00',
  motivoConsulta: '',
  ...parche,
})

describe('validarFormulario — CA-01: campos obligatorios', () => {
  it('rechaza el formulario vacío señalando los cinco campos a la vez', () => {
    const r = validarFormulario(FORMULARIO_VACIO, TERAPIAS)

    expect(r.ok).toBe(false)
    if (r.ok) return
    for (const campo of CAMPOS_OBLIGATORIOS) {
      expect(r.error[campo], `falta el aviso del campo ${campo}`).toBeTruthy()
    }
    expect(Object.keys(r.error)).toHaveLength(5)
  })

  it.each(CAMPOS_OBLIGATORIOS)('impide avanzar si falta %s', (campo) => {
    const vaciar: Record<string, Partial<EntradaFormulario>> = {
      nombre: { nombre: '' },
      celular: { celular: '' },
      terapia: { terapiaId: '' },
      fecha: { fechaIso: '' },
      hora: { horaTexto: '' },
    }
    const r = validarFormulario(completo(vaciar[campo]), TERAPIAS)

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error[campo]).toBeTruthy()
      expect(Object.keys(r.error)).toEqual([campo])
    }
  })

  it('acepta un formulario completo', () => {
    const r = validarFormulario(completo(), TERAPIAS)

    expect(r.ok).toBe(true)
    const s = desempaquetar(r)
    expect(s.paciente.nombre.valor).toBe('Lucía Benítez')
    expect(s.paciente.celular.plano).toBe('0981456789')
    expect(s.terapiaId).toBe('acupuntura')
    expect(s.fecha.iso).toBe('2026-10-06')
    expect(s.hora.texto).toBe('09:00')
  })
})

describe('validarFormulario — CA-01: valores presentes pero inválidos', () => {
  it('rechaza un celular con formato inválido', () => {
    const r = validarFormulario(completo({ celular: '123' }), TERAPIAS)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.celular).toContain('0981 456 789')
  })

  it('rechaza un nombre con números', () => {
    const r = validarFormulario(completo({ nombre: 'Paciente 42' }), TERAPIAS)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.nombre).toBeTruthy()
  })

  it('rechaza una terapia que no está en el catálogo', () => {
    const r = validarFormulario(completo({ terapiaId: 'quiropraxia' }), TERAPIAS)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.terapia).toBe('Esa terapia no está disponible.')
  })

  it('rechaza una fecha mal formada', () => {
    const r = validarFormulario(completo({ fechaIso: '06/10/2026' }), TERAPIAS)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.fecha).toBeTruthy()
  })

  it('rechaza una hora que no existe', () => {
    const r = validarFormulario(completo({ horaTexto: '25:00' }), TERAPIAS)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.hora).toBeTruthy()
  })

  it('distingue campo faltante de campo inválido en el mensaje', () => {
    const faltante = validarFormulario(completo({ celular: '' }), TERAPIAS)
    const invalido = validarFormulario(completo({ celular: '123' }), TERAPIAS)
    expect(faltante.ok).toBe(false)
    expect(invalido.ok).toBe(false)
    if (!faltante.ok && !invalido.ok) {
      expect(faltante.error.celular).not.toBe(invalido.error.celular)
    }
  })
})

describe('validarFormulario — normalización', () => {
  it('recorta el motivo de consulta y lo deja pasar vacío', () => {
    expect(desempaquetar(validarFormulario(completo(), TERAPIAS)).paciente.motivoConsulta).toBe('')
    expect(
      desempaquetar(validarFormulario(completo({ motivoConsulta: '  dolor lumbar  ' }), TERAPIAS))
        .paciente.motivoConsulta,
    ).toBe('dolor lumbar')
  })

  it('el motivo de consulta no es obligatorio', () => {
    expect(validarFormulario(completo({ motivoConsulta: '' }), TERAPIAS).ok).toBe(true)
  })

  it('normaliza el celular escrito con prefijo internacional', () => {
    const s = desempaquetar(validarFormulario(completo({ celular: '+595 981 456 789' }), TERAPIAS))
    expect(s.paciente.celular.e164).toBe('595981456789')
  })
})

describe('hayErrores', () => {
  it('distingue el objeto vacío de uno con avisos', () => {
    expect(hayErrores({})).toBe(false)
    expect(hayErrores({ nombre: 'falta' })).toBe(true)
  })
})
