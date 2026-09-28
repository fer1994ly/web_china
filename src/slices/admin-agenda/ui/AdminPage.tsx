// oxlint-disable react-hooks/exhaustive-deps
//
// `revision` es un TOKEN DE INVALIDACION, no un valor que se lea dentro del memo:
// el repositorio es una fuente externa mutable (localStorage) y `revision` cambia en
// cada escritura para forzar la relectura. La regla exhaustive-deps es sintactica y
// no puede verlo, asi que marcaria como "innecesaria" la dependencia que justamente
// sostiene el criterio CA-02.
import { useMemo, useState } from 'react'
import { useAgenda } from '@/app/agenda-context'
import { esOk } from '@/shared/domain/result'
import { cx } from '@/shared/ui/cx'
import { Aviso, Boton, Contenedor, Entrada, Sello, SinResultados, Tarjeta } from '@/shared/ui/componentes'
import { diasDeAgenda, FechaAgenda, primerDiaConLugar, slotsDelDia, type Reserva } from '@/slices/agenda'
import { buscarTerapia, nombreDeTerapia, precioEnGuaranies } from '@/slices/catalogo-terapias'
import { PuertaDeAcceso } from '@/slices/admin-acceso/ui/PuertaDeAcceso'
import {
  bloquearHorario,
  cancelarDesdeElPanel,
  liberarHorario,
  reiniciarDatosDemo,
  resumenDelDia,
} from '../application/administrar-agenda'

const precioDe = (terapiaId: string): number => buscarTerapia(terapiaId)?.precioGs ?? 0

export function AdminPage() {
  return (
    <PuertaDeAcceso>
      <PanelDeAgenda />
    </PuertaDeAcceso>
  )
}

