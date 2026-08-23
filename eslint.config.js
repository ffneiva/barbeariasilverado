import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist', 'node_modules', 'assets-src']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Na v7 do plugin, `configs['recommended-latest']` ainda é o formato
      // eslintrc; o equivalente em flat config vive sob `configs.flat`.
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // Os scripts de build rodam em Node e não seguem as regras de componente.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
])
