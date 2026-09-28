import { cx } from '@/shared/ui/cx'
import { duracionLegible, precioEnGuaranies, TERAPIAS } from '@/slices/catalogo-terapias'

/**
 * Tarjetas de terapia en lugar de un <select>.
 *
 * Un desplegable esconde precio y duracion detras de un toque, justo el dato que
 * la gente compara antes de decidir. Las tarjetas los muestran los cuatro a la vez
 * y dan un objetivo tactil grande, que en el celular importa mas que el ahorro de espacio.
 *
 * Se mantiene la semantica de radiogroup para que el teclado y los lectores de
 * pantalla lo entiendan igual que al <select> que reemplaza.
 */
export function SelectorDeTerapia({
  seleccionada,
  hayError,
  onElegir,
}: {
  seleccionada: string
  hayError: boolean
  onElegir: (terapiaId: string) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Terapia"
      aria-invalid={hayError}
      className="grid gap-2 sm:grid-cols-2"
    >
      {TERAPIAS.map((t) => {
        const activa = t.id === seleccionada
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={activa}
            data-testid="terapia"
            data-terapia={t.id}
            onClick={() => onElegir(t.id)}
            className={cx(
              'flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors',
              activa
                ? 'border-jade bg-jade text-blanco'
                : hayError
                  ? 'border-terracota bg-blanco text-grafito hover:border-jade'
                  : 'border-salvia-claro bg-blanco text-grafito hover:border-jade',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="font-titulo text-base leading-tight">{t.nombre}</span>
              <span
                aria-hidden="true"
                className={cx(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  activa ? 'border-blanco bg-blanco' : 'border-salvia-claro',
                )}
              >
                {activa && <span className="h-2.5 w-2.5 rounded-full bg-jade" />}
              </span>
            </span>
            <span
              className={cx(
                'mt-1 text-xs',
                activa ? 'text-salvia-niebla' : 'text-grafito-suave',
              )}
            >
              {duracionLegible(t.duracionMinutos)} · {precioEnGuaranies(t.precioGs)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Barra fija con lo que se lleva elegido y el boton de confirmar.
 *
 * En el celular el boton de confirmar queda al final de un formulario largo: hay que
 * volver a bajar despues de elegir el horario. Esta barra lo deja siempre a mano y,
 * de paso, hace visible lo que falta completar.
 */
export function BarraDeResumen({
  terapia,
  dia,
  hora,
  onConfirmar,
}: {
  terapia: string
  dia: string
  hora: string
  onConfirmar: () => void
}) {
  const partes = [terapia, dia, hora].filter((p) => p !== '')
  const completo = partes.length === 3

  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 border-t border-salvia-niebla bg-lino/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <p className="min-w-0 flex-1 text-xs leading-snug text-grafito-suave" data-testid="resumen-reserva">
          {completo ? (
            <span className="font-semibold text-grafito">{partes.join(' · ')}</span>
          ) : partes.length === 0 ? (
            'Elegí terapia, día y horario'
          ) : (
            <>
              <span className="font-semibold text-grafito">{partes.join(' · ')}</span>
              <span className="block text-grafito-tenue">
                {dia === '' ? 'Falta el día' : 'Falta el horario'}
              </span>
            </>
          )}
        </p>

        <button
          type="button"
          onClick={onConfirmar}
          data-testid="confirmar-reserva"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-jade px-6 py-3 text-[0.95rem] font-semibold text-blanco transition-colors hover:bg-jade-hondo"
        >
          Confirmar turno
        </button>
      </div>
    </div>
  )
}
