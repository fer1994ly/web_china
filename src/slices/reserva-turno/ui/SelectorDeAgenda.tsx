import { cx } from '@/shared/ui/cx'
import { SinResultados } from '@/shared/ui/componentes'
import type { DiaDeAgenda, EstadoSlot, SlotConEstado } from '@/slices/agenda'

const LEYENDA: Record<Exclude<EstadoSlot, 'disponible'>, string> = {
  reservado: 'Ocupado',
  bloqueado: 'No disponible',
  pasado: 'Ya pasó',
}

export function TiraDeDias({
  dias,
  seleccionada,
  onElegir,
}: {
  dias: readonly DiaDeAgenda[]
  seleccionada: string
  onElegir: (fechaIso: string) => void
}) {
  if (dias.length === 0) {
    return <SinResultados>No hay días de atención cargados en la agenda.</SinResultados>
  }

  return (
    /* `tira-scroll` mantiene el desplazamiento dentro de esta caja: a 360px la tira
       se desliza pero el documento nunca se ensancha (criterio CA-07). */
    <div className="tira-scroll -mx-1 flex gap-2 px-1 pb-2" role="radiogroup" aria-label="Día del turno">
      {dias.map((d) => {
        const activo = d.fecha.iso === seleccionada
        return (
          <button
            key={d.fecha.iso}
            type="button"
            role="radio"
            aria-checked={activo}
            data-testid="dia"
            data-fecha={d.fecha.iso}
            data-libres={d.cantidadLibre}
            onClick={() => onElegir(d.fecha.iso)}
            className={cx(
              'flex w-[5.5rem] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-colors',
              activo
                ? 'border-jade bg-jade text-blanco'
                : 'border-salvia-claro bg-blanco text-grafito hover:border-jade',
              !d.hayLugar && !activo && 'opacity-55',
            )}
          >
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide">
              {d.etiqueta.split(' ')[0]}
            </span>
            <span className="font-titulo text-xl leading-none">{d.fecha.dia}</span>
            <span className={cx('text-[0.65rem]', activo ? 'text-salvia-niebla' : 'text-grafito-tenue')}>
              {d.cantidadLibre > 0 ? `${d.cantidadLibre} libres` : 'completo'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function GrillaDeHorarios({
  slots,
  seleccionado,
  sinDiaElegido,
  onElegir,
}: {
  slots: readonly SlotConEstado[]
  seleccionado: string
  sinDiaElegido: boolean
  onElegir: (hora: string) => void
}) {
  // Dos vacios distintos con causas distintas: un solo mensaje generico dejaria a
  // la paciente sin saber si tiene que elegir un dia o cambiar de dia.
  if (sinDiaElegido) {
    return <SinResultados>Elegí primero un día en la tira de arriba.</SinResultados>
  }

  if (slots.length === 0) {
    return <SinResultados>El centro no atiende ese día. Elegí otra fecha en la tira de arriba.</SinResultados>
  }

  const libres = slots.filter((s) => s.estado === 'disponible').length

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Horario del turno">
        {slots.map((s) => {
          const disponible = s.estado === 'disponible'
          const activo = disponible && s.hora.texto === seleccionado
          const etiquetaEstado = disponible ? '' : LEYENDA[s.estado]

          return (
            <button
              key={s.hora.texto}
              type="button"
              role="radio"
              aria-checked={activo}
              disabled={!disponible}
              data-testid="slot"
              data-hora={s.hora.texto}
              data-estado={s.estado}
              title={s.motivo !== '' ? s.motivo : undefined}
              onClick={() => onElegir(s.hora.texto)}
              aria-label={disponible ? `${s.hora.texto} disponible` : `${s.hora.texto} ${etiquetaEstado}`}
              className={cx(
                'flex flex-col items-center justify-center rounded-xl border px-1 py-2 text-sm font-semibold transition-colors',
                activo && 'border-jade bg-jade text-blanco',
                disponible && !activo && 'border-salvia-claro bg-blanco text-grafito hover:border-jade',
                !disponible && 'cursor-not-allowed border-lino-hondo bg-lino-hondo text-grafito-tenue line-through',
              )}
            >
              {s.hora.texto}
              {!disponible && (
                <span className="text-[0.6rem] font-normal no-underline">{etiquetaEstado}</span>
              )}
            </button>
          )
        })}
      </div>

      {libres === 0 && (
        <p className="mt-3 text-sm text-grafito-suave">
          Ese día ya está completo. Probá con otra fecha en la tira de arriba.
        </p>
      )}
    </>
  )
}
