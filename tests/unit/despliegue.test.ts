import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  cabecerasPara,
  coincide,
  leerNetlifyToml,
  redireccionPara,
} from '../../scripts/netlify-config.mjs'
import { RUTAS, rutasPrerenderizables, rutasServidasPorLaSpa } from '@/app/rutas'

/**
 * FITNESS FUNCTIONS del despliegue.
 *
 * `netlify.toml` decide cosas que ningun test de la app puede ver y que se rompen en
 * silencio: que una ruta nueva no caiga en la reserva de la SPA, que una URL
 * inexistente devuelva 200 y Google la indexe, que la CSP bloquee la hoja de estilos y
 * el sitio salga en blanco. Peor todavia: el build entero puede ser imposible de correr
 * en Netlify, y eso no se nota hasta que falla el deploy.
 *
 * Que estas reglas sean tests significa que se sabe en `npm run verify`, antes de
 * subir, y no leyendo el log de un deploy fallado.
 */

const config = leerNetlifyToml()
const paquete = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
  devDependencies: Record<string, string>
}

/** Todos los comandos que llegan a correr durante un build de Netlify. */
function comandosDelBuild(): string[] {
  const vistos: string[] = []
  const expandir = (comando: string): void => {
    vistos.push(comando)
    for (const [, nombre] of comando.matchAll(/npm run ([\w:]+)/g)) {
      const guion = nombre === undefined ? undefined : paquete.scripts[nombre]
      if (guion !== undefined) expandir(guion)
    }
  }
  expandir(config.build.command)
  return vistos
}

describe('El build puede correr en Netlify', () => {
  it('publica el directorio que genera Vite', () => {
    expect(config.build.publish).toBe('dist')
  })

  it('el comando de build es el del package.json', () => {
    expect(config.build.command).toBe('npm run build')
  })

  /**
   * LA RAZON POR LA QUE ESTE ARCHIVO EXISTE.
   *
   * El prerenderizado se hacia abriendo un Chromium con Playwright, asi que el build
   * empezaba con `npx playwright install --with-deps chromium`. `--with-deps` es un
   * `apt-get install` de las librerias de sistema del navegador, y el contenedor de
   * build de Netlify no permite instalar paquetes del sistema: el deploy fallaba
   * siempre. Ahora se renderiza con `react-dom/server`, que es Node y nada mas.
   */
  it('ningún paso del build necesita un navegador', () => {
    for (const comando of comandosDelBuild()) {
      expect(comando, `"${comando}" instala un navegador durante el build`).not.toMatch(
        /playwright\s+install|puppeteer|--with-deps/,
      )
    }
  })

  it('el build no invoca Playwright de ninguna forma', () => {
    // `npm run csp` y los E2E sí usan Chromium, pero corren en `npm run verify`, en la
    // máquina de quien publica. No pueden colarse en el camino del build.
    for (const comando of comandosDelBuild()) {
      expect(comando, `"${comando}" usa Playwright`).not.toMatch(/playwright|npm run csp/)
    }
  })

  it('el prerenderizador no importa un navegador', () => {
    const fuente = readFileSync('scripts/prerender.mjs', 'utf8')
    expect(fuente).not.toMatch(/from 'playwright'/)
    expect(fuente, 'el prerenderizado sale de la entrada de servidor').toMatch(/entrada-servidor/)
  })

  it('Playwright está declarado como dependencia de desarrollo, no dado por sentado', () => {
    // `scripts/verificar-csp.mjs` hace `import { chromium } from 'playwright'`. Antes
    // funcionaba sólo porque @playwright/test lo arrastra: un detalle de cómo npm
    // acomoda node_modules, no algo con lo que se pueda contar.
    expect(paquete.devDependencies['playwright']).toBeDefined()
  })

  it('pide una versión de Node que sepa quitar los tipos de un .ts', () => {
    // `scripts/seo.mjs` importa `src/app/rutas.ts` directamente.
    expect(Number(config.build.environment.NODE_VERSION)).toBeGreaterThanOrEqual(23)
  })
})

