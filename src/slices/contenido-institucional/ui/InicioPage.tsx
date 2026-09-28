import { Link } from 'react-router-dom'
import { CENTRO, direccionCompleta } from '@/seed/centro'
import { Contenedor, Seccion, Sello, Tarjeta } from '@/shared/ui/componentes'
import { HorarioAtencion } from '@/slices/agenda'
import { duracionLegible, precioEnGuaranies, TERAPIAS } from '@/slices/catalogo-terapias'
import { FotoTerapia } from './FotoTerapia'

const PASOS = [
  {
    titulo: 'Elegís la terapia',
    texto: 'Cuatro tratamientos, cada uno con su duración y su precio a la vista.',
  },
  {
    titulo: 'Elegís día y hora',
    texto: 'La agenda muestra solo los horarios que están realmente libres.',
  },
  {
    titulo: 'Confirmás y listo',
    texto: 'Te queda un código para consultar o cancelar, sin llamar a nadie.',
  },
]

export function InicioPage() {
  const horarios = HorarioAtencion.delCentro().descripcionSemanal()

  return (
    <>
      <section className="bg-gradient-to-b from-salvia-niebla to-lino">
        <Contenedor className="py-12 sm:py-16">
          <Sello>Villa Morra · Asunción</Sello>
          <h1 className="mt-4 text-4xl leading-tight text-jade sm:text-5xl">
            Medicina tradicional china, con turno y sin esperas
          </h1>
          <p className="mt-4 max-w-xl text-lg text-grafito-suave">{CENTRO.descripcion}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/reservar"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-jade px-6 py-3 font-semibold text-blanco transition-colors hover:bg-jade-hondo"
            >
              Reservar mi sesión
            </Link>
            <Link
              to="/terapias"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-salvia-claro bg-blanco px-6 py-3 font-semibold text-jade transition-colors hover:border-jade"
            >
              Ver las terapias
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-salvia-claro pt-6 sm:grid-cols-4">
            <Dato termino="Terapias" descripcion="4 tratamientos" />
            <Dato termino="Sesión" descripcion="40 a 60 min" />
            <Dato termino="Atención" descripcion="Lunes a sábado" />
            <Dato termino="Turno" descripcion="Online, al instante" />
          </dl>
        </Contenedor>
      </section>

      <Seccion
        titulo="Nuestras terapias"
        copete="Cada sesión es individual y arranca con una conversación sobre lo que te trae."
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {TERAPIAS.map((t) => (
            <li key={t.id}>
              <Tarjeta className="flex h-full flex-col overflow-hidden">
                <FotoTerapia terapia={t} className="h-40 w-full" />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg text-jade">{t.nombre}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-grafito-suave">{t.resumen}</p>
                  <p className="mt-3 text-sm font-semibold text-grafito">
                    {duracionLegible(t.duracionMinutos)} · {precioEnGuaranies(t.precioGs)}
                  </p>
                  <Link
                    to={`/reservar?terapia=${t.id}`}
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-jade px-4 py-2.5 text-sm font-semibold text-blanco hover:bg-jade-hondo"
                  >
                    Reservar {t.nombre.toLowerCase()}
                  </Link>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="Cómo se reserva" className="bg-blanco">
        <ol className="grid gap-4 sm:grid-cols-3">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="rounded-2xl border border-salvia-niebla bg-lino p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-jade font-titulo text-blanco">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg text-jade">{p.titulo}</h3>
              <p className="mt-1 text-sm text-grafito-suave">{p.texto}</p>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion titulo="Dónde y cuándo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Tarjeta className="p-5">
            <h3 className="text-lg text-jade">El consultorio</h3>
            <address className="mt-2 not-italic text-grafito-suave">
              {direccionCompleta()}
              <br />
              {CENTRO.comoLlegar}
            </address>
            <p className="mt-3 text-sm text-grafito-suave">
              Sala individual, camilla climatizada y material estéril descartable en cada sesión.
            </p>
          </Tarjeta>

          <Tarjeta className="p-5">
            <h3 className="text-lg text-jade">Horarios de atención</h3>
            <dl className="mt-2 space-y-1.5 text-grafito-suave">
              {horarios.map((h) => (
                <div key={h.dias} className="flex flex-wrap justify-between gap-2">
                  <dt className="font-semibold text-grafito">{h.dias}</dt>
                  <dd>{h.horas}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-grafito-suave">
              Cada turno ocupa una hora completa de la agenda, así nadie espera en la sala.
            </p>
          </Tarjeta>
        </div>
      </Seccion>
    </>
  )
}

function Dato({ termino, descripcion }: { termino: string; descripcion: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-salvia">{termino}</dt>
      <dd className="mt-0.5 font-titulo text-lg text-jade">{descripcion}</dd>
    </div>
  )
}
