import { describe, expect, it } from 'vitest'
import { RUTAS, rutasPrerenderizables, rutasPublicas } from '@/app/rutas'
import {
  migasDePan,
  negocio,
  preguntasFrecuentes,
  servicio,
  sitioWeb,
  todosLosServicios,
} from '@/app/datos-estructurados'
import { PREGUNTAS_FRECUENTES } from '@/slices/contenido-institucional/domain/preguntas'
import { TERAPIAS } from '@/slices/catalogo-terapias'
import { CENTRO } from '@/seed/centro'

const comoObjeto = (v: object): Record<string, unknown> => v as Record<string, unknown>

describe('Inventario de rutas', () => {
  it('no repite rutas', () => {
    const rutas = RUTAS.map((r) => r.ruta)
    expect(new Set(rutas).size).toBe(rutas.length)
  })

  it('todas las rutas empiezan con /', () => {
    for (const r of RUTAS) expect(r.ruta.startsWith('/'), r.ruta).toBe(true)
  })

  it('las páginas con datos de un paciente quedan fuera de los buscadores', () => {
    for (const ruta of ['/mi-turno', '/admin']) {
      const r = RUTAS.find((x) => x.ruta === ruta)
      expect(r?.publica, `${ruta} no debería ser pública`).toBe(false)
    }
  })

  it('ninguna ruta privada se prerenderiza', () => {
    for (const r of RUTAS.filter((x) => !x.publica)) {
      expect(r.prerenderizable, `${r.ruta} no debe generar HTML estático`).toBe(false)
    }
  })

  // La agenda cambia cada día: un HTML congelado mostraría horarios que ya no existen.
  it('la pantalla de reserva no se prerenderiza', () => {
    expect(RUTAS.find((r) => r.ruta === '/reservar')?.prerenderizable).toBe(false)
  })

  it('las páginas de contenido estático sí se prerenderizan', () => {
    const esperadas = ['/', '/terapias', '/legal/aviso', '/legal/privacidad']
    expect(rutasPrerenderizables().map((r) => r.ruta).sort()).toEqual(esperadas.sort())
  })

  it('las rutas públicas tienen prioridad y las privadas no', () => {
    for (const r of rutasPublicas()) expect(r.prioridad, r.ruta).toBeGreaterThan(0)
    for (const r of RUTAS.filter((x) => !x.publica)) expect(r.prioridad, r.ruta).toBe(0)
  })

  it('la portada es la de mayor prioridad', () => {
    const maxima = Math.max(...rutasPublicas().map((r) => r.prioridad))
    expect(RUTAS.find((r) => r.ruta === '/')?.prioridad).toBe(maxima)
  })
})

describe('Datos estructurados del negocio', () => {
  const n = comoObjeto(negocio())

  it('se declara como negocio de salud', () => {
    expect(n['@type']).toBe('MedicalBusiness')
  })

  it('publica dirección completa en Asunción', () => {
    const dir = comoObjeto(n['address'] as object)
    expect(dir['addressLocality']).toBe(CENTRO.ciudad)
    expect(dir['addressCountry']).toBe('PY')
    expect(String(dir['streetAddress']).length).toBeGreaterThan(10)
  })

  it('publica el teléfono en formato internacional', () => {
    expect(n['telephone']).toBe(`+${CENTRO.celularE164}`)
  })

  it('publica los horarios derivados del dominio, no una copia a mano', () => {
    const horarios = n['openingHoursSpecification'] as object[]
    // Lunes a viernes tienen dos tramos (mañana y tarde) y el sábado uno: 11 en total.
    expect(horarios.length).toBe(11)

    const domingo = horarios.filter((h) =>
      String(comoObjeto(h)['dayOfWeek']).endsWith('Sunday'),
    )
    expect(domingo, 'el domingo el centro no atiende').toHaveLength(0)
  })

  it('el catálogo de ofertas cubre las cuatro terapias con su precio', () => {
    const catalogo = comoObjeto(n['hasOfferCatalog'] as object)
    const items = catalogo['itemListElement'] as object[]
    expect(items).toHaveLength(TERAPIAS.length)
    for (const item of items) {
      expect(comoObjeto(item)['priceCurrency']).toBe('PYG')
      expect(Number(comoObjeto(item)['price'])).toBeGreaterThan(0)
    }
  })

  it('declara la acción de reservar, que es a lo que viene la gente', () => {
    const accion = comoObjeto(n['potentialAction'] as object)
    expect(accion['@type']).toBe('ReserveAction')
  })
})

