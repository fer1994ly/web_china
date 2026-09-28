/**
 * Error de dominio tipado. El `codigo` es estable y testeable;
 * el `mensaje` es texto para el paciente, en espanol.
 */
export interface DomainError {
  readonly codigo: string
  readonly mensaje: string
}

export const errorDeDominio = (codigo: string, mensaje: string): DomainError => ({
  codigo,
  mensaje,
})
