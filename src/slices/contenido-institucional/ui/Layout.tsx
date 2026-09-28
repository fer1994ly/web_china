import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CENTRO, direccionCompleta } from '@/seed/centro'
import { useAgenda } from '@/app/agenda-context'
import { cx } from '@/shared/ui/cx'
import { ScrollAlInicio, VolverArriba } from '@/shared/ui/navegacion'
import { Contenedor } from '@/shared/ui/componentes'
import { enlaceDeConsulta } from '@/slices/difusion-whatsapp'
import { HorarioAtencion } from '@/slices/agenda'

const NAVEGACION = [
  { a: '/', texto: 'Inicio' },
  { a: '/terapias', texto: 'Terapias' },
  { a: '/reservar', texto: 'Reservar' },
  { a: '/mi-turno', texto: 'Mi turno' },
] as const

function LogoQi({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label={`Isotipo de ${CENTRO.nombre}`}>
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M20 3.5a8.25 8.25 0 0 1 0 16.5 8.25 8.25 0 0 0 0 16.5 16.5 16.5 0 0 0 0-33Z"
        fill="currentColor"
      />
      <circle cx="20" cy="11.75" r="2.4" fill="var(--color-lino)" />
      <circle cx="20" cy="28.25" r="2.4" fill="currentColor" />
    </svg>
  )
}

function Encabezado() {
  const [abierto, setAbierto] = useState(false)
  const { pathname } = useLocation()

  const clasesEnlace = ({ isActive }: { isActive: boolean }) =>
    cx(
      'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
      isActive ? 'bg-salvia-niebla text-jade' : 'text-grafito-suave hover:text-jade',
    )

  return (
    <header className="sticky top-0 z-30 border-b border-salvia-niebla bg-lino/95 backdrop-blur-sm">
      <Contenedor className="flex items-center justify-between gap-3 py-3">
        <Link
          to="/"
          className="flex min-h-[44px] min-w-0 items-center gap-2.5 py-1 text-jade"
          onClick={() => setAbierto(false)}
        >
          <LogoQi className="h-9 w-9 shrink-0" />
          <span className="min-w-0">
            <span className="block font-titulo text-lg leading-none">{CENTRO.nombre}</span>
            <span className="block truncate text-[0.7rem] uppercase tracking-[0.14em] text-salvia">
              Terapias orientales
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Principal">
          {NAVEGACION.map((i) => (
            <NavLink key={i.a} to={i.a} className={clasesEnlace}>
              {i.texto}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-lg px-3 text-jade sm:hidden"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="sr-only">{abierto ? 'Cerrar menú' : 'Abrir menú'}</span>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            {abierto ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </Contenedor>

      {abierto && (
        <nav id="menu-movil" className="border-t border-salvia-niebla bg-lino sm:hidden" aria-label="Principal">
          <Contenedor className="flex flex-col py-2">
            {NAVEGACION.map((i) => (
              <NavLink
                key={i.a}
                to={i.a}
                onClick={() => setAbierto(false)}
                className={({ isActive }) =>
                  cx(
                    'rounded-lg px-3 py-3 text-base font-semibold',
                    isActive || pathname === i.a ? 'bg-salvia-niebla text-jade' : 'text-grafito',
                  )
                }
              >
                {i.texto}
              </NavLink>
            ))}
          </Contenedor>
        </nav>
      )}
    </header>
  )
}

function PieDePagina() {
  const horarios = HorarioAtencion.delCentro().descripcionSemanal()
  // El año sale del reloj inyectado: llamar a `new Date()` durante el render es impuro
  // y deja el pie fuera de sincronía con la fecha que usa el resto de la app.
  const { reloj } = useAgenda()
  const anio = reloj.ahora().getFullYear()

  return (
    <footer className="mt-auto border-t border-salvia-niebla bg-blanco">
      <Contenedor className="grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 font-titulo text-lg text-jade">
            <LogoQi className="h-7 w-7" />
            {CENTRO.nombre}
          </p>
          <p className="mt-2 text-sm text-grafito-suave">{CENTRO.lema}</p>
        </div>

        <div>
          <h3 className="font-titulo text-sm uppercase tracking-wider text-jade">Dónde estamos</h3>
          <address className="mt-2 not-italic text-sm text-grafito-suave">
            {direccionCompleta()}
            <br />
            {CENTRO.comoLlegar}
          </address>
          <p className="mt-2 text-sm text-grafito-suave">
            <a href={enlaceDeConsulta()} target="_blank" rel="noreferrer" className="text-jade underline">
              {CENTRO.celular}
            </a>
            <br />
            {CENTRO.correo}
            <br />
            {CENTRO.instagram}
          </p>
        </div>

        <div>
          <h3 className="font-titulo text-sm uppercase tracking-wider text-jade">Horarios</h3>
          <dl className="mt-2 space-y-1 text-sm text-grafito-suave">
            {horarios.map((h) => (
              <div key={h.dias}>
                <dt className="inline font-semibold text-grafito">{h.dias}: </dt>
                <dd className="inline">{h.horas}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Contenedor>

      <div className="border-t border-salvia-niebla">
        <Contenedor className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs text-grafito-tenue">
          <p>
            © {anio} {CENTRO.nombreCompleto} · {CENTRO.ciudad}, {CENTRO.pais}
          </p>
          {/* `min-h-[44px]` en cada enlace: en el pie son objetivos táctiles chicos y
              muy juntos, de los más difíciles de acertar con el pulgar. */}
          <nav className="-my-2 flex flex-wrap gap-x-4" aria-label="Legal">
            <Link
              to="/legal/aviso"
              className="inline-flex min-h-[44px] items-center underline hover:text-jade"
            >
              Aviso legal
            </Link>
            <Link
              to="/legal/privacidad"
              className="inline-flex min-h-[44px] items-center underline hover:text-jade"
            >
              Privacidad
            </Link>
            <Link
              to="/admin"
              className="inline-flex min-h-[44px] items-center underline hover:text-jade"
            >
              Panel
            </Link>
          </nav>
        </Contenedor>
      </div>
    </footer>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollAlInicio />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-jade focus:px-4 focus:py-2 focus:text-blanco"
      >
        Saltar al contenido
      </a>
      <Encabezado />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <PieDePagina />
      <VolverArriba />
    </div>
  )
}
