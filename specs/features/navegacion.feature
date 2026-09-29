# language: es
Característica: Todas las pantallas cableadas y alcanzables
  Como centro que entrega esto para revisión
  quiero que ninguna pantalla quede a medio conectar
  para que nadie se encuentre con un enlace muerto o una página vacía.

  # "Cableado" no es una impresión: es que cada ruta del inventario muestre su propia
  # pantalla, que se llegue a todas desde la interfaz y que ningún enlace del sitio
  # apunte a una dirección que no existe. Un botón que no lleva a ninguna parte es el
  # defecto más fácil de dejar pasar y el más visible para quien revisa.

  Antecedentes:
    Dado que la demo arranca con los datos de ejemplo de Asunción

  Escenario: Cada ruta del inventario muestra su propia pantalla con contenido real
    Cuando recorro todas las rutas del sitio
    Entonces cada pantalla muestra contenido propio y un encabezado distinto
    Y ninguna pantalla queda en blanco ni muestra un error

  Escenario: Ningún enlace del sitio lleva a una dirección que no existe
    Cuando recorro todas las rutas del sitio
    Entonces todos los enlaces internos que encontré responden

  Escenario: Se llega a todas las pantallas públicas desde la interfaz
    Cuando abro la ruta "/"
    Entonces el menú principal lleva a las pantallas públicas
    Y el pie de página lleva a las legales y al panel

  Escenario: El botón de WhatsApp del pie abre un enlace real
    Cuando abro la ruta "/"
    Entonces el pie de página ofrece el celular del centro como enlace de WhatsApp
