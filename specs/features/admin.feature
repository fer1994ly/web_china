# language: es
Característica: Panel de administración de la agenda
  Como recepción del centro
  quiero entrar con una clave y manejar los horarios
  para bloquear franjas y ver los turnos del día.

  # CA-04
  Escenario: La agenda permanece oculta hasta ingresar la clave correcta
    Dado que la demo arranca con los datos de ejemplo de Asunción
    Cuando abro la ruta "/admin"
    Entonces no veo la agenda del día
    Y veo el pedido de clave
    Cuando ingreso la clave "incorrecta"
    Entonces no veo la agenda del día
    Y veo un aviso de clave incorrecta
    Cuando ingreso la clave correcta
    Entonces veo la agenda del día

  # CA-05
  Escenario: Un horario bloqueado desde el panel desaparece de la vista pública
    Dado que la demo arranca con los datos de ejemplo de Asunción
    Y entré al panel con la clave correcta
    Cuando bloqueo el primer horario disponible del primer día
    Entonces ese horario figura como bloqueado en el panel
    Cuando abro la vista pública de reserva para ese mismo día
    Entonces el horario que bloqueé ya no figura como disponible

  Escenario: Reiniciar los datos de ejemplo devuelve la demo a su estado original
    Dado que la demo arranca con los datos de ejemplo de Asunción
    Y entré al panel con la clave correcta
    Y bloqueo el primer horario disponible del primer día
    Cuando reinicio los datos de ejemplo
    Entonces ese horario vuelve a figurar como disponible
