import { expect, type Page } from '@playwright/test'
import { Given, INSTANTE_DEMO, Then, When } from './fixtures'

const CLAVE_CORRECTA = 'qi2026'

// --- Ayudantes -------------------------------------------------------------

const slotDisponible = (page: Page) => page.locator('[data-testid="slot"][data-estado="disponible"]').first()

async function irAReservar(page: Page, fechaIso: string): Promise<void> {
  await page.goto('/reservar')
  if (fechaIso !== '') {
    await page.locator(`[data-testid="dia"][data-fecha="${fechaIso}"]`).click()
  }
}

async function entrarAlPanel(page: Page): Promise<void> {
  await page.goto('/admin')
  await page.locator('#clave-admin').fill(CLAVE_CORRECTA)
  await page.locator('[data-testid="entrar-admin"]').click()
  await expect(page.getByRole('heading', { name: 'Agenda del centro' })).toBeVisible()
}

/**
 * La terapia se elige tocando una tarjeta, no desplegando un <select>.
 * Se busca por el nombre visible para que el escenario siga leyendose igual
 * que el criterio de aceptacion, sin depender del id interno del catalogo.
 */
async function elegirTerapia(page: Page, nombre: string): Promise<void> {
  await page.locator('[data-testid="terapia"]', { hasText: nombre }).first().click()
}

/** El texto que el destinatario realmente lee en WhatsApp. */
async function textoDelEnlace(page: Page): Promise<string> {
  const href = await page.locator('[data-testid="enlace-whatsapp"]').first().getAttribute('href')
  return decodeURIComponent(new URL(href ?? '').searchParams.get('text') ?? '')
}

// --- Antecedentes ----------------------------------------------------------

