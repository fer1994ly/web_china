import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * FITNESS FUNCTIONS de arquitectura.
 *
 * Las reglas de Clean Architecture y de vertical slicing solo se sostienen si algo
 * las verifica. Son tests y no reglas de lint a proposito: corren dentro de
 * `npm run verify`, fallan con un mensaje que explica el porque, y no dependen
 * de la configuracion del linter de turno.
 */

const RAIZ = join(process.cwd(), 'src')

function archivosFuente(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) return archivosFuente(ruta)
    return /\.tsx?$/.test(nombre) ? [ruta] : []
  })
}

const TODOS = archivosFuente(RAIZ)
const rutaRelativa = (ruta: string) => relative(RAIZ, ruta).split(sep).join('/')
const leer = (ruta: string) => readFileSync(ruta, 'utf8')

/**
 * Codigo sin comentarios. Las reglas de abajo hablan de lo que el archivo HACE:
 * un comentario que menciona "localStorage" para explicar por que el dominio no
 * lo usa no es una violacion, es documentacion.
 */
const leerCodigo = (ruta: string): string =>
  leer(ruta)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

const esTest = (ruta: string) => /\.test\.tsx?$/.test(ruta)

/** Los `import ... from '...'` de un archivo. */
function importaciones(contenido: string): string[] {
  const encontrados: string[] = []
  const patron = /(?:^|\n)\s*(?:import|export)[^'"\n]*from\s+['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = patron.exec(contenido)) !== null) {
    if (m[1] !== undefined) encontrados.push(m[1])
  }
  return encontrados
}

