import { err, ok, type Result } from '@/shared/domain/result'
import { errorDeDominio, type DomainError } from '@/shared/domain/domain-error'

/** Sin I, O, 0 ni 1: el paciente lee este codigo de una pantalla y lo tipea. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const LARGO = 6
const FORMATO = new RegExp(`^QI-[${ALFABETO}]{${LARGO}}$`)

export class CodigoReserva {
  private constructor(readonly valor: string) {}

  static crear(entrada: string): Result<CodigoReserva, DomainError> {
    const normalizado = entrada.trim().toUpperCase().replace(/\s/g, '')
    const conPrefijo = normalizado.startsWith('QI-') ? normalizado : `QI-${normalizado}`
    if (!FORMATO.test(conPrefijo)) {
      return err(
        errorDeDominio('CODIGO_INVALIDO', 'El código de reserva tiene el formato QI-XXXXXX.'),
      )
    }
    return ok(new CodigoReserva(conPrefijo))
  }

  /** `aleatorio` se inyecta para que los tests y el seed sean deterministas. */
  static generar(aleatorio: () => number = Math.random): CodigoReserva {
    let cuerpo = ''
    for (let i = 0; i < LARGO; i += 1) {
      const indice = Math.floor(aleatorio() * ALFABETO.length) % ALFABETO.length
      cuerpo += ALFABETO[indice] ?? 'A'
    }
    return new CodigoReserva(`QI-${cuerpo}`)
  }

  equals(otro: CodigoReserva): boolean {
    return this.valor === otro.valor
  }

  toString(): string {
    return this.valor
  }
}
