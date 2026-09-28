import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cx } from './cx'

/**
 * En una SPA el navegador conserva el scroll al cambiar de ruta: abrir "Terapias"
 * desde el pie de pagina te deja a mitad de la pagina nueva. Esto lo corrige, salvo
 * cuando el enlace apunta a un ancla concreta.
 */
export function ScrollAlInicio() {
  const { pathname, hash } = useLocation()
  const primeraCarga = useRef(true)

  useEffect(() => {
    const esPrimeraCarga = primeraCarga.current
    primeraCarga.current = false

    if (hash !== '') {
      // En una SPA el elemento del ancla no existe cuando el navegador intenta
      // saltar solo, asi que el salto lo hacemos nosotros una vez montada la vista.
      // Sin esto, compartir "/#preguntas" deja al visitante arriba de todo.
      const destino = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (destino !== null) {
        destino.scrollIntoView({ behavior: esPrimeraCarga ? 'instant' : 'smooth' })
        return
      }
    }

    // Sin ancla: en la primera carga se respeta la posicion que trae el navegador
    // (una recarga a mitad de pagina, por ejemplo). Al navegar, se vuelve arriba.
    if (esPrimeraCarga) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

export interface Miga {
  readonly nombre: string
  readonly ruta: string
}

/** Migas de pan: orientan en el sitio y alimentan el BreadcrumbList de schema.org. */
export function MigasDePan({ tramos }: { tramos: readonly Miga[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-grafito-tenue">
        <li>
          <Link to="/" className="hover:text-jade hover:underline">
            Inicio
          </Link>
        </li>
        {tramos.map((t, i) => (
          <li key={t.ruta} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {i === tramos.length - 1 ? (
              <span className="font-medium text-grafito-suave" aria-current="page">
                {t.nombre}
              </span>
            ) : (
              <Link to={t.ruta} className="hover:text-jade hover:underline">
                {t.nombre}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Acordeon accesible construido con <details>/<summary>.
 *
 * El elemento nativo ya trae el teclado, el foco y el anuncio de estado resueltos,
 * y el contenido queda en el DOM aunque este plegado: los buscadores lo leen igual.
 */
export function Desplegable({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="group border-b border-salvia-niebla last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-left font-semibold text-grafito marker:hidden hover:text-jade">
        <span>{titulo}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-salvia transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="pb-4 text-sm leading-relaxed text-grafito-suave">{children}</div>
    </details>
  )
}

/**
 * Boton flotante que sube al inicio. Aparece recien cuando ya bajaste bastante,
 * para no tapar contenido en pantallas chicas.
 */
export function VolverArriba() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const alScrollear = () => setVisible(window.scrollY > 900)
    alScrollear()
    window.addEventListener('scroll', alScrollear, { passive: true })
    return () => window.removeEventListener('scroll', alScrollear)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cx(
        'fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full',
        'border border-salvia-claro bg-blanco text-jade shadow-lg transition-opacity',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <span className="sr-only">Volver arriba</span>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