describe('Regla de dependencia: el dominio es TypeScript puro', () => {
  const archivosDeDominio = TODOS.filter((r) => rutaRelativa(r).includes('/domain/') && !esTest(r))

  it('hay archivos de dominio para revisar', () => {
    expect(archivosDeDominio.length).toBeGreaterThan(10)
  })

  it.each(archivosDeDominio.map(rutaRelativa))('%s no importa React', (relativa) => {
    const ruta = join(RAIZ, relativa)
    for (const imp of importaciones(leer(ruta))) {
      expect(imp, `${relativa} importa ${imp}`).not.toMatch(/^react($|\/|-dom)/)
    }
  })

  it.each(archivosDeDominio.map(rutaRelativa))('%s no toca el navegador', (relativa) => {
    const ruta = join(RAIZ, relativa)
    const contenido = leerCodigo(ruta)
    for (const prohibido of ['localStorage', 'sessionStorage', 'document.', 'window.']) {
      expect(contenido, `${relativa} usa ${prohibido}`).not.toContain(prohibido)
    }
  })

  it.each(archivosDeDominio.map(rutaRelativa))('%s no importa de infrastructure ni de ui', (relativa) => {
    const ruta = join(RAIZ, relativa)
    for (const imp of importaciones(leer(ruta))) {
      expect(imp, `${relativa} importa ${imp}`).not.toMatch(/(^|\/)(infrastructure|ui)\//)
    }
  })

  // `new Date()` disperso en el dominio hace que "no se reserva en el pasado" sea
  // imposible de testear de forma determinista. El tiempo entra por el port Clock.
  it.each(archivosDeDominio.map(rutaRelativa))('%s no consulta la hora del sistema', (relativa) => {
    const ruta = join(RAIZ, relativa)
    if (relativa === 'shared/domain/clock.ts') return
    expect(leerCodigo(ruta), `${relativa} llama a new Date() sin argumentos`).not.toMatch(/new Date\(\s*\)/)
  })
})

describe('Regla de dependencia: application no conoce la UI', () => {
  const archivosDeAplicacion = TODOS.filter(
    (r) => rutaRelativa(r).includes('/application/') && !esTest(r),
  )

  it.each(archivosDeAplicacion.map(rutaRelativa))('%s no importa React ni componentes', (relativa) => {
    const ruta = join(RAIZ, relativa)
    for (const imp of importaciones(leer(ruta))) {
      expect(imp, `${relativa} importa ${imp}`).not.toMatch(/^react($|\/|-dom)/)
      expect(imp, `${relativa} importa ${imp}`).not.toMatch(/(^|\/)ui\//)
    }
  })
})

describe('Vertical slicing: cruzar de slice solo por el public API', () => {
  const sliceDe = (relativa: string): string | null => {
    const m = /^slices\/([^/]+)\//.exec(relativa)
    return m?.[1] ?? null
  }

  it('ningún slice importa los internos de otro slice', () => {
    const violaciones: string[] = []

    for (const ruta of TODOS) {
      const relativa = rutaRelativa(ruta)
      const propio = sliceDe(relativa)
      if (propio === null) continue

      for (const imp of importaciones(leer(ruta))) {
        const m = /^@\/slices\/([^/]+)(\/.*)?$/.exec(imp)
        const ajeno = m?.[1]
        const resto = m?.[2] ?? ''
        if (ajeno === undefined || ajeno === propio) continue

        // Se permite `@/slices/otro` y `@/slices/otro/ui/Algo` (la UI es composición
        // de pantallas). Lo prohibido es entrar a su domain, application o infrastructure.
        if (/^\/(domain|application|infrastructure)\//.test(resto)) {
          violaciones.push(`${relativa} → ${imp}`)
        }
      }
    }

    expect(violaciones, 'Importá desde el índice del slice, por ejemplo @/slices/agenda').toEqual([])
  })

  it('cada slice consumido desde afuera expone un index.ts', () => {
    const consumidos = new Set<string>()
    for (const ruta of TODOS) {
      const relativa = rutaRelativa(ruta)
      const propio = sliceDe(relativa)
      for (const imp of importaciones(leer(ruta))) {
        const m = /^@\/slices\/([^/]+)$/.exec(imp)
        if (m?.[1] !== undefined && m[1] !== propio) consumidos.add(m[1])
      }
    }

    expect(consumidos.size).toBeGreaterThan(0)
    for (const slice of consumidos) {
      const indice = join(RAIZ, 'slices', slice, 'index.ts')
      expect(() => statSync(indice), `falta src/slices/${slice}/index.ts`).not.toThrow()
    }
  })

  it('shared no importa de ningún slice', () => {
    for (const ruta of TODOS.filter((r) => rutaRelativa(r).startsWith('shared/'))) {
      const relativa = rutaRelativa(ruta)
      for (const imp of importaciones(leer(ruta))) {
        expect(imp, `${relativa} importa ${imp}`).not.toMatch(/^@\/slices\//)
      }
    }
  })
})

describe('Paleta: el terracota está reservado', () => {
  /**
   * El briefing lo reserva para cancelaciones y alertas puntuales. Es la clase de
   * regla que se viola sin querer al tercer día, asi que la fija un test.
   */
  const PERMITIDOS = [
    'index.css', // definición del token
    'shared/ui/componentes.tsx', // Aviso de alerta, botón de peligro, asterisco de campo obligatorio
    'slices/cancelacion-turno/ui/MiTurnoPage.tsx',
    'slices/admin-agenda/ui/AdminPage.tsx', // bloqueos y cancelaciones desde el panel
    // Borde de error de las tarjetas de terapia: un campo obligatorio sin completar
    // es una alerta puntual, la misma categoría que ya usan Entrada y Selección.
    'slices/reserva-turno/ui/SelectorDeTerapia.tsx',
  ]

  it('ningún otro archivo usa el color terracota', () => {
    const infractores = TODOS.filter((ruta) => {
      const relativa = rutaRelativa(ruta)
      if (PERMITIDOS.includes(relativa) || esTest(ruta)) return false
      return /terracota|#[Bb]4533[Cc]/.test(leerCodigo(ruta))
    }).map(rutaRelativa)

    expect(infractores, 'El terracota es solo para cancelaciones y alertas').toEqual([])
  })

  it('nadie escribe colores de la paleta a mano en vez de usar los tokens', () => {
    const HEX_PALETA = /#(2[Dd]5[Aa]43|7[Ee]9987|[Ff]8[Ff]6[Ff]0|242926)/
    const infractores = TODOS.filter((ruta) => {
      const relativa = rutaRelativa(ruta)
      return relativa !== 'index.css' && HEX_PALETA.test(leerCodigo(ruta))
    }).map(rutaRelativa)

    expect(infractores, 'Usá las utilidades de Tailwind (bg-jade, text-grafito…)').toEqual([])
  })
})

describe('El adapter de localStorage está aislado', () => {
  const PERMITIDOS = [
    'shared/infra/almacenamiento-local.ts',
    'slices/admin-acceso/infrastructure/sesion-admin.ts',
    // Le explica al paciente donde quedan sus datos: es texto de la pagina, no una llamada.
    'slices/contenido-institucional/ui/LegalPage.tsx',
  ]

  it('solo la capa de infraestructura habla con el navegador', () => {
    const infractores = TODOS.filter((ruta) => {
      const relativa = rutaRelativa(ruta)
      if (PERMITIDOS.includes(relativa) || esTest(ruta)) return false
      // `X.` o `X[`: una llamada real al almacenamiento, no una mencion en un texto.
      return /\b(localStorage|sessionStorage)\s*[.[]/.test(leerCodigo(ruta))
    }).map(rutaRelativa)

    expect(infractores, 'El acceso al almacenamiento pasa por shared/infra').toEqual([])
  })
})
