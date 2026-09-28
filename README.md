# Centro Qi · Reservas de terapias orientales

Aplicación de reservas para un centro de acupuntura y terapias tradicionales chinas en
Villa Morra, Asunción. Los pacientes reservan su sesión desde el celular, sin llamar ni esperar
respuesta.

**Todo corre en el frontend.** No hay backend, ni base de datos, ni pasarelas de mensajería:
la agenda vive en el `localStorage` del navegador. Kodarvia migra los datos a una base
centralizada, implementa la autenticación segura y publica en el servidor definitivo.

---

## Cómo arrancarlo

Requiere Node 20 o superior (probado con Node 24).

```bash
npm install
npm run dev          # http://localhost:5173
```

Para ver la build de producción tal como la corre la suite de aceptación:

```bash
npm run build
npm run preview      # http://localhost:4173
```

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Chequeo de tipos + build de producción |
| `npm run test` | Vitest: dominio, aplicación, infraestructura y reglas de arquitectura |
| `npm run test:e2e` | Playwright: los escenarios Gherkin, a 360px |
| `npm run test:e2e:ui` | Lo mismo, en modo interactivo |
| `npm run typecheck` | Solo TypeScript |
| `npm run lint` | oxlint |
| **`npm run verify`** | **Todo junto: la puerta de entrega** |

---

## Dónde está cada cosa

```
specs/                     La especificación ejecutable
  ubiquitous-language.md     Vocabulario e invariantes del dominio
  acceptance-matrix.md       CA-01…CA-08 → escenario → archivo de test
  features/*.feature         Gherkin en español, uno por área

src/
  app/                     Composition root, router, contexto
    container.ts             El ÚNICO lugar que elige una implementación concreta
  shared/
    domain/                  Result, DomainError, Clock (port)
    infra/                   Driver de localStorage con sobre versionado
    ui/                      Design system: Boton, Campo, Tarjeta, Aviso…
  slices/                  Un slice = una capacidad de negocio
    agenda/                  ★ CORE: el agregado AgendaDelDia y sus reglas
    catalogo-terapias/       Las cuatro terapias
    reserva-turno/           Formulario, validación y confirmación
    cancelacion-turno/       Consulta y baja con código de reserva
    admin-acceso/            Clave del panel y sesión
    admin-agenda/            Panel: turnos, bloqueos, reinicio de la demo
    difusion-whatsapp/       Constructor del enlace wa.me
    contenido-institucional/ Landing, terapias, legales, layout
  seed/                    Datos de ejemplo de Asunción y datos del centro

tests/
  unit/                    Fitness functions de arquitectura y contenido
  e2e/steps/               Los pasos que hacen ejecutables los .feature

public/img/                Fotografías (ver CREDITOS.md)
```

### Cómo está organizado el código

Cada slice tiene sus cuatro capas adentro, y la dependencia va en un solo sentido:

```
ui  →  application  →  domain
                ↑
       infrastructure (implementa los ports del domain)
```

El `domain` es TypeScript puro: no conoce React, ni el DOM, ni `localStorage`, ni la hora del
sistema (el tiempo entra por el port `Clock`). Los slices se hablan entre sí **solo por su
`index.ts`**, nunca alcanzando los internos de otro.

Esto no es una convención escrita en un documento: lo verifica
`tests/unit/arquitectura.test.ts`, que corre en `npm run verify` y falla con el nombre del
archivo infractor.

**El agregado.** `AgendaDelDia` tiene como identidad la fecha, y es el límite de consistencia
del sistema. La razón es la invariante central del negocio — *un slot, una sola reserva
confirmada* — que cruza varias reservas a la vez y solo se puede garantizar si el día entero es
la unidad de consistencia. Con un agregado `Reserva` suelto, la detección de colisiones se
escaparía a la interfaz, que es exactamente el bug que persigue el criterio CA-02.

---

## Qué está simulado

| Pieza | Cómo funciona hoy | Qué hace falta para producción |
|---|---|---|
| **Persistencia** | `localStorage` del navegador, clave `centro-qi:agenda`, con sobre `{schemaVersion, data}`. Los datos no salen del dispositivo ni se comparten entre navegadores. | Base de datos centralizada detrás del port `AgendaRepository`. Se reemplaza un solo archivo: `agenda.localstorage.repo.ts`. |
| **Clave del panel** | Constante en el código (`qi2026`), sesión en `sessionStorage`. **No es seguridad**: cualquiera que lea el bundle la encuentra. | Autenticación del lado del servidor. |
| **WhatsApp** | El botón arma un enlace `https://wa.me/` real con el texto del turno codificado. **La app no envía nada por su cuenta**: abre WhatsApp con el mensaje listo para que la persona lo mande. | API de WhatsApp Business si se quiere envío automático. |
| **Correo y pagos** | No están conectados. La lógica queda preparada detrás de los mismos límites. | Proveedor de correo y pasarela de pago. |
| **Celular y correo del centro** | Datos de ejemplo en `src/seed/centro.ts`. | Los reales del negocio. |
| **Fotografías** | Unsplash, libres de derechos (ver `public/img/CREDITOS.md`). | Fotos del consultorio real. |

