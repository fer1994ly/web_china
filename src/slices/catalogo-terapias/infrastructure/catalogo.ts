import type { Terapia } from '../domain/terapia'

/**
 * Las cuatro terapias del centro. Contenido real: descripciones escritas para este
 * negocio, sin texto de relleno. `tests/unit/sin-relleno.test.ts` lo verifica.
 */
export const TERAPIAS: readonly Terapia[] = [
  {
    id: 'acupuntura',
    nombre: 'Acupuntura',
    resumen: 'Agujas estériles descartables en puntos precisos para destrabar dolor y tensión.',
    descripcion:
      'La sesión empieza con una lectura de pulso y una conversación breve sobre lo que te trae. ' +
      'Después se colocan entre ocho y quince agujas muy finas en los puntos que corresponden a tu cuadro, ' +
      'y descansás con ellas entre veinte y treinta minutos. Las agujas son de un solo uso y se descartan ' +
      'delante tuyo al terminar.',
    beneficios: [
      'Alivio de dolor lumbar y cervical',
      'Mejor descanso nocturno',
      'Reducción del estrés sostenido',
      'Acompañamiento en migrañas recurrentes',
    ],
    duracionMinutos: 60,
    precioGs: 180000,
    imagen: '/img/acupuntura.jpg',
    imagenAlt: 'Manos de la terapeuta colocando una aguja fina de acupuntura sobre la espalda de una paciente',
  },
  {
    id: 'auriculoterapia',
    nombre: 'Auriculoterapia',
    resumen: 'Estimulación de puntos del pabellón auricular con semillas de mostaza o balines.',
    descripcion:
      'Toda la oreja funciona como un mapa del cuerpo. Se identifican los puntos activos y se fijan ' +
      'semillas de mostaza con cinta hipoalergénica, que vos misma o vos mismo vas presionando durante ' +
      'los días siguientes. Es la opción para quien quiere probar la medicina china sin agujas.',
    beneficios: [
      'Manejo de la ansiedad entre sesiones',
      'Apoyo en tratamientos de descenso de peso',
      'Menos antojos en procesos de dejar de fumar',
      'Sesión sin agujas, apta para quien les tiene aprensión',
    ],
    duracionMinutos: 40,
    precioGs: 120000,
    imagen: '/img/auriculoterapia.jpg',
    imagenAlt: 'Terapeuta trabajando sobre el pabellón auricular de una paciente recostada y relajada',
  },
  {
    id: 'reflexologia',
    nombre: 'Reflexología podal',
    resumen: 'Presión sobre zonas reflejas del pie que se corresponden con órganos y sistemas.',
    descripcion:
      'Se trabaja pie por pie con presión sostenida sobre las zonas reflejas, buscando los puntos ' +
      'que aparecen sensibles. Es la terapia que más eligen quienes pasan el día de pie o sentados ' +
      'frente a una pantalla. Se hace con ropa cómoda, sin necesidad de desvestirse.',
    beneficios: [
      'Mejor circulación en piernas',
      'Alivio de piernas pesadas e hinchazón al final del día',
      'Digestión más regular',
      'Relajación profunda desde la primera sesión',
    ],
    duracionMinutos: 50,
    precioGs: 140000,
    imagen: '/img/reflexologia.jpg',
    imagenAlt: 'Manos aplicando presión sostenida sobre la planta del pie durante una sesión de reflexología',
  },
  {
    id: 'moxibustion',
    nombre: 'Moxibustión',
    resumen: 'Calor de artemisa sobre puntos de acupuntura para movilizar energía y circulación.',
    descripcion:
      'Según el caso se acerca un cigarro de artemisa a los puntos elegidos, sin tocar la piel, o se ' +
      'monta un cono de artemisa sobre la aguja ya colocada para que el calor entre por el punto. ' +
      'La zona toma un calor parejo y sostenido. El olor a artemisa queda un rato en la sala: es parte ' +
      'de la sesión. Se usa sola o en la misma sesión que la acupuntura.',
    beneficios: [
      'Alivio de dolores que empeoran con el frío o la humedad',
      'Apoyo en cólicos menstruales',
      'Mejora de la energía general en cuadros de cansancio',
      'Se combina bien con acupuntura en la misma sesión',
    ],
    duracionMinutos: 45,
    precioGs: 150000,
    imagen: '/img/moxibustion.jpg',
    imagenAlt: 'Terapeuta encendiendo un cono de artemisa montado sobre una aguja de acupuntura',
  },
]

export function buscarTerapia(id: string): Terapia | undefined {
  return TERAPIAS.find((t) => t.id === id)
}

export function nombreDeTerapia(id: string): string {
  return buscarTerapia(id)?.nombre ?? id
}
