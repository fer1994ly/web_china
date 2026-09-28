/**
 * Driver de localStorage con sobre versionado.
 *
 * Tres cosas que un `JSON.parse(localStorage.getItem(...))` suelto no resuelve y que
 * en una demo se pagan con pantalla en blanco:
 *  1. El JSON puede estar corrupto (el usuario lo editó desde DevTools).
 *  2. El esquema puede ser de una version anterior de la app.
 *  3. `localStorage` puede no existir (modo incognito estricto, iframe sin permisos).
 * En los tres casos se cae con gracia a los datos de ejemplo en memoria.
 */

interface Sobre<T> {
  readonly schemaVersion: number
  readonly data: T
}

/** Reemplazo en memoria cuando el navegador no da acceso a localStorage. */
class MemoriaVolatil implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  private mapa = new Map<string, string>()
  getItem(clave: string): string | null {
    return this.mapa.get(clave) ?? null
  }
  setItem(clave: string, valor: string): void {
    this.mapa.set(clave, valor)
  }
  removeItem(clave: string): void {
    this.mapa.delete(clave)
  }
}

function almacenDisponible(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    const sonda = '__centro_qi_sonda__'
    window.localStorage.setItem(sonda, '1')
    window.localStorage.removeItem(sonda)
    return window.localStorage
  } catch {
    return new MemoriaVolatil()
  }
}

export class AlmacenamientoLocal<T> {
  private readonly almacen = almacenDisponible()

  constructor(
    private readonly clave: string,
    private readonly schemaVersion: number,
    private readonly semilla: () => T,
  ) {}

  leer(): T {
    const crudo = this.almacen.getItem(this.clave)
    if (crudo === null) return this.sembrar()

    try {
      const sobre = JSON.parse(crudo) as Partial<Sobre<T>>
      if (sobre.schemaVersion !== this.schemaVersion || sobre.data === undefined) {
        return this.sembrar()
      }
      return sobre.data
    } catch {
      // JSON ilegible: preferimos una demo que funciona a un error que no dice nada.
      return this.sembrar()
    }
  }

  escribir(data: T): void {
    const sobre: Sobre<T> = { schemaVersion: this.schemaVersion, data }
    try {
      this.almacen.setItem(this.clave, JSON.stringify(sobre))
    } catch {
      // Cuota llena: la sesion sigue con lo que ya esta en memoria.
    }
  }

  /** Vuelve a los datos de ejemplo. Es lo que dispara el boton de reinicio del panel. */
  reiniciar(): T {
    return this.sembrar()
  }

  private sembrar(): T {
    const datos = this.semilla()
    this.escribir(datos)
    return datos
  }
}