Los textos de las páginas legales que dicen *"pendiente de redacción legal"* son marcadores
deliberados: ese contenido lo redacta el estudio jurídico del centro. Todo el resto del
contenido es real y escrito para este negocio — no hay lorem ipsum en ninguna pantalla, y
`tests/unit/sin-relleno.test.ts` lo verifica.

---

## Datos de ejemplo

La demo arranca precargada, sin configurar nada: 9 turnos (8 confirmados y 1 cancelado, para
que se vea el historial), 3 bloqueos y las cuatro terapias con precios en guaraníes.

Los turnos **se generan en relación al día en que abrís la demo**, no con fechas fijas, así la
agenda siempre se ve con uso real.

### Cómo reiniciar los datos de ejemplo

**Desde la aplicación** (la forma recomendada):

1. Entrá a `/admin` con la clave `qi2026`.
2. Bajá hasta *Datos de ejemplo* y tocá **Reiniciar datos de ejemplo**.
3. Confirmá. La agenda vuelve al estado original.

**Desde el navegador**, si preferís empezar de cero a mano: abrí DevTools →
*Application* → *Local Storage* → borrá la clave `centro-qi:agenda` y recargá. La app detecta
que no hay datos y vuelve a sembrar sola.

Lo mismo pasa si los datos guardados quedan corruptos o son de una versión anterior del
esquema: la app vuelve a sembrar en lugar de mostrar una pantalla en blanco.

---

## Criterios de aceptación

Cada criterio tiene un escenario Gherkin ejecutable. `npm run verify` los corre todos.

| ID | Criterio | Dónde se verifica |
|---|---|---|
| CA-01 | El formulario valida obligatorios e impide avanzar si falta nombre, celular, terapia, fecha u hora | `reserva.feature` + `formulario-reserva.test.ts` |
| CA-02 | Al confirmar, el horario queda inhabilitado de inmediato | `reserva.feature` + `agenda-del-dia.test.ts` |
| CA-03 | Reservas, cancelaciones y bloqueos persisten tras recargar o cerrar el navegador | `persistencia.feature` + `agenda.localstorage.repo.test.ts` |
| CA-04 | `/admin` pide clave y bloquea la agenda hasta acertar | `admin.feature` |
| CA-05 | Un horario bloqueado desde el panel desaparece de la vista pública | `admin.feature` + `agenda-del-dia.test.ts` |
| CA-06 | El botón de WhatsApp genera un `https://wa.me/` con nombre, servicio, fecha y hora codificados | `whatsapp.feature` + `enlace-whatsapp.test.ts` |
| CA-07 | La interfaz se adapta desde 360px sin desbordes horizontales | `responsive.feature`, las 7 rutas a 360×640 |
| CA-08 | Repo compartido con partners@kodarvia.com, README y preview | Este documento |

El criterio CA-07 no se revisa a ojo: el escenario mide el desborde real en el navegador y, si
falla, nombra el elemento concreto que se sale del viewport.

### Revisión manual

1. Abrí `/` a **360×640** y recorré todas las rutas buscando scroll horizontal.
2. Reservá un turno → recargá con F5 → el horario sigue ocupado.
3. Cerrá el navegador por completo y volvé a abrir → los datos siguen ahí.
4. Entrá a `/admin` sin clave: la agenda no se ve. Con `qi2026`: se ve.
5. Bloqueá un horario en el panel y verificá que no figure en `/reservar`.
6. Copiá el enlace de WhatsApp y confirmá que el texto decodificado trae nombre, terapia,
   fecha y hora.
7. Reiniciá los datos de ejemplo: vuelve al seed original.

---

## Identidad visual

Paleta y tipografías del briefing, definidas como tokens en `src/index.css`:

| Token | Valor | Uso |
|---|---|---|
| `jade` | `#2D5A43` | Primario institucional |
| `salvia` | `#7E9987` | Secundarios y estados activos |
| `lino` | `#F8F6F0` | Fondo de página |
| `blanco` | `#FFFFFF` | Tarjetas y contenedores |
| `grafito` | `#242926` | Texto principal |
| `terracota` | `#B4533C` | **Solo** cancelaciones y alertas |

Tipografías: **Cinzel** para encabezados, **Plus Jakarta Sans** para interfaz y lectura.

La restricción del terracota la verifica un test: si aparece fuera de una cancelación o una
alerta, `npm run verify` falla.

---

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Landing: terapias, cómo se reserva, dónde y cuándo |
| `/terapias` | Ficha ampliada de cada terapia |
| `/reservar` | Flujo de reserva |
| `/mi-turno` | Consulta y cancelación con código de reserva |
| `/admin` | Panel del centro (clave `qi2026`) |
| `/legal/aviso` | Aviso legal |
| `/legal/privacidad` | Política de privacidad |

---

## Stack

React 19 · TypeScript (modo estricto) · Tailwind CSS v4 · Vite · React Router ·
Vitest · Playwright + playwright-bdd · localStorage
