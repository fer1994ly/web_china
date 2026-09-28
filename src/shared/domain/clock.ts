/**
 * Port de reloj. El dominio jamas llama `new Date()` directamente:
 * las reglas "no se puede reservar en el pasado" solo son testeables
 * de forma determinista si el tiempo es una dependencia inyectada.
 */
export interface Clock {
  ahora(): Date
}

export const relojDelSistema: Clock = {
  ahora: () => new Date(),
}

/** Reloj fijo para tests y para los escenarios E2E. */
export function relojFijo(fecha: Date): Clock {
  return { ahora: () => new Date(fecha.getTime()) }
}
