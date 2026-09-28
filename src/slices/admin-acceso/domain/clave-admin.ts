/**
 * Acceso al panel.
 *
 * SIMULADO A PROPOSITO: una clave fija en el bundle no es seguridad. Cumple el
 * criterio CA-04 (bloquear la vista hasta ingresar el valor correcto) y nada mas.
 * Kodarvia reemplaza esto por autenticacion real contra su backend.
 */
export const CLAVE_ADMIN = 'qi2026'

export function claveEsCorrecta(entrada: string): boolean {
  return entrada.trim() === CLAVE_ADMIN
}

export const MENSAJE_CLAVE_INCORRECTA = 'La clave no es correcta. Volvé a intentar.'
