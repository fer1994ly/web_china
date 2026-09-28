import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'

import { cx } from './cx'

// --- Botones ---------------------------------------------------------------

type Tono = 'jade' | 'salvia' | 'contorno' | 'peligro'

const TONOS: Record<Tono, string> = {
  jade: 'bg-jade text-blanco hover:bg-jade-hondo active:bg-jade-hondo',
  salvia: 'bg-salvia text-blanco hover:bg-salvia/90',
  contorno: 'bg-blanco text-jade border border-salvia-claro hover:border-jade hover:bg-salvia-niebla',
  // Terracota: reservado por el briefing para cancelaciones y alertas.
  peligro: 'bg-terracota text-blanco hover:brightness-95',
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tono?: Tono
  anchoCompleto?: boolean
}

export function Boton({ tono = 'jade', anchoCompleto = false, className, ...props }: BotonProps) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3',
        'text-[0.95rem] font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-45',
        TONOS[tono],
        anchoCompleto && 'w-full',
        className,
      )}
    />
  )
}

// --- Campos de formulario --------------------------------------------------

interface CampoProps {
  id: string
  etiqueta: string
  error?: string | undefined
  ayuda?: string
  obligatorio?: boolean
  children: ReactNode
}

/**
 * Envoltorio de campo con etiqueta, ayuda y aviso de error.
 * Conecta `aria-describedby` y `aria-invalid` para que el aviso de CA-01
 * lo anuncien tambien los lectores de pantalla, no solo el color.
 */
export function Campo({ id, etiqueta, error, ayuda, obligatorio = false, children }: CampoProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-grafito">
        {etiqueta}
        {obligatorio && (
          <span className="ml-1 text-terracota" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {ayuda !== undefined && (
        <p id={`${id}-ayuda`} className="text-xs text-grafito-suave">
          {ayuda}
        </p>
      )}
      {children}
      {error !== undefined && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-terracota"
        >
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}
    </div>
  )
}

const BASE_CONTROL =
  'w-full rounded-xl border bg-blanco px-4 py-3 text-grafito placeholder:text-grafito-tenue ' +
  'transition-colors focus:border-jade focus:outline-none min-h-[44px]'

const borde = (hayError: boolean) => (hayError ? 'border-terracota' : 'border-salvia-claro')

export function Entrada({
  hayError = false,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { hayError?: boolean }) {
  return <input {...props} aria-invalid={hayError} className={cx(BASE_CONTROL, borde(hayError), className)} />
}

export function Seleccion({
  hayError = false,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { hayError?: boolean }) {
  return <select {...props} aria-invalid={hayError} className={cx(BASE_CONTROL, borde(hayError), className)} />
}

// --- Contenedores ----------------------------------------------------------

export function Tarjeta({
  className,
  children,
  ...resto
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...resto}
      className={cx('rounded-2xl border border-salvia-niebla bg-blanco sombra-tarjeta', className)}
    >
      {children}
    </div>
  )
}

/**
 * Ancho maximo y canaleta lateral en un solo lugar.
 *
 * `px-4` garantiza los 16px de margen a 360px que pide el criterio CA-07.
 * `lectura` (por defecto) mantiene los textos en un ancho comodo de leer;
 * `amplio` se usa donde hay grillas de tarjetas, que a 1280px se verian apretadas
 * dentro de una sola columna de lectura.
 */
export function Contenedor({
  className,
  ancho = 'lectura',
  children,
}: {
  className?: string
  ancho?: 'lectura' | 'amplio' | undefined
  children: ReactNode
}) {
  return (
    <div
      className={cx(
        'mx-auto w-full px-4 sm:px-6',
        ancho === 'amplio' ? 'max-w-6xl' : 'max-w-3xl',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Seccion({
  titulo,
  copete,
  id,
  className,
  ancho,
  children,
}: {
  titulo: string
  copete?: string
  id?: string
  className?: string
  ancho?: 'lectura' | 'amplio' | undefined
  children: ReactNode
}) {
  return (
    <section id={id} className={cx('py-10 sm:py-14', className)}>
      <Contenedor ancho={ancho}>
        <h2 className="text-2xl text-jade sm:text-3xl">{titulo}</h2>
        {copete !== undefined && <p className="mt-2 max-w-xl text-grafito-suave">{copete}</p>}
        <div className="mt-6">{children}</div>
      </Contenedor>
    </section>
  )
}

// --- Avisos ----------------------------------------------------------------

type TonoAviso = 'info' | 'alerta'

/** `alerta` es el unico lugar, junto con la cancelacion, donde entra el terracota. */
export function Aviso({
  tono = 'info',
  titulo,
  children,
}: {
  tono?: TonoAviso
  titulo?: string
  children: ReactNode
}) {
  const esAlerta = tono === 'alerta'
  return (
    <div
      role={esAlerta ? 'alert' : 'status'}
      className={cx(
        'rounded-xl border px-4 py-3 text-sm',
        esAlerta
          ? 'border-terracota/35 bg-terracota-tenue text-terracota'
          : 'border-salvia-claro bg-salvia-niebla text-jade',
      )}
    >
      {titulo !== undefined && <p className="font-semibold">{titulo}</p>}
      <div className={titulo !== undefined ? 'mt-1' : undefined}>{children}</div>
    </div>
  )
}

export function Sello({
  children,
  className,
  ...resto
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...resto}
      className={cx(
        'inline-flex items-center rounded-full bg-salvia-niebla px-3 py-1 text-xs font-semibold text-jade',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Estado vacio con texto propio: nunca un hueco en blanco sin explicacion. */
export function SinResultados({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-salvia-claro px-4 py-8 text-center text-sm text-grafito-suave">
      {children}
    </p>
  )
}
