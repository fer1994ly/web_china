# Matriz de criterios de aceptacion

La revision de Kodarvia se hace contra esta lista. Cada criterio tiene un escenario
Gherkin ejecutable; `npm run verify` los corre todos.

| ID | Criterio de aceptacion | Feature | Escenario | Tests de dominio |
|---|---|---|---|---|
| **CA-01** | El formulario de reserva valida obligatorios e impide avanzar si falta nombre, celular, terapia, fecha u hora | `reserva.feature` | "No se puede confirmar sin completar los datos obligatorios" | `datos-paciente.test.ts`, `celular-paraguayo.test.ts` |
| **CA-02** | Al confirmar un turno, el horario queda inhabilitado de inmediato | `reserva.feature` | "El horario reservado deja de ofrecerse de inmediato" | `agenda-del-dia.test.ts` → "rechaza una segunda reserva sobre el mismo slot" |
| **CA-03** | Reservas, cancelaciones y bloqueos persisten tras recargar o cerrar el navegador | `persistencia.feature` | "Las reservas sobreviven a una recarga", "Los bloqueos y las cancelaciones sobreviven a una recarga" | `agenda.localstorage.repo.test.ts` |
| **CA-04** | `/admin` solicita clave fija y bloquea la agenda hasta ingresar el valor correcto | `admin.feature` | "La agenda permanece oculta hasta ingresar la clave correcta" | `clave-admin.test.ts` |
| **CA-05** | Bloquear un horario en admin lo retira de la vista publica | `admin.feature` | "Un horario bloqueado desde el panel desaparece de la vista publica" | `agenda-del-dia.test.ts` → "no ofrece un slot bloqueado" |
| **CA-06** | El boton de WhatsApp genera un enlace `https://wa.me/` con nombre, servicio, fecha y hora codificados | `whatsapp.feature` | "El enlace de WhatsApp lleva los datos del turno codificados" | `enlace-whatsapp.test.ts` |
| **CA-07** | La interfaz se adapta desde 360px sin desbordes horizontales | `responsive.feature` | "Ninguna ruta desborda horizontalmente a 360px" (7 rutas), "Las pantallas principales también se adaptan a tablet y escritorio" (768 y 1280), "Los objetivos táctiles son cómodos en el celular" | — (solo navegador real) |
| **CA-08** | Repo compartido con partners@kodarvia.com, README completo y URL de preview | — | Checklist manual en `README.md` | — |

## Criterios transversales del briefing

| Regla | Como se verifica |
|---|---|
| Nada de lorem ipsum | `tests/unit/sin-relleno.test.ts` escanea el seed y los textos buscando `lorem`, `ipsum`, `dolor sit` |
| Terracota solo para cancelaciones y alertas | `tests/unit/arquitectura.test.ts` |
| El dominio no conoce React ni localStorage | `tests/unit/arquitectura.test.ts` |
| Cross-slice solo por public API | `tests/unit/arquitectura.test.ts` |
| Ningun texto se corta dentro de su tarjeta | `responsive.feature` |
| Objetivos tactiles de 44px (WCAG 2.5.8) | `responsive.feature` |

## Documentacion y completitud de la entrega

| Requisito | Donde esta / como se verifica |
|---|---|
| El README explica como arrancar el proyecto y donde esta cada cosa | `README.md` → "Como arrancarlo" y "Donde esta cada cosa" |
| Que funcionalidades estan simuladas y como se comportan | `README.md` → "Que esta simulado": persistencia, clave del panel, WhatsApp, correo y pagos, datos del centro y fotografias |
| Datos de ejemplo precargados y como reiniciarlos | `README.md` → "Datos de ejemplo": el boton del panel y el borrado de la clave `centro-qi:agenda` en localStorage |
| Todas las pantallas cableadas y funcionando | `navegacion.feature`: cada ruta muestra su propia pantalla, todos los enlaces internos responden, y se llega a todas desde la interfaz |
| URL de preview publicada | <https://gorgeous-shortbread-f7e06f.netlify.app> |

## Requisitos de posicionamiento (SEO)

