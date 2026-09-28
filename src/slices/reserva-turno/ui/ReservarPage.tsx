// oxlint-disable react-hooks/exhaustive-deps
//
// `revision` es un TOKEN DE INVALIDACION, no un valor que se lea dentro del memo:
// el repositorio es una fuente externa mutable (localStorage) y `revision` cambia en
// cada escritura para forzar la relectura. La regla exhaustive-deps es sintactica y
// no puede verlo, asi que marcaria como "innecesaria" la dependencia que justamente
// sostiene el criterio CA-02.
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAgenda } from '@/app/agenda-context'
import {
  Aviso,
  Boton,
  Campo,
  Contenedor,
  Entrada,
  Seleccion,
  Sello,
  Tarjeta,
} from '@/shared/ui/componentes'
import { diasDeAgenda, FechaAgenda, slotsDelDia, type Reserva } from '@/slices/agenda'
import { duracionLegible, nombreDeTerapia, precioEnGuaranies, TERAPIAS } from '@/slices/catalogo-terapias'
import { datosDelTurno, enlaceDeWhatsApp } from '@/slices/difusion-whatsapp'
import { esOk } from '@/shared/domain/result'
import { reservarTurno } from '../application/reservar-turno'
import {
  FORMULARIO_VACIO,
  type EntradaFormulario,
  type ErroresFormulario,
} from '../domain/formulario-reserva'
import { GrillaDeHorarios, TiraDeDias } from './SelectorDeAgenda'

const IDS_TERAPIAS = TERAPIAS.map((t) => t.id)

