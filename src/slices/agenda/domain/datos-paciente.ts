import type { CelularParaguayo } from './celular-paraguayo'
import type { NombrePaciente } from './nombre-paciente'

/** Identidad minima del paciente: el centro no maneja cuentas ni contrasenas. */
export class DatosPaciente {
  constructor(
    readonly nombre: NombrePaciente,
    readonly celular: CelularParaguayo,
    /** Opcional: "dolor lumbar hace dos semanas". Vacio si el paciente no escribe nada. */
    readonly motivoConsulta: string = '',
  ) {}
}
