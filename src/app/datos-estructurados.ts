import { CENTRO } from '@/seed/centro'
import { SITIO } from '@/shared/seo/useSeo'
import { HorarioAtencion } from '@/slices/agenda'
import { TERAPIAS } from '@/slices/catalogo-terapias'

/**
 * Datos estructurados schema.org.
 *
 * Vive en `app/` y no en `shared/` porque compone informacion de varios slices
 * (el catalogo y el horario de atencion), y `shared` no puede depender de slices.
 *
 * Son lo que convierte un resultado de busqueda en una ficha con horarios, direccion
 * y precios, en vez de dos lineas de texto.
 */

/** Los dias de `HorarioAtencion` en el vocabulario de schema.org. */
function horariosSchema(): object[] {
  const horario = HorarioAtencion.delCentro()
  const NOMBRES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ] as const

  // Se recorre una semana real para no duplicar la definicion del horario:
  // la fuente de verdad sigue siendo la politica del dominio.
  const especificaciones: object[] = []
  for (let dia = 0; dia < 7; dia += 1) {
    const tramos = horario.tramosDePorDiaSemana(dia)
    for (const t of tramos) {
      especificaciones.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${NOMBRES[dia]}`,
        opens: t.desde.texto,
        closes: t.hasta.texto,
      })
    }
  }
  return especificaciones
}

export function negocio(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': `${SITIO.url}/#centro`,
    name: CENTRO.nombreCompleto,
    alternateName: CENTRO.nombre,
    description: CENTRO.descripcion,
    url: SITIO.url,
    telephone: `+${CENTRO.celularE164}`,
    email: CENTRO.correo,
    image: `${SITIO.url}/img/acupuntura.jpg`,
    priceRange: 'Gs. 120.000 – Gs. 180.000',
    currenciesAccepted: 'PYG',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CENTRO.direccion,
      addressLocality: CENTRO.ciudad,
      addressRegion: CENTRO.barrio,
      addressCountry: 'PY',
    },
    areaServed: { '@type': 'City', name: CENTRO.ciudad },
    medicalSpecialty: 'https://schema.org/PhysicalTherapy',
    openingHoursSpecification: horariosSchema(),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Terapias',
      itemListElement: TERAPIAS.map((t) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: t.nombre, description: t.resumen },
        price: t.precioGs,
        priceCurrency: 'PYG',
        availability: 'https://schema.org/InStock',
      })),
    },
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITIO.url}/reservar`,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
      result: { '@type': 'Reservation', name: 'Turno reservado' },
    },
  }
}

export function sitioWeb(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITIO.url}/#sitio`,
    name: CENTRO.nombreCompleto,
    url: SITIO.url,
    inLanguage: 'es-PY',
    publisher: { '@id': `${SITIO.url}/#centro` },
  }
}

export function servicio(terapiaId: string): object | null {
  const t = TERAPIAS.find((x) => x.id === terapiaId)
  if (t === undefined) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: t.nombre,
    description: t.descripcion,
    serviceType: t.nombre,
    provider: { '@id': `${SITIO.url}/#centro` },
    areaServed: { '@type': 'City', name: CENTRO.ciudad },
    offers: {
      '@type': 'Offer',
      price: t.precioGs,
      priceCurrency: 'PYG',
      availability: 'https://schema.org/InStock',
      url: `${SITIO.url}/reservar?terapia=${t.id}`,
    },
  }
}

export function todosLosServicios(): object[] {
  return TERAPIAS.map((t) => servicio(t.id)).filter((s): s is object => s !== null)
}

export function migasDePan(tramos: readonly { nombre: string; ruta: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO.url },
      ...tramos.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: t.nombre,
        item: `${SITIO.url}${t.ruta}`,
      })),
    ],
  }
}

export interface Pregunta {
  readonly pregunta: string
  readonly respuesta: string
}

export function preguntasFrecuentes(preguntas: readonly Pregunta[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preguntas.map((p) => ({
      '@type': 'Question',
      name: p.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
    })),
  }
}
