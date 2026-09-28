/**
 * Genera robots.txt y sitemap.xml dentro de `dist/`, despues del build.
 *
 * Importa `src/app/rutas.ts` directamente: Node 24 quita los tipos por su cuenta.
 * Asi el inventario de rutas vive en un unico archivo y es imposible que una pagina
 * nueva quede fuera del sitemap, o que una pagina privada entre en el por descuido.
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { RUTAS } from '../src/app/rutas.ts'

const DIST = 'dist'
const SITIO = (process.env.VITE_SITE_URL ?? 'https://centroqi.com.py').replace(/\/$/, '')
const HOY = new Date().toISOString().slice(0, 10)

const publicas = RUTAS.filter((r) => r.publica)
const privadas = RUTAS.filter((r) => !r.publica)

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicas
  .map(
    (r) => `  <url>
    <loc>${SITIO}${r.ruta}</loc>
    <lastmod>${HOY}</lastmod>
    <changefreq>${r.frecuencia}</changefreq>
    <priority>${r.prioridad.toFixed(1)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

const robots = `# ${SITIO}
User-agent: *
Allow: /
${privadas.map((r) => `Disallow: ${r.ruta}`).join('\n')}

Sitemap: ${SITIO}/sitemap.xml
`

await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8')
await writeFile(join(DIST, 'robots.txt'), robots, 'utf8')

console.log(
  `SEO: sitemap.xml con ${publicas.length} rutas públicas, ` +
    `robots.txt bloqueando ${privadas.length} → ${SITIO}`,
)