export function ReservarPage() {
  const { agenda: repo, reloj, revision, refrescar } = useAgenda()
  const [params] = useSearchParams()

  const [entrada, setEntrada] = useState<EntradaFormulario>(() => ({
    ...FORMULARIO_VACIO,
    terapiaId: params.get('terapia') ?? '',
  }))
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [errorAgenda, setErrorAgenda] = useState<string | null>(null)
  const [confirmada, setConfirmada] = useState<Reserva | null>(null)

  // El "ahora" se fija por ciclo de revision y no por render: un Date nuevo en cada
  // render invalidaria todos los useMemo y haria parpadear la grilla. La guarda real
  // contra horarios pasados vive en el agregado, que revalida al confirmar.
  const ahora = useMemo(() => reloj.ahora(), [reloj, revision])

  // `revision` fuerza la relectura después de cada escritura: es lo que hace que
  // el horario recién tomado desaparezca de la grilla al instante (criterio CA-02).
  const dias = useMemo(() => diasDeAgenda(repo, ahora), [repo, revision, ahora])

  /**
   * El dia NO se preselecciona. Preseleccionarlo seria mas comodo, pero dejaria a
   * la paciente reservando un dia que nunca eligio conscientemente, y haria
   * imposible el criterio CA-01: "impide avanzar si falta la fecha".
   */
  const fechaElegida = entrada.fechaIso

  const slots = useMemo(() => {
    if (fechaElegida === '') return []
    const fecha = FechaAgenda.desdeISO(fechaElegida)
    return esOk(fecha) ? slotsDelDia(repo, fecha.value, ahora) : []
  }, [repo, revision, fechaElegida, ahora])

  const actualizar = (parche: Partial<EntradaFormulario>) => {
    setEntrada((prev) => ({ ...prev, ...parche }))
    setErrorAgenda(null)
    // Limpia solo los avisos de los campos que acaban de cambiar: dejar los demás
    // visibles es lo que evita que el paciente sienta que los errores "saltan".
    setErrores((prev) => {
      const siguiente = { ...prev }
      if (parche.nombre !== undefined) delete siguiente.nombre
      if (parche.celular !== undefined) delete siguiente.celular
      if (parche.terapiaId !== undefined) delete siguiente.terapia
      if (parche.fechaIso !== undefined) delete siguiente.fecha
      if (parche.horaTexto !== undefined) delete siguiente.hora
      return siguiente
    })
  }

  const confirmar = () => {
    const resultado = reservarTurno(repo, reloj, { ...entrada, fechaIso: fechaElegida }, IDS_TERAPIAS)

    if (resultado.ok) {
      setErrores({})
      setErrorAgenda(null)
      setConfirmada(resultado.value)
      refrescar()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (resultado.error.tipo === 'formulario') {
      setErrores(resultado.error.errores)
      setErrorAgenda(null)
    } else {
      setErrores({})
      setErrorAgenda(resultado.error.error.mensaje)
      refrescar() // alguien se adelantó: reflejamos la agenda real
    }
  }

  const reservarOtro = () => {
    setConfirmada(null)
    setEntrada({ ...FORMULARIO_VACIO })
    setErrores({})
  }

  if (confirmada !== null) {
    return <Confirmacion reserva={confirmada} onReservarOtro={reservarOtro} />
  }

  const terapia = TERAPIAS.find((t) => t.id === entrada.terapiaId)

  return (
    <Contenedor className="py-8">
      <h1 className="text-3xl text-jade">Reservá tu sesión</h1>
      <p className="mt-2 max-w-xl text-grafito-suave">
        Elegí terapia, día y horario. Te confirmamos en el momento, sin esperar respuesta.
      </p>

      {errorAgenda !== null && (
        <div className="mt-5">
          <Aviso tono="alerta" titulo="No pudimos tomar ese horario">
            {errorAgenda}
          </Aviso>
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          confirmar()
        }}
        className="mt-6 flex flex-col gap-6"
      >
        <Tarjeta className="p-5">
          <Campo
            id="terapia"
            etiqueta="1. Terapia"
            obligatorio
            error={errores.terapia}
          >
            <Seleccion
              id="terapia"
              name="terapia"
              value={entrada.terapiaId}
              hayError={errores.terapia !== undefined}
              onChange={(e) => actualizar({ terapiaId: e.target.value })}
              aria-describedby={errores.terapia !== undefined ? 'terapia-error' : undefined}
            >
              <option value="">Elegí una terapia</option>
              {TERAPIAS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} · {duracionLegible(t.duracionMinutos)} · {precioEnGuaranies(t.precioGs)}
                </option>
              ))}
            </Seleccion>
          </Campo>

          {terapia !== undefined && (
            <p className="mt-3 text-sm text-grafito-suave">{terapia.resumen}</p>
          )}
        </Tarjeta>

        <Tarjeta className="p-5">
          <Campo id="fecha" etiqueta="2. Día" obligatorio error={errores.fecha}>
            <input type="hidden" id="fecha" name="fecha" value={fechaElegida} readOnly />
            <TiraDeDias
              dias={dias}
              seleccionada={fechaElegida}
              onElegir={(fechaIso) => actualizar({ fechaIso, horaTexto: '' })}
            />
          </Campo>

          <div className="mt-5">
            <Campo id="hora" etiqueta="3. Horario" obligatorio error={errores.hora}>
              <input type="hidden" id="hora" name="hora" value={entrada.horaTexto} readOnly />
              <GrillaDeHorarios
                slots={slots}
                sinDiaElegido={fechaElegida === ''}
                seleccionado={entrada.horaTexto}
                onElegir={(horaTexto) => actualizar({ horaTexto })}
              />
            </Campo>
          </div>
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-5 p-5">
          <h2 className="text-lg text-jade">4. Tus datos</h2>

          <Campo id="nombre" etiqueta="Nombre y apellido" obligatorio error={errores.nombre}>
            <Entrada
              id="nombre"
              name="nombre"
              type="text"
              autoComplete="name"
              placeholder="Lucía Benítez"
              value={entrada.nombre}
              hayError={errores.nombre !== undefined}
              onChange={(e) => actualizar({ nombre: e.target.value })}
              aria-describedby={errores.nombre !== undefined ? 'nombre-error' : undefined}
            />
          </Campo>

          <Campo
            id="celular"
            etiqueta="Celular"
            obligatorio
            ayuda="Te escribimos por acá solo si necesitamos reprogramar."
            error={errores.celular}
          >
            <Entrada
              id="celular"
              name="celular"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0981 456 789"
              value={entrada.celular}
              hayError={errores.celular !== undefined}
              onChange={(e) => actualizar({ celular: e.target.value })}
              aria-describedby={
                errores.celular !== undefined ? 'celular-error celular-ayuda' : 'celular-ayuda'
              }
            />
          </Campo>

          <Campo id="motivo" etiqueta="¿Qué te trae? (opcional)">
            <textarea
              id="motivo"
              name="motivo"
              rows={3}
              maxLength={300}
              placeholder="Dolor lumbar desde hace dos semanas."
              value={entrada.motivoConsulta}
              onChange={(e) => actualizar({ motivoConsulta: e.target.value })}
              className="w-full resize-y rounded-xl border border-salvia-claro bg-blanco px-4 py-3 text-grafito placeholder:text-grafito-tenue focus:border-jade focus:outline-none"
            />
          </Campo>
        </Tarjeta>

        <Boton type="submit" anchoCompleto data-testid="confirmar-reserva">
          Confirmar turno
        </Boton>

        <p className="text-center text-xs text-grafito-tenue">
          Al confirmar aceptás nuestro{' '}
          <Link to="/legal/aviso" className="underline">
            aviso legal
          </Link>{' '}
          y la{' '}
          <Link to="/legal/privacidad" className="underline">
            política de privacidad
          </Link>
          .
        </p>
      </form>
    </Contenedor>
  )
}

