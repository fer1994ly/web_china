import { Link } from 'react-router-dom'
import { Contenedor, Sello, Tarjeta } from '@/shared/ui/componentes'
import { duracionLegible, precioEnGuaranies, TERAPIAS } from '@/slices/catalogo-terapias'
import { FotoTerapia } from './FotoTerapia'

export function TerapiasPage() {
  return (
    <Contenedor className="py-8">
      <h1 className="text-3xl text-jade">Terapias</h1>
      <p className="mt-2 max-w-xl text-grafito-suave">
        Cuatro tratamientos de medicina tradicional china. Si no sabés cuál te conviene, reservá una
        acupuntura: en la primera sesión evaluamos y te orientamos.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {TERAPIAS.map((t) => (
          <Tarjeta key={t.id} className="overflow-hidden" id={t.id}>
            <FotoTerapia terapia={t} className="h-48 w-full sm:h-56" />

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl text-jade">{t.nombre}</h2>
                <Sello>{duracionLegible(t.duracionMinutos)}</Sello>
                <Sello>{precioEnGuaranies(t.precioGs)}</Sello>
              </div>

              <p className="mt-3 text-grafito-suave">{t.descripcion}</p>

              <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-jade">
                En qué ayuda
              </h3>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {t.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-grafito-suave">
                    <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-salvia" />
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                to={`/reservar?terapia=${t.id}`}
                className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-jade px-5 py-3 font-semibold text-blanco hover:bg-jade-hondo sm:w-auto"
              >
                Reservar {t.nombre.toLowerCase()}
              </Link>
            </div>
          </Tarjeta>
        ))}
      </div>
    </Contenedor>
  )
}
