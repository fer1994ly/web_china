import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CENTRO, direccionCompleta } from '@/seed/centro'
import { Contenedor, Seccion, Sello, Tarjeta } from '@/shared/ui/componentes'
import { Desplegable } from '@/shared/ui/navegacion'
import { useSeo } from '@/shared/seo/useSeo'
import {
  negocio,
  preguntasFrecuentes,
  sitioWeb,
  todosLosServicios,
} from '@/app/datos-estructurados'
import { HorarioAtencion } from '@/slices/agenda'
import { duracionLegible, precioEnGuaranies, TERAPIAS } from '@/slices/catalogo-terapias'
import { PREGUNTAS_FRECUENTES } from '../domain/preguntas'
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

  const datosEstructurados = useMemo(
    () => [negocio(), sitioWeb(), ...todosLosServicios(), preguntasFrecuentes(PREGUNTAS_FRECUENTES)],
    [],
  )

  useSeo({
    titulo: 'Centro Qi · Acupuntura y terapias orientales en Asunción',
    descripcion:
      'Reservá tu sesión de acupuntura, auriculoterapia, reflexología o moxibustión en Villa Morra, ' +
      'Asunción. Turno online al instante, sin llamar ni esperar respuesta.',
    ruta: '/',
    datosEstructurados,
  })

  return (
    <>
      <section className="bg-gradient-to-b from-salvia-niebla to-lino">
        <Contenedor ancho="amplio" className="py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Sello>Villa Morra · Asunción</Sello>
              <h1 className="mt-4 text-[2rem] leading-tight text-jade sm:text-5xl">
                Medicina tradicional china, con turno y sin esperas
              </h1>
              <p className="mt-4 max-w-xl text-lg text-grafito-suave">{CENTRO.descripcion}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/reservar"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-jade px-6 py-3 font-semibold text-blanco transition-colors hover:bg-jade-hondo"
                >
                  Reservar mi sesión
                </Link>
                <Link
                  to="/terapias"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-salvia-claro bg-blanco px-6 py-3 font-semibold text-jade transition-colors hover:border-jade"
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
            </div>

            {/* Solo desde lg: en el celular la foto empujaría el botón de reserva
                fuera de la primera pantalla, que es lo que la gente viene a hacer. */}
            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-2xl sombra-tarjeta">
                <FotoTerapia terapia={TERAPIAS[0]!} className="h-[26rem] w-full" prioridad />
              </div>
            </div>
          </div>
        </Contenedor>
      </section>

      <Seccion
        titulo="Nuestras terapias"
        copete="Cada sesión es individual y arranca con una conversación sobre lo que te trae."
        ancho="amplio"
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TERAPIAS.map((t) => (
            <li key={t.id}>
              <Tarjeta className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
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
                    Reservar
                    <span className="sr-only"> {t.nombre.toLowerCase()}</span>
                  </Link>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion titulo="Cómo se reserva" className="bg-blanco" ancho="amplio">
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

      <Seccion titulo="Dónde y cuándo" ancho="amplio">
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

      <Seccion
        id="preguntas"
        titulo="Preguntas frecuentes"
        copete="Lo que más nos consultan antes de la primera sesión."
        className="bg-blanco"
      >
        <Tarjeta className="px-5">
          {PREGUNTAS_FRECUENTES.map((p) => (
            <Desplegable key={p.pregunta} titulo={p.pregunta}>
              {p.respuesta}
            </Desplegable>
          ))}
        </Tarjeta>
      </Seccion>

      <section className="bg-jade py-12">
        <Contenedor className="text-center">
          <h2 className="font-titulo text-2xl text-blanco sm:text-3xl">
            ¿Listo para tu primera sesión?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-salvia-niebla">
            Elegís terapia, día y horario en menos de un minuto. Te queda un código para
            consultar o cancelar cuando quieras.
          </p>
          <Link
            to="/reservar"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-blanco px-8 py-3 font-semibold text-jade transition-colors hover:bg-lino"
          >
            Reservar mi sesión
          </Link>
        </Contenedor>
      </section>
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
