import { useMemo, type ReactNode } from 'react'
import { CENTRO, direccionCompleta } from '@/seed/centro'
import { Aviso, Contenedor, Tarjeta } from '@/shared/ui/componentes'
import { MigasDePan } from '@/shared/ui/navegacion'
import { useSeo } from '@/shared/seo/useSeo'
import { migasDePan } from '@/app/datos-estructurados'

/**
 * Paginas legales con bloques estructurados.
 *
 * El briefing pide dejar "textos de marcador estandar" en estas dos secciones: el
 * contenido juridico lo redacta el estudio del centro. Los bloques marcados con
 * `pendiente` señalan exactamente que falta y quien lo completa, en vez de simular
 * un texto legal que nadie reviso.
 */

interface Bloque {
  readonly titulo: string
  readonly contenido: ReactNode
  readonly pendiente?: boolean
}

const TEXTO_MARCADOR =
  'Texto pendiente de redacción legal. El estudio jurídico del centro completa esta sección antes de la publicación.'

function PaginaLegal({
  titulo,
  copete,
  ruta,
  bloques,
}: {
  titulo: string
  copete: string
  ruta: string
  bloques: readonly Bloque[]
}) {
  const migas = useMemo(() => [{ nombre: titulo, ruta }], [titulo, ruta])
  const datosEstructurados = useMemo(() => [migasDePan(migas)], [migas])

  useSeo({
    titulo: `${titulo} | Centro Qi`,
    descripcion: copete,
    ruta,
    datosEstructurados,
  })

  return (
    <Contenedor className="py-8">
      <MigasDePan tramos={migas} />
      <h1 className="mt-4 text-3xl text-jade">{titulo}</h1>
      <p className="mt-2 max-w-xl text-grafito-suave">{copete}</p>

      <div className="mt-6">
        <Aviso>
          <span className="font-semibold">Demo:</span> los bloques marcados como pendientes llevan texto
          de marcador estándar, no contenido legal definitivo.
        </Aviso>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {bloques.map((b, i) => (
          <Tarjeta key={b.titulo} className="p-5">
            <h2 className="font-titulo text-lg text-jade">
              {i + 1}. {b.titulo}
            </h2>
            <div className="mt-2 text-sm text-grafito-suave">{b.contenido}</div>
            {b.pendiente === true && (
              <p className="mt-3 rounded-lg border border-dashed border-salvia-claro bg-lino px-3 py-2 text-xs text-grafito-tenue">
                {TEXTO_MARCADOR}
              </p>
            )}
          </Tarjeta>
        ))}
      </div>

      <p className="mt-8 text-xs text-grafito-tenue">
        Última actualización: pendiente de aprobación. Consultas sobre este documento:{' '}
        {CENTRO.correo}.
      </p>
    </Contenedor>
  )
}

export function AvisoLegalPage() {
  return (
    <PaginaLegal
      titulo="Aviso legal"
      ruta="/legal/aviso"
      copete={`Condiciones de uso del sitio de reservas de ${CENTRO.nombreCompleto}, centro de terapias orientales en Villa Morra, Asunción.`}
      bloques={[
        {
          titulo: 'Titular del sitio',
          contenido: (
            <address className="not-italic">
              {CENTRO.nombreCompleto}
              <br />
              {direccionCompleta()}, {CENTRO.pais}
              <br />
              {CENTRO.correo} · {CENTRO.celular}
            </address>
          ),
        },
        {
          titulo: 'Objeto del sitio',
          contenido:
            'Este sitio permite consultar las terapias del centro y reservar turnos. No sustituye una consulta médica ni constituye asesoramiento sanitario.',
        },
        {
          titulo: 'Naturaleza de las terapias',
          contenido:
            'Las terapias ofrecidas son complementarias. No reemplazan tratamientos prescriptos por profesionales de la salud. Ante síntomas agudos, consultá con tu médico de cabecera.',
        },
        {
          titulo: 'Reservas y cancelaciones',
          contenido:
            'El turno queda confirmado al recibir el código de reserva. Podés cancelarlo desde la sección "Mi turno" con ese código. Te pedimos avisar con al menos dos horas de anticipación para liberar el horario.',
        },
        { titulo: 'Propiedad intelectual', contenido: 'Contenido del bloque.', pendiente: true },
        { titulo: 'Limitación de responsabilidad', contenido: 'Contenido del bloque.', pendiente: true },
        { titulo: 'Legislación aplicable y jurisdicción', contenido: 'Contenido del bloque.', pendiente: true },
      ]}
    />
  )
}

export function PrivacidadPage() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      ruta="/legal/privacidad"
      copete="Qué datos pedimos al reservar en el Centro Qi, para qué los usamos y dónde se guardan."
      bloques={[
        {
          titulo: 'Responsable del tratamiento',
          contenido: (
            <address className="not-italic">
              {CENTRO.nombreCompleto}
              <br />
              {direccionCompleta()}
              <br />
              {CENTRO.correo}
            </address>
          ),
        },
        {
          titulo: 'Datos que recogemos',
          contenido: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Nombre y apellido, para identificar el turno.</li>
              <li>Número de celular, para avisarte si hay que reprogramar.</li>
              <li>Motivo de consulta, si elegís escribirlo. Es opcional.</li>
              <li>Terapia, día y hora de la sesión reservada.</li>
            </ul>
          ),
        },
        {
          titulo: 'Finalidad',
          contenido:
            'Gestionar la agenda del centro: confirmar tu turno, evitar reservas duplicadas sobre el mismo horario y contactarte si surge un cambio.',
        },
        {
          titulo: 'Dónde se guardan',
          contenido: (
            <>
              <p>
                <span className="font-semibold text-grafito">En esta versión de demostración</span>, los
                datos se guardan únicamente en el almacenamiento local de tu propio navegador
                (<code className="rounded bg-lino px-1 py-0.5 font-mono text-xs">localStorage</code>). No se
                envían a ningún servidor, no salen de tu dispositivo y no los ve nadie más.
              </p>
              <p className="mt-2">
                Podés borrarlos en cualquier momento limpiando los datos del sitio desde tu navegador.
              </p>
            </>
          ),
        },
        {
          titulo: 'Conservación',
          contenido: 'Contenido del bloque.',
          pendiente: true,
        },
        {
          titulo: 'Cesión a terceros',
          contenido: 'Contenido del bloque.',
          pendiente: true,
        },
        {
          titulo: 'Derechos de acceso, rectificación y supresión',
          contenido: 'Contenido del bloque.',
          pendiente: true,
        },
        {
          titulo: 'Cookies',
          contenido:
            'Este sitio no usa cookies de seguimiento ni herramientas de analítica de terceros.',
        },
      ]}
    />
  )
}