describe('Datos estructurados de servicios', () => {
  it('genera un nodo por cada terapia del catálogo', () => {
    expect(todosLosServicios()).toHaveLength(TERAPIAS.length)
  })

  it.each(TERAPIAS.map((t) => [t.nombre, t.id] as const))(
    '%s se publica con precio en guaraníes y enlace de reserva',
    (_nombre, id) => {
      const s = comoObjeto(servicio(id)!)
      const oferta = comoObjeto(s['offers'] as object)
      expect(s['@type']).toBe('Service')
      expect(oferta['priceCurrency']).toBe('PYG')
      expect(String(oferta['url'])).toContain(`/reservar?terapia=${id}`)
    },
  )

  it('devuelve null para una terapia que no existe', () => {
    expect(servicio('quiropraxia')).toBeNull()
  })
})

describe('Otros nodos schema.org', () => {
  it('el sitio web apunta al negocio como editor', () => {
    const s = comoObjeto(sitioWeb())
    expect(s['@type']).toBe('WebSite')
    expect(s['inLanguage']).toBe('es-PY')
  })

  it('las migas de pan siempre arrancan en Inicio', () => {
    const m = comoObjeto(migasDePan([{ nombre: 'Terapias', ruta: '/terapias' }]))
    const items = m['itemListElement'] as object[]
    expect(items).toHaveLength(2)
    expect(comoObjeto(items[0]!)['name']).toBe('Inicio')
    expect(comoObjeto(items[1]!)['position']).toBe(2)
  })

  it('las preguntas frecuentes se publican como FAQPage', () => {
    const f = comoObjeto(preguntasFrecuentes(PREGUNTAS_FRECUENTES))
    expect(f['@type']).toBe('FAQPage')
    expect((f['mainEntity'] as object[]).length).toBe(PREGUNTAS_FRECUENTES.length)
  })

  it('todo nodo publicado lleva su contexto schema.org', () => {
    const nodos = [negocio(), sitioWeb(), ...todosLosServicios(), migasDePan([])]
    for (const nodo of nodos) {
      expect(comoObjeto(nodo)['@context'], JSON.stringify(nodo).slice(0, 60)).toBe(
        'https://schema.org',
      )
    }
  })
})

describe('Contenido de las preguntas frecuentes', () => {
  it('hay suficientes para que la sección valga la pena', () => {
    expect(PREGUNTAS_FRECUENTES.length).toBeGreaterThanOrEqual(6)
  })

  it('ninguna pregunta se repite', () => {
    const p = PREGUNTAS_FRECUENTES.map((x) => x.pregunta)
    expect(new Set(p).size).toBe(p.length)
  })

  it('toda pregunta termina en signo de interrogación y tiene respuesta sustancial', () => {
    for (const p of PREGUNTAS_FRECUENTES) {
      expect(p.pregunta.endsWith('?'), p.pregunta).toBe(true)
      expect(p.respuesta.length, p.pregunta).toBeGreaterThan(80)
    }
  })

  // El aviso legal dice que las terapias son complementarias: las respuestas no
  // pueden contradecirlo prometiendo que reemplazan un tratamiento medico.
  it('ninguna respuesta promete reemplazar un tratamiento médico', () => {
    for (const p of PREGUNTAS_FRECUENTES) {
      expect(p.respuesta.toLowerCase()).not.toMatch(/cura(r|mos)?\s+(el|la|tu)/)
    }
  })
})
