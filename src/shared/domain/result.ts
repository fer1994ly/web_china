/**
 * Result explicito: el dominio nunca lanza excepciones para reglas de negocio.
 * Un fallo de negocio es un valor que el caso de uso debe manejar, no un throw
 * que la UI pueda ignorar por accidente.
 */
export type Result<T, E> = Ok<T> | Err<E>

export interface Ok<T> {
  readonly ok: true
  readonly value: T
}

export interface Err<E> {
  readonly ok: false
  readonly error: E
}

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })

export const esOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok
export const esErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok

/** Desempaqueta o lanza. Solo para tests y seeds, nunca en la UI. */
export function desempaquetar<T, E>(r: Result<T, E>): T {
  if (r.ok) return r.value
  throw new Error(`Result en error: ${JSON.stringify(r.error)}`)
}
