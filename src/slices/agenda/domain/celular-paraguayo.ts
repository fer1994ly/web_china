import { err, ok, type Result } from '@/shared/domain/result'
import { errorDeDominio, type DomainError } from '@/shared/domain/domain-error'

/** Movil paraguayo normalizado: 10 digitos que empiezan en 09. */
const NACIONAL = /^09\d{8}$/

export class CelularParaguayo {
  private constructor(private readonly nacional: string) {}

  /**
   * Acepta lo que la gente realmente escribe: "0981456789", "0981 456 789",
   * "0981-456-789", "+595 981 456 789", "595981456789".
   */
  static crear(entrada: string): Result<CelularParaguayo, DomainError> {
    const soloDigitos = entrada.replace(/\D/g, '')
    if (soloDigitos.length === 0) {
      return err(errorDeDominio('CELULAR_REQUERIDO', 'Necesitamos tu celular para confirmarte el turno.'))
    }

    let nacional = soloDigitos
    if (nacional.startsWith('595')) nacional = `0${nacional.slice(3)}`

    if (!NACIONAL.test(nacional)) {
      return err(
        errorDeDominio(
          'CELULAR_INVALIDO',
          'Ingresá un celular paraguayo válido, por ejemplo 0981 456 789.',
        ),
      )
    }
    return ok(new CelularParaguayo(nacional))
  }

  /** "0981 456 789" */
  get formateado(): string {
    return `${this.nacional.slice(0, 4)} ${this.nacional.slice(4, 7)} ${this.nacional.slice(7)}`
  }

  /** "0981456789" — como se guarda. */
  get plano(): string {
    return this.nacional
  }

  /** "595981456789" — formato que espera wa.me, sin signo ni espacios. */
  get e164(): string {
    return `595${this.nacional.slice(1)}`
  }

  equals(otro: CelularParaguayo): boolean {
    return this.nacional === otro.nacional
  }
}