describe('Cada ruta llega a donde tiene que llegar', () => {
  it('las rutas prerenderizadas no dependen de una redirección propia', () => {
    // Netlify sirve el archivo estático antes de mirar las redirecciones, así que estas
    // rutas se resuelven con su HTML y no necesitan ninguna regla.
    for (const { ruta } of rutasPrerenderizables()) {
      const regla = redireccionPara(config, ruta)
      expect(regla?.from, `${ruta} depende de una redirección propia`).not.toBe(ruta)
    }
  })

  it('toda ruta sin HTML propio cae en la plantilla de la SPA con estado 200', () => {
    const declaradas = rutasServidasPorLaSpa().map((r) => r.ruta)
    expect(declaradas.length, 'no hay rutas servidas por la SPA').toBeGreaterThan(0)

    for (const ruta of declaradas) {
      const regla = redireccionPara(config, ruta)
      expect(regla, `falta la redirección de ${ruta} en netlify.toml`).not.toBeNull()
      expect(regla?.to, ruta).toBe('/spa.html')
      expect(regla?.status, `${ruta} tiene que responder 200`).toBe(200)
    }
  })

  it('netlify.toml no redirige rutas que ya no existen', () => {
    const conocidas = RUTAS.map((r) => r.ruta)
    for (const regla of config.redirects.filter((r) => !r.from.includes('*'))) {
      expect(conocidas, `netlify.toml redirige ${regla.from}, que no está en RUTAS`).toContain(
        regla.from,
      )
    }
  })

  /**
   * Con la reserva en 200 —como estaba— cualquier URL rota se indexa como una página
   * más del sitio, y el sitemap deja de ser la lista de lo que existe.
   */
  it('una URL inexistente responde 404 de verdad', () => {
    const regla = redireccionPara(config, '/una-ruta-que-no-existe')
    expect(regla?.status).toBe(404)
    expect(regla?.to).toBe('/spa.html')
  })

  it('la reserva es spa.html y nunca index.html, que ahora es la portada renderizada', () => {
    for (const regla of config.redirects) {
      expect(regla.to, `${regla.from} cae en ${regla.to}`).not.toBe('/index.html')
    }
  })

  it('el comodín va último: una regla después de él sería inalcanzable', () => {
    const comodin = config.redirects.findIndex((r) => r.from === '/*')
    expect(comodin).toBe(config.redirects.length - 1)
  })
})

describe('Cabeceras de producción', () => {
  const csp = (): string => String(cabecerasPara(config, '/')['Content-Security-Policy'])

  it('toda respuesta lleva las cabeceras de seguridad', () => {
    const cabeceras = cabecerasPara(config, '/')
    expect(cabeceras['X-Content-Type-Options']).toBe('nosniff')
    expect(cabeceras['Referrer-Policy']).toBeDefined()
    expect(cabeceras['X-Frame-Options']).toBeDefined()
  })

  it('la CSP no permite scripts en línea ni de terceros', () => {
    expect(csp()).toContain("script-src 'self'")
    expect(csp(), 'un script-src con unsafe-inline no protege de nada').not.toMatch(
      /script-src[^;]*unsafe-inline/,
    )
  })

  it('la CSP ya no necesita abrirle la puerta a los dominios de Google Fonts', () => {
    // Las fuentes se sirven desde `public/fonts`. Si alguien vuelve a poner el <link> a
    // fonts.googleapis.com, la CSP lo bloquea y este test explica por qué.
    expect(csp()).not.toContain('fonts.googleapis.com')
    expect(csp()).not.toContain('fonts.gstatic.com')
    expect(csp()).toContain("font-src 'self'")
  })

  it('los archivos con hash se cachean para siempre y el HTML se revalida', () => {
    expect(cabecerasPara(config, '/assets/index-abc123.js')['Cache-Control']).toContain('immutable')
    expect(cabecerasPara(config, '/fonts/jakarta-latin.woff2')['Cache-Control']).toContain(
      'immutable',
    )
    // Sin esto, un deploy nuevo no se ve hasta que expira la caché del visitante.
    expect(cabecerasPara(config, '/')['Cache-Control']).toContain('must-revalidate')
  })

  it('el HTML prerenderizado de las subcarpetas también se revalida', () => {
    for (const { ruta } of rutasPrerenderizables()) {
      expect(cabecerasPara(config, ruta)['Cache-Control'], ruta).toContain('must-revalidate')
    }
  })

  it('la plantilla de la SPA no se indexa: es un detalle de implementación', () => {
    expect(cabecerasPara(config, '/spa.html')['X-Robots-Tag']).toContain('noindex')
  })

  /**
   * Netlify resuelve las cabeceras por la ruta PEDIDA, no por el archivo que termina
   * sirviendo: la regla de `/spa.html` no alcanza a `/admin`, aunque sea el archivo que
   * recibe. Cada ruta privada necesita la suya.
   */
  it.each(rutasServidasPorLaSpa().map((r) => r.ruta))('%s se sirve con noindex', (ruta) => {
    expect(cabecerasPara(config, ruta)['X-Robots-Tag'], `${ruta} podría indexarse`).toContain(
      'noindex',
    )
  })
})

describe('Coincidencia de patrones de Netlify', () => {
  it('un patrón sin comodín es una ruta exacta', () => {
    expect(coincide('/admin', '/admin')).toBe(true)
    expect(coincide('/admin', '/admin/agenda')).toBe(false)
  })

  it('el comodín coincide con lo que empieza igual', () => {
    expect(coincide('/assets/*', '/assets/index.js')).toBe(true)
    expect(coincide('/assets/*', '/img/foto.jpg')).toBe(false)
    expect(coincide('/*', '/cualquier/cosa')).toBe(true)
  })
})
