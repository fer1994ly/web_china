import { describe, expect, it } from 'vitest'
import { etiquetasSeo, SITIO, type DatosSeo } from '@/shared/seo/etiquetas'
import {
  etiquetasComoHtml,
  paginaEstatica,
  plantillaDeLaSpa,
} from '@/shared/seo/pagina-estatica'

/**
 * El prerenderizado es lo que hace que un enlace compartido por WhatsApp muestre una
 * tarjeta con titulo y foto, y que Google lea la pagina sin ejecutar JavaScript. Si se
 * rompe, no se nota mirando el sitio: se nota semanas despues en el Search Console.
 * De ahi que estas piezas sean funciones puras y se testeen con un string.
 */

/** Una plantilla con la misma forma que la que emite Vite. */
const PLANTILLA = [
  '<!doctype html>',
  '<html lang="es-PY">',
  '  <head>',
  '    <meta charset="UTF-8" />',
  '    <meta name="description" content="Descripción genérica del sitio" />',
  '    <title>Centro Qi · Terapias Orientales en Asunción</title>',
  '  </head>',
  '  <body>',
  '    <div id="root"></div>',
  '    <script type="module" src="/assets/index.js"></script>',
  '  </body>',
  '</html>',
].join('\n')

const SEO: DatosSeo = {
  titulo: 'Terapias | Centro Qi',
  descripcion: 'Las cuatro terapias del centro, con duración y precio.',
  ruta: '/terapias',
}

const contar = (texto: string, patron: RegExp) => texto.match(patron)?.length ?? 0

describe('Etiquetas de <head> como HTML', () => {
  const html = etiquetasComoHtml(SEO)

  it('escribe el título y la descripción de la página', () => {
    expect(html).toContain('<title>Terapias | Centro Qi</title>')
    expect(html).toContain(`content="${SEO.descripcion}"`)
  })

  it('la canónica y la imagen de Open Graph son absolutas', () => {
    expect(html).toContain(`<link rel="canonical" href="${SITIO.url}/terapias">`)
    expect(html).toContain(`content="${SITIO.url}/img/acupuntura.jpg"`)
  })

  it('escribe todas las etiquetas que describe el modelo, sin perder ninguna', () => {
    // La lista de `etiquetas.ts` es la fuente de verdad; esto verifica que el
    // serializador no se saltee un caso del `switch`.
    expect(contar(html, /<(title|meta|link|script)\b/g)).toBe(etiquetasSeo(SEO).length)
  })

  it('escapa las comillas del contenido en lugar de romper el atributo', () => {
    const conComillas = etiquetasComoHtml({ ...SEO, titulo: 'Acupuntura "de verdad"' })
    // Dentro de un atributo la comilla lo cerraria antes de tiempo y el resto del
    // titulo pasaria a ser markup.
    expect(conComillas).toContain('content="Acupuntura &quot;de verdad&quot;"')
    // Como texto de un elemento, en cambio, la comilla no significa nada.
    expect(conComillas).toContain('<title>Acupuntura "de verdad"</title>')
  })

  it('escapa los signos de mayor y menor, que si romperian el markup', () => {
    const conMarkup = etiquetasComoHtml({ ...SEO, titulo: '<script>alert(1)</script>' })
    expect(conMarkup).toContain('<title>&lt;script&gt;alert(1)&lt;/script&gt;</title>')
    expect(conMarkup).not.toContain('<title><script>')
  })

  it('un </script> dentro del JSON-LD no cierra la etiqueta antes de tiempo', () => {
    const conTrampa = etiquetasComoHtml({
      ...SEO,
      datosEstructurados: [{ '@type': 'Service', name: '</script><script>alert(1)' }],
    })
    expect(conTrampa).not.toContain('</script><script>alert(1)')
    // La barra escapada: `<\/script>` dentro del JSON ya no cierra la etiqueta.
    expect(conTrampa).toContain('<\\/script>')
    // Sigue habiendo exactamente un cierre: el de la etiqueta de datos estructurados.
    expect(contar(conTrampa, /<\/script>/g)).toBe(1)
  })

  it('las páginas privadas se marcan noindex', () => {
    expect(etiquetasComoHtml({ ...SEO, noIndexar: true })).toContain(
      'content="noindex, nofollow"',
    )
  })
})

