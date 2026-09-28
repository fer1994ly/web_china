# language: es
Característica: Persistencia local de la agenda
  Como centro de terapias
  quiero que los turnos, cancelaciones y bloqueos sobrevivan al cierre del navegador
  para no perder la agenda entre visitas.

  # CA-03
  Escenario: Las reservas sobreviven a una recarga
    Dado que la demo arranca con los datos de ejemplo de Asunción
    Y reservo un turno de "Reflexología" a nombre de "Mariana Ojeda" con celular "0972 334 118"
    Cuando recargo la página
    Y vuelvo a la vista de reserva para ese mismo día
    Entonces el horario que tomé ya no figura como disponible

  # CA-03
  Escenario: Los bloqueos y las cancelaciones sobreviven a una recarga
    Dado que la demo arranca con los datos de ejemplo de Asunción
    Y reservo un turno de "Moxibustión" a nombre de "Diego Ayala" con celular "0985 210 447"
    Y cancelo ese turno con mi código de reserva
    Cuando recargo la página
    Y consulto ese turno con el código de reserva
    Entonces el turno figura como cancelado
