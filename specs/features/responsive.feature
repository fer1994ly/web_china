# language: es
Característica: Prioridad celular
  Como paciente que entra desde el teléfono
  quiero que ninguna pantalla se corte ni se desborde
  para poder reservar sin pelear con el scroll.

  # CA-07
  Esquema del escenario: Ninguna ruta desborda horizontalmente a 360px
    Dado que la demo arranca con los datos de ejemplo de Asunción
    Y uso una pantalla de 360 por 640
    Cuando abro la ruta "<ruta>"
    Entonces la página no desborda horizontalmente

    Ejemplos:
      | ruta               |
      | /                  |
      | /terapias          |
      | /reservar          |
      | /mi-turno          |
      | /admin             |
      | /legal/aviso       |
      | /legal/privacidad  |
