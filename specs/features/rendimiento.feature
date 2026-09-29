# language: es
Característica: Rendimiento percibido y Core Web Vitals
  Como centro que recibe casi todas sus visitas desde un celular
  quiero que la página se vea rápido, no salte y responda al toque
  para no perder a quien viene a reservar y para no ser penalizado en Google.

  # Core Web Vitals son las tres métricas con las que Google mide la experiencia real
  # y que usa como señal de ranking. Los umbrales son los suyos, no una preferencia
  # nuestra: LCP hasta 2500 ms, CLS hasta 0.1, INP hasta 200 ms.

  Antecedentes:
    Dado que la demo arranca con los datos de ejemplo de Asunción

  Esquema del escenario: Las páginas públicas entran en el rango bueno de Core Web Vitals
    Cuando abro la ruta "<ruta>"
    Entonces el "LCP" está en el rango bueno de Core Web Vitals
    Y el "CLS" está en el rango bueno de Core Web Vitals

    Ejemplos:
      | ruta               |
      | /                  |
      | /terapias          |
      | /reservar          |
      | /legal/aviso       |

  Escenario: El contenido de una página de contenido ya viene en el HTML
    # Sin esto, quien reciba el enlace por WhatsApp ve una tarjeta vacía, y Google
    # tiene que ejecutar JavaScript para saber de qué habla la página.
    Cuando pido el HTML de "/terapias" sin ejecutar JavaScript
    Entonces el HTML ya trae el título de la página
    Y el HTML ya trae el nombre de las cuatro terapias

  Escenario: La pantalla de reserva trae sus metadatos aunque su agenda la arme el navegador
    Cuando pido el HTML de "/reservar" sin ejecutar JavaScript
    Entonces el HTML ya trae el título de la página
    Y el HTML no trae horarios de la agenda

  Escenario: Una dirección que no existe responde 404 y no se indexa como página
    Cuando pido el HTML de "/una-pagina-que-no-existe" sin ejecutar JavaScript
    Entonces la respuesta tiene estado 404

  Escenario: La tipografía se sirve desde el propio dominio
    # Una hoja de estilos de un tercero bloquea el primer pintado y suma dos
    # handshakes antes de que se vea una sola letra.
    Cuando abro la ruta "/"
    Entonces la página no pide nada a dominios de terceros
    Y la tipografía del título ya está aplicada

  Escenario: El panel del centro no viaja en el código que descarga un paciente
    Cuando abro la ruta "/"
    Entonces el código descargado no incluye la clave del panel