Given('que la demo arranca con los datos de ejemplo de Asunción', async ({ page }) => {
  // El reloj se congela ANTES de que cargue la app: el seed se construye en
  // relación a esa fecha, así los escenarios no cambian según la hora real.
  await page.addInitScript((iso) => {
    ;(window as unknown as { __RELOJ_DEMO__: string }).__RELOJ_DEMO__ = iso
  }, INSTANTE_DEMO)

  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

Given('que estoy en el formulario de reserva', async ({ page }) => {
  await page.goto('/reservar')
  await expect(page.getByRole('heading', { name: 'Reservá tu sesión' })).toBeVisible()
})

// --- Formulario: CA-01 -----------------------------------------------------

When('intento confirmar sin completar ningún dato', async ({ page }) => {
  await page.locator('[data-testid="confirmar-reserva"]').click()
})

When('intento confirmar la reserva', async ({ page }) => {
  await page.locator('[data-testid="confirmar-reserva"]').click()
})

Given('completo el formulario con nombre {string} y celular {string}', async ({ page }, nombre: string, celular: string) => {
  await page.locator('#nombre').fill(nombre)
  await page.locator('#celular').fill(celular)
})

Then('el turno no se confirma', async ({ page }) => {
  await expect(page.locator('[data-testid="confirmacion"]')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Reservá tu sesión' })).toBeVisible()
})

Then('veo el aviso de campo obligatorio en {string}', async ({ page }, campo: string) => {
  const aviso = page.locator(`#${campo}-error`)
  await expect(aviso, `falta el aviso del campo ${campo}`).toBeVisible()
  await expect(aviso).not.toBeEmpty()
})

// --- Reserva: CA-02 --------------------------------------------------------

Given('elijo la terapia {string}', async ({ page, ctx }, terapia: string) => {
  await elegirTerapia(page, terapia)
  ctx.terapia = terapia
})

Given('elijo el primer día disponible', async ({ page, ctx }) => {
  const dia = page.locator('[data-testid="dia"]').first()
  ctx.fechaElegida = (await dia.getAttribute('data-fecha')) ?? ''
  await dia.click()
  expect(ctx.fechaElegida).not.toBe('')
})

Given('tomo nota del primer horario disponible', async ({ page, ctx }) => {
  const slot = slotDisponible(page)
  await expect(slot).toBeVisible()
  ctx.horaTomada = (await slot.getAttribute('data-hora')) ?? ''
  await slot.click()
  expect(ctx.horaTomada).not.toBe('')
})

When('completo mis datos como {string} con celular {string}', async ({ page, ctx }, nombre: string, celular: string) => {
  await page.locator('#nombre').fill(nombre)
  await page.locator('#celular').fill(celular)
  ctx.nombre = nombre
})

When('confirmo la reserva', async ({ page, ctx }) => {
  await page.locator('[data-testid="confirmar-reserva"]').click()
  await expect(page.locator('[data-testid="confirmacion"]')).toBeVisible()
  ctx.codigo = (await page.locator('[data-testid="codigo-reserva"]').innerText()).trim()
})

Then('veo la confirmación con mi código de reserva', async ({ page, ctx }) => {
  await expect(page.locator('[data-testid="confirmacion"]')).toBeVisible()
  expect(ctx.codigo).toMatch(/^QI-[A-Z2-9]{6}$/)
})

When('vuelvo a la vista de reserva para ese mismo día', async ({ page, ctx }) => {
  await irAReservar(page, ctx.fechaElegida)
})

Then('el horario que tomé ya no figura como disponible', async ({ page, ctx }) => {
  const slot = page.locator(`[data-testid="slot"][data-hora="${ctx.horaTomada}"]`)
  await expect(slot).toHaveAttribute('data-estado', 'reservado')
  await expect(slot).toBeDisabled()
})

// --- Reserva completa en un paso (persistencia y WhatsApp) -----------------

Given(
  'reservo un turno de {string} a nombre de {string} con celular {string}',
  async ({ page, ctx }, terapia: string, nombre: string, celular: string) => {
    await page.goto('/reservar')
    await elegirTerapia(page, terapia)

    const dia = page.locator('[data-testid="dia"]').first()
    ctx.fechaElegida = (await dia.getAttribute('data-fecha')) ?? ''
    await dia.click()

    const slot = slotDisponible(page)
    ctx.horaTomada = (await slot.getAttribute('data-hora')) ?? ''
    await slot.click()

    await page.locator('#nombre').fill(nombre)
    await page.locator('#celular').fill(celular)
    await page.locator('[data-testid="confirmar-reserva"]').click()

    await expect(page.locator('[data-testid="confirmacion"]')).toBeVisible()
    ctx.codigo = (await page.locator('[data-testid="codigo-reserva"]').innerText()).trim()
    ctx.terapia = terapia
    ctx.nombre = nombre
  },
)

// --- Persistencia: CA-03 ---------------------------------------------------

When('recargo la página', async ({ page }) => {
  await page.reload()
})

Given('cancelo ese turno con mi código de reserva', async ({ page, ctx }) => {
  await page.goto('/mi-turno')
  await page.locator('#codigo').fill(ctx.codigo)
  await page.locator('[data-testid="buscar-turno"]').click()
  await page.locator('[data-testid="cancelar-turno"]').click()
  await page.locator('[data-testid="confirmar-cancelacion"]').click()
  await expect(page.locator('[data-testid="estado-turno"]')).toHaveText('Turno cancelado')
})

When('consulto ese turno con el código de reserva', async ({ page, ctx }) => {
  await page.goto('/mi-turno')
  await page.locator('#codigo').fill(ctx.codigo)
  await page.locator('[data-testid="buscar-turno"]').click()
})

Then('el turno figura como cancelado', async ({ page }) => {
  await expect(page.locator('[data-testid="estado-turno"]')).toHaveText('Turno cancelado')
})

// --- Panel: CA-04 y CA-05 --------------------------------------------------

When('abro la ruta {string}', async ({ page }, ruta: string) => {
  await page.goto(ruta)
})

Then('no veo la agenda del día', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Agenda del centro' })).toHaveCount(0)
  await expect(page.locator('[data-testid="slot-admin"]')).toHaveCount(0)
  await expect(page.locator('[data-testid="turno-admin"]')).toHaveCount(0)
})

Then('veo el pedido de clave', async ({ page }) => {
  await expect(page.locator('[data-testid="puerta-admin"]')).toBeVisible()
  await expect(page.locator('#clave-admin')).toBeVisible()
})

When('ingreso la clave {string}', async ({ page }, clave: string) => {
  await page.locator('#clave-admin').fill(clave)
  await page.locator('[data-testid="entrar-admin"]').click()
})

When('ingreso la clave correcta', async ({ page }) => {
  await page.locator('#clave-admin').fill(CLAVE_CORRECTA)
  await page.locator('[data-testid="entrar-admin"]').click()
})

Then('veo un aviso de clave incorrecta', async ({ page }) => {
  await expect(page.locator('#clave-admin-error')).toBeVisible()
})

Then('veo la agenda del día', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Agenda del centro' })).toBeVisible()
  await expect(page.locator('[data-testid="slot-admin"]').first()).toBeVisible()
})

Given('entré al panel con la clave correcta', async ({ page }) => {
  await entrarAlPanel(page)
})

Given('bloqueo el primer horario disponible del primer día', async ({ page, ctx }) => {
  const dia = page.locator('[data-testid="dia-admin"]').first()
  ctx.fechaElegida = (await dia.getAttribute('data-fecha')) ?? ''
  await dia.click()

  const libre = page.locator('[data-testid="slot-admin"][data-estado="disponible"]').first()
  ctx.horaTomada = (await libre.getAttribute('data-hora')) ?? ''
  await libre.click()

  await expect(page.locator('[data-testid="aviso-admin"]')).toBeVisible()
})

Then('ese horario figura como bloqueado en el panel', async ({ page, ctx }) => {
  await expect(
    page.locator(`[data-testid="slot-admin"][data-hora="${ctx.horaTomada}"]`),
  ).toHaveAttribute('data-estado', 'bloqueado')
})

When('abro la vista pública de reserva para ese mismo día', async ({ page, ctx }) => {
  await irAReservar(page, ctx.fechaElegida)
})

Then('el horario que bloqueé ya no figura como disponible', async ({ page, ctx }) => {
  const slot = page.locator(`[data-testid="slot"][data-hora="${ctx.horaTomada}"]`)
  await expect(slot).toHaveAttribute('data-estado', 'bloqueado')
  await expect(slot).toBeDisabled()
})

When('reinicio los datos de ejemplo', async ({ page }) => {
  await page.locator('[data-testid="reiniciar-demo"]').click()
  await page.locator('[data-testid="confirmar-reinicio"]').click()
  await expect(page.locator('[data-testid="aviso-admin"]')).toContainText('datos de ejemplo')
})

Then('ese horario vuelve a figurar como disponible', async ({ page, ctx }) => {
  await irAReservar(page, ctx.fechaElegida)
  await expect(
    page.locator(`[data-testid="slot"][data-hora="${ctx.horaTomada}"]`),
  ).toHaveAttribute('data-estado', 'disponible')
})

// --- WhatsApp: CA-06 -------------------------------------------------------

When('miro el botón de WhatsApp de la confirmación', async ({ page }) => {
  await expect(page.locator('[data-testid="enlace-whatsapp"]').first()).toBeVisible()
})

Then('el enlace empieza con {string}', async ({ page }, prefijo: string) => {
  const href = await page.locator('[data-testid="enlace-whatsapp"]').first().getAttribute('href')
  expect(href).toContain(prefijo)
  expect(href?.startsWith(prefijo)).toBe(true)
})

Then('el texto del enlace contiene el nombre {string}', async ({ page }, nombre: string) => {
  expect(await textoDelEnlace(page)).toContain(nombre)
})

Then('el texto del enlace contiene la terapia {string}', async ({ page }, terapia: string) => {
  expect(await textoDelEnlace(page)).toContain(terapia)
})

Then('el texto del enlace contiene la fecha y la hora del turno', async ({ page, ctx }) => {
  const texto = await textoDelEnlace(page)
  expect(texto, 'falta la hora del turno').toContain(ctx.horaTomada)

  // La fecha aparece en prosa ("lunes 5 de octubre de 2026"): comprobamos el día del mes.
  const dia = Number(ctx.fechaElegida.slice(-2))
  expect(texto, 'falta la fecha del turno').toMatch(new RegExp(`\\b${dia}\\s+de\\s+\\w+`))
})

// --- Prioridad celular: CA-07 ----------------------------------------------

Given('que uso una pantalla de {int} por {int}', async ({ page }, ancho: number, alto: number) => {
  await page.setViewportSize({ width: ancho, height: alto })
})

Then('la página no desborda horizontalmente', async ({ page }) => {
  await page.waitForLoadState('networkidle')

  const medidas = await page.evaluate(() => {
    const raiz = document.documentElement
    const anchos: { etiqueta: string; derecha: number }[] = []

    // Además del documento, buscamos el elemento concreto que se pasa del viewport:
    // un fallo así sin el culpable identificado cuesta media hora de inspección.
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.right > raiz.clientWidth + 1) {
        anchos.push({
          etiqueta: `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`,
          derecha: Math.round(r.right),
        })
      }
    }

    return {
      scrollWidth: raiz.scrollWidth,
      clientWidth: raiz.clientWidth,
      culpables: anchos.slice(0, 5),
    }
  })

  expect(
    medidas.scrollWidth,
    `La página desborda: scrollWidth ${medidas.scrollWidth} > ${medidas.clientWidth}. ` +
      `Elementos fuera del viewport: ${JSON.stringify(medidas.culpables)}`,
  ).toBeLessThanOrEqual(medidas.clientWidth + 1)
})

