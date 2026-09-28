import { relojDelSistema, type Clock } from '@/shared/domain/clock'
import { HorarioAtencion, type AgendaRepository } from '@/slices/agenda'
import { AgendaLocalStorageRepo } from '@/slices/agenda/infrastructure/agenda.localstorage.repo'

/**
 * COMPOSITION ROOT.
 *
 * El unico lugar de la aplicacion donde se elige una implementacion concreta.
 * Todo lo demas recibe el port. Cuando Kodarvia conecte su API, se cambia aca
 * `AgendaLocalStorageRepo` por `AgendaHttpRepo` y no se toca nada mas.
 */
export interface Contenedor {
  readonly agenda: AgendaRepository
  readonly reloj: Clock
  readonly horario: HorarioAtencion
}

export function crearContenedor(reloj: Clock = relojDelSistema): Contenedor {
  const horario = HorarioAtencion.delCentro()
  return {
    agenda: new AgendaLocalStorageRepo(horario, () => reloj.ahora()),
    reloj,
    horario,
  }
}

/**
 * Los E2E congelan el tiempo escribiendo una fecha ISO en `window.__RELOJ_DEMO__`
 * antes de que cargue la app. Sin esto, un escenario que corre a las 18:59 y otro
 * que corre a las 19:01 ven agendas distintas y la suite se vuelve intermitente.
 */
declare global {
  interface Window {
    __RELOJ_DEMO__?: string
  }
}

export function relojDeLaApp(): Clock {
  if (typeof window !== 'undefined' && typeof window.__RELOJ_DEMO__ === 'string') {
    const fijo = new Date(window.__RELOJ_DEMO__)
    if (!Number.isNaN(fijo.getTime())) return { ahora: () => new Date(fijo.getTime()) }
  }
  return relojDelSistema
}
