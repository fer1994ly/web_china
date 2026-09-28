# language: es
Característica: Reserva de un turno desde el celular
  Como paciente del centro
  quiero reservar mi sesión desde el teléfono en menos de un minuto
  para no tener que llamar ni esperar respuesta.

  Antecedentes:
    Dado que la demo arranca con los datos de ejemplo de Asunción

  # CA-01
  Escenario: No se puede confirmar sin completar los datos obligatorios
    Dado que estoy en el formulario de reserva
    Cuando intento confirmar sin completar ningún dato
    Entonces el turno no se confirma
    Y veo el aviso de campo obligatorio en "nombre"
    Y veo el aviso de campo obligatorio en "celular"
    Y veo el aviso de campo obligatorio en "terapia"
    Y veo el aviso de campo obligatorio en "fecha"
    Y veo el aviso de campo obligatorio en "hora"

  # CA-01
  Escenario: Un celular con formato inválido tampoco deja avanzar
    Dado que estoy en el formulario de reserva
    Y completo el formulario con nombre "Lucía Benítez" y celular "123"
    Cuando intento confirmar la reserva
    Entonces el turno no se confirma
    Y veo el aviso de campo obligatorio en "celular"

  # CA-02
  Escenario: El horario reservado deja de ofrecerse de inmediato
    Dado que estoy en el formulario de reserva
    Y elijo la terapia "Acupuntura"
    Y elijo el primer día disponible
    Y tomo nota del primer horario disponible
    Cuando completo mis datos como "Lucía Benítez" con celular "0981 456 789"
    Y confirmo la reserva
    Entonces veo la confirmación con mi código de reserva
    Cuando vuelvo a la vista de reserva para ese mismo día
    Entonces el horario que tomé ya no figura como disponible
