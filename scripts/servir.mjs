/**
 * `npm run preview`: la build de produccion servida como la servira Netlify.
 *
 * Es tambien el `webServer` de la suite E2E, para que los escenarios corran contra el
 * mismo comportamiento que el sitio publicado y no contra el de `vite preview`.
 */
import { levantar } from './servidor-estatico.mjs'

const argumentos = process.argv.slice(2)
const leer = (bandera, pordefecto) => {
  const i = argumentos.indexOf(bandera)
  return i === -1 ? pordefecto : argumentos[i + 1]
}

const puerto = Number(leer('--port', '4173'))
const { base } = await levantar({ puerto })

console.log(`  ➜  ${base}/   (dist/ con las reglas de netlify.toml)`)
