import { Link } from 'react-router-dom'
import { Contenedor } from '@/shared/ui/componentes'

export function NoEncontradaPage() {
  return (
    <Contenedor className="py-16 text-center">
      <p className="font-titulo text-5xl text-salvia">404</p>
      <h1 className="mt-3 text-2xl text-jade">Esa página no existe</h1>
      <p className="mt-2 text-grafito-suave">
        Puede que el enlace esté viejo. Desde el inicio llegás a todo.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-jade px-6 py-3 font-semibold text-blanco hover:bg-jade-hondo"
      >
        Volver al inicio
      </Link>
    </Contenedor>
  )
}
