/** PUBLIC API del slice `catalogo-terapias`. */
export type { Terapia } from './domain/terapia'
export { duracionLegible, precioEnGuaranies } from './domain/terapia'
export { buscarTerapia, nombreDeTerapia, TERAPIAS } from './infrastructure/catalogo'
