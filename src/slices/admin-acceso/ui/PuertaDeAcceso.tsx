import { useState, type ReactNode } from 'react'
import { Aviso, Boton, Campo, Contenedor, Entrada, Tarjeta } from '@/shared/ui/componentes'
import { claveEsCorrecta, MENSAJE_CLAVE_INCORRECTA } from '../domain/clave-admin'
import { sesionAdmin } from '../infrastructure/sesion-admin'

/**
 * Guard del panel (criterio CA-04).
 *
 * `children` no se monta hasta que la clave es correcta: la agenda no llega al DOM,
 * no se puede leer desde el inspector ni queda a un `display:none` de distancia.
 */
export function PuertaDeAcceso({ children }: { children: ReactNode }) {
  const [abierta, setAbierta] = useState(() => sesionAdmin.estaAbierta())
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (abierta) {
    return (
      <>
        <Contenedor className="flex justify-end pt-4">
          <button
            type="button"
            data-testid="cerrar-sesion-admin"
            onClick={() => {
              sesionAdmin.cerrar()
              setAbierta(false)
              setClave('')
            }}
            className="text-sm text-grafito-suave underline hover:text-jade"
          >
            Cerrar sesión del panel
          </button>
        </Contenedor>
        {children}
      </>
    )
  }

  const intentar = () => {
    if (!claveEsCorrecta(clave)) {
      setError(MENSAJE_CLAVE_INCORRECTA)
      return
    }
    sesionAdmin.abrir()
    setError(null)
    setAbierta(true)
  }

  return (
    <Contenedor className="py-12">
      <Tarjeta className="mx-auto max-w-sm p-6" data-testid="puerta-admin">
        <h1 className="text-2xl text-jade">Panel del centro</h1>
        <p className="mt-2 text-sm text-grafito-suave">
          Esta sección es para el equipo de recepción. Ingresá la clave para ver la agenda.
        </p>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            intentar()
          }}
          className="mt-6 flex flex-col gap-4"
        >
          <Campo id="clave-admin" etiqueta="Clave de acceso" error={error ?? undefined}>
            <Entrada
              id="clave-admin"
              name="clave"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              value={clave}
              hayError={error !== null}
              onChange={(e) => {
                setClave(e.target.value)
                setError(null)
              }}
            />
          </Campo>

          <Boton type="submit" anchoCompleto data-testid="entrar-admin">
            Entrar
          </Boton>
        </form>

        <div className="mt-6">
          <Aviso>
            <span className="font-semibold">Demo:</span> la clave es{' '}
            <code className="rounded bg-blanco px-1.5 py-0.5 font-mono text-xs">qi2026</code>. Es una
            clave fija en el código, sin seguridad real: Kodarvia la reemplaza por autenticación del
            lado del servidor.
          </Aviso>
        </div>
      </Tarjeta>
    </Contenedor>
  )
}
