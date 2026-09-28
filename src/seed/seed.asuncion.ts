import type { DatosAgenda, ReservaDTO, BloqueoDTO } from '@/slices/agenda/infrastructure/agenda.dto'
import { FechaAgenda } from '@/slices/agenda/domain/fecha-agenda'
import { HorarioAtencion } from '@/slices/agenda/domain/horario-atencion'

/**
 * Datos de ejemplo del Centro Qi.
 *
 * Se generan en relacion al dia en que se abre la demo, no con fechas fijas: una demo
 * con turnos de 2026 congelados se ve rota en 2027. Todos los turnos caen en dias
 * habiles futuros, para que el revisor vea una agenda con uso real al entrar.
 */

interface PlantillaReserva {
  /** Indice dentro de los proximos dias habiles: 0 = el proximo dia que el centro atiende. */
  readonly diaHabil: number
  readonly hora: string
  readonly terapiaId: string
  readonly nombre: string
  readonly celular: string
  readonly motivoConsulta: string
  readonly codigo: string
  readonly cancelada?: boolean
}

interface PlantillaBloqueo {
  readonly diaHabil: number
  readonly hora: string
  readonly motivo: string
}

const RESERVAS: readonly PlantillaReserva[] = [
  {
    diaHabil: 0,
    hora: '09:00',
    terapiaId: 'acupuntura',
    nombre: 'Mariana Ojeda',
    celular: '0972334118',
    motivoConsulta: 'Contractura en el cuello desde hace dos semanas.',
    codigo: 'QI-K7R2MP',
  },
  {
    diaHabil: 0,
    hora: '15:00',
    terapiaId: 'reflexologia',
    nombre: 'Hugo Fretes',
    celular: '0994512330',
    motivoConsulta: 'Trabajo parado todo el día, piernas pesadas.',
    codigo: 'QI-B4XQ73',
  },
  {
    diaHabil: 1,
    hora: '08:00',
    terapiaId: 'auriculoterapia',
    nombre: 'Rocío Gaona',
    celular: '0961887205',
    motivoConsulta: 'Quiero dejar de fumar, segunda sesión.',
    codigo: 'QI-M9TC45',
  },
  {
    diaHabil: 1,
    hora: '17:00',
    terapiaId: 'acupuntura',
    nombre: 'Sofía Núñez',
    celular: '0983604172',
    motivoConsulta: 'Migrañas los fines de semana.',
    codigo: 'QI-H2VD68',
  },
  {
    diaHabil: 2,
    hora: '10:00',
    terapiaId: 'moxibustion',
    nombre: 'Carmen Duarte',
    celular: '0992317664',
    motivoConsulta: 'Cólicos fuertes, me recomendó mi ginecóloga.',
    codigo: 'QI-P5NW29',
  },
  {
    diaHabil: 2,
    hora: '16:00',
    terapiaId: 'reflexologia',
    nombre: 'Blas Cáceres',
    celular: '0975448901',
    motivoConsulta: 'Vengo cada mes, sesión de mantenimiento.',
    codigo: 'QI-T3JF87',
  },
  {
    diaHabil: 3,
    hora: '11:00',
    terapiaId: 'acupuntura',
    nombre: 'Alejandro Riveros',
    celular: '0986725013',
    motivoConsulta: 'Dolor lumbar después de mudanza.',
    codigo: 'QI-Z8LG54',
  },
  {
    diaHabil: 4,
    hora: '14:00',
    terapiaId: 'auriculoterapia',
    nombre: 'Patricia Villalba',
    celular: '0971209583',
    motivoConsulta: 'Ansiedad antes de rendir la tesis.',
    codigo: 'QI-R6SK32',
  },
  {
    // Cancelada: deja ver el historial y libera el slot. Sostiene el escenario de CA-03.
    diaHabil: 3,
    hora: '15:00',
    terapiaId: 'moxibustion',
    nombre: 'Gustavo Benítez',
    celular: '0981775240',
    motivoConsulta: 'Rodilla que duele con el frío.',
    codigo: 'QI-W4YH96',
    cancelada: true,
  },
]

const BLOQUEOS: readonly PlantillaBloqueo[] = [
  { diaHabil: 1, hora: '10:00', motivo: 'Capacitación del equipo' },
  { diaHabil: 1, hora: '11:00', motivo: 'Capacitación del equipo' },
  { diaHabil: 2, hora: '18:00', motivo: 'Mantenimiento de la sala 2' },
]

/** Los proximos `cantidad` dias en los que el centro efectivamente atiende. */
export function proximosDiasHabiles(desde: Date, cantidad: number): FechaAgenda[] {
  const horario = HorarioAtencion.delCentro()
  const dias: FechaAgenda[] = []
  let cursor = FechaAgenda.desdeDate(desde)

  // Si hoy ya pasó la última hora, igual lo incluimos: la vista marca los slots como pasados.
  for (let i = 0; i < 60 && dias.length < cantidad; i += 1) {
    if (horario.atiende(cursor)) dias.push(cursor)
    cursor = cursor.sumarDias(1)
  }
  return dias
}

export function construirSemilla(ahora: Date): DatosAgenda {
  const dias = proximosDiasHabiles(ahora, 14)
  const creadaEn = ahora.toISOString()

  const reservas: ReservaDTO[] = RESERVAS.flatMap((p) => {
    const fecha = dias[p.diaHabil]
    if (!fecha) return []
    return [
      {
        codigo: p.codigo,
        fecha: fecha.iso,
        hora: p.hora,
        terapiaId: p.terapiaId,
        nombre: p.nombre,
        celular: p.celular,
        motivoConsulta: p.motivoConsulta,
        estado: p.cancelada === true ? ('cancelada' as const) : ('confirmada' as const),
        creadaEn,
        canceladaEn: p.cancelada === true ? creadaEn : null,
      },
    ]
  })

  const bloqueos: BloqueoDTO[] = BLOQUEOS.flatMap((p) => {
    const fecha = dias[p.diaHabil]
    if (!fecha) return []
    return [
      {
        id: `${fecha.iso}T${p.hora}`,
        fecha: fecha.iso,
        hora: p.hora,
        motivo: p.motivo,
        creadoEn: creadaEn,
      },
    ]
  })

  return { reservas, bloqueos }
}
