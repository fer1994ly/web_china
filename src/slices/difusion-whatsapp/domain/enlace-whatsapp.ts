import type { Reserva } from '@/slices/agenda'
import { CENTRO, direccionCompleta } from '@/seed/centro'

export interface DatosDelTurno {
  readonly nombrePaciente: string
  readonly terapia: string
  readonly fecha: string
  readonly hora: string
  readonly codigo: string
}

/**
 * Construye el deep link de WhatsApp del turno confirmado.
 *
 * SIMULADO: abrir este enlace deja el mensaje escrito en WhatsApp para que la persona
 * lo envie. La app no manda nada por su cuenta y no habla con ninguna API de mensajeria.
 *
 * `wa.me` exige el numero en formato internacional sin signos ni espacios, y el texto
 * codificado como componente de URL: de ahi `encodeURIComponent`.
 */
export function enlaceDeWhatsApp(datos: DatosDelTurno, telefonoE164: string = CENTRO.celularE164): string {
  const texto = mensajeDelTurno(datos)
  return `https://wa.me/${telefonoE164}?text=${encodeURIComponent(texto)}`
}

export function mensajeDelTurno(datos: DatosDelTurno): string {
  return [
    `Hola ${CENTRO.nombre}, confirmo mi turno.`,
    '',
    `Paciente: ${datos.nombrePaciente}`,
    `Terapia: ${datos.terapia}`,
    `Fecha: ${datos.fecha}`,
    `Hora: ${datos.hora}`,
    `Código: ${datos.codigo}`,
    '',
    `Dirección: ${direccionCompleta()}`,
  ].join('\n')
}

export function datosDelTurno(reserva: Reserva, nombreTerapia: string): DatosDelTurno {
  return {
    nombrePaciente: reserva.paciente.nombre.valor,
    terapia: nombreTerapia,
    fecha: reserva.fecha.etiquetaLarga,
    hora: reserva.hora.texto,
    codigo: reserva.codigo.valor,
  }
}

/** Enlace generico de consulta, para el boton flotante de la landing. */
export function enlaceDeConsulta(): string {
  const texto = `Hola ${CENTRO.nombre}, quiero consultar por un turno.`
  return `https://wa.me/${CENTRO.celularE164}?text=${encodeURIComponent(texto)}`
}
