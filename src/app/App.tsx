import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProveedorAgenda } from './ProveedorAgenda'
import { Layout } from '@/slices/contenido-institucional/ui/Layout'
import { InicioPage } from '@/slices/contenido-institucional/ui/InicioPage'
import { TerapiasPage } from '@/slices/contenido-institucional/ui/TerapiasPage'
import { AvisoLegalPage, PrivacidadPage } from '@/slices/contenido-institucional/ui/LegalPage'
import { ReservarPage } from '@/slices/reserva-turno/ui/ReservarPage'
import { MiTurnoPage } from '@/slices/cancelacion-turno/ui/MiTurnoPage'
import { NoEncontradaPage } from '@/slices/contenido-institucional/ui/NoEncontradaPage'

/**
 * El panel se carga aparte, cuando alguien entra a `/admin`.
 *
 * No es una micro-optimizacion: es la unica pantalla del sitio que ningun paciente
 * abre nunca, y era el slice mas grande del bundle que TODOS descargaban para poder
 * hidratar la portada. De paso, la clave de la demo deja de viajar en el archivo que
 * se le sirve a cualquier visitante.
 *
 * Se puede hacer justamente porque `/admin` no se prerenderiza: `<Routes>` solo
 * renderiza la rama que coincide, asi que durante la compilacion de las paginas
 * publicas este modulo no se toca.
 */
const AdminPage = lazy(async () => ({
  default: (await import('@/slices/admin-agenda/ui/AdminPage')).AdminPage,
}))

/**
 * El arbol de pantallas, SIN router.
 *
 * Esta separado de `App` porque se monta bajo dos routers distintos: el navegador lo
 * monta con `BrowserRouter` y el prerenderizador con `StaticRouter`, porque durante la
 * compilacion no existe la historia del navegador. Manteniendo una sola definicion de
 * las rutas, es imposible que el HTML estatico de una pagina salga de un arbol
 * distinto del que despues la hidrata.
 */
export function Pantallas() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<InicioPage />} />
        <Route path="/terapias" element={<TerapiasPage />} />
        <Route path="/reservar" element={<ReservarPage />} />
        <Route path="/mi-turno" element={<MiTurnoPage />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<CargandoPanel />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route path="/legal/aviso" element={<AvisoLegalPage />} />
        <Route path="/legal/privacidad" element={<PrivacidadPage />} />
        <Route path="*" element={<NoEncontradaPage />} />
      </Routes>
    </Layout>
  )
}

/** Reserva mientras baja el modulo del panel. Ocupa alto para no mover el pie. */
function CargandoPanel() {
  return (
    <p className="min-h-[60vh] px-4 py-16 text-center text-grafito-suave" role="status">
      Cargando el panel…
    </p>
  )
}

export default function App() {
  return (
    <ProveedorAgenda>
      <BrowserRouter>
        <Pantallas />
      </BrowserRouter>
    </ProveedorAgenda>
  )
}
