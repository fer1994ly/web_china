export interface PreguntaFrecuente {
  readonly pregunta: string
  readonly respuesta: string
}

/**
 * Preguntas reales que recibe un centro de terapias orientales.
 *
 * Sirven dos propositos a la vez: le sacan la duda a quien esta por reservar por
 * primera vez, y alimentan los datos estructurados FAQPage, que es lo que hace que
 * estas respuestas puedan aparecer directamente en el buscador.
 */
export const PREGUNTAS_FRECUENTES: readonly PreguntaFrecuente[] = [
  {
    pregunta: '¿Duele la acupuntura?',
    respuesta:
      'Las agujas son mucho más finas que las de una inyección: entran casi sin sentirse. Lo que sí se ' +
      'nota es una sensación de peso o calor alrededor del punto, que en medicina china se llama "deqi" ' +
      'y es señal de que el punto está respondiendo. Si algo te molesta, avisá y se reacomoda en el momento.',
  },
  {
    pregunta: '¿Cuántas sesiones necesito?',
    respuesta:
      'Depende del cuadro. Una contractura reciente suele ceder en tres o cuatro sesiones. Un dolor ' +
      'crónico de años se trabaja en ciclos de ocho a diez, con sesiones semanales al principio y más ' +
      'espaciadas después. En la primera sesión te damos una estimación concreta para tu caso.',
  },
  {
    pregunta: '¿Tengo que llevar algo?',
    respuesta:
      'Vení con ropa cómoda y, si tenés estudios recientes relacionados con tu consulta, traelos. No hace ' +
      'falta ayuno ni preparación previa. Si venís derecho del trabajo, mejor comer algo liviano antes: ' +
      'no conviene llegar con el estómago vacío.',
  },
  {
    pregunta: '¿Reemplaza a mi tratamiento médico?',
    respuesta:
      'No. Las terapias que hacemos son complementarias y se suman a lo que te indicó tu médico, nunca lo ' +
      'reemplazan. No suspendas ninguna medicación por tu cuenta. Si estás con un tratamiento en curso, ' +
      'contanos cuál para poder coordinar.',
  },
  {
    pregunta: '¿Cómo cancelo o cambio mi turno?',
    respuesta:
      'Con el código de reserva que te damos al confirmar, entrás a "Mi turno" y lo cancelás vos misma o ' +
      'vos mismo, sin llamar. Te pedimos avisar con al menos dos horas de anticipación para que el ' +
      'horario quede libre para otra persona.',
  },
  {
    pregunta: '¿Atienden a embarazadas?',
    respuesta:
      'Sí, con puntos adaptados y evitando los que están contraindicados durante el embarazo. Es ' +
      'importante que nos avises al reservar, en el campo de consulta, para preparar la sesión.',
  },
  {
    pregunta: '¿Las agujas son descartables?',
    respuesta:
      'Sí. Se usan agujas estériles de un solo uso, se abren delante tuyo y se descartan al terminar la ' +
      'sesión en un recipiente para material cortopunzante. No se reutilizan bajo ninguna circunstancia.',
  },
  {
    pregunta: '¿Aceptan pagos con tarjeta?',
    respuesta:
      'Sí, se abona al momento de la sesión en efectivo, con transferencia o con tarjeta de débito y ' +
      'crédito. La reserva del turno no requiere pago anticipado.',
  },
]
