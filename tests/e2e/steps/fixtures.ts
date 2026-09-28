// El `test` base tiene que venir de playwright-bdd, no de @playwright/test:
// es el que trae las fixtures que usan los steps generados desde los .feature.
import { test as base, createBdd } from 'playwright-bdd'

/**
 * Instante congelado para toda la suite: lunes 5 de octubre de 2026, 07:00 en Asunción
 * (Paraguay es UTC-3 todo el año desde 2024). Antes de que el centro abra, así ningún
 * slot del primer día cuenta como pasado y los escenarios no dependen de la hora real
 * en que se corren.
 */
export const INSTANTE_DEMO = '2026-10-05T10:00:00.000Z'

/** Estado que los pasos se pasan entre sí dentro de un escenario. */
export class Contexto {
  fechaElegida = ''
  horaTomada = ''
  codigo = ''
  terapia = ''
  nombre = ''
}

export const test = base.extend<{ ctx: Contexto }>({
  // Playwright exige que el primer parametro sea un patron de desestructuracion, aunque
  // no se use ninguna fixture. El segundo se llama `usar` y no `use` para que el linter
  // deje de confundir esta funcion de Playwright con el hook `use` de React.
  // oxlint-disable-next-line no-empty-pattern
  ctx: async ({}, usar) => {
    await usar(new Contexto())
  },
})

export const { Given, When, Then } = createBdd(test)
