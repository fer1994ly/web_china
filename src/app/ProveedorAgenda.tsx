import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { crearContenedor, relojDeLaApp } from './container'
import { ContextoAgenda, type EstadoAgenda } from './agenda-context'
import type { Clock } from '@/shared/domain/clock'

export function ProveedorAgenda({ children, reloj }: { children: ReactNode; reloj?: Clock }) {
  const [revision, setRevision] = useState(0)
  const refrescar = useCallback(() => setRevision((n) => n + 1), [])

  // El contenedor se crea una sola vez: cambiar de repositorio en caliente
  // dejaria media pantalla leyendo del anterior.
  const contenedor = useMemo(() => crearContenedor(reloj ?? relojDeLaApp()), [reloj])

  const valor = useMemo<EstadoAgenda>(
    () => ({ ...contenedor, revision, refrescar }),
    [contenedor, revision, refrescar],
  )

  return <ContextoAgenda.Provider value={valor}>{children}</ContextoAgenda.Provider>
}
