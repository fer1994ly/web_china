/**
 * Tipos de `netlify-config.mjs`.
 *
 * El script es JavaScript porque corre en Node durante el build, sin pasar por Vite ni
 * por `tsc`. Pero `tests/unit/despliegue.test.ts` lo importa para verificar las reglas
 * de despliegue, y ahí sí hace falta que el compilador sepa qué forma tiene lo que
 * devuelve: sin esto, las reglas se comprobarían contra un `any`, que es justo lo que
 * no queremos en una fitness function.
 */

export interface Redireccion {
  readonly from: string
  readonly to: string
  readonly status?: number
}

export interface ReglaDeCabeceras {
  readonly for: string
  readonly values?: Readonly<Record<string, string>>
}

export interface ConfigNetlify {
  readonly build: {
    readonly command: string
    readonly publish: string
    readonly environment: Readonly<Record<string, string>>
    /** Post-procesado de Netlify. Ver `pretty_urls` en `netlify.toml`. */
    readonly processing?: {
      readonly skip_processing?: boolean
      readonly html?: { readonly pretty_urls?: boolean }
    }
  }
  readonly redirects: readonly Redireccion[]
  readonly headers: readonly ReglaDeCabeceras[]
}

export function leerNetlifyToml(ruta?: string): ConfigNetlify

/** `/*` y `/assets/*` como predicado sobre la ruta pedida. */
export function coincide(patron: string, ruta: string): boolean

/** La primera redirección que aplica a `ruta`, o null. */
export function redireccionPara(config: ConfigNetlify, ruta: string): Redireccion | null

/** Todas las cabeceras que aplican a `ruta`, de la más general a la más específica. */
export function cabecerasPara(
  config: ConfigNetlify,
  ruta: string,
): Readonly<Record<string, string>>
