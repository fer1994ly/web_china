import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProveedorAgenda } from './ProveedorAgenda'
import { Layout } from '@/slices/contenido-institucional/ui/Layout'
import { InicioPage } from '@/slices/contenido-institucional/ui/InicioPage'
import { TerapiasPage } from '@/slices/contenido-institucional/ui/TerapiasPage'
import { AvisoLegalPage, PrivacidadPage } from '@/slices/contenido-institucional/ui/LegalPage'
import { ReservarPage } from '@/slices/reserva-turno/ui/ReservarPage'
import { MiTurnoPage } from '@/slices/cancelacion-turno/ui/MiTurnoPage'
import { AdminPage } from '@/slices/admin-agenda/ui/AdminPage'
import { NoEncontradaPage } from '@/slices/contenido-institucional/ui/NoEncontradaPage'

export default function App() {
  return (
    <ProveedorAgenda>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<InicioPage />} />
            <Route path="/terapias" element={<TerapiasPage />} />
            <Route path="/reservar" element={<ReservarPage />} />
            <Route path="/mi-turno" element={<MiTurnoPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/legal/aviso" element={<AvisoLegalPage />} />
            <Route path="/legal/privacidad" element={<PrivacidadPage />} />
            <Route path="*" element={<NoEncontradaPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ProveedorAgenda>
  )
}
