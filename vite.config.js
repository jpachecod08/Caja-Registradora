import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      tslib: path.resolve(
        __dirname,
        'node_modules/tslib/tslib.es6.js'
      ),
    },
  },

  optimizeDeps: {
    exclude: ['@supabase/supabase-js'],
  },
})
