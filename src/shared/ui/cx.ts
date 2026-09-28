/**
 * Une clases ignorando los falsy. Vive en su propio archivo para que
 * `componentes.tsx` exporte solo componentes y Fast Refresh siga funcionando.
 */
export const cx = (...clases: (string | false | null | undefined)[]): string =>
  clases.filter(Boolean).join(' ')
