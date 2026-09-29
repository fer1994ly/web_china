import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { observarMetricasWeb } from './shared/rendimiento/metricas-web'

const raiz = document.getElementById('root')
if (raiz === null) throw new Error('No se encontró el nodo #root')

const arbol = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Las páginas prerenderizadas llegan con el HTML ya armado: hay que HIDRATARLAS, no
// volver a renderizarlas. `createRoot` sobre contenido existente lo descarta y lo
// reconstruye desde cero, que es exactamente el trabajo que el prerenderizado venía a
// ahorrar, y de paso desperdicia el Largest Contentful Paint que ya se había pintado.
// Las rutas sin HTML propio (`/reservar`, el panel) llegan con `#root` vacío y sí se
// montan de cero.
if (raiz.hasChildNodes()) hydrateRoot(raiz, arbol)
else createRoot(raiz).render(arbol)

// Core Web Vitals. No se envían a ninguna parte: quedan en `window.__METRICAS_WEB__`
// para que la suite de rendimiento pueda fallar si una regresión se sale de rango.
observarMetricasWeb()
