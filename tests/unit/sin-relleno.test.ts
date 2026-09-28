import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CENTRO } from '@/seed/centro'
import { construirSemilla } from '@/seed/seed.asuncion'
import { TERAPIAS } from '@/slices/catalogo-terapias'

/**
 * El briefing es explicito: nada de texto de relleno en ninguna pantalla.
 * Este test lo verifica sobre el contenido real, no sobre una impresion visual.
 */

const RAIZ = join(process.cwd(), 'src')

function archivosFuente(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) return archivosFuente(ruta)
    return /\.(tsx?|css)$/.test(nombre) ? [ruta] : []
  })
}

const RELLENO = [
  'lorem',
  'ipsum',
  'dolor sit amet',
  'consectetur',
  'placeholder text',
  'texto de ejemplo',
  'tu texto aquí',
  'aquí va el texto',
  'foo bar',
  'asdf',
  'xxxx',
  'tbd',
]

describe('Nada de texto de relleno', () => {
  it('ningún archivo del proyecto contiene relleno', () => {
    const infractores: string[] = []

    for (const ruta of archivosFuente(RAIZ)) {
      const relativa = relative(RAIZ, ruta).split(sep).join('/')
      // Los tests nombran el relleno justamente para prohibirlo.
      if (relativa === 'index.css' || /\.test\.tsx?$/.test(relativa)) continue

      const contenido = readFileSync(ruta, 'utf8')
        .toLowerCase()
        // "QI-XXXXXX" es la máscara del formato del código, no relleno.
        .replace(/qi-x+/g, '')

      for (const palabra of RELLENO) {
        if (contenido.includes(palabra)) infractores.push(`${relativa}: "${palabra}"`)
      }
    }

    expect(infractores).toEqual([])
  })
})

describe('El catálogo tiene contenido real', () => {
  it('son exactamente las cuatro terapias del briefing', () => {
    expect(TERAPIAS.map((t) => t.id)).toEqual([
      'acupuntura',
      'auriculoterapia',
      'reflexologia',
      'moxibustion',
    ])
  })

  it.each(TERAPIAS.map((t) => [t.nombre, t] as const))(
    '%s tiene descripción, beneficios, duración y precio propios',
    (_nombre, t) => {
      expect(t.resumen.length).toBeGreaterThan(40)
      expect(t.descripcion.length).toBeGreaterThan(150)
      expect(t.beneficios.length).toBeGreaterThanOrEqual(3)
      expect(t.duracionMinutos).toBeGreaterThan(0)
      expect(t.precioGs).toBeGreaterThan(0)
      expect(t.imagenAlt.length).toBeGreaterThan(20)
    },
  )

  it('ninguna terapia repite el resumen de otra', () => {
    expect(new Set(TERAPIAS.map((t) => t.resumen)).size).toBe(TERAPIAS.length)
  })

  it('ningún beneficio se repite entre terapias', () => {
    const todos = TERAPIAS.flatMap((t) => t.beneficios)
    expect(new Set(todos).size).toBe(todos.length)
  })
})

describe('Los datos del centro son coherentes', () => {
  it('el celular nacional y el internacional son el mismo número', () => {
    expect(CENTRO.celularE164).toBe(`595${CENTRO.celular.replace(/\D/g, '').slice(1)}`)
  })

  it('está contextualizado en Asunción', () => {
    expect(CENTRO.ciudad).toBe('Asunción')
    expect(CENTRO.pais).toBe('Paraguay')
    expect(CENTRO.direccion.length).toBeGreaterThan(10)
  })
})

describe('El seed está precargado y es realista', () => {
  const semilla = construirSemilla(new Date(2026, 9, 5, 7, 0, 0))

  it('trae turnos y bloqueos, para que la demo se entienda sin configurar nada', () => {
    expect(semilla.reservas.length).toBeGreaterThanOrEqual(8)
    expect(semilla.bloqueos.length).toBeGreaterThanOrEqual(2)
  })

  it('todos los turnos apuntan a una terapia que existe en el catálogo', () => {
    const ids = TERAPIAS.map((t) => t.id)
    for (const r of semilla.reservas) {
      expect(ids, `${r.codigo} usa la terapia ${r.terapiaId}`).toContain(r.terapiaId)
    }
  })

  it('no repite códigos de reserva', () => {
    const codigos = semilla.reservas.map((r) => r.codigo)
    expect(new Set(codigos).size).toBe(codigos.length)
  })

  it('no agenda dos turnos confirmados en el mismo slot', () => {
    const ocupados = semilla.reservas
      .filter((r) => r.estado === 'confirmada')
      .map((r) => `${r.fecha}T${r.hora}`)
    expect(new Set(ocupados).size).toBe(ocupados.length)
  })

  it('no bloquea un slot que ya tiene un turno confirmado', () => {
    const ocupados = new Set(
      semilla.reservas.filter((r) => r.estado === 'confirmada').map((r) => `${r.fecha}T${r.hora}`),
    )
    for (const b of semilla.bloqueos) {
      expect(ocupados, `el bloqueo ${b.id} pisa un turno`).not.toContain(`${b.fecha}T${b.hora}`)
    }
  })

  it('cada paciente tiene nombre completo y celular paraguayo', () => {
    for (const r of semilla.reservas) {
      expect(r.nombre.trim().split(' ').length, `${r.nombre} no tiene apellido`).toBeGreaterThanOrEqual(2)
      expect(r.celular).toMatch(/^09\d{8}$/)
    }
  })

  it('cada bloqueo explica su motivo', () => {
    for (const b of semilla.bloqueos) {
      expect(b.motivo.length, `el bloqueo ${b.id} no dice por qué`).toBeGreaterThan(8)
    }
  })
})