describe('Inyección en la plantilla', () => {
  const html = paginaEstatica(PLANTILLA, { seo: SEO, cuerpo: '<h1>Terapias</h1>' })

  it('deja exactamente un título y una descripción', () => {
    // Dos descripciones es peor que ninguna: Google elige una y no es la que quisiste.
    expect(contar(html, /<title>/g)).toBe(1)
    expect(contar(html, /name="description"/g)).toBe(1)
  })

  it('el título y la descripción que quedan son los de la página, no los genéricos', () => {
    expect(html).toContain('<title>Terapias | Centro Qi</title>')
    expect(html).not.toContain('Descripción genérica del sitio')
    expect(html).not.toContain('<title>Centro Qi · Terapias Orientales en Asunción</title>')
  })

  it('el cuerpo renderizado va dentro de #root', () => {
    expect(html).toContain('<div id="root"><h1>Terapias</h1></div>')
  })

  it('conserva el resto de la plantilla: el script del bundle y el idioma', () => {
    expect(html).toContain('<script type="module" src="/assets/index.js"></script>')
    expect(html).toContain('<html lang="es-PY">')
    expect(html).toContain('<meta charset="UTF-8" />')
  })

  it('sin cuerpo publica los metadatos y deja #root vacío', () => {
    // Es lo que se hace con `/reservar`: metadatos para el buscador, agenda al día
    // armada por el navegador.
    const soloCabeza = paginaEstatica(PLANTILLA, { seo: SEO })
    expect(soloCabeza).toContain('<div id="root"></div>')
    expect(soloCabeza).toContain('<title>Terapias | Centro Qi</title>')
  })

  it('sin metadatos deja la plantilla como estaba', () => {
    const sinSeo = paginaEstatica(PLANTILLA, { cuerpo: '<h1>Hola</h1>' })
    expect(sinSeo).toContain('<title>Centro Qi · Terapias Orientales en Asunción</title>')
    expect(sinSeo).toContain('<div id="root"><h1>Hola</h1></div>')
  })

  // Si Vite cambia la forma del HTML que emite, es mejor que el build falle que
  // publicar páginas sin metadatos y enterarse por el Search Console.
  it('falla ruidosamente si la plantilla no tiene #root', () => {
    expect(() => paginaEstatica('<html><head></head><body></body></html>', { seo: SEO })).toThrow(
      /root/,
    )
  })

  it('falla ruidosamente si la plantilla no tiene </head>', () => {
    expect(() => paginaEstatica('<div id="root"></div>', { seo: SEO })).toThrow(/head/)
  })
})

describe('La plantilla de reserva de la SPA', () => {
  const spa = plantillaDeLaSpa(PLANTILLA)

  /**
   * Todo lo que se sirve con esta plantilla es privado (`/admin`, `/mi-turno`) o no
   * existe. Que el `noindex` esté en el HTML y no lo ponga `useSeo` al montar importa:
   * el panel se carga en un módulo aparte, así que hubo una ventana —corta pero real—
   * en la que la página ya respondía y todavía no decía que no debía indexarse.
   */
  it('viene marcada noindex desde el HTML, sin depender de JavaScript', () => {
    expect(spa).toMatch(/<meta name="robots" content="noindex[^"]*">/)
  })

  it('trae una sola etiqueta robots, para que useSeo actualice esa y no agregue otra', () => {
    expect(contar(spa, /name="robots"/g)).toBe(1)
  })

  it('deja #root vacío y conserva el script del bundle', () => {
    expect(spa).toContain('<div id="root"></div>')
    expect(spa).toContain('<script type="module" src="/assets/index.js"></script>')
  })

  it('no toca el título genérico: la pantalla que monte pondrá el suyo', () => {
    expect(spa).toContain('<title>Centro Qi · Terapias Orientales en Asunción</title>')
    expect(contar(spa, /<title>/g)).toBe(1)
  })

  it('falla ruidosamente si la plantilla no tiene </head>', () => {
    expect(() => plantillaDeLaSpa('<div id="root"></div>')).toThrow(/head/)
  })
})