Then('ningún texto se sale de su contenedor', async ({ page }) => {
  // Un desborde del documento lo detecta el paso anterior. Esto busca el caso mas
  // sutil: una palabra larga (un correo, una URL) que se sale de SU tarjeta sin
  // llegar a ensanchar la pagina, y que por eso queda cortada a la vista.
  const cortados = await page.evaluate(() => {
    /** `sr-only` mide 1px a proposito: existe para lectores de pantalla, no se ve. */
    const soloParaLectores = (el: Element): boolean => {
      const e = window.getComputedStyle(el)
      return (
        (e.position === 'absolute' && parseFloat(e.width) <= 1) ||
        e.clipPath === 'inset(50%)' ||
        el.className.toString().includes('sr-only')
      )
    }

    const culpables: string[] = []
    for (const el of Array.from(document.body.querySelectorAll('p, h1, h2, h3, a, dd, dt, li, span'))) {
      if (el.children.length > 0) continue
      if (soloParaLectores(el)) continue
      if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
        const estilo = window.getComputedStyle(el)
        // Un contenedor que desplaza a proposito no es un error.
        if (estilo.overflowX === 'auto' || estilo.overflowX === 'scroll') continue
        culpables.push(`${el.tagName.toLowerCase()}: "${(el.textContent ?? '').slice(0, 40)}"`)
      }
    }
    return culpables.slice(0, 5)
  })

  expect(cortados, 'Texto cortado dentro de su contenedor').toEqual([])
})

Then('todos los botones miden al menos {int} píxeles de alto', async ({ page }, minimo: number) => {
  const chicos = await page.evaluate((min) => {
    const culpables: string[] = []

    for (const el of Array.from(document.querySelectorAll('button, a[href]'))) {
      const r = el.getBoundingClientRect()
      if (r.height === 0 && r.width === 0) continue // oculto

      const estilo = window.getComputedStyle(el)

      // Fuera de alcance por diseño, no por descuido:
      //  - `sr-only`: existe solo para lectores de pantalla.
      //  - enlaces en prosa (display inline): WCAG 2.5.8 los exceptúa expresamente,
      //    porque agrandarlos partiría el renglón del texto que los contiene.
      if (estilo.position === 'absolute' && parseFloat(estilo.width) <= 1) continue
      if (estilo.display === 'inline') continue

      if (r.height < min) {
        culpables.push(
          `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}": ${Math.round(r.height)}px`,
        )
      }
    }
    return culpables.slice(0, 8)
  }, minimo)

  expect(chicos, `Objetivos táctiles menores a ${minimo}px`).toEqual([])
})
