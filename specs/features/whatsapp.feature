# language: es
Característica: Aviso por WhatsApp del turno confirmado
  Como paciente
  quiero mandarle al centro el detalle de mi turno por WhatsApp
  para dejar constancia sin tener que escribirlo a mano.

  # CA-06
  Escenario: El enlace de WhatsApp lleva los datos del turno codificados
    Dado que la demo arranca con los datos de ejemplo de Asunción
    Y reservo un turno de "Auriculoterapia" a nombre de "Lucía Benítez" con celular "0981 456 789"
    Cuando miro el botón de WhatsApp de la confirmación
    Entonces el enlace empieza con "https://wa.me/"
    Y el texto del enlace contiene el nombre "Lucía Benítez"
    Y el texto del enlace contiene la terapia "Auriculoterapia"
    Y el texto del enlace contiene la fecha y la hora del turno
