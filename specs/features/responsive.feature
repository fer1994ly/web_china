# language: es
Característica: Prioridad celular y adaptación a cualquier pantalla
  Como paciente que entra desde el teléfono
  quiero que ninguna pantalla se corte ni se desborde
  para poder reservar sin pelear con el scroll.

  Antecedentes:
    Dado que la demo arranca con los datos de ejemplo de Asunción

  # CA-07
  Esquema del escenario: Ninguna ruta desborda horizontalmente a 360px
    Dado que uso una pantalla de 360 por 640
    Cuando abro la ruta "<ruta>"
    Entonces la página no desborda horizontalmente
    Y ningún texto se sale de su contenedor

    Ejemplos:
      | ruta               |
      | /                  |
      | /terapias          |
      | /reservar          |
      | /mi-turno          |
      | /admin             |
      | /legal/aviso       |
      | /legal/privacidad  |

  Esquema del escenario: Las pantallas principales también se adaptan a tablet y escritorio
    Dado que uso una pantalla de <ancho> por <alto>
    Cuando abro la ruta "<ruta>"
    Entonces la página no desborda horizontalmente

    Ejemplos:
      | ruta       | ancho | alto |
      | /          | 768   | 1024 |
      | /          | 1280  | 800  |
      | /terapias  | 768   | 1024 |
      | /terapias  | 1280  | 800  |
      | /reservar  | 768   | 1024 |
      | /reservar  | 1280  | 800  |

  Escenario: Los objetivos táctiles son cómodos en el celular
    Dado que uso una pantalla de 360 por 640
    Cuando abro la ruta "/reservar"
    Entonces todos los botones miden al menos 44 píxeles de alto
