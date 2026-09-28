import { errorDeDominio, type DomainError } from '@/shared/domain/domain-error'
import type { HoraSlot } from './hora-slot'
import type { FechaAgenda } from './fecha-agenda'

/**
 * Codigos estables: los tests y la UI se apoyan en el codigo, nunca en el texto.
 * El texto es para el paciente y puede cambiar sin romper nada.
 */
export const CodigoError = {
  SLOT_YA_RESERVADO: 'SLOT_YA_RESERVADO',
  SLOT_BLOQUEADO: 'SLOT_BLOQUEADO',
  SLOT_EN_EL_PASADO: 'SLOT_EN_EL_PASADO',
  FUERA_DE_HORARIO: 'FUERA_DE_HORARIO',
  DIA_CERRADO: 'DIA_CERRADO',
  RESERVA_NO_ENCONTRADA: 'RESERVA_NO_ENCONTRADA',
  RESERVA_YA_CANCELADA: 'RESERVA_YA_CANCELADA',
  SLOT_YA_BLOQUEADO: 'SLOT_YA_BLOQUEADO',
  BLOQUEO_NO_ENCONTRADO: 'BLOQUEO_NO_ENCONTRADO',
} as const

export const slotYaReservado = (hora: HoraSlot): DomainError =>
  errorDeDominio(
    CodigoError.SLOT_YA_RESERVADO,
    `El horario de las ${hora.texto} acaba de ser tomado. Elegí otro, por favor.`,
  )

export const slotBloqueado = (hora: HoraSlot): DomainError =>
  errorDeDominio(
    CodigoError.SLOT_BLOQUEADO,
    `El centro no atiende a las ${hora.texto} ese día.`,
  )

export const slotEnElPasado = (hora: HoraSlot): DomainError =>
  errorDeDominio(
    CodigoError.SLOT_EN_EL_PASADO,
    `Las ${hora.texto} ya pasaron. Elegí un horario posterior.`,
  )

export const fueraDeHorario = (hora: HoraSlot): DomainError =>
  errorDeDominio(
    CodigoError.FUERA_DE_HORARIO,
    `Las ${hora.texto} están fuera del horario de atención.`,
  )

export const diaCerrado = (fecha: FechaAgenda): DomainError =>
  errorDeDominio(
    CodigoError.DIA_CERRADO,
    `El centro no atiende el ${fecha.etiquetaLarga}.`,
  )

export const reservaNoEncontrada = (codigo: string): DomainError =>
  errorDeDominio(
    CodigoError.RESERVA_NO_ENCONTRADA,
    `No encontramos ninguna reserva con el código ${codigo}.`,
  )

export const reservaYaCancelada = (codigo: string): DomainError =>
  errorDeDominio(
    CodigoError.RESERVA_YA_CANCELADA,
    `La reserva ${codigo} ya había sido cancelada.`,
  )

export const slotYaBloqueado = (hora: HoraSlot): DomainError =>
  errorDeDominio(
    CodigoError.SLOT_YA_BLOQUEADO,
    `El horario de las ${hora.texto} ya está bloqueado.`,
  )

export const bloqueoNoEncontrado = (hora: HoraSlot): DomainError =>
  errorDeDominio(
    CodigoError.BLOQUEO_NO_ENCONTRADO,
    `No hay ningún bloqueo a las ${hora.texto}.`,
  )
