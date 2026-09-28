import { err, ok, type Result } from '@/shared/domain/result'
import { errorDeDominio, type DomainError } from '@/shared/domain/domain-error'

const LETRAS = /^[\p{L}][\p{L}\s'.-]*$/u

export class NombrePaciente {
  private constructor(readonly valor: string) {}

  static crear(entrada: string): Result<NombrePaciente, DomainError> {
    const limpio = entrada.trim().replace(/\s+/g, ' ')
    if (limpio.length === 0) {
      return err(errorDeDominio('NOMBRE_REQUERIDO', 'Contanos tu nombre y apellido.'))
    }
    if (limpio.length < 3) {
      return err(errorDeDominio('NOMBRE_CORTO', 'El nombre es demasiado corto.'))
    }
    if (limpio.length > 80) {
      return err(errorDeDominio('NOMBRE_LARGO', 'El nombre no puede superar los 80 caracteres.'))
    }
    if (!LETRAS.test(limpio)) {
      return err(errorDeDominio('NOMBRE_INVALIDO', 'El nombre solo puede tener letras.'))
    }
    return ok(new NombrePaciente(limpio))
  }

  get primerNombre(): string {
    return this.valor.split(' ')[0] ?? this.valor
  }

  toString(): string {
    return this.valor
  }
}