function Confirmacion({ reserva, onReservarOtro }: { reserva: Reserva; onReservarOtro: () => void }) {
  const nombreTerapia = nombreDeTerapia(reserva.terapiaId)
  const enlace = enlaceDeWhatsApp(datosDelTurno(reserva, nombreTerapia))

  return (
    <Contenedor className="py-10">
      <Tarjeta className="p-6" data-testid="confirmacion">
        <Sello>Turno confirmado</Sello>
        <h1 className="mt-3 text-2xl text-jade">
          Listo, {reserva.paciente.nombre.primerNombre}. Te esperamos.
        </h1>

        <dl className="mt-6 grid gap-3 border-t border-salvia-niebla pt-5 text-sm">
          <Fila termino="Terapia" descripcion={nombreTerapia} />
          <Fila termino="Día" descripcion={reserva.fecha.etiquetaLarga} />
          <Fila termino="Hora" descripcion={reserva.hora.texto} />
          <Fila termino="A nombre de" descripcion={reserva.paciente.nombre.valor} />
          <Fila termino="Celular" descripcion={reserva.paciente.celular.formateado} />
        </dl>

        <div className="mt-6 rounded-xl border border-dashed border-salvia-claro bg-lino px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-wider text-grafito-suave">Tu código de reserva</p>
          <p className="mt-1 font-titulo text-3xl text-jade" data-testid="codigo-reserva">
            {reserva.codigo.valor}
          </p>
          <p className="mt-1 text-xs text-grafito-suave">
            Guardalo: con este código podés consultar o cancelar tu turno.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={enlace}
            target="_blank"
            rel="noreferrer"
            data-testid="enlace-whatsapp"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-jade px-5 py-3 text-[0.95rem] font-semibold text-blanco transition-colors hover:bg-jade-hondo"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.17-1.35a9.93 9.93 0 0 0 4.87 1.24c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm5.8 14.06c-.24.68-1.42 1.32-1.95 1.36-.5.04-.98.22-3.3-.69-2.77-1.09-4.53-3.92-4.67-4.1-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27a1 1 0 0 1 .72-.34h.52c.16 0 .39-.06.6.46l.83 2c.07.14.11.3.02.48l-.28.42c-.09.13-.2.27-.09.46.11.2.5.82 1.07 1.33.73.65 1.35.86 1.54.95.19.1.3.08.42-.05l.6-.7c.15-.19.29-.15.48-.08l1.88.89c.2.09.32.14.37.21.05.08.05.45-.19 1.13Z" />
            </svg>
            Avisar por WhatsApp
          </a>

          <Link
            to="/mi-turno"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-salvia-claro bg-blanco px-5 py-3 text-[0.95rem] font-semibold text-jade hover:border-jade"
          >
            Ver o cancelar mi turno
          </Link>

          <Boton type="button" tono="contorno" anchoCompleto onClick={onReservarOtro}>
            Reservar otra sesión
          </Boton>
        </div>
      </Tarjeta>
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
