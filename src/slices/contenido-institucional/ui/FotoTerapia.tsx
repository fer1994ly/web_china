import { useState } from 'react'
import { cx } from '@/shared/ui/cx'
import type { Terapia } from '@/slices/catalogo-terapias'

/**
 * Foto de la terapia con reserva propia.
 *
 * Si el archivo no esta (una copia del repo sin las imagenes, o sin red la primera vez),
 * en lugar de un cuadro roto se dibuja un motivo en la paleta del centro. Nunca un
 * placeholder gris generico: el briefing pide justamente evitar eso.
 */
export function FotoTerapia({ terapia, className }: { terapia: Terapia; className?: string }) {
  const [fallo, setFallo] = useState(false)

  if (fallo) {
    return (
      <div className={cx('flex items-center justify-center bg-salvia-niebla', className)}>
        <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label={terapia.imagenAlt}>
          <rect width="120" height="120" fill="var(--color-salvia-niebla)" />
          <g fill="none" stroke="var(--color-salvia)" strokeWidth="1.1" opacity="0.75">
            <circle cx="60" cy="60" r="34" />
            <circle cx="60" cy="60" r="24" />
            <circle cx="60" cy="60" r="14" />
            <path d="M60 12v96M12 60h96" strokeDasharray="3 6" />
          </g>
          <circle cx="60" cy="60" r="5" fill="var(--color-jade)" />
          <text
            x="60"
            y="106"
            textAnchor="middle"
            fontSize="8"
            fontFamily="Cinzel, serif"
            fill="var(--color-jade)"
          >
            {terapia.nombre}
          </text>
        </svg>
      </div>
    )
  }

  return (
    <img
      src={terapia.imagen}
      alt={terapia.imagenAlt}
      loading="lazy"
      decoding="async"
      onError={() => setFallo(true)}
      className={cx('object-cover', className)}
    />
  )
}
