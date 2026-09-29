// oxlint-disable react/only-export-components
//
// El archivo exporta funciones y no componentes. La regla existe para que Fast Refresh
// funcione, y Fast Refresh no tiene nada que hacer aca: este modulo no se carga nunca
// en el navegador, solo lo importa `scripts/prerender.mjs` durante la compilacion.

/**
 * Entrada de compilacion: renderiza una ruta a HTML sin navegador.
 *
 * POR QUE EXISTE. Antes el prerenderizado levantaba Chromium con Playwright y le
 * pedia el `document.documentElement.outerHTML` de cada pagina. Funcionaba en una
 * maquina de desarrollo y NO funciona en Netlify: el contenedor de build no puede
 * correr `apt-get` para instalar las librerias del sistema que pide un Chromium
 * headless, asi que `playwright install --with-deps` falla y con el todo el deploy.
 *
 * Ahora las paginas se renderizan con `react-dom/server`, que es el mismo React que
 * despues las hidrata. No hay navegador, ni descarga de 150 MB, ni puerto que
 * escuchar: es una funcion de ruta a string. El build pasa de ~30 s a menos de 2 s y
 * corre igual en cualquier CI.
 *
 * Este archivo se compila aparte (`vite build --ssr`) y solo lo consume
 * `scripts/prerender.mjs`. El bundle del navegador no lo incluye.
 */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { Pantallas } from './App'
import { ProveedorAgenda } from './ProveedorAgenda'
import { ContextoSumideroSeo, type DatosSeo } from '@/shared/seo/useSeo'
import { paginaEstatica } from '@/shared/seo/pagina-estatica'

export { plantillaDeLaSpa } from '@/shared/seo/pagina-estatica'

export { RUTAS, rutasPrerenderizables, rutasSoloMetadatos } from './rutas'

export interface Renderizado {
  /** El HTML del arbol, listo para ir dentro de `#root`. */
  readonly cuerpo: string
  /**
   * Los metadatos que declaro la pagina con `useSeo`. Puede faltar si la pantalla no
   * declara ninguno, y entonces la plantilla conserva los genericos de `index.html`.
   */
  readonly seo: DatosSeo | undefined
}

export function renderizarRuta(ruta: string): Renderizado {
  const recogidos: DatosSeo[] = []

  const cuerpo = renderToString(
    <ContextoSumideroSeo.Provider value={{ registrar: (d) => recogidos.push(d) }}>
      <ProveedorAgenda>
        <StaticRouter location={ruta}>
          <Pantallas />
        </StaticRouter>
      </ProveedorAgenda>
    </ContextoSumideroSeo.Provider>,
  )

  // El ultimo gana: si una pantalla anida otra que tambien declara metadatos, la de
  // adentro es la mas especifica.
  return { cuerpo, seo: recogidos.at(-1) }
}

/**
 * El HTML completo de una ruta, sobre la plantilla que emitio Vite.
 *
 * `conCuerpo: false` publica solo la cabeza y deja `#root` vacio. Es lo que se hace
 * con `/reservar`: sus metadatos y sus datos estructurados son fijos y conviene que
 * un buscador los lea sin ejecutar JavaScript, pero su cuerpo es la agenda del dia y
 * congelarlo mostraria horarios que ya pasaron.
 */
export function htmlDeLaRuta(
  plantilla: string,
  ruta: string,
  { conCuerpo = true }: { conCuerpo?: boolean } = {},
): string {
  const { cuerpo, seo } = renderizarRuta(ruta)
  return paginaEstatica(plantilla, { seo, cuerpo: conCuerpo ? cuerpo : '' })
}
