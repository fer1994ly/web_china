# language: es
Característica: Presencia en buscadores y en enlaces compartidos
  Como centro que depende de que lo encuentren
  quiero que cada página tenga sus metadatos y datos estructurados
  para aparecer en Google y para que el enlace se vea bien al compartirlo por WhatsApp.

  Antecedentes:
    Dado que la demo arranca con los datos de ejemplo de Asunción

  Esquema del escenario: Cada página pública tiene título, descripción y canónica propios
    Cuando abro la ruta "<ruta>"
    Entonces la página tiene un título descriptivo
    Y la página tiene una descripción de entre 70 y 200 caracteres
    Y la página declara su URL canónica para "<ruta>"
    Y la página es indexable

    Ejemplos:
      | ruta               |
      | /                  |
      | /terapias          |
      | /reservar          |
      | /legal/aviso       |
      | /legal/privacidad  |

  Esquema del escenario: Las páginas privadas se excluyen de los buscadores
    Cuando abro la ruta "<ruta>"
    Entonces la página no es indexable

    Ejemplos:
      | ruta       |
      | /mi-turno  |
      | /admin     |

  Escenario: El enlace compartido por WhatsApp muestra una tarjeta completa
    Cuando abro la ruta "/"
    Entonces la página tiene las etiquetas Open Graph de título, descripción, imagen y URL
    Y la imagen de Open Graph es una dirección absoluta

  Escenario: La página principal publica los datos del negocio para Google
    Cuando abro la ruta "/"
    Entonces la página incluye datos estructurados de tipo "MedicalBusiness"
    Y los datos estructurados incluyen la dirección y los horarios del centro
    Y la página incluye datos estructurados de tipo "FAQPage"

  Escenario: Cada título de página es distinto de los demás
    Entonces ninguna página pública repite el título de otra
