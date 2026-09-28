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
| La app arranca con la CSP de produccion | — | `npm run csp` |
