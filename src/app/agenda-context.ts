import { createContext, useContext } from 'react'
import type { Contenedor } from './container'

export interface EstadoAgenda extends Contenedor {
  /**
   * Cambia con cada escritura. Los componentes lo usan como dependencia de `useMemo`
   * para releer el repositorio despues de reservar, cancelar o bloquear.
   *
   * Es deliberadamente un contador y no un cache de datos: la unica fuente de verdad
   * sigue siendo el repositorio, asi dos pantallas abiertas nunca se contradicen.
   */
  readonly revision: number
  refrescar(): void
}

export const ContextoAgenda = createContext<EstadoAgenda | null>(null)

export function useAgenda(): EstadoAgenda {
  const ctx = useContext(ContextoAgenda)
  if (ctx === null) {
    throw new Error('useAgenda debe usarse dentro de <ProveedorAgenda>')
  }
  return ctx
}
