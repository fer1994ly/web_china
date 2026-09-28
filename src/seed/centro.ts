/**
 * Datos del centro. Punto unico de verdad: la landing, el pie de pagina, el mensaje
 * de WhatsApp y las paginas legales leen todos de aca, asi nunca se contradicen.
 *
 * DEMO: el celular y el correo son de ejemplo. Kodarvia los reemplaza por los reales.
 */
export const CENTRO = {
  nombre: 'Centro Qi',
  nombreCompleto: 'Centro Qi · Terapias Orientales',
  lema: 'Medicina tradicional china en Asunción',
  descripcion:
    'Atendemos con acupuntura, auriculoterapia, reflexología y moxibustión en Villa Morra. ' +
    'Sesiones individuales, con turno reservado y sin sala de espera llena.',

  direccion: 'Dr. Juan de Salazar 1247 casi Sucre',
  barrio: 'Villa Morra',
  ciudad: 'Asunción',
  pais: 'Paraguay',

  /** Formato nacional, como se muestra en pantalla. */
  celular: '0981 234 567',
  /** Formato que espera wa.me: sin signo, sin espacios. */
  celularE164: '595981234567',
  correo: 'hola@centroqi.com.py',
  instagram: '@centroqi.py',

  /** Referencia para quien llega en taxi o en colectivo. */
  comoLlegar: 'A media cuadra del Shopping Villa Morra, sobre la vereda par.',
} as const

export const direccionCompleta = (): string =>
  `${CENTRO.direccion}, ${CENTRO.barrio}, ${CENTRO.ciudad}`
