/**
 * La sesion del panel vive en sessionStorage, no en localStorage: cerrar la pestana
 * deja el panel bloqueado otra vez, que es lo que espera quien atiende en el mostrador.
 */
const CLAVE_SESION = 'centro-qi:sesion-admin'

export const sesionAdmin = {
  estaAbierta(): boolean {
    try {
      return window.sessionStorage.getItem(CLAVE_SESION) === 'abierta'
    } catch {
      return false
    }
  },
  abrir(): void {
    try {
      window.sessionStorage.setItem(CLAVE_SESION, 'abierta')
    } catch {
      /* sin sessionStorage la sesion dura lo que dure el componente */
    }
  },
  cerrar(): void {
    try {
      window.sessionStorage.removeItem(CLAVE_SESION)
    } catch {
      /* nada que limpiar */
    }
  },
}