No son criterios de Kodarvia, pero se verifican con el mismo rigor: sin esto una SPA
le entrega HTML vacio a los buscadores y a la vista previa de WhatsApp.

| Requisito | Feature | Escenario |
|---|---|---|
| Titulo, descripcion y canonica propios por pagina | `seo.feature` | "Cada pagina publica tiene titulo, descripcion y canonica propios" |
| Las paginas con datos de un paciente no se indexan | `seo.feature` | "Las paginas privadas se excluyen de los buscadores" |
| El enlace compartido muestra tarjeta completa | `seo.feature` | "El enlace compartido por WhatsApp muestra una tarjeta completa" |
| Datos del negocio legibles por Google | `seo.feature` | "La pagina principal publica los datos del negocio para Google" |
| Ningun titulo duplicado | `seo.feature` | "Cada titulo de pagina es distinto de los demas" |
| Inventario de rutas coherente con sitemap y prerender | — | `tests/unit/seo.test.ts` |
| El HTML servido ya trae el contenido, sin ejecutar JavaScript | `rendimiento.feature` | "El contenido de una pagina de contenido ya viene en el HTML" |
| La pantalla de reserva publica sus metadatos sin congelar la agenda | `rendimiento.feature` | "La pantalla de reserva trae sus metadatos aunque su agenda la arme el navegador" |
| Una URL inexistente responde 404 y no se indexa | `rendimiento.feature` | "Una direccion que no existe responde 404 y no se indexa como pagina" |
| Las etiquetas del prerender y las del navegador salen de la misma lista | — | `tests/unit/pagina-estatica.test.ts` |
| La app arranca con la CSP de produccion | — | `npm run csp` |

## Rendimiento: Core Web Vitals

Son las tres metricas con las que Google mide la experiencia real de una pagina y que
usa como senal de ranking. Los umbrales son los suyos —LCP 2500 ms, CLS 0.1, INP 200 ms—
y los fija `tests/unit/rendimiento.test.ts` para que nadie los relaje y ponga el tablero
en verde sin arreglar nada.

La medicion sale de `PerformanceObserver` en el propio navegador (ver
`src/shared/rendimiento/`), no de una estimacion. Corre contra un servidor local, asi que
los tiempos son mejores que en un celular con datos moviles: un fallo no dice "el sitio es
lento en Paraguay", dice que algo se rompio tanto que ni en las mejores condiciones entra
en rango.

| Requisito | Feature | Escenario |
|---|---|---|
| LCP y CLS en rango bueno en las paginas publicas | `rendimiento.feature` | "Las paginas publicas entran en el rango bueno de Core Web Vitals" (4 rutas) |
| La tipografia se sirve del propio dominio, sin hojas de terceros que bloqueen el pintado | `rendimiento.feature` | "La tipografia se sirve desde el propio dominio" |
| El panel no viaja en el codigo que descarga un paciente | `rendimiento.feature` | "El panel del centro no viaja en el codigo que descarga un paciente" |
| Las fotos reservan su espacio antes de cargar (CLS) | — | `imagenAncho`/`imagenAlto` en el catalogo; lo cubre el CLS de arriba |

## Despliegue

`netlify.toml` decide cosas que ningun test de la app puede ver y que se rompen en
silencio: el build entero puede ser imposible de correr en Netlify y no enterarse hasta
el deploy. `tests/unit/despliegue.test.ts` lee el archivo de verdad y lo verifica.

| Regla | Como se verifica |
|---|---|
| Ningun paso del build necesita un navegador | `tests/unit/despliegue.test.ts` |
| Toda ruta sin HTML propio cae en `spa.html` con 200 | `tests/unit/despliegue.test.ts` |
| Una URL inexistente responde 404 | `tests/unit/despliegue.test.ts` + `rendimiento.feature` |
| Las rutas privadas se sirven con `noindex` | `tests/unit/despliegue.test.ts` |
| La CSP no necesita dominios de terceros | `tests/unit/despliegue.test.ts` |
| Los E2E corren con las reglas reales de `netlify.toml` | `scripts/servidor-estatico.mjs`, que las lee del archivo |
