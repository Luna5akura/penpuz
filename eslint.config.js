import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // The puzzle registry deliberately lazy-loads every board component so
    // each puzzle type splits into its own chunk.  It is not a component
    // file, so the fast-refresh export rule does not apply.
    files: ['src/puzzles/registry.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
