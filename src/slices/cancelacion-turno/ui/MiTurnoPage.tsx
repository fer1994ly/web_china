import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAgenda } from '@/app/agenda-context'
import { Aviso, Boton, Campo, Contenedor, Entrada, Sello, Tarjeta } from '@/shared/ui/componentes'
import type { Reserva } from '@/slices/agenda'
import { nombreDeTerapia } from '@/slices/catalogo-terapias'
import { datosDelTurno, enlaceDeWhatsApp } from '@/slices/difusion-whatsapp'
import { useSeo } from '@/shared/seo/useSeo'
import { cancelarTurno, consultarTurno } from '../application/gestionar-turno'

type Vista =
  | { readonly paso: 'buscar' }
  | { readonly paso: 'encontrado'; readonly reserva: Reserva }
  | { readonly paso: 'cancelado'; readonly reserva: Reserva }

export function MiTurnoPage() {
  const { agenda: repo, reloj, refrescar } = useAgenda()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [vista, setVista] = useState<Vista>({ paso: 'buscar' })
  const [confirmandoBaja, setConfirmandoBaja] = useState(false)

  // `noIndexar`: muestra datos de un turno concreto. No tiene nada que hacer en un buscador.
  useSeo({
    titulo: 'Mi turno | Centro Qi',
    descripcion: 'Consultá o cancelá tu turno del Centro Qi con tu código de reserva.',
    ruta: '/mi-turno',
    noIndexar: true,
  })

  const buscar = () => {
    const r = consultarTurno(repo, codigo)
    if (!r.ok) {
      setError(r.error.mensaje)
      setVista({ paso: 'buscar' })
      return
    }
    setError(null)
    setConfirmandoBaja(false)
    setVista(r.value.estaActiva ? { paso: 'encontrado', reserva: r.value } : { paso: 'cancelado', reserva: r.value })
  }

  const cancelar = () => {
    const r = cancelarTurno(repo, reloj, codigo)
    if (!r.ok) {
      setError(r.error.mensaje)
      return
    }
    setError(null)
    setConfirmandoBaja(false)
    setVista({ paso: 'cancelado', reserva: r.value })
    refrescar()
  }

  const volver = () => {
    setVista({ paso: 'buscar' })
    setCodigo('')
    setError(null)
    setConfirmandoBaja(false)
  }

  return (
    <Contenedor className="py-8">
      <h1 className="text-3xl text-jade">Mi turno</h1>
      <p className="mt-2 max-w-xl text-grafito-suave">
        Ingresá el código que te dimos al reservar para ver los datos de tu sesión o cancelarla.
      </p>

      <Tarjeta className="mt-6 p-5">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            buscar()
          }}
          className="flex flex-col gap-4"
        >
          <Campo
            id="codigo"
            etiqueta="Código de reserva"
            ayuda="Tiene el formato QI-XXXXXX."
            error={error ?? undefined}
          >
            <Entrada
              id="codigo"
              name="codigo"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="QI-K7R2MP"
              value={codigo}
              hayError={error !== null}
              onChange={(e) => {
                setCodigo(e.target.value)
                setError(null)
              }}
              className="font-titulo text-lg tracking-widest uppercase"
            />
          </Campo>

          <Boton type="submit" anchoCompleto data-testid="buscar-turno">
            Buscar mi turno
          </Boton>
        </form>
      </Tarjeta>

      {vista.paso !== 'buscar' && (
        <Tarjeta className="mt-6 p-6" data-testid="detalle-turno">
          {vista.paso === 'cancelado' ? (
            <Sello className="bg-terracota-tenue text-terracota" data-testid="estado-turno">
              Turno cancelado
            </Sello>
          ) : (
            <Sello data-testid="estado-turno">Turno confirmado</Sello>
          )}

          <h2 className="mt-3 text-2xl text-jade">{nombreDeTerapia(vista.reserva.terapiaId)}</h2>

          <dl className="mt-5 grid gap-3 border-t border-salvia-niebla pt-5 text-sm">
            <Fila termino="A nombre de" descripcion={vista.reserva.paciente.nombre.valor} />
            <Fila termino="Día" descripcion={vista.reserva.fecha.etiquetaLarga} />
            <Fila termino="Hora" descripcion={vista.reserva.hora.texto} />
            <Fila termino="Celular" descripcion={vista.reserva.paciente.celular.formateado} />
            <Fila termino="Código" descripcion={vista.reserva.codigo.valor} />
          </dl>

          {vista.reserva.paciente.motivoConsulta !== '' && (
            <p className="mt-4 rounded-xl bg-lino px-4 py-3 text-sm text-grafito-suave">
              <span className="font-semibold text-grafito">Consulta: </span>
              {vista.reserva.paciente.motivoConsulta}
            </p>
          )}

          {vista.paso === 'cancelado' ? (
            <div className="mt-6 flex flex-col gap-3">
              <Aviso tono="alerta">
                Este turno está cancelado y el horario volvió a quedar disponible para otros pacientes.
              </Aviso>
              <Link
                to="/reservar"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-jade px-5 py-3 text-[0.95rem] font-semibold text-blanco hover:bg-jade-hondo"
              >
                Reservar un turno nuevo
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={enlaceDeWhatsApp(datosDelTurno(vista.reserva, nombreDeTerapia(vista.reserva.terapiaId)))}
                target="_blank"
                rel="noreferrer"
                data-testid="enlace-whatsapp"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-salvia-claro bg-blanco px-5 py-3 text-[0.95rem] font-semibold text-jade hover:border-jade"
              >
                Avisar por WhatsApp
              </a>

              {/* Confirmación en la propia página: un `window.confirm` nativo bloquea
                  la automatización de Playwright y no se puede estilar. */}
              {confirmandoBaja ? (
                <div className="rounded-xl border border-terracota/35 bg-terracota-tenue p-4">
                  <p className="text-sm font-semibold text-terracota">
                    ¿Seguro que querés cancelar este turno?
                  </p>
                  <p className="mt-1 text-sm text-terracota">
                    El horario queda libre en el momento y puede tomarlo otra persona.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Boton
                      type="button"
                      tono="peligro"
                      anchoCompleto
                      onClick={cancelar}
                      data-testid="confirmar-cancelacion"
                    >
                      Sí, cancelar turno
                    </Boton>
                    <Boton
                      type="button"
                      tono="contorno"
                      anchoCompleto
                      onClick={() => setConfirmandoBaja(false)}
                    >
                      Mantener el turno
                    </Boton>
                  </div>
                </div>
              ) : (
                <Boton
                  type="button"
                  tono="peligro"
                  anchoCompleto
                  onClick={() => setConfirmandoBaja(true)}
                  data-testid="cancelar-turno"
                >
                  Cancelar mi turno
                </Boton>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={volver}
            className="mt-4 w-full text-sm text-grafito-suave underline"
          >
            Buscar otro código
          </button>
        </Tarjeta>
      )}
    </Contenedor>
  )
}

function Fila({ termino, descripcion }: { termino: string; descripcion: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-salvia-niebla pb-2 last:border-0">
      <dt className="text-grafito-suave">{termino}</dt>
      <dd className="font-semibold text-grafito">{descripcion}</dd>
    </div>
  )
}
