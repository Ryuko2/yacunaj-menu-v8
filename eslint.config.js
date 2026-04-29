import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const nodeOpts = {
  ecmaVersion: 2022,
  globals: { ...globals.node, ...globals.es2022 },
}
const unusedRule = ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }]

export default defineConfig([
  globalIgnores([
    'dist',
    '_legacy_frontend',
    'backend/node_modules',
    'node_modules',
    '.vercel',
    'supabase/.temp',
  ]),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: { ecmaVersion: 'latest', ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    rules: { 'no-unused-vars': unusedRule },
  },
  {
    files: ['api/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { ...nodeOpts, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
    rules: { 'no-unused-vars': unusedRule },
  },
  {
    files: ['backend/**/*.{js,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: { ...nodeOpts, parserOptions: { ecmaVersion: 'latest', sourceType: 'commonjs' } },
    rules: { 'no-unused-vars': unusedRule },
  },
  {
    files: ['scripts/**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { ...nodeOpts, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
    rules: { 'no-unused-vars': unusedRule },
  },
  {
    files: ['*.{js,mjs,cjs}', 'vite.config.js', 'eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { ...nodeOpts, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
  },
  {
    files: ['shared/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { ...nodeOpts, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
    rules: { 'no-unused-vars': unusedRule },
  },
])
