# Centro Qi · Reservas de terapias orientales

**Sitio publicado: <https://gorgeous-shortbread-f7e06f.netlify.app>**

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

`npm run preview` no es `vite preview`: sirve `dist/` con las redirecciones y cabeceras
del `netlify.toml`, así que lo que se ve ahí es lo que va a hacer el sitio publicado.
Ver [Desplegar en Netlify](#desplegar-en-netlify).

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Tipos + build + `sitemap.xml`/`robots.txt` + prerenderizado |
| `npm run build:spa` | Solo el bundle, sin SEO ni prerenderizado (iteración rápida) |
| `npm run test` | Vitest: dominio, aplicación, infraestructura, arquitectura, SEO, rendimiento y despliegue |
| `npm run test:e2e` | Playwright: los escenarios Gherkin, a 360px por defecto |
| `npm run test:e2e:ui` | Lo mismo, en modo interactivo |
| `npm run csp` | Levanta `dist/` con las cabeceras de producción y comprueba que arranque |
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
    rutas.ts                 Inventario único de rutas: router, sitemap y prerender
    entrada-servidor.tsx     Renderiza una ruta a HTML en Node, sin navegador
  shared/
    domain/                  Result, DomainError, Clock (port)
    infra/                   Driver de localStorage con sobre versionado
    seo/                     Las etiquetas de <head> como datos, y sus dos aplicadores
    rendimiento/             Medición de Core Web Vitals con PerformanceObserver
    styles/                  Las @font-face propias (la tipografía no viene de Google)
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
  unit/                    Fitness functions de arquitectura, contenido y despliegue
  e2e/steps/               Los pasos que hacen ejecutables los .feature

scripts/
  seo.mjs                  sitemap.xml y robots.txt
  prerender.mjs            El HTML estático de cada página (sin navegador)
  servidor-estatico.mjs    Sirve dist/ con las reglas leídas de netlify.toml
  verificar-csp.mjs        Arranca cada ruta con la CSP de producción

public/img/                Fotografías (ver CREDITOS.md)
public/fonts/              Cinzel y Plus Jakarta Sans, servidas del propio dominio
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

## SEO

Una SPA sirve `<div id="root"></div>` vacío. Google sabe ejecutar JavaScript, pero lo hace
tarde y no siempre; **WhatsApp, Facebook y la mayoría de los lectores de enlaces no lo ejecutan
nunca**. En Paraguay, donde casi todo se comparte por WhatsApp, eso significa una vista previa
en blanco. Por eso el build no termina en el bundle.

| Pieza | Dónde |
|---|---|
| Qué etiquetas lleva cada página, como datos | `src/shared/seo/etiquetas.ts` — fuente única |
| Aplicarlas al documento vivo | `src/shared/seo/useSeo.ts` |
| Serializarlas al HTML estático | `src/shared/seo/pagina-estatica.ts` |
| Datos estructurados schema.org | `src/app/datos-estructurados.ts` |
| Inventario de rutas | `src/app/rutas.ts` — fuente única |
| `sitemap.xml` y `robots.txt` | `scripts/seo.mjs`, generados en cada build |
| Prerenderizado a HTML estático | `scripts/prerender.mjs` + `src/app/entrada-servidor.tsx` |

Las etiquetas se **describen una vez** y se materializan en dos lados: el navegador las
escribe en `document.head` y el prerenderizador las serializa como texto. Con una lista por
lado, tarde o temprano una `og:image` aparece solo en uno de los dos.

**Datos estructurados publicados**: `MedicalBusiness` (dirección, teléfono, horarios derivados
del dominio y catálogo con precios en guaraníes), `WebSite`, un `Service` por terapia,
`BreadcrumbList` y `FAQPage`. Esto es lo que convierte un resultado de búsqueda en una ficha con
horarios y precios en vez de dos líneas de texto.

**Qué se prerenderiza y qué no.** Tres categorías, y `src/app/rutas.ts` decide cuál es cuál:

| | Rutas | Qué se publica |
|---|---|---|
| Completo | `/`, `/terapias`, `/legal/aviso`, `/legal/privacidad` | Metadatos y cuerpo ya renderizado |
| Solo la cabeza | `/reservar` | Metadatos y datos estructurados, con `#root` vacío |
| Sin HTML propio | `/mi-turno`, `/admin` | Caen en `spa.html`, que viene con `noindex` |

**Del cuerpo de `/reservar` no se publica nada a propósito**: depende del día, y un HTML
congelado le mostraría al visitante, por un instante, horarios que ya no existen. Pero sus
metadatos sí son fijos, y publicarlos hace que un buscador —o el lector de enlaces de
WhatsApp— los lea sin ejecutar JavaScript. Es la página a la que viene la gente.

`/mi-turno` y `/admin` quedan fuera de los buscadores por tres vías: el `noindex` escrito en
`spa.html`, la cabecera `X-Robots-Tag` y el `Disallow` del `robots.txt`. Son tres capas para lo
mismo porque una página con la agenda del centro indexada no se desindexa rápido.

El inventario de `src/app/rutas.ts` lo consumen el sitemap y el prerenderizador, así que es
imposible agregar una página y que quede fuera del sitemap, o que una privada entre en él.

### Configurar el dominio

El dominio se pasa por variable de entorno, porque de él salen la canónica, el `og:url`, el
`og:image` y las URLs del `sitemap.xml`:

```bash
VITE_SITE_URL=https://tu-dominio.com npm run build
```

En el sitio ya está configurada con la URL de Netlify. **Cuando el centro tenga su dominio
real hay que cambiarla ahí y volver a publicar**: el valor por defecto del código es
`https://centroqi.com.py`, un dominio que hoy no existe, y una canónica apuntando a un
dominio que no resuelve le dice a Google que no indexe el sitio que sí funciona.

```bash
netlify env:set VITE_SITE_URL https://centroqi.com.py   # cuando el dominio exista
```

En el panel es **Site settings → Environment variables**.

---

## Desplegar en Netlify

Ya está desplegado y la rama `main` publica sola:

| | |
|---|---|
| **Sitio** | <https://gorgeous-shortbread-f7e06f.netlify.app> |
| **Panel** | <https://app.netlify.com/projects/gorgeous-shortbread-f7e06f> |
| **Rama de producción** | `main` — cada push publica |

El repositorio trae `netlify.toml` listo. Para montarlo de cero en otra cuenta:

1. **Add new site → Import an existing project → GitHub** y elegí `web_china`.
2. No hay nada que configurar a mano: el `netlify.toml` ya define el comando de build,
   la carpeta a publicar, las redirecciones y las cabeceras.
3. En **Environment variables**, agregá `VITE_SITE_URL` con la URL definitiva del sitio
   (por ejemplo `https://centroqi.netlify.app`). Sin esto, la canónica y las etiquetas
   Open Graph apuntan al dominio por defecto.
4. **Deploy**.

Qué resuelve el `netlify.toml`:

- **Build**: `npm run build`, y nada más. Node puro, sin navegador, unos dos segundos.
- **Redirecciones**: lo que no tiene HTML propio (`/mi-turno`, `/admin`) cae en `/spa.html`
  con estado 200; cualquier otra dirección cae ahí con un **404 de verdad**. Netlify sirve
  primero los archivos estáticos, así que las páginas prerenderizadas no llegan a estas
  reglas. La reserva es `spa.html` y no `index.html`, que ahora es la portada ya renderizada.
- **Cabeceras**: `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy` y
  `Permissions-Policy`, más caché inmutable para los assets con hash y las fuentes, y
  revalidación para todo el HTML. Las rutas privadas van con `X-Robots-Tag: noindex`.

### Por qué antes no se podía desplegar

El prerenderizado abría un Chromium con Playwright, así que el build empezaba con
`npx playwright install --with-deps chromium`. Eso **no puede funcionar en Netlify**:
`--with-deps` es un `apt-get install` de las librerías de sistema del navegador, y el
contenedor de build no permite instalar paquetes del sistema. El deploy fallaba siempre,
antes de compilar una línea.

Ahora las páginas se renderizan con `react-dom/server` —el mismo React que después las
hidrata—, que es Node y nada más: el build completo tarda unos 3 segundos, de los cuales el
prerenderizado son 0,4, y no hay ningún paso que pueda fallar por falta de un navegador. `tests/unit/despliegue.test.ts` verifica que ningún paso del build
vuelva a necesitar un navegador, entre otras reglas del `netlify.toml`.

### Los dos servidores que no hay que confundir

`npm run preview` **no es `vite preview`**: es `scripts/servir.mjs`, que sirve `dist/`
aplicando las redirecciones y cabeceras leídas del `netlify.toml` de verdad. Los E2E corren
contra él por una razón concreta: `vite preview` responde `dist/index.html` —la portada
renderizada— para cualquier ruta sin archivo, y siempre con 200 donde producción responde
404. Una suite verde contra esa reserva no dice nada sobre el sitio publicado.

`npm run csp` usa el mismo servidor y comprueba con un navegador real que las rutas arranquen
sin bloqueos de CSP **y sin desajustes de hidratación**. Corre dentro de `npm run verify`,
porque una CSP demasiado estricta no falla en el build ni en los tests: falla en producción,
con pantalla en blanco.

---

## Rendimiento: Core Web Vitals

Core Web Vitals son las tres métricas con las que Google mide la experiencia real de una
página y que usa como señal de ranking:

| Métrica | Qué mide | Umbral "bueno" |
|---|---|---|
| **LCP** | Cuánto tarda en dibujarse el elemento más grande de la primera pantalla | 2500 ms |
| **CLS** | Cuánto se mueve el contenido solo (lo que hace que toques el botón equivocado) | 0.1 |
| **INP** | Cuánto tarda la página en responder a un toque | 200 ms |

`src/shared/rendimiento/` las mide en el navegador con `PerformanceObserver` —las mismas
entradas que Chrome reporta al Chrome UX Report, sin dependencias nuevas ni JavaScript de
terceros— y deja los valores en `window.__METRICAS_WEB__`. Los escenarios de
`rendimiento.feature` los leen y fallan si se salen de rango, así que una regresión se
descubre corriendo la suite y no en PageSpeed tres semanas después. Cuando el centro tenga
analítica, el parámetro `alMedir` de `observarMetricasWeb` es el punto donde se engancha el
envío.

Qué se hizo para que entren en rango:

- **La tipografía se sirve desde el propio dominio.** Una hoja de estilos de
  `fonts.googleapis.com` bloquea el primer pintado y suma dos handshakes (uno para el CSS,
  otro para los archivos) antes de que se vea una letra. Ahora los `.woff2` están en
  `public/fonts/`, son **fuentes variables** —un archivo por familia cubre todos los pesos— y
  `index.html` precarga los dos subconjuntos `latin`, que son los únicos que descarga una
  página en castellano (~53 kB). De paso, la CSP ya no necesita permitir dominios de Google.
- **Las fotos declaran sus dimensiones.** `imagenAncho`/`imagenAlto` van al `width`/`height`
  del `<img>` para que el navegador reserve el hueco antes de descargar la imagen. Sin eso la
  foto aparece de golpe y empuja el texto de abajo: es la causa más común de CLS. El tamaño en
  pantalla lo sigue decidiendo el CSS.
- **La foto del encabezado se precarga, pero solo donde se ve.** Está oculta hasta 1024px, así
  que el `<link rel="preload">` lleva `media="(min-width: 1024px)"`: en el celular sería
  gastarle 64 kB de datos móviles a quien nunca la va a ver.
- **Las páginas prerenderizadas se hidratan, no se vuelven a renderizar.** `main.tsx` usa
  `hydrateRoot` cuando `#root` ya trae HTML. Con `createRoot` React descartaba ese contenido y
  lo reconstruía, desperdiciando el LCP que ya se había pintado.
- **El panel del centro se carga aparte.** Es la única pantalla que ningún paciente abre nunca
  y era el slice más grande del bundle que todos descargaban. De paso, la clave de la demo deja
  de viajar en el archivo que se le sirve a cualquier visitante.

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
| CA-08 | Repo compartido con partners@kodarvia.com, README y preview | Este documento · <https://gorgeous-shortbread-f7e06f.netlify.app> |

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
Las dos se sirven desde `public/fonts/` y no desde `fonts.googleapis.com`: ver
[Rendimiento](#rendimiento-core-web-vitals).

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

Las siete están **cableadas y funcionando**: no hay pantallas a medio conectar, botones que
no lleven a ninguna parte ni rutas que caigan en la vista de otra. No es una impresión, lo
comprueba `navegacion.feature` en cada `npm run verify`:

- cada ruta del inventario muestra su propia pantalla, con su `<h1>` y contenido real
  (dos rutas con el mismo encabezado suelen ser una ruta mal cableada);
- **todos** los enlaces internos del sitio responden — se recorren las siete pantallas, se
  juntan sus `href` y se pide cada uno;
- se llega a las públicas desde el encabezado (a 360px, abriendo el menú como lo abriría una
  persona) y a las legales y al panel desde el pie;
- el celular del pie es un enlace `wa.me` real con el número del centro.

Una ruta que no existe responde 404 y muestra la pantalla de *no encontrada*.

---

## Stack

React 19 (con `react-dom/server` para el prerenderizado) · TypeScript (modo estricto) ·
Tailwind CSS v4 · Vite · React Router · Vitest · Playwright + playwright-bdd · localStorage ·
Netlify