function PanelDeAgenda() {
  const { agenda: repo, reloj, revision, refrescar } = useAgenda()
  const [fechaIso, setFechaIso] = useState('')
  const [motivo, setMotivo] = useState('')
  const [aviso, setAviso] = useState<{ tono: 'info' | 'alerta'; texto: string } | null>(null)
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false)

  // El "ahora" se fija por ciclo de revision y no por render: un Date nuevo en cada
  // render invalidaria todos los useMemo y haria parpadear la grilla. La guarda real
  // contra horarios pasados vive en el agregado, que revalida al confirmar.
  const ahora = useMemo(() => reloj.ahora(), [reloj, revision])
  const dias = useMemo(() => diasDeAgenda(repo, ahora, 21), [repo, revision, ahora])
  const elegida = fechaIso !== '' ? fechaIso : (primerDiaConLugar(dias)?.iso ?? '')

  const fecha = useMemo(() => {
    const f = FechaAgenda.desdeISO(elegida)
    return esOk(f) ? f.value : null
  }, [elegida])

  const slots = useMemo(
    () => (fecha === null ? [] : slotsDelDia(repo, fecha, ahora)),
    [repo, revision, fecha, ahora],
  )

  const reservas = useMemo(
    () => (fecha === null ? [] : repo.cargarDia(fecha).todasLasReservas),
    [repo, revision, fecha],
  )

  const resumen = useMemo(
    () => (fecha === null ? null : resumenDelDia(repo, fecha, ahora, precioDe)),
    [repo, revision, fecha, ahora],
  )

  const aplicar = (accion: () => { ok: boolean; mensaje: string }) => {
    const { ok, mensaje } = accion()
    setAviso({ tono: ok ? 'info' : 'alerta', texto: mensaje })
    if (ok) refrescar()
  }

  const bloquear = (hora: string) => {
    if (fecha === null) return
    aplicar(() => {
      const r = bloquearHorario(repo, reloj, fecha, hora, motivo)
      return r.ok
        ? { ok: true, mensaje: `Bloqueaste las ${hora}: ${r.value.motivo}.` }
        : { ok: false, mensaje: r.error.mensaje }
    })
  }

  const liberar = (hora: string) => {
    if (fecha === null) return
    aplicar(() => {
      const r = liberarHorario(repo, fecha, hora)
      return r.ok
        ? { ok: true, mensaje: `Liberaste las ${hora}. Ya vuelve a figurar disponible.` }
        : { ok: false, mensaje: r.error.mensaje }
    })
  }

  const cancelar = (reserva: Reserva) => {
    aplicar(() => {
      const r = cancelarDesdeElPanel(repo, reloj, reserva)
      return r.ok
        ? { ok: true, mensaje: `Cancelaste el turno de ${reserva.paciente.nombre.valor}.` }
        : { ok: false, mensaje: r.error.mensaje }
    })
  }

  const reiniciar = () => {
    reiniciarDatosDemo(repo)
    setConfirmandoReinicio(false)
    setFechaIso('')
    setAviso({ tono: 'info', texto: 'Listo: la demo volvió a los datos de ejemplo originales.' })
    refrescar()
  }

  return (
    <Contenedor className="py-6">
      <h1 className="text-3xl text-jade">Agenda del centro</h1>
      <p className="mt-2 text-grafito-suave">
        Mirá los turnos del día, bloqueá horarios y cancelá sesiones cuando avisan por teléfono.
      </p>

      {aviso !== null && (
        <div className="mt-5" data-testid="aviso-admin">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-grafito-suave">Día</h2>
        <div className="tira-scroll mt-2 -mx-1 flex gap-2 px-1 pb-2">
          {dias.map((d) => {
            const activo = d.fecha.iso === elegida
            return (
              <button
                key={d.fecha.iso}
                type="button"
                data-testid="dia-admin"
                data-fecha={d.fecha.iso}
                onClick={() => setFechaIso(d.fecha.iso)}
                className={cx(
                  'flex w-[5.5rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5',
                  activo
                    ? 'border-jade bg-jade text-blanco'
                    : 'border-salvia-claro bg-blanco text-grafito hover:border-jade',
                )}
              >
                <span className="text-[0.7rem] font-semibold uppercase">{d.etiqueta.split(' ')[0]}</span>
                <span className="font-titulo text-xl leading-none">{d.fecha.dia}</span>
                <span className={cx('text-[0.65rem]', activo ? 'text-salvia-niebla' : 'text-grafito-tenue')}>
                  {d.cantidadLibre} libres
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {resumen !== null && (
        <section className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="resumen-dia">
          <Metrica etiqueta="Confirmados" valor={String(resumen.confirmados)} />
          <Metrica etiqueta="Libres" valor={String(resumen.libres)} />
          <Metrica etiqueta="Bloqueados" valor={String(resumen.bloqueados)} />
          <Metrica etiqueta="Estimado" valor={precioEnGuaranies(resumen.ingresosEstimadosGs)} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl text-jade">Horarios</h2>
        <p className="mt-1 text-sm text-grafito-suave">
          Tocá un horario libre para bloquearlo, o uno bloqueado para liberarlo.
        </p>

        <label htmlFor="motivo-bloqueo" className="mt-4 block text-sm font-semibold text-grafito">
          Motivo del bloqueo
        </label>
        <Entrada
          id="motivo-bloqueo"
          name="motivo-bloqueo"
          type="text"
          placeholder="Capacitación del equipo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="mt-1.5"
        />

        {slots.length === 0 ? (
          <div className="mt-4">
            <SinResultados>El centro no atiende ese día.</SinResultados>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => {
              const bloqueado = s.estado === 'bloqueado'
              const reservado = s.estado === 'reservado'
              return (
                <button
                  key={s.hora.texto}
                  type="button"
                  data-testid="slot-admin"
                  data-hora={s.hora.texto}
                  data-estado={s.estado}
                  disabled={reservado}
                  title={s.motivo !== '' ? s.motivo : undefined}
                  onClick={() => (bloqueado ? liberar(s.hora.texto) : bloquear(s.hora.texto))}
                  className={cx(
                    'flex flex-col items-center rounded-xl border px-1 py-2 text-sm font-semibold',
                    bloqueado && 'border-terracota/40 bg-terracota-tenue text-terracota',
                    reservado && 'cursor-not-allowed border-jade/30 bg-salvia-niebla text-jade',
                    !bloqueado && !reservado && 'border-salvia-claro bg-blanco text-grafito hover:border-jade',
                  )}
                >
                  {s.hora.texto}
                  <span className="text-[0.6rem] font-normal">
                    {bloqueado ? 'bloqueado' : reservado ? 'ocupado' : s.estado === 'pasado' ? 'pasó' : 'libre'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl text-jade">Turnos del día</h2>
        {reservas.length === 0 ? (
          <div className="mt-4">
            <SinResultados>No hay turnos agendados para este día.</SinResultados>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {reservas.map((r) => (
              <li key={r.codigo.valor}>
                <Tarjeta className="p-4" data-testid="turno-admin">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-titulo text-lg text-jade">
                        {r.hora.texto} · {r.paciente.nombre.valor}
                      </p>
                      <p className="text-sm text-grafito-suave">
                        {nombreDeTerapia(r.terapiaId)} · {r.paciente.celular.formateado}
                      </p>
                    </div>
                    {r.estaActiva ? (
                      <Sello>{r.codigo.valor}</Sello>
                    ) : (
                      <Sello className="bg-terracota-tenue text-terracota">Cancelado</Sello>
                    )}
                  </div>

                  {r.paciente.motivoConsulta !== '' && (
                    <p className="mt-2 rounded-lg bg-lino px-3 py-2 text-sm text-grafito-suave">
                      {r.paciente.motivoConsulta}
                    </p>
                  )}

                  {r.estaActiva && (
                    <Boton
                      type="button"
                      tono="peligro"
                      className="mt-3 w-full sm:w-auto"
                      onClick={() => cancelar(r)}
                    >
                      Cancelar este turno
                    </Boton>
                  )}
                </Tarjeta>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-salvia-niebla pt-6">
        <h2 className="text-xl text-jade">Datos de ejemplo</h2>
        <p className="mt-1 text-sm text-grafito-suave">
          Vuelve la demo al estado inicial: los turnos y bloqueos de ejemplo de Asunción, sin lo que
          hayas cargado vos.
        </p>

        {confirmandoReinicio ? (
          <div className="mt-4 rounded-xl border border-terracota/35 bg-terracota-tenue p-4">
            <p className="text-sm font-semibold text-terracota">
              Se borra todo lo que cargaste en esta demo. ¿Seguimos?
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Boton type="button" tono="peligro" onClick={reiniciar} data-testid="confirmar-reinicio">
                Sí, reiniciar datos
              </Boton>
              <Boton type="button" tono="contorno" onClick={() => setConfirmandoReinicio(false)}>
                Dejar como está
              </Boton>
            </div>
          </div>
        ) : (
          <Boton
            type="button"
            tono="contorno"
            className="mt-4 w-full sm:w-auto"
            onClick={() => setConfirmandoReinicio(true)}
            data-testid="reiniciar-demo"
          >
            Reiniciar datos de ejemplo
          </Boton>
        )}
      </section>
    </Contenedor>
  )
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Tarjeta className="px-3 py-3">
      <p className="text-[0.7rem] uppercase tracking-wider text-grafito-suave">{etiqueta}</p>
      <p className="mt-0.5 font-titulo text-lg leading-tight text-jade">{valor}</p>
    </Tarjeta>
  )
}
