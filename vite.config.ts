import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        // El dominio es TypeScript puro: no necesita DOM y corre en milisegundos.
        // Si un test de dominio falla aca por falta de `window`, es una violacion
        // de la regla de dependencia, no un problema de configuracion.
        extends: true,
        test: {
          name: 'dominio',
          environment: 'node',
          globals: true,
          include: ['src/**/domain/**/*.test.ts', 'tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: [
            'src/**/application/**/*.test.ts',
            'src/**/infrastructure/**/*.test.ts',
            'src/**/*.test.tsx',
          ],
        },
      },
    ],
  },
})
